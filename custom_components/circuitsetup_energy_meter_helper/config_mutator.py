"""Line-preserving CT substitution mutation planning."""

from __future__ import annotations

import json
import re
from collections.abc import Iterable
from dataclasses import dataclass
from hashlib import sha256
from math import isfinite
from typing import Protocol

from .config_document import ConfigScalar, ESPHomeConfigDocument
from .ct_catalog import CTPresetCatalog, custom_preset, raw_gain_for_preset
from .ct_inventory import CTInventory
from .models import ConfigMutationPlan, MeterTopology, SubstitutionChange

_SUBSTITUTIONS_RE = re.compile(r"^substitutions:\s*(?:#.*)?(?:\r?\n)?$")
_TOP_LEVEL_RE = re.compile(r"^[\w-]+:")
_PLAIN_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 ._/-]*$")
_YAML_RESERVED = {"null", "true", "false", "yes", "no", "on", "off", "~"}


class ConfigSnapshot(Protocol):
    """The minimum trusted configuration snapshot needed for a mutation."""

    configuration: str
    content: str
    sha256: str


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
    if not changes:
        return ConfigMutationPlan(
            snapshot.configuration, snapshot.sha256, (), "", snapshot.content
        )

    proposed_content = _apply_changes(document, changes, values)
    proposed_document = ESPHomeConfigDocument.parse(proposed_content)
    CTInventory.from_document(proposed_document, topology, catalog, snapshot.sha256)
    return ConfigMutationPlan(
        snapshot.configuration,
        snapshot.sha256,
        tuple(changes),
        _redacted_diff(changes),
        proposed_content,
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
        if (
            not isfinite(request.reporting_multiplier)
            or request.reporting_multiplier <= 0
        ):
            raise ConfigMutationError(
                "reporting multiplier must be finite and positive"
            )


def _requested_gain(request: CTChangeRequest, catalog: CTPresetCatalog) -> int:
    if request.model_id == "custom":
        if request.custom_gain_ct is None or request.custom_label is None:
            raise ConfigMutationError("Custom requires an explicit gain and label")
        custom_preset(
            request.custom_label,
            request.custom_gain_ct,
            burden_output_acknowledged=request.burden_output_acknowledged,
        )
        return request.custom_gain_ct
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
    if key.startswith("current_cal_ct"):
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
    if key.startswith("current_cal_ct"):
        return _render_gain(value, old_token)
    return _render_name(value, old_token)


def _render_missing(change: SubstitutionChange, document: ESPHomeConfigDocument) -> str:
    if change.key.startswith("current_cal_ct"):
        quoted = any(
            document.content[scalar.span.start : scalar.span.end].startswith(("'", '"'))
            for key, scalar in document.substitutions.items()
            if key.startswith("current_cal_ct")
        )
        return json.dumps(change.new_value) if quoted else change.new_value
    quoted = any(
        document.content[scalar.span.start : scalar.span.end].startswith(("'", '"'))
        for key, scalar in document.substitutions.items()
        if key.endswith("_name")
    )
    return (
        json.dumps(change.new_value) if quoted else _render_name(change.new_value, "")
    )


def _render_gain(value: str, old_token: str) -> str:
    if old_token.startswith("'"):
        return f"'{value}'"
    if old_token.startswith('"'):
        return json.dumps(value)
    return value


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
