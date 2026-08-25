"""Exact, line-preserving helper-managed YAML block edits."""

from __future__ import annotations

import re
from collections.abc import Mapping

from .config_document import ESPHomeConfigDocument, ESPHomeConfigParseError
from .config_mutator import ConfigMutationError

_MARKERS = {
    "voltage_references": (
        "# CircuitSetup Energy Meter Helper: voltage references v1",
        "# End CircuitSetup Energy Meter Helper: voltage references v1",
    ),
    "phase_overrides": (
        "# CircuitSetup Energy Meter Helper: phase overrides v1",
        "# End CircuitSetup Energy Meter Helper: phase overrides v1",
    ),
    "aggregates": (
        "# CircuitSetup Energy Meter Helper: aggregates v1",
        "# End CircuitSetup Energy Meter Helper: aggregates v1",
    ),
}
_ORDER = tuple(_MARKERS)
_SENSOR = re.compile(r"^sensor:\s*(?:#.*)?(?:\r?\n)?$")
_TOP_LEVEL = re.compile(r"^[\w-]+:")


def replace_managed_block(content: str, block_name: str, rendered: str) -> str:
    """Replace one exact helper block without serializing unrelated YAML."""
    markers = _MARKERS.get(block_name)
    if markers is None:
        raise ConfigMutationError("unknown managed block")
    try:
        document = ESPHomeConfigDocument.parse(content)
    except ESPHomeConfigParseError as error:
        raise ConfigMutationError("managed block is not safely writable") from error
    newline = "\r\n" if "\r\n" in content else "\n"
    block = document.managed_blocks.get(block_name)
    if block is not None:
        _sensor_bounds(document, block_name, block.span.start, block.span.end)
        end = _line_end(content, block.span.end)
        if not rendered:
            return content[: block.span.start] + content[end:]
        return content[: block.span.start] + _block(markers, rendered, newline) + content[end:]
    if not rendered:
        return content
    _, end = _sensor_bounds(document, block_name, rendered=rendered)
    existing = document.managed_blocks
    position = end
    for name in _ORDER[_ORDER.index(block_name) + 1 :]:
        candidate = existing.get(name)
        if candidate is not None:
            position = candidate.span.start
            break
    return content[:position] + _block(markers, rendered, newline) + content[position:]


def render_voltage_references(entries: Mapping[str, str]) -> str:
    """Return voltage-reference entries in stable key order."""
    return _render_entries(entries)


def render_phase_overrides(entries: Mapping[str, str]) -> str:
    """Return phase-override entries in stable key order."""
    return _render_entries(entries)


def render_aggregates(entries: Mapping[str, str]) -> str:
    """Return aggregate entries in stable key order."""
    return _render_entries(entries)


def _render_entries(entries: Mapping[str, str]) -> str:
    if not isinstance(entries, Mapping) or any(
        not isinstance(key, str) or not isinstance(value, str)
        for key, value in entries.items()
    ):
        raise ConfigMutationError("managed block entries must be text mappings")
    return "".join(entries[key] for key in sorted(entries))


def _block(markers: tuple[str, str], rendered: str, newline: str) -> str:
    body = rendered.replace("\r\n", "\n").replace("\r", "\n")
    if any(marker in body for pair in _MARKERS.values() for marker in pair):
        raise ConfigMutationError("managed block content cannot contain markers")
    if body and not body.endswith("\n"):
        body += "\n"
    return newline.join((markers[0], body.rstrip("\n"), markers[1])) + newline


def _sensor_bounds(
    document: ESPHomeConfigDocument,
    block_name: str,
    block_start: int | None = None,
    block_end: int | None = None,
    rendered: str = "",
) -> tuple[int, int]:
    starts = [index for index, line in enumerate(document.lines) if _SENSOR.fullmatch(line)]
    if len(starts) != 1:
        raise ConfigMutationError(
            "no unambiguous writable sensor block", snippet=_snippet(block_name, rendered)
        )
    start_line = starts[0]
    end_line = len(document.lines)
    for index in range(start_line + 1, len(document.lines)):
        line = document.lines[index]
        if line.strip() and not line.lstrip().startswith("#") and _TOP_LEVEL.match(line):
            end_line = index
            break
    start = sum(len(line) for line in document.lines[: start_line + 1])
    end = sum(len(line) for line in document.lines[:end_line])
    if block_start is not None and (block_start < start or block_end is None or block_end > end):
        raise ConfigMutationError(
            "managed block is outside the sensor section", snippet=_snippet(block_name)
        )
    return start, end


def _line_end(content: str, position: int) -> int:
    if content[position : position + 2] == "\r\n":
        return position + 2
    if content[position : position + 1] in {"\n", "\r"}:
        return position + 1
    return position


def _snippet(block_name: str, rendered: str = "") -> str:
    start, end = _MARKERS[block_name]
    body = rendered.replace("\r\n", "\n").replace("\r", "\n").rstrip("\n")
    lines = [f"sensor:\n  {start}"]
    lines.extend(line for line in body.split("\n") if line)
    lines.append(f"  {end}")
    return "\n".join(lines) + "\n"
