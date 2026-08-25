"""Line-preserving CT substitution mutation planning."""

from __future__ import annotations

import json
import re
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, replace
from hashlib import sha256
from typing import Protocol

from .config_document import (
    MANAGED_BLOCK_MARKERS,
    ConfigScalar,
    ESPHomeConfigDocument,
)
from .ct_catalog import (
    REPORTING_MULTIPLIERS,
    CTPresetCatalog,
    custom_preset,
    raw_gain,
    raw_gain_for_preset,
)
from .ct_inventory import CTInventory
from .models import ConfigMutationPlan, MeterTopology, SubstitutionChange
from .store import VerifiedCalibrationRecord
from .topology import (
    voltage_reference_fingerprint_for_meter,
    voltage_reference_topology_from_config,
)

_SUBSTITUTIONS_RE = re.compile(r"^substitutions:\s*(?:#.*)?(?:\r?\n)?$")
_SENSOR_RE = re.compile(r"^sensor:\s*(?:#.*)?(?:\r?\n)?$")
_ROOT_SENSOR_RE = re.compile(r"^(?:sensor|['\"]sensor['\"])\s*:")
_TOP_LEVEL_RE = re.compile(r"^[\w-]+:")
_PHASE_OVERRIDE_START, _PHASE_OVERRIDE_END = MANAGED_BLOCK_MARKERS["phase_overrides"]
_STATUS_OVERRIDE_START, _STATUS_OVERRIDE_END = MANAGED_BLOCK_MARKERS["status_overrides"]
_PHASE_OWNER_RE = re.compile(r"^  - id: !extend (?P<id>[\w${}-]+)$")
_PHASE_HEADER_RE = re.compile(
    r"^    phase_(?P<phase>[abc]): # CT(?P<channel>[1-9]|[1-3][0-9]|4[0-2])$"
)
_PLAIN_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 ._/-]*$")
_YAML_RESERVED = {"null", "true", "false", "yes", "no", "on", "off", "~"}
_YAML_KEY_TOKEN = r'''(?:[\w-]+|'(?:[^']|'')*'|"(?:[^"\\]|\\.)*")'''
_YAML_MAPPING_RE = re.compile(
    rf"^(?P<indent> *)(?P<dash>-[ \t]+)?"
    rf"(?P<decorators>(?:(?:![^\s]+|&[^\s]+)[ \t]+)*)"
    rf"(?P<key>{_YAML_KEY_TOKEN})[ \t]*:"
    r"(?P<rest>.*)$"
)
_YAML_EXPLICIT_KEY_RE = re.compile(
    rf"^(?P<indent> *)\?[ \t]+(?:(?:![^\s]+|&[^\s]+)[ \t]+)*"
    rf"(?P<key>{_YAML_KEY_TOKEN})[ \t]*:?$"
)
_YAML_FLOW_KEY_RE = re.compile(
    rf"[{{,][ \t]*(?:(?:![^\s]+|&[^\s]+)[ \t]+)*"
    rf"(?P<key>{_YAML_KEY_TOKEN})[ \t]*:"
)
_PACKAGE_FEATURES = {
    "power_quality": ("power_quality", "power_quality"),
    "status_fields": ("status_fields", "status"),
}


class ConfigSnapshot(Protocol):
    """The minimum trusted configuration snapshot needed for a mutation."""

    @property
    def configuration(self) -> str: ...

    @property
    def content(self) -> str: ...

    @property
    def sha256(self) -> str: ...


class ConfigMutationError(ValueError):
    """A safe refusal that can offer substitutions for manual application."""

    def __init__(self, message: str, *, snippet: str | None = None) -> None:
        super().__init__(message)
        self.snippet = snippet


@dataclass(frozen=True, slots=True)
class CTChangeRequest:
    """One user-requested CT name and model selection."""

    channel: int
    name: str
    model_id: str
    reporting_multiplier: float = 1.0
    custom_gain_ct: int | None = None
    custom_label: str | None = None
    burden_output_acknowledged: bool = False


@dataclass(frozen=True, slots=True)
class _PhaseChannelState:
    enabled: bool
    multiplier: float


def build_ct_mutation(
    snapshot: ConfigSnapshot,
    topology: MeterTopology,
    requested_channels: Iterable[CTChangeRequest],
    *,
    package_options: Mapping[str, Iterable[bool]] | None = None,
) -> ConfigMutationPlan:
    """Build a CT mutation through the generalized configuration entry point."""
    from .meter_config_mutator import build_meter_configuration_mutation
    from .meter_inventory import MeterConfigurationInventory
    from .voltage_transformer_catalog import VoltageTransformerCatalog

    requests = tuple(requested_channels)
    _validate_requests(requests, topology)
    options: dict[str, tuple[bool, ...]] | None = None
    if package_options is not None:
        if set(package_options) != set(_PACKAGE_FEATURES):
            raise ConfigMutationError("package options are invalid")
        options = {name: tuple(values) for name, values in package_options.items()}
        if any(
            len(values) != topology.board_count
            or any(type(value) is not bool for value in values)
            for values in options.values()
        ):
            raise ConfigMutationError(
                "package options require one state per installed board"
            )
    document = ESPHomeConfigDocument.parse(snapshot.content)
    ct_catalog = CTPresetCatalog.load()
    voltage_catalog = VoltageTransformerCatalog.load()
    try:
        current = MeterConfigurationInventory.from_document(
            snapshot.configuration,
            document,
            topology,
            ct_catalog,
            voltage_catalog,
            snapshot.sha256,
            configuration_authoritative=getattr(snapshot, "configuration_authoritative", True),
        )
    except ValueError:
        plan = _build_ct_mutation(
            snapshot, topology, requests, package_options=options
        )
        MeterConfigurationInventory.from_document(
            snapshot.configuration,
            ESPHomeConfigDocument.parse(plan.proposed_content),
            topology,
            ct_catalog,
            voltage_catalog,
            sha256(plan.proposed_content.encode()).hexdigest(),
            configuration_authoritative=True,
        )
        return plan
    requested = replace(
        current.configuration,
        channels=tuple(
            replace(
                channel,
                name=request.name,
                model_id=request.model_id,
                reporting_multiplier=request.reporting_multiplier,
                custom_gain_ct=request.custom_gain_ct,
                custom_label=request.custom_label,
                burden_output_acknowledged=request.burden_output_acknowledged,
            )
            if (request := next((item for item in requests if item.channel == channel.channel), None))
            is not None
            else channel
            for channel in current.configuration.channels
        ),
    )
    if options is not None:
        requested = replace(
            requested,
            power_quality=options["power_quality"],
            status_fields=options["status_fields"],
        )
    return build_meter_configuration_mutation(snapshot, topology, current, requested)


