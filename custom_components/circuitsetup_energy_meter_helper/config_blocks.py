"""Exact, line-preserving helper-managed YAML block edits."""

from __future__ import annotations

import re
from collections.abc import Mapping
from hashlib import sha256

from .config_document import (
    MANAGED_BLOCK_MARKERS,
    ESPHomeConfigDocument,
    ESPHomeConfigParseError,
    resembles_managed_block_marker,
)
from .config_mutator import ConfigMutationError

_ORDER = tuple(MANAGED_BLOCK_MARKERS)
_EOF_SEPARATOR_HINT = "# csemh-owned-eof-separator:"
_EOF_SEPARATOR_PREFIX = "# csemh-owned-eof-separator: aggregates-v1:"
_EOF_SEPARATOR_RE = re.compile(rf"^{re.escape(_EOF_SEPARATOR_PREFIX)}[0-9a-f]{{64}}$")


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
    trailer = _eof_separator_start(document, "aggregates")
    newline = "\r\n" if "\r\n" in content else "\n"
    block = document.managed_blocks.get(block_name)
    if block is not None:
        _sensor_bounds(document, block_name, block.span.start, block.span.end)
        end = _line_end(content, block.span.end)
        if not rendered:
            separator = _eof_separator_start(document, block_name)
            if separator is not None and end == len(content):
                return content[:separator] + content[end:]
            result = content[: block.span.start] + content[end:]
        else:
            result = content[: block.span.start] + _block(markers, rendered, newline) + content[end:]
        return _rebind_eof_separator(result) if trailer is not None else result
    if not rendered:
        return content
    _, end = _sensor_bounds(document, block_name, rendered=rendered)
    existing = document.managed_blocks
    position = end
    for name in _ORDER[_ORDER.index(block_name) + 1 :]:
        if name == "status_overrides":
            continue
        candidate = existing.get(name)
        if candidate is not None:
            position = _managed_block_start(document, name)
            break
    prefix = "" if position == 0 or content[position - 1] in "\r\n" else newline
    metadata = (
        _eof_separator(content[:position]) + newline
        if block_name == "aggregates" and position == len(content) and prefix
        else ""
    )
    result = (
        content[:position]
        + prefix
        + metadata
        + _block(markers, rendered, newline)
        + content[position:]
    )
    return _rebind_eof_separator(result) if trailer is not None else result


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


def _managed_block_start(document: ESPHomeConfigDocument, block_name: str) -> int:
    separator = _eof_separator_start(document, block_name)
    return separator if separator is not None else document.managed_blocks[block_name].span.start


def _eof_separator(content: str) -> str:
    return _EOF_SEPARATOR_PREFIX + sha256(content.encode()).hexdigest()


def _eof_separator_start(
    document: ESPHomeConfigDocument, block_name: str
) -> int | None:
    found: int | None = None
    offset = 0
    for line in document.lines:
        body = line.rstrip("\r\n")
        if body.lstrip().startswith(_EOF_SEPARATOR_HINT):
            block = document.managed_blocks.get("aggregates")
            end = _line_end(document.content, block.span.end) if block else -1
            separator_length = 2 if document.content[offset - 2 : offset] == "\r\n" else 1
            separator = offset - separator_length
            if (
                _EOF_SEPARATOR_RE.fullmatch(body) is None
                or block is None
                or offset + len(line) != block.span.start
                or end != len(document.content)
                or separator < 0
                or document.content[separator:offset] not in {"\n", "\r\n"}
                or document.content[block.span.end : end]
                != document.content[separator:offset]
                or sha256(document.content[:separator].encode()).hexdigest()
                != body.removeprefix(_EOF_SEPARATOR_PREFIX)
                or found is not None
            ):
                raise ConfigMutationError("managed EOF separator is not safely writable")
            found = separator
        offset += len(line)
    return found if block_name == "aggregates" else None


def _rebind_eof_separator(content: str) -> str:
    document = ESPHomeConfigDocument.parse(content)
    offset = 0
    for line in document.lines:
        body = line.rstrip("\r\n")
        if body.startswith(_EOF_SEPARATOR_PREFIX):
            block = document.managed_blocks.get("aggregates")
            end = _line_end(content, block.span.end) if block else -1
            separator_length = 2 if content[offset - 2 : offset] == "\r\n" else 1
            separator = offset - separator_length
            if (
                _EOF_SEPARATOR_RE.fullmatch(body) is None
                or block is None
                or offset + len(line) != block.span.start
                or end != len(content)
                or separator < 0
                or content[separator:offset] not in {"\n", "\r\n"}
                or content[block.span.end : end] != content[separator:offset]
            ):
                raise ConfigMutationError("managed EOF separator is not safely writable")
            digest = sha256(content[:separator].encode()).hexdigest()
            return (
                content[: offset + len(_EOF_SEPARATOR_PREFIX)]
                + digest
                + content[offset + len(body) :]
            )
        offset += len(line)
    raise ConfigMutationError("managed EOF separator is not safely writable")


def _line_end(content: str, position: int) -> int:
    if content[position : position + 2] == "\r\n":
        return position + 2
    if content[position : position + 1] in {"\n", "\r"}:
        return position + 1
    return position


def _snippet(block_name: str, rendered: str = "") -> str:
    return "sensor:\n" + _block(MANAGED_BLOCK_MARKERS[block_name], rendered, "\n")
