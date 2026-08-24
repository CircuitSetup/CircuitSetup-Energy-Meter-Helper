"""Line-preserving CT substitution mutation planning."""

from __future__ import annotations

import json
import re
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from hashlib import sha256
from typing import Protocol

from .config_document import ConfigScalar, ESPHomeConfigDocument
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

_SUBSTITUTIONS_RE = re.compile(r"^substitutions:\s*(?:#.*)?(?:\r?\n)?$")
_SENSOR_RE = re.compile(r"^sensor:\s*(?:#.*)?(?:\r?\n)?$")
_TOP_LEVEL_RE = re.compile(r"^[\w-]+:")
_MULTIPLIER_START = "  # CircuitSetup Energy Meter Helper reporting multipliers"
_MULTIPLIER_END = "  # End reporting multipliers"
_MULTIPLIER_ENTRY_RE = re.compile(
    r"    phase_[abc]: # CT(?P<channel>[1-9]|[1-3][0-9]|4[0-2])\r?\n"
    r"      current:\r?\n        filters:\r?\n"
    r"          - multiply: (?P<current>[^\r\n]+)\r?\n"
    r"      power:\r?\n        filters:\r?\n"
    r"          - multiply: (?P<power>[^\r\n]+)\r?\n"
)
_PLAIN_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 ._/-]*$")
_YAML_RESERVED = {"null", "true", "false", "yes", "no", "on", "off", "~"}


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


def build_ct_mutation(
    snapshot: ConfigSnapshot,
    topology: MeterTopology,
    requested_channels: Iterable[CTChangeRequest],
) -> ConfigMutationPlan:
    """Build a safe CT-only edit plan without serializing the YAML document."""
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
    proposed_content = _apply_reporting_multipliers(
        _apply_changes(document, changes, values), requests, document.substitutions
    )
    if proposed_content == snapshot.content:
        return ConfigMutationPlan(
            snapshot.configuration, snapshot.sha256, (), "", snapshot.content
        )
    proposed_document = ESPHomeConfigDocument.parse(proposed_content)
    CTInventory.from_document(proposed_document, topology, catalog, snapshot.sha256)
    return ConfigMutationPlan(
        snapshot.configuration,
        snapshot.sha256,
        tuple(changes),
        _review_diff(changes, snapshot.content, proposed_content),
        proposed_content,
    )