def _build_ct_mutation(
    snapshot: ConfigSnapshot,
    topology: MeterTopology,
    requested_channels: Iterable[CTChangeRequest],
    *,
    package_options: Mapping[str, Iterable[bool]] | None = None,
    phase_channels: Mapping[int, tuple[bool, float]] | None = None,
) -> ConfigMutationPlan:
    """Build a safe config edit plan without serializing the YAML document."""
    if getattr(snapshot, "configuration_authoritative", True) is not True:
        raise ConfigMutationError("configuration snapshot is not authoritative")
    if sha256(snapshot.content.encode()).hexdigest() != snapshot.sha256:
        raise ConfigMutationError("configuration snapshot hash does not match content")
    document = ESPHomeConfigDocument.parse(snapshot.content)
    requests = tuple(requested_channels)
    _validate_requests(requests, topology)
    catalog = CTPresetCatalog.load()
    changes: list[SubstitutionChange] = []
    values: dict[str, str] = {}
    for request in requests:
        name_key = f"ct{request.channel}_name"
        gain_key = f"current_cal_ct{request.channel}"
        gain = _requested_gain(request, catalog)
        _append_change(changes, values, name_key, request.name, document.substitutions)
        _append_change(changes, values, gain_key, str(gain), document.substitutions)
    proposed_content = _apply_changes(document, changes, values)
    if package_options is not None:
        proposed_content, package_changes = _apply_package_options(
            proposed_content, topology, package_options
        )
        changes.extend(package_changes)
    proposed_content = _apply_reporting_multipliers(
        proposed_content,
        topology,
        requests,
        document.substitutions,
        phase_channels,
    )
    proposed_document = ESPHomeConfigDocument.parse(proposed_content)
    CTInventory.from_document(proposed_document, topology, catalog, snapshot.sha256)
    if proposed_content == snapshot.content:
        return ConfigMutationPlan(
            snapshot.configuration, snapshot.sha256, (), "", snapshot.content
        )
    return ConfigMutationPlan(
        snapshot.configuration,
        snapshot.sha256,
        tuple(changes),
        _review_diff(changes, snapshot.content, proposed_content),
        proposed_content,
    )


def _apply_package_options(
    content: str,
    topology: MeterTopology,
    package_options: Mapping[str, Iterable[bool]],
) -> tuple[str, list[SubstitutionChange]]:
    if set(package_options) != set(_PACKAGE_FEATURES):
        raise ConfigMutationError("package options are invalid")
    desired = {name: tuple(values) for name, values in package_options.items()}
    if any(
        len(values) != topology.board_count
        or any(type(value) is not bool for value in values)
        for values in desired.values()
    ):
        raise ConfigMutationError("package options require one state per installed board")

    lines = content.splitlines(keepends=True)
    changes: list[SubstitutionChange] = []
    for feature, (directory, suffix) in _PACKAGE_FEATURES.items():
        for board_index, enabled in enumerate(desired[feature]):
            board = "main" if board_index == 0 else f"addon{board_index}"
            path = f"Software/ESPHome/{directory}/6chan_{board}_{suffix}.yaml"
            pattern = re.compile(
                rf"^(?P<indent> *)(?P<comment>#\s*)?(?P<entry>-\s+{re.escape(path)}"
                rf"(?P<tail>\s*(?:#.*)?))(?P<newline>\r?\n)?$"
            )
            matches = [
                (index, match)
                for index, line in enumerate(lines)
                if (match := pattern.fullmatch(line)) is not None
            ]
            if len(matches) > 1:
                raise ConfigMutationError(f"{feature} package line is duplicated")
            current = bool(matches and matches[0][1].group("comment") is None)
            if current == enabled:
                continue
            if not matches:
                raise ConfigMutationError(f"{feature} package line is unavailable")
            index, match = matches[0]
            lines[index] = (
                match.group("indent")
                + ("" if enabled else "#")
                + match.group("entry")
                + (match.group("newline") or "")
            )
            changes.append(
                SubstitutionChange(
                    f"{feature}_{board}",
                    "enabled" if current else "disabled",
                    "enabled" if enabled else "disabled",
                )
            )
    return "".join(lines), changes


def package_options_from_document(
    document: ESPHomeConfigDocument, topology: MeterTopology
) -> dict[str, tuple[bool, ...]]:
    """Return the active optional packages for each installed board."""
    active = set(document.package_files)
    return {
        feature: tuple(
            f"Software/ESPHome/{directory}/6chan_"
            f"{'main' if board_index == 0 else f'addon{board_index}'}_{suffix}.yaml"
            in active
            for board_index in range(topology.board_count)
        )
        for feature, (directory, suffix) in _PACKAGE_FEATURES.items()
    }


