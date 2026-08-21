"""Read the small ESPHome YAML surface that the helper may edit later."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field

CT_NAME_RE = re.compile(r"^ct(?P<channel>[1-9]|[1-3][0-9]|4[0-2])_name$")
CT_GAIN_RE = re.compile(r"^current_cal_ct(?P<channel>[1-9]|[1-3][0-9]|4[0-2])$")
_MAPPING_RE = re.compile(r"^(?P<indent> *)(?P<key>[\w-]+):(?P<rest>.*)$")
_SEQUENCE_MAPPING_RE = re.compile(
    r"^(?P<indent> *)-\s+(?P<key>[\w-]+):(?P<rest>.*)$"
)
_SEQUENCE_RE = re.compile(r"^(?P<indent> *)-\s+(?P<rest>.+)$")
_YAML_PATH_RE = re.compile(r"(?i)^(.*?\.ya?ml)(?:@.*)?$")


class ESPHomeConfigParseError(ValueError):
    """A configuration construct that cannot be represented safely."""

    def __init__(self, message: str, line: int) -> None:
        self.line = line
        super().__init__(f"{message} at line {line}")


@dataclass(frozen=True, slots=True)
class SourceSpan:
    """Exact character range of one scalar in the original document."""

    start: int
    end: int
    line: int
    start_column: int
    end_column: int


@dataclass(frozen=True, slots=True)
class ConfigScalar:
    """Decoded scalar value paired with its unchanged lexical range."""

    value: str
    span: SourceSpan


@dataclass(frozen=True, slots=True)
class ESPHomeConfigDocument:
    """Relevant ESPHome values plus the exact source text that supplied them."""

    content: str = field(repr=False)
    lines: tuple[str, ...] = field(repr=False)
    project_name: str | None
    project_name_span: SourceSpan | None
    dashboard_import: str | None
    dashboard_import_span: SourceSpan | None
    substitutions: dict[str, ConfigScalar]
    package_files: tuple[str, ...]

    @classmethod
    def parse(cls, content: str) -> ESPHomeConfigDocument:
        """Parse without loading or serializing the YAML document."""
        return _DocumentParser(content).parse(cls)


@dataclass(frozen=True, slots=True)
class _Mapping:
    indent: int
    key: str
    rest: str
    rest_column: int


class _DocumentParser:
    def __init__(self, content: str) -> None:
        self.content = content
        self.lines = tuple(content.splitlines(keepends=True))
        self._bodies = tuple(line.rstrip("\r\n") for line in self.lines)
        offset = 0
        self._offsets: list[int] = []
        for line in self.lines:
            self._offsets.append(offset)
            offset += len(line)

    def parse(self, document_type: type[ESPHomeConfigDocument]) -> ESPHomeConfigDocument:
        project = self._nested_scalar("esphome", "project", "name")
        dashboard = self._section_scalar("dashboard_import", "package_import_url")
        return document_type(
            content=self.content,
            lines=self.lines,
            project_name=project.value if project else None,
            project_name_span=project.span if project else None,
            dashboard_import=dashboard.value if dashboard else None,
            dashboard_import_span=dashboard.span if dashboard else None,
            substitutions=self._substitutions(),
            package_files=self._package_files(),
        )

    def _sections(self, name: str) -> list[tuple[int, _Mapping]]:
        sections: list[tuple[int, _Mapping]] = []
        for index in range(len(self.lines)):
            mapping = self._mapping(index)
            if mapping and mapping.indent == 0 and mapping.key == name:
                sections.append((index, mapping))
        if len(sections) > 1:
            raise ESPHomeConfigParseError(f"duplicate {name} block", sections[1][0] + 1)
        return sections

    def _section(self, name: str) -> tuple[int, _Mapping] | None:
        sections = self._sections(name)
        return sections[0] if sections else None

    def _section_lines(self, name: str) -> tuple[int, int, int] | None:
        section = self._section(name)
        if section is None:
            return None
        start, mapping = section
        end = len(self.lines)
        for index in range(start + 1, len(self.lines)):
            body = self._bodies[index]
            if not body.strip() or body.lstrip().startswith("#"):
                continue
            if len(body) - len(body.lstrip(" ")) <= mapping.indent:
                end = index
                break
        return start + 1, end, mapping.indent

    def _substitutions(self) -> dict[str, ConfigScalar]:
        bounds = self._section_lines("substitutions")
        if bounds is None:
            return {}
        substitutions: dict[str, ConfigScalar] = {}
        start, end, section_indent = bounds
        for index in range(start, end):
            mapping = self._mapping(index)
            if mapping is None or mapping.indent <= section_indent:
                continue
            if not (CT_NAME_RE.fullmatch(mapping.key) or CT_GAIN_RE.fullmatch(mapping.key)):
                continue
            if mapping.key in substitutions:
                raise ESPHomeConfigParseError(
                    f"duplicate mutable substitution {mapping.key}", index + 1
                )
            substitutions[mapping.key] = self._scalar(index, mapping)
        return substitutions

    def _nested_scalar(
        self, section_name: str, parent_key: str, child_key: str
    ) -> ConfigScalar | None:
        bounds = self._section_lines(section_name)
        if bounds is None:
            return None
        start, end, section_indent = bounds
        parent: tuple[int, _Mapping] | None = None
        for index in range(start, end):
            mapping = self._mapping(index)
            if (
                mapping
                and mapping.indent > section_indent
                and mapping.key == parent_key
            ):
                parent = (index, mapping)
                break
        if parent is None:
            return None
        parent_index, parent_mapping = parent
        if parent_mapping.rest.strip():
            raise ESPHomeConfigParseError(
                f"{parent_key} must be a mapping", parent_index + 1
            )
        for index in range(parent_index + 1, end):
            body = self._bodies[index]
            if not body.strip() or body.lstrip().startswith("#"):
                continue
            mapping = self._mapping(index)
            indent = len(body) - len(body.lstrip(" "))
            if indent <= parent_mapping.indent:
                break
            if mapping and mapping.key == child_key:
                return self._scalar(index, mapping)
        return None

    def _section_scalar(self, section_name: str, key: str) -> ConfigScalar | None:
        bounds = self._section_lines(section_name)
        if bounds is None:
            return None
        start, end, section_indent = bounds
        for index in range(start, end):
            mapping = self._mapping(index)
            if mapping and mapping.indent > section_indent and mapping.key == key:
                return self._scalar(index, mapping)
        return None

    def _package_files(self) -> tuple[str, ...]:
        bounds = self._section_lines("packages")
        if bounds is None:
            return ()
        start, end, section_indent = bounds
        files_indent: int | None = None
        paths: list[str] = []
        for index in range(start, end):
            body = self._bodies[index]
            if not body.strip() or body.lstrip().startswith("#"):
                continue
            indent = len(body) - len(body.lstrip(" "))
            if indent <= section_indent:
                break
            if files_indent is not None and indent <= files_indent:
                files_indent = None

            mapping = self._mapping(index) or self._sequence_mapping(index)
            if mapping and mapping.key == "files":
                if mapping.rest.strip():
                    raise ESPHomeConfigParseError(
                        "inline package file lists are unsupported", index + 1
                    )
                files_indent = mapping.indent
                continue

            if files_indent is not None and indent > files_indent:
                sequence = _SEQUENCE_RE.match(body)
                if sequence:
                    scalar = self._scalar_parts(
                        index,
                        sequence.group("rest"),
                        sequence.start("rest"),
                    )
                    paths.append(self._normalize_file_path(scalar.value, index + 1))
                continue

            if mapping and mapping.key == "file":
                scalar = self._scalar(index, mapping)
                paths.append(self._normalize_file_path(scalar.value, index + 1))
                continue

            if mapping and "github://" in mapping.rest:
                scalar = self._scalar(index, mapping)
                path = self._remote_shorthand_path(scalar.value)
                if path is not None:
                    paths.append(path)
                continue

            sequence = _SEQUENCE_RE.match(body)
            if sequence and ":" not in sequence.group("rest"):
                scalar = self._scalar_parts(
                    index, sequence.group("rest"), sequence.start("rest")
                )
                path = self._remote_shorthand_path(scalar.value)
                if path is not None:
                    paths.append(path)
        return tuple(paths)

    def _mapping(self, index: int) -> _Mapping | None:
        match = _MAPPING_RE.match(self._bodies[index])
        if match is None:
            return None
        return _Mapping(
            indent=len(match.group("indent")),
            key=match.group("key"),
            rest=match.group("rest"),
            rest_column=match.start("rest"),
        )

    def _sequence_mapping(self, index: int) -> _Mapping | None:
        match = _SEQUENCE_MAPPING_RE.match(self._bodies[index])
        if match is None:
            return None
        return _Mapping(
            indent=len(match.group("indent")),
            key=match.group("key"),
            rest=match.group("rest"),
            rest_column=match.start("rest"),
        )

    def _scalar(self, index: int, mapping: _Mapping) -> ConfigScalar:
        return self._scalar_parts(index, mapping.rest, mapping.rest_column)

    def _scalar_parts(self, index: int, raw: str, raw_column: int) -> ConfigScalar:
        leading = len(raw) - len(raw.lstrip(" "))
        text = raw[leading:]
        line = index + 1
        if not text or text.startswith("#"):
            raise ESPHomeConfigParseError("missing scalar value", line)
        if text[0] in "!&*|>[{":
            raise ESPHomeConfigParseError("unsafe non-literal scalar", line)

        if text[0] == "'":
            end = self._single_quote_end(text, line)
            token = text[:end]
            value = token[1:-1].replace("''", "'")
        elif text[0] == '"':
            end = self._double_quote_end(text, line)
            token = text[:end]
            try:
                value = json.loads(token)
            except json.JSONDecodeError as error:
                raise ESPHomeConfigParseError("invalid quoted scalar", line) from error
        else:
            end = len(text)
            for position, character in enumerate(text):
                if character == "#" and position and text[position - 1].isspace():
                    end = position
                    break
            end = len(text[:end].rstrip(" "))
            if end == 0:
                raise ESPHomeConfigParseError("missing scalar value", line)
            token = text[:end]
            value = token

        tail = text[end:].lstrip(" ")
        if tail and not tail.startswith("#"):
            raise ESPHomeConfigParseError("unsupported multiline scalar", line)
        start_column = raw_column + leading
        end_column = start_column + len(token)
        return ConfigScalar(
            value=value,
            span=SourceSpan(
                start=self._offsets[index] + start_column,
                end=self._offsets[index] + end_column,
                line=line,
                start_column=start_column,
                end_column=end_column,
            ),
        )

    @staticmethod
    def _single_quote_end(text: str, line: int) -> int:
        position = 1
        while position < len(text):
            if text[position] == "'":
                if position + 1 < len(text) and text[position + 1] == "'":
                    position += 2
                    continue
                return position + 1
            position += 1
        raise ESPHomeConfigParseError("unterminated quoted scalar", line)

    @staticmethod
    def _double_quote_end(text: str, line: int) -> int:
        escaped = False
        for position in range(1, len(text)):
            character = text[position]
            if character == '"' and not escaped:
                return position + 1
            if character == "\\" and not escaped:
                escaped = True
            else:
                escaped = False
        raise ESPHomeConfigParseError("unterminated quoted scalar", line)

    @staticmethod
    def _normalize_file_path(value: str, line: int) -> str:
        normalized = value.replace("\\", "/")
        match = _YAML_PATH_RE.fullmatch(normalized)
        if match is None:
            raise ESPHomeConfigParseError("package file is not YAML", line)
        return match.group(1)

    @classmethod
    def _remote_shorthand_path(cls, value: str) -> str | None:
        if not value.startswith("github://"):
            return None
        parts = value.removeprefix("github://").split("/", 2)
        if len(parts) != 3:
            return None
        try:
            return cls._normalize_file_path(parts[2], 1)
        except ESPHomeConfigParseError:
            return None