def build_calibrated_gain_mutation(
    snapshot: ConfigSnapshot,
    topology: MeterTopology,
    verified: VerifiedCalibrationRecord,
    requested_channels: Iterable[CTChangeRequest] = (),
    calibrated_current_channels: frozenset[int] = frozenset(),
) -> ConfigMutationPlan:
    """Build a reviewed final-gain plan bound to the calibration source hash."""
    if getattr(snapshot, "configuration_authoritative", True) is not True:
        raise ConfigMutationError("configuration snapshot is not authoritative")
    current_hash = sha256(snapshot.content.encode()).hexdigest()
    if current_hash != snapshot.sha256:
        raise ConfigMutationError("configuration snapshot hash does not match content")
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
        or verified.topology_voltage_layout != topology.voltage_layout
    ):
        raise ConfigMutationError("verified calibration topology does not match target")
    document = ESPHomeConfigDocument.parse(snapshot.content)
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
    proposed_content = _apply_reporting_multipliers(
        _apply_changes(document, changes, values), requests, document.substitutions
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
    requests: tuple[CTChangeRequest, ...],
    substitutions: Mapping[str, ConfigScalar],
) -> str:
    starts = [
        match.start() for match in re.finditer(re.escape(_MULTIPLIER_START), content)
    ]
    ends = [match.end() for match in re.finditer(re.escape(_MULTIPLIER_END), content)]
    if len(starts) != len(ends) or len(starts) > 1 or starts and starts[0] >= ends[0]:
        raise ConfigMutationError("reporting multiplier block is not safely writable")
    multipliers: dict[int, float] = {}
    if starts:
        managed = content[starts[0] : ends[0]]
        entries = tuple(_MULTIPLIER_ENTRY_RE.finditer(managed))
        if len(entries) != managed.count("    phase_"):
            raise ConfigMutationError(
                "reporting multiplier block is not safely writable"
            )
        for entry in entries:
            try:
                current = float(entry.group("current"))
                power = float(entry.group("power"))
            except ValueError as error:
                raise ConfigMutationError(
                    "reporting multiplier block is not safely writable"
                ) from error
            if current != power or current not in REPORTING_MULTIPLIERS:
                raise ConfigMutationError(
                    "reporting multiplier block is not safely writable"
                )
            channel = int(entry.group("channel"))
            if channel in multipliers:
                raise ConfigMutationError(
                    "reporting multiplier block is not safely writable"
                )
            multipliers[channel] = current
        end = ends[0]
        if content[end : end + 2] == "\r\n":
            end += 2
        elif content[end : end + 1] == "\n":
            end += 1
        content = content[: starts[0]] + content[end:]
    for request in requests:
        if request.reporting_multiplier == 1:
            multipliers.pop(request.channel, None)
        else:
            multipliers[request.channel] = request.reporting_multiplier
    if not multipliers:
        return content
    _reject_local_output_filters(content, multipliers, substitutions)
    newline = "\r\n" if "\r\n" in content else "\n"
    block: list[str] = [_MULTIPLIER_START]
    current_id = ""
    for channel, value in sorted(multipliers.items()):
        meter_key, phase = _channel_meter_phase(channel)
        meter_id = (
            f"${{{meter_key}}}"
            if meter_key in substitutions
            else _canonical_meter_id(meter_key)
        )
        if meter_id != current_id:
            block.append(f"  - id: !extend {meter_id}")
            current_id = meter_id
        multiplier = f"{value:g}"
        block.extend(
            (
                f"    phase_{phase}: # CT{channel}",
                "      current:",
                "        filters:",
                f"          - multiply: {multiplier}",
                "      power:",
                "        filters:",
                f"          - multiply: {multiplier}",
            )
        )
    block.append(_MULTIPLIER_END)
    rendered = newline.join(block) + newline
    lines = content.splitlines(keepends=True)
    sensor_lines = [
        index for index, line in enumerate(lines) if line.startswith("sensor:")
    ]
    if len(sensor_lines) > 1 or (
        sensor_lines and _SENSOR_RE.fullmatch(lines[sensor_lines[0]]) is None
    ):
        raise ConfigMutationError("no unambiguous writable sensor block")
    if not sensor_lines:
        separator = "" if not content or content.endswith(("\n", "\r")) else newline
        return content + separator + "sensor:" + newline + rendered
    start = sensor_lines[0]
    end = len(lines)
    for index in range(start + 1, len(lines)):
        line = lines[index]
        if (
            line.strip()
            and not line.lstrip().startswith("#")
            and _TOP_LEVEL_RE.match(line)
        ):
            end = index
            break
    offset = sum(len(line) for line in lines[:end])
    return content[:offset] + rendered + content[offset:]


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
    channels: Iterable[int],
    substitutions: Mapping[str, ConfigScalar],
) -> None:
    targets: dict[tuple[str, str], int] = {}
    for channel in channels:
        meter_key, phase = _channel_meter_phase(channel)
        aliases = {meter_key, _canonical_meter_id(meter_key)}
        if meter_key in substitutions:
            aliases.add(substitutions[meter_key].value)
        targets.update({(alias, phase): channel for alias in aliases})
    lines = content.splitlines()
    for index, line in enumerate(lines):
        item = re.match(r"(?P<indent> *)-\s+", line)
        if item is None:
            continue
        item_indent = len(item.group("indent"))
        item_end = len(lines)
        for candidate in range(index + 1, len(lines)):
            stripped = lines[candidate].strip()
            indent = len(lines[candidate]) - len(lines[candidate].lstrip(" "))
            if stripped and not stripped.startswith("#") and indent <= item_indent:
                item_end = candidate
                break
        extend = re.fullmatch(
            r" *-\s+id:\s*!extend\s+(?:\$\{)?(?P<id>[\w-]+)(?:\})?\s*(?:#.*)?",
            line,
        )
        owner_id = extend.group("id") if extend is not None else None
        if owner_id is None:
            for candidate in range(index + 1, item_end):
                identifier = re.fullmatch(
                    rf" {{{item_indent + 2}}}id:\s*(?:\$\{{)?(?P<id>[\w-]+)(?:\}})?\s*(?:#.*)?",
                    lines[candidate],
                )
                if identifier is not None:
                    owner_id = identifier.group("id")
                    break
        if owner_id is None or not any(owner_id == target[0] for target in targets):
            continue
        for (target_meter_id, phase), channel in targets.items():
            if target_meter_id != owner_id:
                continue
            phase_line = next(
                (
                    candidate
                    for candidate in range(index + 1, item_end)
                    if lines[candidate].strip().split(" #", 1)[0] == f"phase_{phase}:"
                ),
                None,
            )
            if phase_line is None:
                continue
            phase_indent = len(lines[phase_line]) - len(lines[phase_line].lstrip(" "))
            for candidate in range(phase_line + 1, item_end):
                stripped = lines[candidate].strip()
                indent = len(lines[candidate]) - len(lines[candidate].lstrip(" "))
                if stripped and not stripped.startswith("#") and indent <= phase_indent:
                    break
                if stripped in {"current:", "power:"}:
                    output_indent = indent
                    for nested in range(candidate + 1, item_end):
                        nested_value = lines[nested].strip()
                        nested_indent = len(lines[nested]) - len(
                            lines[nested].lstrip(" ")
                        )
                        if (
                            nested_value
                            and not nested_value.startswith("#")
                            and nested_indent <= output_indent
                        ):
                            break
                        if nested_value == "filters:":
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
    return _render_name(value, old_token)


def _render_missing(change: SubstitutionChange, document: ESPHomeConfigDocument) -> str:
    quote = _prevailing_quote(document, change.key)
    if _is_gain_key(change.key):
        return _render_gain(change.new_value, quote)
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
        start = content.find(_MULTIPLIER_START)
        if start < 0:
            return ()
        end = content.find(_MULTIPLIER_END, start)
        return tuple(
            content[start : end + len(_MULTIPLIER_END)].splitlines()
        )

    prior = managed_lines(prior_content)
    proposed = managed_lines(proposed_content)
    if prior == proposed:
        return ""
    return "\n".join(
        (*(f"- {line}" for line in prior), *(f"+ {line}" for line in proposed))
    )
