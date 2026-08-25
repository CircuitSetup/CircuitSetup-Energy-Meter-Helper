"""Exact, line-preserving helper-managed YAML block edits."""

from __future__ import annotations

from collections.abc import Mapping

from .config_document import (
    MANAGED_BLOCK_MARKERS,
    ESPHomeConfigDocument,
    ESPHomeConfigParseError,
    resembles_managed_block_marker,
)
from .config_mutator import ConfigMutationError

_ORDER = tuple(MANAGED_BLOCK_MARKERS)


def replace_managed_block(content: str, block_name: str, rendered: str) -> str:
    """Replace one exact helper block without serializing unrelated YAML."""
    markers = MANAGED_BLOCK_MARKERS.get(block_name)
    if markers is None:
        raise ConfigMutationError("unknown managed block")
    try:
        document = ESPHomeConfigDocument.parse(content)
    except ESPHomeConfigParseError as error:
        raise ConfigMutationError("managed block is not safely writable") from error
    _validate_managed_layout(document)
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
    start, end = _sensor_bounds(document, block_name, rendered=rendered)
    if start == end == len(content) and content and content[-1] not in "\r\n":
        raise ConfigMutationError(
            "no unambiguous writable sensor block; add snippet at document root",
            snippet=_snippet(block_name, rendered),
        )
    position = end if block_name == "status_overrides" else _insertion_position(document, block_name, start)
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
    return _validated_body("".join(entries[key] for key in sorted(entries)))


def _block(markers: tuple[str, str], rendered: str, newline: str) -> str:
    body = _validated_body(rendered)
    if body and not body.endswith("\n"):
        body += "\n"
    return markers[0] + newline + body.replace("\n", newline) + markers[1] + newline


def _validated_body(rendered: str) -> str:
    if not isinstance(rendered, str):
        raise ConfigMutationError("managed block body must be text")
    body = rendered.replace("\r\n", "\n").replace("\r", "\n")
    for line in body.split("\n"):
        if not line:
            continue
        indent = len(line) - len(line.lstrip(" "))
        stripped = line[indent:]
        if (
            "\t" in line
            or any(
                ord(character) < 32
                or 0x7F <= ord(character) <= 0x9F
                or character in "\u2028\u2029"
                for character in line
            )
            or indent < 2
            or indent % 2
            or stripped.startswith(("%", "---", "...", "?"))
            or resembles_managed_block_marker(stripped)
        ):
            raise ConfigMutationError("managed block body is not safely nested")
    return body


def _sensor_bounds(
    document: ESPHomeConfigDocument,
    block_name: str,
    block_start: int | None = None,
    block_end: int | None = None,
    rendered: str = "",
) -> tuple[int, int]:
    span = document.writable_sensor_span
    if span is None:
        raise ConfigMutationError(
            "no unambiguous writable sensor block; add snippet at document root",
            snippet=_snippet(block_name, rendered),
        )
    start, end = span.start, span.end
    if block_start is not None and (block_start < start or block_end is None or block_end > end):
        raise ConfigMutationError(
            "managed block is outside the sensor section", snippet=_snippet(block_name)
        )
    return start, end


def _validate_managed_layout(document: ESPHomeConfigDocument) -> None:
    for name, block in document.managed_blocks.items():
        if name == "status_overrides":
            continue
        _sensor_bounds(document, name, block.span.start, block.span.end)
    actual = [
        name
        for name, _ in sorted(
            document.managed_blocks.items(), key=lambda item: item[1].span.start
        )
        if name != "status_overrides"
    ]
    expected = [
        name
        for name in _ORDER
        if name != "status_overrides" and name in document.managed_blocks
    ]
    if actual != expected:
        raise ConfigMutationError("managed blocks are out of canonical order")


def _insertion_position(
    document: ESPHomeConfigDocument, block_name: str, start: int
) -> int:
    names = [name for name in _ORDER if name != "status_overrides"]
    index = names.index(block_name)
    for name in names[index + 1 :]:
        block = document.managed_blocks.get(name)
        if block is not None:
            return block.span.start
    for name in reversed(names[:index]):
        block = document.managed_blocks.get(name)
        if block is not None:
            return _line_end(document.content, block.span.end)
    return start


def _line_end(content: str, position: int) -> int:
    if content[position : position + 2] == "\r\n":
        return position + 2
    if content[position : position + 1] in {"\n", "\r"}:
        return position + 1
    return position


def _snippet(block_name: str, rendered: str = "") -> str:
    return "sensor:\n" + _block(MANAGED_BLOCK_MARKERS[block_name], rendered, "\n")