def build_calibrated_gain_mutation(
    snapshot: ConfigSnapshot,
    topology: MeterTopology,
    verified: VerifiedCalibrationRecord,
    requested_channels: Iterable[CTChangeRequest] = (),
    calibrated_current_channels: frozenset[int] = frozenset(),
    *,
    package_options: Mapping[str, Iterable[bool]] | None = None,
    trusted_voltage_fingerprint: str | None = None,
) -> ConfigMutationPlan:
    """Build a reviewed final-gain plan bound to the calibration source hash."""
    if getattr(snapshot, "configuration_authoritative", True) is not True:
        raise ConfigMutationError("configuration snapshot is not authoritative")
    current_hash = sha256(snapshot.content.encode()).hexdigest()
    if current_hash != snapshot.sha256:
        raise ConfigMutationError("configuration snapshot hash does not match content")
    document = ESPHomeConfigDocument.parse(snapshot.content)
    try:
        current_voltage_fingerprint = voltage_reference_topology_from_config(
            document, topology, trusted_fingerprint=trusted_voltage_fingerprint
        ).fingerprint
    except ValueError as error:
        if trusted_voltage_fingerprint is not None:
            raise ConfigMutationError(
                "verified calibration topology does not match target"
            ) from error
        current_voltage_fingerprint = voltage_reference_fingerprint_for_meter(topology)
    if (
        snapshot.configuration != verified.config_filename
        or snapshot.sha256 != verified.config_sha256
    ):
        raise ConfigMutationError(
            "calibration origin no longer matches current YAML; re-read configuration"
        )
    if (
        verified.topology_addon_count != topology.addon_count
        or verified.topology_project_name != topology.project_name
        or verified.topology_connection_type != topology.connection_type
        or verified.topology_voltage_fingerprint
        != current_voltage_fingerprint
    ):
        raise ConfigMutationError("verified calibration topology does not match target")
    requests = tuple(requested_channels)
    _validate_requests(requests, topology)
    catalog = CTPresetCatalog.load()
    changes: list[SubstitutionChange] = []
    values: dict[str, str] = {}
    requested_by_channel = {request.channel: request for request in requests}
    for request in requests:
        _append_change(
            changes,
            values,
            f"ct{request.channel}_name",
            request.name,
            document.substitutions,
        )
        if request.channel not in calibrated_current_channels:
            _append_change(
                changes,
                values,
                f"current_cal_ct{request.channel}",
                str(_requested_gain(request, catalog)),
                document.substitutions,
            )
    voltage_values: dict[int, set[int]] = {1: set(), 2: set()}
    addressed: list[tuple[str, int, int, tuple[int, int, int]]] = []
    seen_channels: set[int] = set()
    for group in verified.groups:
        board_index, group_index = _gain_group_address(group.instance_id, topology)
        first_channel = board_index * 6 + (group_index - 1) * 3 + 1
        channels = (first_channel, first_channel + 1, first_channel + 2)
        if seen_channels.intersection(channels):
            raise ConfigMutationError("verified gain groups overlap")
        seen_channels.update(channels)
        voltage_gains = (
            group.phase_gains[0][0],
            group.phase_gains[1][0],
            group.phase_gains[2][0],
        )
        addressed.append((group.instance_id, first_channel, group_index, voltage_gains))
        voltage_values[group_index].update(voltage_gains)
        for channel, (_, current_gain) in zip(channels, group.phase_gains, strict=True):
            if (
                channel in requested_by_channel
                and channel not in calibrated_current_channels
            ):
                continue
            key = f"current_cal_ct{channel}"
            _append_change(
                changes,
                values,
                key,
                str(current_gain),
                document.substitutions,
            )

    covered_instances = {
        group_index: {
            instance_id
            for instance_id, _, candidate_index, _ in addressed
            if candidate_index == group_index
        }
        for group_index in (1, 2)
    }
    required_instances = {
        group_index: {
            f"meter_main{group_index}"
            if board_index == 0
            else f"addon{board_index}_{group_index}"
            for board_index in range(topology.board_count)
        }
        for group_index in (1, 2)
    }
    unsafe_voltage_keys = {
        group_index
        for group_index, gains in voltage_values.items()
        if gains
        and (
            len(gains) > 1
            or covered_instances[group_index] != required_instances[group_index]
        )
    }
    if unsafe_voltage_keys:
        raise ConfigMutationError(
            "per-phase voltage gains require manual review",
            snippet=_calibrated_gain_snippet(verified, addressed, unsafe_voltage_keys),
        )
    for group_index, gains in voltage_values.items():
        if not gains:
            continue
        key = f"voltage_cal{group_index}"
        _append_change(
            changes,
            values,
            key,
            str(next(iter(gains))),
            document.substitutions,
        )
    proposed_content = _apply_changes(document, changes, values)
    if package_options is not None:
        proposed_content, package_changes = _apply_package_options(
            proposed_content, topology, package_options
        )
        changes.extend(package_changes)
    proposed_content = _apply_reporting_multipliers(
        proposed_content, topology, requests, document.substitutions
    )
    return ConfigMutationPlan(
        snapshot.configuration,
        snapshot.sha256,
        tuple(changes),
        _review_diff(changes, snapshot.content, proposed_content),
        proposed_content,
    )


def _gain_group_address(instance_id: str, topology: MeterTopology) -> tuple[int, int]:
    match = re.fullmatch(r"meter_main([12])", instance_id)
    if match is not None:
        return 0, int(match.group(1))
    match = re.fullmatch(r"addon([1-6])_([12])", instance_id)
    if match is None:
        raise ConfigMutationError("verified gain group has an unknown instance ID")
    board_index, group_index = map(int, match.groups())
    if board_index >= topology.board_count:
        raise ConfigMutationError("verified gain group is outside topology")
    return board_index, group_index


