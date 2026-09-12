"""Line-preserving CT substitution mutation planning."""

from __future__ import annotations

import json
import re
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, replace
from hashlib import sha256
from typing import Protocol

import yaml  # type: ignore[import-untyped]
from yaml.nodes import (  # type: ignore[import-untyped]
    MappingNode,
    ScalarNode,
    SequenceNode,
)

from .config_document import (
    MANAGED_BLOCK_MARKERS,
    ConfigScalar,
    ESPHomeConfigDocument,
    PackageFileReference,
)
from .ct_catalog import (
    REPORTING_MULTIPLIERS,
    CTPresetCatalog,
    custom_preset,
    raw_gain,
    raw_gain_for_preset,
)
from .ct_inventory import CTInventory
from .models import (
    ConfigMutationPlan,
    MeterTopology,
    PhaseOffsetTable,
    PhasePowerOffsetTable,
    SubstitutionChange,
)
from .package_contract import (
    OFFICIAL_PACKAGE_REPOSITORY,
    SUPPORTED_PACKAGE_CONTRACTS,
    CalibrationPreparationCapability,
    PackageCapability,
    calibration_package_path,
    is_static_package_ref,
    package_path,
)
from .store import VerifiedCalibrationRecord, _validate_group_table
from .topology import (
    topology_from_config,
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
_PACKAGE_FEATURES = SUPPORTED_PACKAGE_CONTRACTS


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

    def __init__(
        self,
        message: str,
        *,
        snippet: str | None = None,
        reason_code: str | None = None,
    ) -> None:
        super().__init__(message)
        self.snippet = snippet
        self.reason_code = reason_code


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
    preserved_gain_channels: frozenset[int] = frozenset(),
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
        _append_change(changes, values, name_key, request.name, document.substitutions)
        if request.channel not in preserved_gain_channels:
            gain = _requested_gain(request, catalog)
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
    if ESPHomeConfigDocument.parse(content).unresolved_package_sources:
        raise ConfigMutationError("unresolved package source", reason_code="unsupported_package_source")
    if set(package_options) != set(_PACKAGE_FEATURES):
        raise ConfigMutationError("package options are invalid")
    desired = {name: tuple(values) for name, values in package_options.items()}
    if any(
        len(values) != topology.board_count
        or any(type(value) is not bool for value in values)
        for values in desired.values()
    ):
        raise ConfigMutationError("package options require one state per installed board")

    changes: list[SubstitutionChange] = []
    proposed = content
    for feature in _PACKAGE_FEATURES:
        for board_index, enabled in enumerate(desired[feature]):
            board = "main" if board_index == 0 else f"addon{board_index}"
            path = package_path(feature, board_index)
            document = ESPHomeConfigDocument.parse(proposed)
            references = [
                reference
                for reference in document.package_references
                if reference.path == path
            ]
            if len(references) > 1:
                raise ConfigMutationError(
                    f"{feature} package line is duplicated",
                    reason_code="duplicate_package_reference",
                )
            reference = references[0] if references else None
            current = reference is not None and reference.active
            if reference is not None and not _official_package_reference(reference):
                raise ConfigMutationError(
                    f"{feature} package cannot be safely managed "
                    "from this package source",
                    reason_code=_package_reference_reason(reference),
                )
            if current == enabled:
                continue
            if reference is None:
                if not enabled:
                    continue
                capability = _package_capability(
                    document, topology, feature, board_index
                )
                if capability.state != "available_to_prepare":
                    raise ConfigMutationError(
                        f"{feature} package cannot be safely prepared "
                        f"({capability.reason_code})",
                        reason_code=capability.reason_code,
                    )
                source = _writable_package_sources(document)[0]
                proposed = _insert_package_reference(proposed, source, path)
                changes.append(
                    SubstitutionChange(
                        f"{feature}_{board}", "disabled", "enabled"
                    )
                )
                continue
            proposed = _toggle_package_reference(
                proposed, document, reference, enabled, feature
            )
            changes.append(
                SubstitutionChange(
                    f"{feature}_{board}",
                    "enabled" if current else "disabled",
                    "enabled" if enabled else "disabled",
                )
            )
    return proposed, changes


def build_calibration_preparation_mutation(
    snapshot: ConfigSnapshot, topology: MeterTopology
) -> ConfigMutationPlan:
    """Build the reviewed official calibration-controls package preparation."""
    if getattr(snapshot, "configuration_authoritative", True) is not True:
        raise ConfigMutationError(
            "configuration snapshot is not authoritative",
            reason_code="configuration_not_authoritative",
        )
    if sha256(snapshot.content.encode()).hexdigest() != snapshot.sha256:
        raise ConfigMutationError("configuration snapshot hash does not match content")
    proposed = snapshot.content
    changes: list[SubstitutionChange] = []
    document = ESPHomeConfigDocument.parse(proposed)
    if document.unresolved_package_sources:
        raise ConfigMutationError("unresolved package source", reason_code="unsupported_package_source")
    proposed = _apply_calibration_flags(proposed, document, changes)
    for board_index in range(topology.board_count):
        path = calibration_package_path(board_index)
        document = ESPHomeConfigDocument.parse(proposed)
        references = [
            reference
            for reference in document.package_references
            if reference.path == path
        ]
        if len(references) > 1:
            raise ConfigMutationError(
                "calibration package line is duplicated",
                reason_code="duplicate_package_reference",
            )
        reference = references[0] if references else None
        if reference is not None:
            if not _official_package_reference(reference):
                raise ConfigMutationError(
                    "calibration package cannot be safely managed from this source",
                    reason_code=_package_reference_reason(reference),
                )
            if reference.active:
                continue
            proposed = _toggle_package_reference(
                proposed, document, reference, True, "calibration"
            )
        else:
            sources = _package_sources(document)
            if len(sources) != 1:
                reason = "ambiguous_package_source" if len(sources) > 1 else "package_source_unavailable"
                raise ConfigMutationError(
                    "calibration package cannot be safely prepared",
                    reason_code=reason,
                )
            if not _official_package_reference(sources[0]):
                raise ConfigMutationError(
                    "calibration package cannot be safely prepared from this source",
                    reason_code="unsupported_package_source",
                )
            proposed = _insert_package_reference(proposed, sources[0], path)
        board = "main" if board_index == 0 else f"addon{board_index}"
        changes.append(
            SubstitutionChange(f"package.{board}.calibration", "disabled", "enabled")
        )
    if proposed == snapshot.content:
        return ConfigMutationPlan(
            snapshot.configuration, snapshot.sha256, (), "", snapshot.content
        )
    return ConfigMutationPlan(
        snapshot.configuration,
        snapshot.sha256,
        tuple(changes),
        _review_diff(changes, snapshot.content, proposed),
        proposed,
    )


def _apply_calibration_flags(
    content: str,
    document: ESPHomeConfigDocument,
    changes: list[SubstitutionChange],
) -> str:
    """Enable only literal official calibration substitutions."""
    values: dict[str, str] = {}
    flag_changes: list[SubstitutionChange] = []
    for key in ("offset_calibration", "gain_calibration"):
        scalar = document.substitutions.get(key)
        if scalar is None:
            raise ConfigMutationError(
                f"{key} substitution is unavailable",
                reason_code="calibration_flag_unavailable",
            )
        if scalar.value not in {"true", "false"}:
            raise ConfigMutationError(
                f"{key} substitution is not a literal true/false flag",
                reason_code="calibration_flag_invalid",
            )
        if scalar.value == "false":
            flag_changes.append(SubstitutionChange(key, scalar.value, "true"))
            values[key] = "true"
    if not flag_changes:
        return content
    changes.extend(flag_changes)
    return _apply_changes(document, flag_changes, values)


def package_capabilities_from_document(
    document: ESPHomeConfigDocument, topology: MeterTopology
) -> tuple[PackageCapability, ...]:
    """Describe package edits before the browser offers an enabled checkbox."""
    if document.unresolved_package_sources:
        return tuple(
            PackageCapability(feature, board, "cannot_safely_manage", "unsupported_package_source")
            for feature in _PACKAGE_FEATURES for board in range(topology.board_count)
        )
    return tuple(
        _package_capability(document, topology, feature, board_index)
        for feature in _PACKAGE_FEATURES
        for board_index in range(topology.board_count)
    )


def calibration_preparation_capability_from_document(
    document: ESPHomeConfigDocument, topology: MeterTopology
) -> CalibrationPreparationCapability:
    """Describe whether the reviewed calibration controls can be prepared."""
    if document.unresolved_package_sources:
        return CalibrationPreparationCapability("cannot_safely_manage", "unsupported_package_source")
    for key in ("offset_calibration", "gain_calibration"):
        scalar = document.substitutions.get(key)
        if scalar is None:
            return CalibrationPreparationCapability(
                "cannot_safely_manage", "calibration_flag_unavailable"
            )
        if scalar.value not in {"true", "false"}:
            return CalibrationPreparationCapability(
                "cannot_safely_manage", "calibration_flag_invalid"
            )

    needs_change = any(
        document.substitutions[key].value == "false"
        for key in ("offset_calibration", "gain_calibration")
    )
    for board_index in range(topology.board_count):
        path = calibration_package_path(board_index)
        references = [
            reference
            for reference in document.package_references
            if reference.path == path
        ]
        if len(references) > 1:
            return CalibrationPreparationCapability(
                "cannot_safely_manage", "duplicate_package_reference"
            )
        if not references:
            sources = _package_sources(document)
            if len(sources) != 1:
                return CalibrationPreparationCapability(
                    "cannot_safely_manage",
                    "ambiguous_package_source"
                    if len(sources) > 1
                    else "package_source_unavailable",
                )
            if not _official_package_reference(sources[0]):
                return CalibrationPreparationCapability(
                    "cannot_safely_manage", "unsupported_package_source"
                )
            needs_change = True
            continue
        reference = references[0]
        official_identity = (
            reference.repository == OFFICIAL_PACKAGE_REPOSITORY
            and is_static_package_ref(reference.ref)
        )
        if not official_identity:
            return CalibrationPreparationCapability(
                "cannot_safely_manage", "unsupported_package_source"
            )
        if not reference.active:
            if not _official_package_reference(reference):
                return CalibrationPreparationCapability(
                    "cannot_safely_manage", "package_source_unavailable"
                )
            needs_change = True
    return CalibrationPreparationCapability(
        "available_to_prepare" if needs_change else "already_present",
        "calibration_source_ready"
        if needs_change
        else "calibration_package_present",
    )


def _package_capability(
    document: ESPHomeConfigDocument,
    topology: MeterTopology,
    feature: str,
    board_index: int,
) -> PackageCapability:
    path = package_path(feature, board_index)
    references = [
        reference
        for reference in document.package_references
        if reference.path == path
    ]
    if len(references) > 1:
        return PackageCapability(
            feature, board_index, "cannot_safely_manage", "duplicate_package_reference"
        )
    if references:
        reference = references[0]
        if _official_package_reference(reference):
            return PackageCapability(
                feature,
                board_index,
                "already_present" if reference.active else "available_to_prepare",
                "official_package_present" if reference.active else "official_source_ready",
            )
        return PackageCapability(
            feature,
            board_index,
            "cannot_safely_manage",
            _package_reference_reason(reference),
        )
    sources = _package_sources(document)
    if len(sources) == 1 and _official_package_reference(sources[0]):
        return PackageCapability(
            feature, board_index, "available_to_prepare", "official_source_ready"
        )
    if len(sources) == 1:
        reason = "unsupported_package_source"
    else:
        reason = "ambiguous_package_source" if sources else "package_source_unavailable"
    return PackageCapability(feature, board_index, "cannot_safely_manage", reason)


def _official_package_reference(reference: PackageFileReference) -> bool:
    return (
        reference.repository == OFFICIAL_PACKAGE_REPOSITORY
        and is_static_package_ref(reference.ref)
        and reference.files_span is not None
    )


def package_graph_owner_is_official(document: ESPHomeConfigDocument) -> bool:
    """Return whether every parsed package reference has the official source."""
    references = document.package_references
    return not document.unresolved_package_sources and bool(references) and all(
        reference.repository == OFFICIAL_PACKAGE_REPOSITORY
        and is_static_package_ref(reference.ref)
        for reference in references
    )


def _package_reference_reason(reference: PackageFileReference) -> str:
    if reference.repository != OFFICIAL_PACKAGE_REPOSITORY:
        return "unsupported_package_source"
    return "package_source_unavailable"


def _toggle_package_reference(
    content: str,
    document: ESPHomeConfigDocument,
    reference: PackageFileReference,
    enabled: bool,
    feature: str,
) -> str:
    """Toggle one exact official package reference without rewriting its list."""
    pattern = re.compile(
        rf"^(?P<indent> *)(?P<comment>#\s*)?(?P<entry>-\s+{re.escape(reference.path)}"
        rf"(?P<tail>\s*(?:#.*)?))(?P<newline>\r?\n)?$"
    )
    index = reference.line - 1
    lines = content.splitlines(keepends=True)
    if index < 0 or index >= len(lines):
        raise ConfigMutationError(
            f"{feature} package line is unavailable",
            reason_code="package_reference_changed",
        )
    match = pattern.fullmatch(lines[index])
    if match is None:
        raise ConfigMutationError(
            f"{feature} package line is unavailable",
            reason_code="package_reference_changed",
        )
    indent = match.group("indent")
    if enabled:
        indent = _package_item_indent(document, reference, indent)
    lines[index] = (
        indent
        + ("" if enabled else "#")
        + match.group("entry")
        + (match.group("newline") or "")
    )
    return "".join(lines)


def _writable_package_sources(
    document: ESPHomeConfigDocument,
) -> list[PackageFileReference]:
    return [
        source
        for source in _package_sources(document)
        if _official_package_reference(source)
    ]


def _package_sources(document: ESPHomeConfigDocument) -> list[PackageFileReference]:
    sources: dict[tuple[object, ...], PackageFileReference] = {}
    for reference in document.package_references:
        if reference.files_span is None:
            continue
        sources[_package_source_key(reference)] = reference
    return list(sources.values())


def _insert_package_reference(
    content: str, source: PackageFileReference, path: str
) -> str:
    lines = content.splitlines(keepends=True)
    span = source.files_span
    item_indent = source.item_indent
    if span is None:
        raise ConfigMutationError(
            "package source has no writable files list",
            reason_code="package_source_unavailable",
        )
    indent = " " * (item_indent or 0)
    source_key = _package_source_key(source)
    source_references = [
        reference
        for reference in ESPHomeConfigDocument.parse(content).package_references
        if _package_source_key(reference) == source_key
    ]
    target_order = _package_path_order(path)
    later = [
        reference
        for reference in source_references
        if _package_path_order(reference.path) > target_order
    ]
    if later:
        insert_at = min(reference.line for reference in later) - 1
        start = span.line - 1
        while insert_at > start:
            previous = lines[insert_at - 1].strip()
            if not previous or previous.startswith("#"):
                insert_at -= 1
                continue
            break
    else:
        insert_at = _line_index_at_offset(lines, span.end)
    newline = _line_ending(lines, span.line - 1)
    prefix = ""
    if insert_at and not lines[insert_at - 1].endswith(("\n", "\r")):
        prefix = newline
    lines.insert(insert_at, prefix + f"{indent}- {path}{newline}")
    return "".join(lines)


def _package_item_indent(
    document: ESPHomeConfigDocument,
    target: PackageFileReference,
    fallback: str,
) -> str:
    peers = [
        reference
        for reference in document.package_references
        if reference.active
        and _package_source_key(reference) == _package_source_key(target)
        and reference.item_indent is not None
    ]
    if not peers or target.item_indent is None:
        return fallback
    nearest = min(peers, key=lambda reference: abs(reference.line - target.line))
    return " " * (nearest.item_indent or 0)


def _package_source_key(reference: PackageFileReference) -> tuple[object, ...]:
    span = reference.files_span
    return (
        span.start if span is not None else None,
        span.end if span is not None else None,
        reference.repository,
        reference.ref,
    )


def _package_path_order(path: str) -> tuple[int, int]:
    for feature_index, feature in enumerate(_PACKAGE_FEATURES):
        for board_index in range(7):
            if package_path(feature, board_index) == path:
                return feature_index, board_index
    return len(_PACKAGE_FEATURES), 7


def _line_index_at_offset(lines: list[str], offset: int) -> int:
    position = 0
    for index, line in enumerate(lines):
        if position >= offset:
            return index
        position += len(line)
    return len(lines)


def _line_ending(lines: list[str], start: int) -> str:
    for line in lines[start:]:
        if line.endswith("\r\n"):
            return "\r\n"
        if line.endswith("\n"):
            return "\n"
    return "\r\n" if any(line.endswith("\r\n") for line in lines) else "\n"


def package_options_from_document(
    document: ESPHomeConfigDocument, topology: MeterTopology
) -> dict[str, tuple[bool, ...]]:
    """Return the active optional packages for each installed board."""
    active = set(document.package_files)
    return {
        feature: tuple(
            package_path(feature, board_index) in active
            for board_index in range(topology.board_count)
        )
        for feature in _PACKAGE_FEATURES
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
    )
    try:
        from .voltage_gains import apply_voltage_gain_changes

        proposed_content = apply_voltage_gain_changes(
            proposed_content,
            topology,
            {instance_id: gains for instance_id, _, _, gains in addressed},
        )
    except ValueError as error:
        raise ConfigMutationError("voltage gains are not safely writable") from error
    proposed_document = ESPHomeConfigDocument.parse(proposed_content)
    for index in (1, 2):
        key = f"voltage_cal{index}"
        old = document.substitutions.get(key)
        new = proposed_document.substitutions.get(key)
        if new is not None and (old is None or old.value != new.value):
            changes.append(SubstitutionChange(key, old.value if old else None, new.value))
    proposed_content = _apply_calibrated_offsets(
        proposed_content,
        topology,
        _verified_offset_tables(topology, verified.offset_groups, "phase_offsets"),
        _verified_offset_tables(
            topology, verified.power_offset_groups, "phase_power_offsets"
        ),
    )
    if (
        "# CircuitSetup Energy Meter Helper: calibrated voltage gains v1"
        in snapshot.content
        and "# CircuitSetup Energy Meter Helper: calibrated voltage gains v1"
        not in proposed_content
    ):
        changes.append(
            SubstitutionChange("calibrated_voltage_gains", "managed", "removed")
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


def _verified_offset_tables(
    topology: MeterTopology, groups: Iterable[object], field: str
) -> dict[str, tuple[tuple[int, int], tuple[int, int], tuple[int, int]]]:
    tables: dict[str, tuple[tuple[int, int], tuple[int, int], tuple[int, int]]] = {}
    for group in groups:
        instance_id = getattr(group, "instance_id", None)
        table = getattr(group, field, None)
        if (
            not isinstance(instance_id, str)
            or not isinstance(table, tuple)
            or len(table) != 3
            or any(
                not isinstance(phase, tuple)
                or len(phase) != 2
                or any(type(value) is not int or not -32768 <= value <= 32767 for value in phase)
                for phase in table
            )
            or instance_id in tables
        ):
            raise ConfigMutationError("verified offset groups are invalid")
        _gain_group_address(instance_id, topology)
        tables[instance_id] = table
    return tables


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


def build_offset_table_mutation(
    snapshot: ConfigSnapshot,
    topology: MeterTopology,
    offsets: Mapping[str, PhaseOffsetTable],
    power_offsets: Mapping[str, PhasePowerOffsetTable],
    *,
    enable_calibration: frozenset[str] | Mapping[str, bool] = frozenset(),
) -> ConfigMutationPlan:
    """Render captured raw candidates without inventing calibration verification."""
    if (
        getattr(snapshot, "configuration_authoritative", True) is not True
        or sha256(snapshot.content.encode()).hexdigest() != snapshot.sha256
    ):
        raise ConfigMutationError("configuration snapshot is not authoritative")
    source = topology_from_config(
        ESPHomeConfigDocument.parse(snapshot.content),
        native_project_name=topology.project_name,
    )
    if replace(source, evidence=()) != replace(topology, evidence=()):
        raise ConfigMutationError("offset topology does not match target")
    for tables in (offsets, power_offsets):
        for instance, table in tables.items():
            _gain_group_address(instance, topology)
            _validate_group_table(instance, table, signed=True, label="offsets")
    if not set(enable_calibration) <= set(offsets) | set(power_offsets):
        raise ConfigMutationError("enabled offset targets must have exact tables")
    if isinstance(enable_calibration, Mapping):
        for instance, enabled in enable_calibration.items():
            if type(enabled) is not bool:
                raise ConfigMutationError("offset calibration flag must be boolean")
            if not enabled and (
                instance not in offsets or instance not in power_offsets
            ):
                raise ConfigMutationError(
                    "disabled offsets require both exact stage tables"
                )
    proposed = _apply_calibrated_offsets(
        snapshot.content,
        topology,
        offsets,
        power_offsets,
        enable_calibration=enable_calibration,
    )
    return ConfigMutationPlan(
        snapshot.configuration,
        snapshot.sha256,
        (),
        _review_diff((), snapshot.content, proposed),
        proposed,
    )


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
    values[key] = new_value
    if current is not None and _same_value(key, current.value, new_value):
        return
    changes.append(
        SubstitutionChange(key, current.value if current else None, new_value)
    )


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
    current_gains = {
        int(key.removeprefix("current_cal_ct")): frozenset(("gain_ct",))
        for key in values
        if key.startswith("current_cal_ct")
    }
    if current_gains:
        try:
            # Includes and aliases can hide gains even when no local gain_ct key exists.
            _reject_local_output_filters(document.content, current_gains, document.substitutions)
        except ConfigMutationError as error:
            raise ConfigMutationError(f"existing current gain overrides are not safely writable: {error}") from error
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


def _apply_calibrated_offsets(
    content: str,
    topology: MeterTopology,
    offsets_by_instance: Mapping[str, tuple[tuple[int, int], tuple[int, int], tuple[int, int]]],
    power_offsets_by_instance: Mapping[
        str, tuple[tuple[int, int], tuple[int, int], tuple[int, int]]
    ],
    *,
    enable_calibration: frozenset[str] | Mapping[str, bool] = frozenset(),
) -> str:
    """Render verified signed offset tables in one exact helper-owned block."""
    from .config_blocks import render_phase_overrides, replace_managed_block

    selected = set(offsets_by_instance) | set(power_offsets_by_instance)
    if not selected:
        return content
    document = ESPHomeConfigDocument.parse(content)
    entries = _read_calibrated_offset_entries(document, topology)
    block = document.managed_blocks.get("calibrated_offsets")
    enabled: dict[str, bool] = {}
    if block is not None:
        enabled.update(
            (instance, value == "true")
            for instance, value in re.findall(
                r"- id: !extend ([\w-]+)\r?\n +enable_offset_calibration: (true|false)",
                block.content,
            )
        )
    enabled.update(
        enable_calibration
        if isinstance(enable_calibration, Mapping)
        else dict.fromkeys(enable_calibration, True)
    )
    _reject_local_offset_overrides(
        replace_managed_block(content, "calibrated_offsets", ""),
        topology,
        selected,
        document.substitutions,
    )
    for instance_id, values in offsets_by_instance.items():
        entries.setdefault(instance_id, {})["rms"] = values
    for instance_id, values in power_offsets_by_instance.items():
        entries.setdefault(instance_id, {})["power"] = values
    rendered = render_phase_overrides(
        {
            instance_id: _render_calibrated_offset_entry(instance_id, stages, enabled=enabled.get(instance_id))
            for instance_id, stages in entries.items()
        }
    )
    if (
        rendered
        and document.writable_sensor_span is None
        and not any(_ROOT_SENSOR_RE.match(line) for line in content.splitlines())
    ):
        newline = "\r\n" if "\r\n" in content else "\n"
        content += ("" if content.endswith(("\n", "\r")) else newline) + "sensor:" + newline
    return replace_managed_block(content, "calibrated_offsets", rendered)


def _read_calibrated_offset_entries(
    document: ESPHomeConfigDocument, topology: MeterTopology
) -> dict[
    str,
    dict[str, tuple[tuple[int, int], tuple[int, int], tuple[int, int]]],
]:
    block = document.managed_blocks.get("calibrated_offsets")
    if block is None:
        return {}
    indent = document.sensor_item_indent
    if indent is None:
        raise ConfigMutationError("managed offsets are invalid")
    lines = block.content.splitlines()[1:-1]
    if indent == 0:
        lines = [f"  {line}" if line else line for line in lines]
    entries: dict[
        str, dict[str, tuple[tuple[int, int], tuple[int, int], tuple[int, int]]]
    ] = {}
    index = 0
    header = re.compile(r"^  - id: !extend (?P<id>[\w-]+)$")
    phase_header = re.compile(r"^    phase_(?P<phase>[abc]):$")
    value_line = re.compile(
        r"^      (?P<field>offset_voltage|offset_current|offset_active_power|offset_reactive_power): (?P<value>-?(?:0|[1-9]\d*))$"
    )
    while index < len(lines):
        owner = header.fullmatch(lines[index])
        if owner is None or owner["id"] in entries:
            raise ConfigMutationError("managed offsets are invalid")
        _gain_group_address(owner["id"], topology)
        index += 1
        if index < len(lines) and lines[index] in (
            "    enable_offset_calibration: true",
            "    enable_offset_calibration: false",
        ):
            index += 1
        phases: dict[str, dict[str, int]] = {}
        for expected_phase in "abc":
            if index >= len(lines) or (phase := phase_header.fullmatch(lines[index])) is None or phase["phase"] != expected_phase:
                raise ConfigMutationError("managed offsets are invalid")
            index += 1
            values: dict[str, int] = {}
            while index < len(lines) and not lines[index].startswith(("  - id:", "    phase_")):
                match = value_line.fullmatch(lines[index])
                if match is None or match["field"] in values:
                    raise ConfigMutationError("managed offsets are invalid")
                value = int(match["value"])
                if not -32768 <= value <= 32767:
                    raise ConfigMutationError("managed offsets are invalid")
                values[match["field"]] = value
                index += 1
            phases[expected_phase] = values
        field_sets = {frozenset(values) for values in phases.values()}
        if len(field_sets) != 1 or next(iter(field_sets)) not in {
            frozenset({"offset_voltage", "offset_current"}),
            frozenset({"offset_active_power", "offset_reactive_power"}),
            frozenset(
                {
                    "offset_voltage",
                    "offset_current",
                    "offset_active_power",
                    "offset_reactive_power",
                }
            ),
        }:
            raise ConfigMutationError("managed offsets are invalid")
        stages: dict[str, tuple[tuple[int, int], tuple[int, int], tuple[int, int]]] = {}
        fields = next(iter(field_sets))
        if "offset_voltage" in fields:
            stages["rms"] = (
                (phases["a"]["offset_voltage"], phases["a"]["offset_current"]),
                (phases["b"]["offset_voltage"], phases["b"]["offset_current"]),
                (phases["c"]["offset_voltage"], phases["c"]["offset_current"]),
            )
        if "offset_active_power" in fields:
            stages["power"] = (
                (
                    phases["a"]["offset_active_power"],
                    phases["a"]["offset_reactive_power"],
                ),
                (
                    phases["b"]["offset_active_power"],
                    phases["b"]["offset_reactive_power"],
                ),
                (
                    phases["c"]["offset_active_power"],
                    phases["c"]["offset_reactive_power"],
                ),
            )
        entries[owner["id"]] = stages
    return entries


def _render_calibrated_offset_entry(
    instance_id: str,
    stages: Mapping[str, tuple[tuple[int, int], tuple[int, int], tuple[int, int]]],
    *,
    enabled: bool | None = None,
) -> str:
    if set(stages) - {"rms", "power"} or not stages:
        raise ConfigMutationError("managed offsets are invalid")
    body = [f"  - id: !extend {instance_id}"]
    if enabled is not None:
        body.append(f"    enable_offset_calibration: {str(enabled).lower()}")
    for phase_index, phase in enumerate("abc"):
        body.append(f"    phase_{phase}:")
        if "rms" in stages:
            voltage, current = stages["rms"][phase_index]
            body.extend((f"      offset_voltage: {voltage}", f"      offset_current: {current}"))
        if "power" in stages:
            active, reactive = stages["power"][phase_index]
            body.extend(
                (
                    f"      offset_active_power: {active}",
                    f"      offset_reactive_power: {reactive}",
                )
            )
    return "\n".join(body) + "\n"


def _reject_local_offset_overrides(
    content: str,
    topology: MeterTopology,
    instance_ids: set[str],
    substitutions: Mapping[str, ConfigScalar],
) -> None:
    aliases = set(instance_ids)
    for instance_id in instance_ids:
        board, group = _gain_group_address(instance_id, topology)
        meter_key = (
            f"main_meter_id{group}"
            if board == 0
            else f"addon{board}_id{group}"
        )
        aliases.add(meter_key)
        if meter_key in substitutions:
            aliases.add(substitutions[meter_key].value)
    lines = ESPHomeConfigDocument.parse(content).code_lines
    offset_fields = {
        "enable_offset_calibration",
        "offset_voltage",
        "offset_current",
        "offset_active_power",
        "offset_reactive_power",
        }
    for index, line in enumerate(lines):
        if _yaml_flow_keys(line).intersection(offset_fields):
            owner_id = _flow_owner_identifier(line)
            if owner_id is None or owner_id in aliases:
                raise ConfigMutationError(
                    "existing offset overrides are not safely writable"
                )
        item = re.match(r"(?P<indent> *)-\s+", line)
        if item is None:
            continue
        item_indent = len(item["indent"])
        end = next(
            (
                candidate
                for candidate in range(index + 1, len(lines))
                if lines[candidate].strip()
                and len(lines[candidate]) - len(lines[candidate].lstrip(" ")) <= item_indent
            ),
            len(lines),
        )
        mappings = [
            mapping
            for candidate in range(index, end)
            if (mapping := _yaml_mapping(lines[candidate])) is not None
        ]
        if not {mapping[2] for mapping in mappings}.intersection(offset_fields):
            continue
        ids = [mapping for mapping in mappings if mapping[2] == "id"]
        if len(ids) != 1:
            raise ConfigMutationError("existing offset overrides are not safely writable")
        if _yaml_identifier(ids[0][3]) in aliases:
            raise ConfigMutationError("existing offset overrides are not safely writable")


def _flow_owner_identifier(line: str) -> str | None:
    """Return one direct flow-list owner ID without interpreting nested mappings."""
    try:
        sequence = yaml.compose(line)
    except yaml.YAMLError:
        return None
    if not isinstance(sequence, SequenceNode) or len(sequence.value) != 1:
        return None
    item = sequence.value[0]
    if not isinstance(item, MappingNode):
        return None
    owners = [
        value
        for key, value in item.value
        if isinstance(key, ScalarNode) and key.value == "id"
    ]
    if len(owners) != 1 or not isinstance(owners[0], ScalarNode):
        return None
    owner = owners[0]
    if owner.tag == "!extend":
        return _yaml_identifier(f"!extend {owner.value}")
    if owner.tag == "tag:yaml.org,2002:str":
        return _yaml_identifier(owner.value)
    return None


def _phase_override_lines(
    enabled: bool, multiplier: float, power_quality: bool
) -> tuple[str, ...]:
    """Render only the current official package metrics for one CT phase."""
    lines: list[str] = []
    value = f"{multiplier:g}"
    power_quality_contract = SUPPORTED_PACKAGE_CONTRACTS["power_quality"]
    outputs: list[str] = []
    if not enabled or multiplier != 1:
        outputs.extend(("current", "power"))
    if enabled and power_quality and multiplier != 1:
        outputs.extend(power_quality_contract.scalable_phase_metrics)
    for output in outputs:
        lines.append(f"      {output}:")
        if not enabled and output in ("current", "power"):
            if multiplier != 1:
                lines.extend(("        filters:", f"          - multiply: {value}"))
            lines.append("        internal: true")
        elif multiplier != 1:
            lines.extend(("        filters:", f"          - multiply: {value}"))
    if power_quality and not enabled:
        lines.extend(
            f"      {output}: !remove"
            for output in power_quality_contract.phase_metrics
        )
    return tuple(lines)


def _legacy_phase_override_lines(
    multiplier: float, power_quality: bool
) -> tuple[str, ...]:
    """Recognize the historical enabled shape during managed-block migration."""
    lines = list(_phase_override_lines(True, multiplier, power_quality))
    if power_quality:
        legacy_metrics = SUPPORTED_PACKAGE_CONTRACTS[
            "power_quality"
        ].legacy_phase_metrics
        lines.extend(
            f"      {output}: !remove"
            for output in legacy_metrics
            if output != "phase_angle"
        )
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
        # Preserve the exact historical order for source-owned block recognition.
        lines.extend(
            f"      {output}: !remove"
            for output in (
                "reactive_power", "apparent_power", "harmonic_power",
                "peak_current", "power_factor", "phase_angle",
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
        section = _status_section(document, block.span.start, block.span.end)
        if section is None:
            raise ConfigMutationError("status override block is not safely writable")
        section_start, has_user_content = section
        end = block.span.end
        if content[end : end + 2] == "\r\n":
            end += 2
        elif content[end : end + 1] in {"\r", "\n"}:
            end += 1
        if not rendered:
            if not has_user_content:
                return content[:section_start] + content[end:]
            return content[: block.span.start] + replacement + content[end:]
        return content[: block.span.start] + replacement + content[end:]
    if not rendered:
        return content
    if re.search(r"(?m)^(?:text_sensor|['\"]text_sensor['\"])[ \t]*:", content):
        raise ConfigMutationError("status override block needs a dedicated text_sensor section")
    return content + ("" if content.endswith(("\n", "\r")) else newline) + "text_sensor:" + newline + replacement


def _status_section(
    document: ESPHomeConfigDocument, block_start: int, block_end: int
) -> tuple[int, bool] | None:
    offsets: list[int] = []
    offset = 0
    for line in document.lines:
        offsets.append(offset)
        offset += len(line)
    try:
        block_index = offsets.index(block_start)
    except ValueError:
        return None
    headers = [
        index
        for index, line in enumerate(document.code_lines[:block_index])
        if line == "text_sensor:"
    ]
    if not headers:
        return None
    header_index = headers[-1]
    section_end = len(document.lines)
    for index in range(header_index + 1, len(document.lines)):
        line = document.code_lines[index]
        if line and not line.startswith(" "):
            section_end = index
            break
    section_start = offsets[header_index]
    section_content_start = section_start + len(document.lines[header_index])
    section_content_end = (
        offsets[section_end] if section_end < len(document.lines) else len(document.content)
    )
    if (
        block_index >= section_end
        or block_start < section_content_start
        or block_end > section_content_end
    ):
        return None
    has_user_content = bool(
        (
            document.content[section_content_start:block_start]
            + document.content[section_start + len("text_sensor:") : section_content_start]
            + document.content[block_end:section_content_end]
        ).strip()
    )
    return section_start, has_user_content


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
    if ESPHomeConfigDocument.parse(content).sensor_item_indent == 0:
        managed = [f"  {line}" if line else line for line in managed]
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
                legacy_enabled = _legacy_phase_override_lines(multiplier, board_pq)
                unused = _phase_override_lines(False, multiplier, board_pq)
                legacy_unused = _legacy_unused_phase_override_lines(
                    multiplier, board_pq
                )
                legacy_internal = (
                    _phase_override_lines(False, 1, False) + legacy_unused
                    if multiplier == 1 else ()
                )
                if body in {unused, legacy_unused, legacy_internal} and unused != enabled:
                    state = _PhaseChannelState(False, multiplier)
                    break
                if body in {legacy, enabled, legacy_enabled}:
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
    if targets and document.writable_sensor_span is None and any(
        (mapping := _yaml_mapping(line)) is not None
        and mapping[0] == 0 and mapping[2] == "sensor"
        for line in lines
    ):
        raise ConfigMutationError("sensor block gains or filters are unresolved")
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
                    if flow_keys.intersection(outputs) and (
                        "filters" in flow_keys or "gain_ct" in outputs
                    ):
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
                if output_name == "gain_ct":
                    if _yaml_identifier(output_rest) != f"current_cal_ct{channel}":
                        _filter_conflict(channel)
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
    value = re.sub(r"\s+#.*$", "", rest).strip()
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
    if key in {"offset_calibration", "gain_calibration"}:
        return _render_boolean(value, old_token)
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


def _render_boolean(value: str, old_token: str) -> str:
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
    voltage_diff = _calibrated_voltage_gain_diff(prior_content, proposed_content)
    offset_diff = _calibrated_offset_diff(prior_content, proposed_content)
    return "\n".join(
        part
        for part in (substitution_diff, multiplier_diff, voltage_diff, offset_diff)
        if part
    )


def _calibrated_voltage_gain_diff(prior_content: str, proposed_content: str) -> str:
    start = "# CircuitSetup Energy Meter Helper: calibrated voltage gains v1"
    end = "# End CircuitSetup Energy Meter Helper: calibrated voltage gains v1"

    def block(content: str) -> str:
        offset = content.find(start)
        if offset < 0:
            return ""
        finish = content.find(end, offset)
        return content[offset : finish + len(end)] if finish >= 0 else content[offset:]

    prior, proposed = block(prior_content), block(proposed_content)
    if prior == proposed:
        return ""
    return proposed or "managed calibrated voltage gains removed"


def _calibrated_offset_diff(prior_content: str, proposed_content: str) -> str:
    start = "# CircuitSetup Energy Meter Helper: calibrated offsets v1"
    end = "# End CircuitSetup Energy Meter Helper: calibrated offsets v1"

    def block(content: str) -> str:
        offset = content.find(start)
        if offset < 0:
            return ""
        finish = content.find(end, offset)
        return content[offset : finish + len(end)] if finish >= 0 else content[offset:]

    prior, proposed = block(prior_content), block(proposed_content)
    if prior == proposed:
        return ""
    return proposed or "managed calibrated offsets removed"


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