def _calibrated_gain_snippet(
    verified: VerifiedCalibrationRecord,
    addressed: list[tuple[str, int, int, tuple[int, int, int]]],
    unsafe_voltage_keys: set[int],
) -> str:
    lines = ["substitutions:"]
    group_by_id = {group.instance_id: group for group in verified.groups}
    for instance_id, first_channel, _, _ in addressed:
        for offset, (_, current_gain) in enumerate(
            group_by_id[instance_id].phase_gains
        ):
            lines.append(f"  current_cal_ct{first_channel + offset}: {current_gain}")
    voltage_values = {
        group_index: {
            gain
            for _, _, candidate_index, gains in addressed
            if candidate_index == group_index
            for gain in gains
        }
        for group_index in (1, 2)
    }
    for group_index, gains in voltage_values.items():
        if gains and group_index not in unsafe_voltage_keys:
            lines.append(f"  voltage_cal{group_index}: {next(iter(gains))}")
    lines.append("sensor:")
    for instance_id, _, group_index, voltage_gains in addressed:
        if group_index not in unsafe_voltage_keys:
            continue
        lines.append(f"  - id: !extend {instance_id}")
        for phase, gain in zip("abc", voltage_gains, strict=True):
            lines.extend((f"    phase_{phase}:", f"      gain_voltage: {gain}"))
    return "\n".join(lines) + "\n"


def _validate_requests(
    requests: tuple[CTChangeRequest, ...], topology: MeterTopology
) -> None:
    channels: set[int] = set()
    for request in requests:
        if not 1 <= request.channel <= topology.ct_count:
            raise ConfigMutationError("requested channel is outside topology")
        if request.channel in channels:
            raise ConfigMutationError("duplicate requested channel")
        channels.add(request.channel)
        if (
            not request.name
            or len(request.name) > 64
            or any(
                ord(character) < 32 or ord(character) == 127
                for character in request.name
            )
        ):
            raise ConfigMutationError("CT name must be non-empty and control-free")
        if request.reporting_multiplier not in REPORTING_MULTIPLIERS:
            raise ConfigMutationError("reporting multiplier must be 1, 2, 4, or 8")


def _requested_gain(request: CTChangeRequest, catalog: CTPresetCatalog) -> int:
    if request.model_id == "custom":
        if request.custom_gain_ct is None or request.custom_label is None:
            raise ConfigMutationError("Custom requires an explicit gain and label")
        custom_preset(
            request.custom_label,
            request.custom_gain_ct,
            burden_output_acknowledged=request.burden_output_acknowledged,
        )
        return raw_gain(request.custom_gain_ct, request.reporting_multiplier)
    preset = catalog.by_model_id(request.model_id)
    if preset is None:
        raise ConfigMutationError("unknown CT preset")
    return raw_gain_for_preset(preset, request.reporting_multiplier)


def _append_change(
    changes: list[SubstitutionChange],
    values: dict[str, str],
    key: str,
    new_value: str,
    substitutions: dict[str, ConfigScalar],
) -> None:
    current = substitutions.get(key)
    if current is not None and _same_value(key, current.value, new_value):
        return
    changes.append(
        SubstitutionChange(key, current.value if current else None, new_value)
    )
    values[key] = new_value


def _same_value(key: str, old_value: str, new_value: str) -> bool:
    if _is_gain_key(key):
        try:
            return int(old_value) == int(new_value)
        except ValueError:
            return False
    return old_value == new_value


def _apply_changes(
    document: ESPHomeConfigDocument,
    changes: list[SubstitutionChange],
    values: dict[str, str],
) -> str:
    edits: list[tuple[int, int, str]] = []
    missing: list[SubstitutionChange] = []
    for change in changes:
        current = document.substitutions.get(change.key)
        if current is None:
            missing.append(change)
            continue
        edits.append(
            (
                current.span.start,
                current.span.end,
                _render_value(
                    change.key, values[change.key], document.content, current
                ),
            )
        )
    if missing:
        end, indent, newline = _substitution_block(document, changes)
        insert = "".join(
            f"{indent}{change.key}: {_render_missing(change, document)}{newline}"
            for change in missing
        )
        prefix = "" if end == 0 or document.content[end - 1] in "\r\n" else newline
        edits.append((end, end, prefix + insert))
    result = document.content
    for start, end, replacement in sorted(edits, reverse=True):
        result = result[:start] + replacement + result[end:]
    return result


def _apply_reporting_multipliers(
    content: str,
    topology: MeterTopology,
    requests: tuple[CTChangeRequest, ...],
    substitutions: Mapping[str, ConfigScalar],
    phase_channels: Mapping[int, tuple[bool, float]] | None = None,
) -> str:
    from .config_blocks import render_phase_overrides, replace_managed_block

    if not requests and phase_channels is None:
        return content
    has_phase_overrides = _PHASE_OVERRIDE_START in content
    document = ESPHomeConfigDocument.parse(content)
    package_options = package_options_from_document(document, topology)
    power_quality = package_options["power_quality"]
    parsed_channels = _read_phase_channel_states(
        content, topology, substitutions, power_quality
    )
    channels = {
        channel: (state.enabled, state.multiplier)
        for channel, state in parsed_channels.items()
    }
    for channel, (enabled, multiplier) in (phase_channels or {}).items():
        channels[channel] = (
            enabled,
            parsed_channels.get(
                channel, _PhaseChannelState(enabled, multiplier)
            ).multiplier,
        )
    for request in requests:
        enabled, _ = channels.get(request.channel, (True, 1.0))
        channels[request.channel] = (enabled, request.reporting_multiplier)
    if not channels and not has_phase_overrides:
        return _apply_status_overrides(content, channels, package_options["status_fields"], substitutions)
    phase_lines = {
        channel: _phase_override_lines(
            enabled, multiplier, power_quality[(channel - 1) // 6]
        )
        for channel, (enabled, multiplier) in channels.items()
    }
    managed_outputs = {
        channel: frozenset(
            match.group("output")
            for line in lines
            if (
                match := re.fullmatch(
                    r"      (?P<output>current|power|reactive_power|apparent_power):(?: !remove)?",
                    line,
                )
            )
        )
        for channel, lines in phase_lines.items()
    }
    if has_phase_overrides:
        content = replace_managed_block(content, "phase_overrides", "")
    _reject_local_output_filters(content, managed_outputs, substitutions)
    entries: dict[str, str] = {}
    for channel, (enabled, multiplier) in sorted(channels.items()):
        if channel not in range(1, topology.ct_count + 1):
            raise ConfigMutationError("reporting multiplier is outside topology")
        meter_key, phase = _channel_meter_phase(channel)
        meter_id = (
            f"${{{meter_key}}}"
            if meter_key in substitutions
            else _canonical_meter_id(meter_key)
        )
        body = [f"  - id: !extend {meter_id}", f"    phase_{phase}: # CT{channel}"]
        body.extend(phase_lines[channel])
        if len(body) > 2:
            entries[f"{channel:02d}"] = "\n".join(body) + "\n"
    if not entries and not has_phase_overrides:
        return _apply_status_overrides(content, channels, package_options["status_fields"], substitutions)
    rendered = render_phase_overrides(entries)
    if (
        rendered
        and ESPHomeConfigDocument.parse(content).writable_sensor_span is None
        and not any(_ROOT_SENSOR_RE.match(line) for line in content.splitlines())
    ):
        newline = "\r\n" if "\r\n" in content else "\n"
        content += ("" if content.endswith(("\n", "\r")) else newline) + "sensor:" + newline
    return _apply_status_overrides(
        replace_managed_block(content, "phase_overrides", rendered),
        channels,
        package_options["status_fields"],
        substitutions,
    )


def _phase_override_lines(
    enabled: bool, multiplier: float, power_quality: bool
) -> tuple[str, ...]:
    lines: list[str] = []
    if multiplier != 1:
        value = f"{multiplier:g}"
        outputs = ["current", "power"]
        if enabled and power_quality:
            outputs.extend(("reactive_power", "apparent_power"))
        for output in outputs:
            lines.extend(
                (f"      {output}:", "        filters:", f"          - multiply: {value}")
            )
    if not enabled:
        for output in ("current", "power"):
            if multiplier == 1:
                lines.append(f"      {output}:")
            lines.append("        internal: true")
    if power_quality:
        removals = ("harmonic_power", "peak_current") if enabled else (
            "reactive_power",
            "apparent_power",
            "harmonic_power",
            "peak_current",
            "power_factor",
            "phase_angle",
        )
        lines.extend(f"      {output}: !remove" for output in removals)
    return tuple(lines)


def _legacy_unused_phase_override_lines(
    multiplier: float, power_quality: bool
) -> tuple[str, ...]:
    """Recognize the Task 15 shape before unused current/power became internal."""
    lines: list[str] = []
    if multiplier != 1:
        value = f"{multiplier:g}"
        for output in ("current", "power"):
            lines.extend(
                (f"      {output}:", "        filters:", f"          - multiply: {value}")
            )
    if power_quality:
        lines.extend(
            f"      {output}: !remove"
            for output in (
                "reactive_power",
                "apparent_power",
                "harmonic_power",
                "peak_current",
                "power_factor",
                "phase_angle",
            )
        )
    return tuple(lines)


def _apply_status_overrides(
    content: str,
    channels: Mapping[int, tuple[bool, float]],
    status_fields: tuple[bool, ...],
    substitutions: Mapping[str, ConfigScalar],
) -> str:
    from .config_blocks import render_phase_overrides

    entries: dict[str, str] = {}
    for channel, (enabled, _) in channels.items():
        if enabled or not status_fields[(channel - 1) // 6]:
            continue
        meter_key, phase = _channel_meter_phase(channel)
        meter_id = (
            f"${{{meter_key}}}"
            if meter_key in substitutions
            else _canonical_meter_id(meter_key)
        )
        entries[f"{channel:02d}"] = (
            f"  - id: !extend {meter_id}\n"
            "    phase_status:\n"
            f"      phase_{phase}:\n"
            "        internal: true\n"
        )
    rendered = render_phase_overrides(entries)
    document = ESPHomeConfigDocument.parse(content)
    block = document.managed_blocks.get("status_overrides")
    newline = "\r\n" if "\r\n" in content else "\n"
    replacement = (
        _STATUS_OVERRIDE_START
        + newline
        + rendered.replace("\n", newline)
        + _STATUS_OVERRIDE_END
        + newline
    )
    if block is not None:
        section_start = _status_section_start(content, block.span.start)
        if section_start is None:
            raise ConfigMutationError("status override block is not safely writable")
        end = block.span.end
        if content[end : end + 2] == "\r\n":
            end += 2
        elif content[end : end + 1] in {"\r", "\n"}:
            end += 1
        if not rendered:
            return content[:section_start] + content[end:]
        return content[: block.span.start] + replacement + content[end:]
    if not rendered:
        return content
    if re.search(r"(?m)^(?:text_sensor|['\"]text_sensor['\"])[ \t]*:", content):
        raise ConfigMutationError("status override block needs a dedicated text_sensor section")
    return content + ("" if content.endswith(("\n", "\r")) else newline) + "text_sensor:" + newline + replacement


def _status_section_start(content: str, start: int) -> int | None:
    preceding = content[:start]
    header = re.search(r"(?m)^text_sensor:[ \t]*(?:#.*)?\r?\n$", preceding)
    if header is None or preceding[header.end() :].strip():
        return None
    return header.start()


def _read_phase_channel_states(
    content: str,
    topology: MeterTopology,
    substitutions: Mapping[str, ConfigScalar],
    power_quality: tuple[bool, ...],
) -> dict[int, _PhaseChannelState]:
    """Read every exact helper-owned phase state needed for safe rewriting."""
    starts = [match.start() for match in re.finditer(re.escape(_PHASE_OVERRIDE_START), content)]
    ends = [match.end() for match in re.finditer(re.escape(_PHASE_OVERRIDE_END), content)]
    if len(starts) != len(ends) or len(starts) > 1 or starts and starts[0] >= ends[0]:
        raise ConfigMutationError("reporting multiplier block is not safely writable")
    if not starts:
        return {}
    managed = content[starts[0] : ends[0]].splitlines()[1:-1]
    states: dict[int, _PhaseChannelState] = {}
    seen: set[int] = set()
    index = 0
    while index < len(managed):
        owner = _PHASE_OWNER_RE.fullmatch(managed[index])
        if owner is None:
            raise ConfigMutationError("reporting multiplier block is not safely writable")
        owner_id = owner.group("id")
        index += 1
        owner_entries = 0
        while index < len(managed) and not managed[index].startswith("  - id:"):
            header = _PHASE_HEADER_RE.fullmatch(managed[index])
            if header is None:
                raise ConfigMutationError(
                    "reporting multiplier block is not safely writable"
                )
            channel = int(header.group("channel"))
            if channel in seen or not 1 <= channel <= topology.ct_count:
                raise ConfigMutationError(
                    "reporting multiplier block is not safely writable"
                )
            meter_key, expected_phase = _channel_meter_phase(channel)
            expected_id = (
                f"${{{meter_key}}}"
                if meter_key in substitutions
                else _canonical_meter_id(meter_key)
            )
            if owner_id != expected_id or header.group("phase") != expected_phase:
                raise ConfigMutationError(
                    "reporting multiplier block is not safely writable"
                )
            index += 1
            body_start = index
            while index < len(managed) and not managed[index].startswith(
                ("  - id:", "    phase_")
            ):
                index += 1
            body = tuple(managed[body_start:index])
            if not body:
                raise ConfigMutationError(
                    "reporting multiplier block is not safely writable"
                )
            board_pq = power_quality[(channel - 1) // 6]
            state: _PhaseChannelState | None = None
            for multiplier in REPORTING_MULTIPLIERS:
                legacy = _phase_override_lines(True, multiplier, False)
                enabled = _phase_override_lines(True, multiplier, board_pq)
                unused = _phase_override_lines(False, multiplier, board_pq)
                legacy_unused = _legacy_unused_phase_override_lines(
                    multiplier, board_pq
                )
                if body in {unused, legacy_unused} and unused != enabled:
                    state = _PhaseChannelState(False, multiplier)
                    break
                if body in {legacy, enabled}:
                    state = _PhaseChannelState(True, multiplier)
                    break
            if state is None:
                raise ConfigMutationError(
                    "reporting multiplier block is not safely writable"
                )
            states[channel] = state
            seen.add(channel)
            owner_entries += 1
        if owner_entries == 0:
            raise ConfigMutationError("reporting multiplier block is not safely writable")
    return states


def _channel_meter_phase(channel: int) -> tuple[str, str]:
    board = (channel - 1) // 6
    group = (channel - 1) % 6 // 3 + 1
    meter_id = f"main_meter_id{group}" if board == 0 else f"addon{board}_id{group}"
    return meter_id, "abc"[(channel - 1) % 3]


def _canonical_meter_id(meter_key: str) -> str:
    match = re.fullmatch(r"main_meter_id([12])", meter_key)
    if match is not None:
        return f"meter_main{match.group(1)}"
    match = re.fullmatch(r"addon([1-6])_id([12])", meter_key)
    if match is None:
        raise ConfigMutationError("reporting multiplier meter ID is invalid")
    return f"addon{match.group(1)}_{match.group(2)}"


def _reject_local_output_filters(
    content: str,
    channels: Mapping[int, frozenset[str]],
    substitutions: Mapping[str, ConfigScalar],
) -> None:
    targets: dict[str, dict[str, tuple[int, frozenset[str]]]] = {}
    for channel, outputs in channels.items():
        if not outputs:
            continue
        meter_key, phase = _channel_meter_phase(channel)
        aliases = {meter_key, _canonical_meter_id(meter_key)}
        if meter_key in substitutions:
            aliases.add(substitutions[meter_key].value)
        for alias in aliases:
            targets.setdefault(alias, {})[phase] = (channel, outputs)
    document = ESPHomeConfigDocument.parse(content)
    lines = document.code_lines
    for index, line in enumerate(lines):
        item = re.match(r"(?P<indent> *)-\s+", line)
        if item is None:
            continue
        item_indent = len(item.group("indent"))
        item_end = len(lines)
        for candidate in range(index + 1, len(lines)):
            stripped = lines[candidate].strip()
            indent = len(lines[candidate]) - len(lines[candidate].lstrip(" "))
            if stripped and indent <= item_indent:
                item_end = candidate
                break
        item_keys: set[str] = set()
        for candidate in range(index, item_end):
            candidate_mapping = _yaml_mapping(lines[candidate])
            if candidate_mapping is not None:
                item_keys.add(candidate_mapping[2])
            explicit = _yaml_explicit_key(
                re.sub(r"^( *)-\s+", r"\1", lines[candidate], count=1)
            )
            if explicit is not None:
                item_keys.add(explicit)
            item_keys.update(_yaml_flow_keys(lines[candidate]))
        relevant_channel = next(
            (
                channel
                for phases in targets.values()
                for phase, (channel, outputs) in phases.items()
                if f"phase_{phase}" in item_keys and item_keys.intersection(outputs)
            ),
            None,
        )
        child_indents = [
            len(lines[candidate]) - len(lines[candidate].lstrip(" "))
            for candidate in range(index + 1, item_end)
            if lines[candidate].strip()
        ]
        direct_indent = min(child_indents) if child_indents else None
        direct_ids: list[tuple[str, bool]] = []
        first_mapping = _yaml_mapping(line)
        if (
            first_mapping is not None
            and first_mapping[1]
            and first_mapping[2] == "id"
        ):
            direct_ids.append((first_mapping[3], first_mapping[4]))
        if direct_indent is not None:
            direct_ids.extend(
                (candidate_mapping[3], candidate_mapping[4])
                for candidate in range(index + 1, item_end)
                if (candidate_mapping := _yaml_mapping(lines[candidate])) is not None
                and not candidate_mapping[1]
                and candidate_mapping[0] == direct_indent
                and candidate_mapping[2] == "id"
            )
        explicit_id = "id" in {
            _yaml_explicit_key(
                re.sub(r"^( *)-\s+", r"\1", lines[candidate], count=1)
            )
            for candidate in range(index, item_end)
        }
        flow_id = line.lstrip().startswith("- {") and "id" in _yaml_flow_keys(line)
        resolved_ids = [_yaml_identifier(value) for value, _ in direct_ids]
        if relevant_channel is not None and (
            explicit_id
            or flow_id
            or len(direct_ids) != 1
            or direct_ids[0][1]
            or resolved_ids[0] is None
        ):
            _filter_conflict(relevant_channel)
        owner_id = resolved_ids[0] if len(resolved_ids) == 1 else None
        if flow_id:
            flow_keys = _yaml_flow_keys(line)
            flow_owner = next((alias for alias in targets if alias in line), None)
            if flow_owner is not None:
                for phase, (channel, outputs) in targets[flow_owner].items():
                    if (
                        f"phase_{phase}" in flow_keys
                        and flow_keys.intersection(outputs)
                        and "filters" in flow_keys
                    ):
                        _filter_conflict(channel)
        if owner_id not in targets:
            continue
        for phase, (channel, outputs) in targets[owner_id].items():
            phase_key = f"phase_{phase}"
            phase_lines = [
                candidate
                for candidate in range(index, item_end)
                if (candidate_mapping := _yaml_mapping(lines[candidate])) is not None
                and (not candidate_mapping[1] or candidate == index)
                and candidate_mapping[2] == phase_key
            ]
            if any(
                _yaml_explicit_key(lines[candidate]) == phase_key
                for candidate in range(index + 1, item_end)
            ):
                _filter_conflict(channel)
            if len(phase_lines) > 1:
                _filter_conflict(channel)
            if not phase_lines:
                continue
            phase_line = phase_lines[0]
            phase_mapping = _yaml_mapping(lines[phase_line])
            assert phase_mapping is not None
            phase_indent, _, _, phase_rest, _ = phase_mapping
            if phase_rest.strip():
                if phase_rest.lstrip().startswith("{"):
                    flow_keys = _yaml_flow_keys(phase_rest)
                    if flow_keys.intersection(outputs) and "filters" in flow_keys:
                        _filter_conflict(channel)
                else:
                    _filter_conflict(channel)
                continue
            phase_end = item_end
            for candidate in range(phase_line + 1, item_end):
                indent = len(lines[candidate]) - len(lines[candidate].lstrip(" "))
                if lines[candidate].strip() and indent <= phase_indent:
                    phase_end = candidate
                    break
            direct_indents = [
                len(lines[candidate]) - len(lines[candidate].lstrip(" "))
                for candidate in range(phase_line + 1, phase_end)
                if lines[candidate].strip()
            ]
            if not direct_indents:
                continue
            direct_indent = min(direct_indents)
            seen_outputs: set[str] = set()
            for candidate in range(phase_line + 1, phase_end):
                if not lines[candidate].strip():
                    continue
                indent = len(lines[candidate]) - len(lines[candidate].lstrip(" "))
                if indent != direct_indent:
                    continue
                explicit = _yaml_explicit_key(lines[candidate])
                if explicit in outputs:
                    _filter_conflict(channel)
                output = _yaml_mapping(lines[candidate])
                if output is None:
                    flow_keys = _yaml_flow_keys(lines[candidate])
                    if flow_keys.intersection(outputs) and "filters" in flow_keys:
                        _filter_conflict(channel)
                    continue
                _, sequence, output_name, output_rest, _ = output
                if output_name not in outputs:
                    continue
                if sequence or output_name in seen_outputs:
                    _filter_conflict(channel)
                seen_outputs.add(output_name)
                output_end = phase_end
                for nested in range(candidate + 1, phase_end):
                    nested_indent = len(lines[nested]) - len(
                        lines[nested].lstrip(" ")
                    )
                    if lines[nested].strip() and nested_indent <= direct_indent:
                        output_end = nested
                        break
                if output_rest.strip():
                    if not (
                        output_rest.lstrip().startswith("{")
                        and "filters" not in _yaml_flow_keys(output_rest)
                    ):
                        _filter_conflict(channel)
                    continue
                for nested in range(candidate + 1, output_end):
                    nested_mapping = _yaml_mapping(lines[nested])
                    if (
                        nested_mapping is not None
                        and nested_mapping[2] in {"filters", "<<"}
                    ) or _yaml_explicit_key(lines[nested]) in {"filters", "<<"}:
                        _filter_conflict(channel)
                    nested_keys = _yaml_flow_keys(lines[nested])
                    if "filters" in nested_keys or re.search(
                        r"(?:^|\s)[*-][^\s]+", lines[nested].strip()
                    ):
                        _filter_conflict(channel)


def _yaml_mapping(line: str) -> tuple[int, bool, str, str, bool] | None:
    match = _YAML_MAPPING_RE.fullmatch(line)
    if match is None:
        return None
    dash = match.group("dash")
    return (
        len(match.group("indent")) + (len(dash) if dash is not None else 0),
        dash is not None,
        _yaml_key(match.group("key")),
        match.group("rest"),
        bool(match.group("decorators")),
    )


def _yaml_explicit_key(line: str) -> str | None:
    match = _YAML_EXPLICIT_KEY_RE.fullmatch(line)
    return _yaml_key(match.group("key")) if match is not None else None


def _yaml_flow_keys(line: str) -> set[str]:
    return {_yaml_key(match.group("key")) for match in _YAML_FLOW_KEY_RE.finditer(line)}


def _yaml_key(token: str) -> str:
    if token.startswith('"'):
        return str(json.loads(token))
    if token.startswith("'"):
        return token[1:-1].replace("''", "'")
    return token


def _yaml_identifier(rest: str) -> str | None:
    value = rest.strip()
    while (decorator := re.match(r"^(?P<token>![^\s]+|&[^\s]+)\s+", value)) is not None:
        if decorator.group("token").startswith("!") and decorator.group("token") != "!extend":
            return None
        value = value[decorator.end() :]
    if not value or value.startswith(("*", "{", "[")):
        return None
    if value.startswith('"'):
        try:
            identifier = json.loads(value)
        except json.JSONDecodeError:
            return None
    elif value.startswith("'") and value.endswith("'"):
        identifier = value[1:-1].replace("''", "'")
    else:
        identifier = value
    if not isinstance(identifier, str) or any(character.isspace() for character in identifier):
        return None
    if identifier.startswith("${") and identifier.endswith("}"):
        identifier = identifier[2:-1]
    return identifier


def _filter_conflict(channel: int) -> None:
    raise ConfigMutationError(
        f"existing CT{channel} output filters are not safely writable"
    )


def _substitution_block(
    document: ESPHomeConfigDocument, changes: list[SubstitutionChange]
) -> tuple[int, str, str]:
    matches = [
        index
        for index, line in enumerate(document.lines)
        if _SUBSTITUTIONS_RE.fullmatch(line)
    ]
    if len(matches) != 1:
        raise ConfigMutationError(
            "no unambiguous writable substitutions block",
            snippet=_snippet(changes),
        )
    start_line = matches[0]
    end_line = len(document.lines)
    for index in range(start_line + 1, len(document.lines)):
        line = document.lines[index]
        if (
            line.strip()
            and not line.lstrip().startswith("#")
            and _TOP_LEVEL_RE.match(line)
        ):
            end_line = index
            break
    child_indents = [
        len(line) - len(line.lstrip(" "))
        for line in document.lines[start_line + 1 : end_line]
        if line.strip() and not line.lstrip().startswith("#") and line.startswith(" ")
    ]
    newline = "\r\n" if "\r\n" in document.content else "\n"
    return (
        sum(len(line) for line in document.lines[:end_line]),
        " " * min(child_indents, default=2),
        newline,
    )


def _render_value(key: str, value: str, content: str, current: ConfigScalar) -> str:
    old_token = content[current.span.start : current.span.end]
    if _is_gain_key(key):
        return _render_gain(value, old_token)
    if key == "electric_freq":
        return _render_frequency(value, old_token)
    return _render_name(value, old_token)


def _render_missing(change: SubstitutionChange, document: ESPHomeConfigDocument) -> str:
    quote = _prevailing_quote(document, change.key)
    if _is_gain_key(change.key):
        return _render_gain(change.new_value, quote)
    if change.key == "electric_freq":
        return _render_frequency(change.new_value, quote)
    return _render_name(change.new_value, quote)


def _prevailing_quote(document: ESPHomeConfigDocument, key: str) -> str:
    is_gain = _is_gain_key(key)
    for same_family in (True, False):
        for candidate_key, scalar in document.substitutions.items():
            if same_family and (_is_gain_key(candidate_key) != is_gain):
                continue
            token = document.content[scalar.span.start : scalar.span.end]
            if token.startswith(("'", '"')):
                return token[0]
    return ""


def _render_gain(value: str, old_token: str) -> str:
    if old_token.startswith("'"):
        return f"'{value}'"
    if old_token.startswith('"'):
        return json.dumps(value)
    return value


def _render_frequency(value: str, old_token: str) -> str:
    if old_token.startswith("'"):
        return "'" + value.replace("'", "''") + "'"
    return json.dumps(value)


def _is_gain_key(key: str) -> bool:
    return key.startswith("current_cal_ct") or key in {"voltage_cal1", "voltage_cal2"}


def _render_name(value: str, old_token: str) -> str:
    if old_token.startswith("'"):
        return "'" + value.replace("'", "''") + "'"
    if old_token.startswith('"') or not _plain_yaml_name(value):
        return json.dumps(value, ensure_ascii=False)
    return value


def _plain_yaml_name(value: str) -> bool:
    return bool(_PLAIN_NAME_RE.fullmatch(value)) and value.lower() not in _YAML_RESERVED


def _snippet(changes: Iterable[SubstitutionChange]) -> str:
    return "substitutions:\n" + "".join(
        f"  {change.key}: {_render_name(change.new_value, '')}\n"
        if change.key.endswith("_name")
        else f"  {change.key}: {change.new_value}\n"
        for change in changes
    )


def _redacted_diff(changes: Iterable[SubstitutionChange]) -> str:
    lines: list[str] = []
    for change in changes:
        if change.old_value is not None:
            lines.append(f"- {change.key}: {change.old_value}")
        lines.append(f"+ {change.key}: {change.new_value}")
    return "\n".join(lines)


def _review_diff(
    changes: Iterable[SubstitutionChange], prior_content: str, proposed_content: str
) -> str:
    substitution_diff = _redacted_diff(changes)
    multiplier_diff = _reporting_multiplier_diff(prior_content, proposed_content)
    return "\n".join(part for part in (substitution_diff, multiplier_diff) if part)


def _reporting_multiplier_diff(prior_content: str, proposed_content: str) -> str:
    def managed_lines(content: str) -> tuple[str, ...]:
        start = content.find(_PHASE_OVERRIDE_START)
        if start < 0:
            return ()
        end = content.find(_PHASE_OVERRIDE_END, start)
        return tuple(
            content[start : end + len(_PHASE_OVERRIDE_END)].splitlines()
        )

    prior = managed_lines(prior_content)
    proposed = managed_lines(proposed_content)
    if prior == proposed:
        return ""
    return "managed phase overrides updated"
