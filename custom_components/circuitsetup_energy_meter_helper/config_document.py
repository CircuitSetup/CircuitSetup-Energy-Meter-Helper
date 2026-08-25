"""Read the small ESPHome YAML surface that the helper may edit later."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field

CT_NAME_RE = re.compile(r"^ct(?P<channel>[1-9]|[1-3][0-9]|4[0-2])_name$")
CT_GAIN_RE = re.compile(r"^current_cal_ct(?P<channel>[1-9]|[1-3][0-9]|4[0-2])$")
VOLTAGE_GAIN_RE = re.compile(r"^voltage_cal[12]$")
GROUP_NAME_RE = re.compile(r"^(?:main_meter_name[12]|addon[1-6]_name[12])$")
METER_ID_RE = re.compile(r"^(?:main_meter_id[12]|addon[1-6]_id[12])$")
METER_SETTING_RE = re.compile(
    r"^(?:friendly_name|update_time|electric_freq|csemh_config_contract)$"
)
_KEY_TOKEN_RE = r'''(?:<<|[\w-]+|'(?:[^']|'')*'|"(?:[^"\\]|\\.)*")'''
_MAPPING_RE = re.compile(
    rf"^(?P<indent> *)(?P<key>{_KEY_TOKEN_RE})[ \t]*:(?P<rest>(?:[ \t].*)?)$"
)
_SEQUENCE_MAPPING_RE = re.compile(
    rf"^(?P<indent> *)-[ \t]+(?P<key>{_KEY_TOKEN_RE})[ \t]*:(?P<rest>(?:[ \t].*)?)$"
)
_SEQUENCE_RE = re.compile(r"^(?P<indent> *)-\s+(?P<rest>.+)$")
_YAML_PATH_RE = re.compile(r"(?i)^(.*?\.ya?ml)(?:@.*)?$")
_CONTROL_RE = re.compile(r"[\x00-\x1f\x7f-\x9f]")
_LINE_BREAK_RE = re.compile(r"\r\n|[\n\r\v\f\x1c-\x1e\x85\u2028\u2029]")
_LINE_BREAK_FINAL_CHARS = "\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029"
_BLOCK_SCALAR_HEADER_RE = re.compile(
    r"^(?P<indent> *)(?P<dash>-[ \t]+)?(?P<mapping>.+?:[ \t]*)?(?:(?:![^\s]+|&[^\s]+)\s+)*"
    r"[|>][1-9+-]*(?:\s+#.*)?$"
)
_EXPLICIT_BLOCK_SCALAR_RE = re.compile(
    r"^(?P<indent> *):[ \t]*(?:(?:![^\s]+|&[^\s]+)\s+)*[|>][1-9+-]*(?:\s+#.*)?$"
)
_EXPLICIT_KEY_RE = re.compile(
    rf"^[ \t]*\?[ \t]+(?P<key>{_KEY_TOKEN_RE})(?:[ \t]*(?::|#.*|$))"
)
_PREFIXED_KEY_RE = re.compile(
    rf"^\s*(?:[!&*][^\s]+\s+)+(?P<key>{_KEY_TOKEN_RE})\s*:"
)
_DECORATED_EXPLICIT_KEY_RE = re.compile(
    rf"^[ \t]*\?[ \t]+(?:[!&*][^\s]+[ \t]+)+(?P<key>{_KEY_TOKEN_RE})(?:[ \t]*(?::|#.*|$))"
)
_FLOW_KEY_RE = re.compile(rf"[{{,][ \t]*(?P<key>{_KEY_TOKEN_RE})[ \t]*:")
_MERGE_KEY_RE = re.compile(r"^\s*(?:<<\s*:|!!merge\s+['\"]<<['\"]\s*:)")
_ALIAS_KEY_RE = re.compile(r"^[ \t]*\*[^\s:]+[ \t]*:")
_MAX_DOCUMENT_BYTES = 1_048_576
_MAX_DOCUMENT_LINES = 10_000
_MAX_SETTING_LENGTH = 64
MANAGED_BLOCK_MARKERS = {
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
    "status_overrides": (
        "# CircuitSetup Energy Meter Helper: status overrides v1",
        "# End CircuitSetup Energy Meter Helper: status overrides v1",
    ),
}
_MANAGED_MARKERS = {
    marker: (name, is_end)
    for name, pair in MANAGED_BLOCK_MARKERS.items()
    for is_end, marker in enumerate(pair)
}
_HELPER_MARKER_HINT_RE = re.compile(
    r"^#\s*(?:end\s+)?circuitsetup\s+energy\s+meter\s+help(?:er|r)\b",
    re.IGNORECASE,
)


def resembles_managed_block_marker(value: str) -> bool:
    """Return whether text looks like helper-owned marker syntax."""
    return _HELPER_MARKER_HINT_RE.search(value) is not None


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
class ManagedBlock:
    """One exact helper-owned source range, including its marker comments."""

    content: str
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
    managed_blocks: dict[str, ManagedBlock]
    writable_sensor_span: SourceSpan | None
    sensor_item_indent: int | None
    code_lines: tuple[str, ...] = field(repr=False)

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
        content_size = 0
        for character in content:
            codepoint = ord(character)
            if 0xD800 <= codepoint <= 0xDFFF:
                raise ESPHomeConfigParseError("configuration is not valid UTF-8", 1)
            content_size += 1 if codepoint < 0x80 else 2 if codepoint < 0x800 else 3 if codepoint < 0x10000 else 4
            if content_size > _MAX_DOCUMENT_BYTES:
                raise ESPHomeConfigParseError("configuration exceeds byte limit", 1)
        line_count = 0
        for _ in _LINE_BREAK_RE.finditer(content):
            line_count += 1
            if line_count > _MAX_DOCUMENT_LINES:
                raise ESPHomeConfigParseError("configuration exceeds line limit", 1)
        if content and content[-1] not in _LINE_BREAK_FINAL_CHARS:
            line_count += 1
        if line_count > _MAX_DOCUMENT_LINES:
            raise ESPHomeConfigParseError("configuration exceeds line limit", 1)
        self.content = content
        self.lines = tuple(content.splitlines(keepends=True))
        self._bodies = tuple(self._line_body(line) for line in self.lines)
        self._block_scalar_lines: set[int] = set()
        offset = 0
        self._offsets: list[int] = []
        for line in self.lines:
            self._offsets.append(offset)
            offset += len(line)
        self._scan_lexical_document()

    def parse(
        self, document_type: type[ESPHomeConfigDocument]
    ) -> ESPHomeConfigDocument:
        project = self._nested_scalar("esphome", "project", "name")
        dashboard = self._section_scalar("dashboard_import", "package_import_url")
        sensor = self._writable_sensor_section()
        return document_type(
            content=self.content,
            lines=self.lines,
            project_name=project.value if project else None,
            project_name_span=project.span if project else None,
            dashboard_import=dashboard.value if dashboard else None,
            dashboard_import_span=dashboard.span if dashboard else None,
            substitutions=self._substitutions(),
            package_files=self._package_files(),
            managed_blocks=self._managed_blocks(),
            writable_sensor_span=sensor[0] if sensor else None,
            sensor_item_indent=sensor[1] if sensor else None,
            code_lines=tuple(
                "" if index in self._block_scalar_lines else self._without_comment(body)
                for index, body in enumerate(self._bodies)
            ),
        )

    def _writable_sensor_section(self) -> tuple[SourceSpan, int] | None:
        roots: list[tuple[int, _Mapping]] = []
        for index, body in enumerate(self._bodies):
            if (
                index in self._block_scalar_lines
                or not body.strip()
                or body.lstrip().startswith("#")
            ):
                continue
            mapping = self._mapping(index)
            if mapping is not None and mapping.indent == 0:
                roots.append((index, mapping))
        matches = [(index, mapping) for index, mapping in roots if mapping.key == "sensor"]
        if len(matches) != 1:
            return None
        start_index, mapping = matches[0]
        if self._has_value(mapping.rest):
            return None
        end_index = next(
            (index for index, _ in roots if index > start_index), len(self.lines)
        )
        item_indents: set[int] = set()
        for index, body in enumerate(self._bodies):
            if (
                index in self._block_scalar_lines
                or not body.strip()
                or body.lstrip().startswith("#")
            ):
                continue
            mapping = self._mapping(index)
            if not start_index < index < end_index:
                if mapping is None and not body.startswith(" "):
                    return None
                continue
            sequence = self._sequence_mapping(index)
            if sequence is not None and sequence.indent in {0, 2}:
                item_indents.add(sequence.indent)
                continue
            if mapping is None and not body.startswith(" "):
                return None
        if len(item_indents) > 1:
            return None
        start = self._offsets[start_index] + len(self.lines[start_index])
        end = self._offsets[end_index] if end_index < len(self.lines) else len(self.content)
        return SourceSpan(start, end, start_index + 2, 0, 0), next(
            iter(item_indents), 2
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
        section = self._section("substitutions")
        if section is None:
            return {}
        section_index, section_mapping = section
        if self._has_value(section_mapping.rest):
            raise ESPHomeConfigParseError(
                "substitutions must be a local mapping", section_index + 1
            )
        bounds = self._section_lines("substitutions")
        assert bounds is not None
        substitutions: dict[str, ConfigScalar] = {}
        start, end, section_indent = bounds
        child_indent = self._direct_child_indent(start, end, section_indent)
        for index in range(start, end):
            body = self._bodies[index]
            indent = len(body) - len(body.lstrip(" "))
            if child_indent is None or indent != child_indent:
                continue
            mapping = self._mapping(index)
            if mapping is None:
                continue
            if mapping.key == "<<":
                raise ESPHomeConfigParseError(
                    "substitution merges are not locally authoritative", index + 1
                )
            if not (
                CT_NAME_RE.fullmatch(mapping.key)
                or CT_GAIN_RE.fullmatch(mapping.key)
                or VOLTAGE_GAIN_RE.fullmatch(mapping.key)
                or GROUP_NAME_RE.fullmatch(mapping.key)
                or METER_ID_RE.fullmatch(mapping.key)
                or METER_SETTING_RE.fullmatch(mapping.key)
            ):
                continue
            if mapping.key in substitutions:
                raise ESPHomeConfigParseError(
                    f"duplicate mutable substitution {mapping.key}", index + 1
                )
            scalar = self._scalar(index, mapping)
            if METER_SETTING_RE.fullmatch(mapping.key):
                self._validate_meter_setting(mapping.key, scalar.value, index + 1)
            substitutions[mapping.key] = scalar
        return substitutions

    @staticmethod
    def _validate_meter_setting(key: str, value: str, line: int) -> None:
        if not value or len(value) > _MAX_SETTING_LENGTH or _CONTROL_RE.search(value):
            raise ESPHomeConfigParseError("meter setting is not safely bounded", line)
        if key == "update_time" and value not in {"1s", "2s", "5s", "10s", "30s", "60s"}:
            raise ESPHomeConfigParseError("unsupported update_time", line)
        if key == "electric_freq" and value not in {"50Hz", "60Hz"}:
            raise ESPHomeConfigParseError("unsupported electric_freq", line)
        if key == "csemh_config_contract" and value != "2":
            raise ESPHomeConfigParseError("unsupported csemh_config_contract", line)

    def _managed_blocks(self) -> dict[str, ManagedBlock]:
        blocks: dict[str, ManagedBlock] = {}
        open_block: tuple[str, int] | None = None
        for index, body in enumerate(self._bodies):
            marker = _MANAGED_MARKERS.get(body)
            if marker is None:
                continue
            name, is_end = marker
            if not is_end:
                if open_block is not None:
                    raise ESPHomeConfigParseError("nested managed block", index + 1)
                if name in blocks:
                    raise ESPHomeConfigParseError("duplicate managed block", index + 1)
                open_block = (name, index)
                continue
            if open_block is None:
                raise ESPHomeConfigParseError("managed block ends before it starts", index + 1)
            open_name, start = open_block
            if name != open_name:
                raise ESPHomeConfigParseError("mismatched managed block marker", index + 1)
            span = SourceSpan(
                start=self._offsets[start],
                end=self._offsets[index] + len(self._bodies[index]),
                line=start + 1,
                start_column=0,
                end_column=len(self._bodies[index]),
            )
            blocks[name] = ManagedBlock(self.content[span.start : span.end], span)
            open_block = None
        if open_block is not None:
            raise ESPHomeConfigParseError("unterminated managed block", open_block[1] + 1)
        return blocks

    @staticmethod
    def _line_body(line: str) -> str:
        if line.endswith("\r\n"):
            return line[:-2]
        if line and line[-1] in _LINE_BREAK_FINAL_CHARS:
            return line[:-1]
        return line

    @staticmethod
    def _without_comment(body: str) -> str:
        """Return YAML code only; quoted hashes remain data."""
        quote: str | None = None
        escaped = False
        position = 0
        while position < len(body):
            character = body[position]
            if quote == '"':
                if character == '"' and not escaped:
                    quote = None
                escaped = character == "\\" and not escaped
            elif quote == "'":
                if character == "'":
                    if position + 1 < len(body) and body[position + 1] == "'":
                        position += 1
                    else:
                        quote = None
            elif character in "\"'":
                quote = character
                escaped = False
            elif character == "#" and (
                position == 0 or body[position - 1].isspace()
            ):
                return body[:position].rstrip()
            position += 1
        return body.rstrip()

    def _scan_lexical_document(self) -> None:
        block_indent: int | None = None
        explicit_key = False
        for index in range(len(self.lines)):
            body = self._bodies[index]
            if block_indent is not None:
                if not body.strip():
                    self._block_scalar_lines.add(index)
                    continue
                indent = len(body) - len(body.lstrip(" "))
                if indent > block_indent:
                    self._block_scalar_lines.add(index)
                    continue
                block_indent = None
            structural_body = f"? {body.lstrip()}" if explicit_key else body
            self._reject_unsafe_structural_syntax(structural_body, index + 1)
            header = _BLOCK_SCALAR_HEADER_RE.fullmatch(body) or _EXPLICIT_BLOCK_SCALAR_RE.fullmatch(body)
            if header is not None:
                block_indent = len(header.group("indent"))
                if header.groupdict().get("dash") and header.groupdict().get("mapping"):
                    block_indent += len(header.group("dash"))
                explicit_key = False
                continue
            explicit_key = self._scan_lexical_line(
                body, index + 1, explicit_key=explicit_key
            )

    def _reject_unsafe_structural_syntax(self, body: str, line: int) -> None:
        if _ALIAS_KEY_RE.match(body):
            raise ESPHomeConfigParseError("unsupported structural key syntax", line)
        if _MERGE_KEY_RE.match(body):
            raise ESPHomeConfigParseError(
                "substitution merges are not locally authoritative", line
            )
        for pattern in (_EXPLICIT_KEY_RE, _DECORATED_EXPLICIT_KEY_RE, _PREFIXED_KEY_RE, _FLOW_KEY_RE):
            for match in pattern.finditer(body):
                if self._is_structural_key(self._mapping_key(match.group("key"), line)):
                    raise ESPHomeConfigParseError("unsupported structural key syntax", line)

    @staticmethod
    def _is_structural_key(key: str) -> bool:
        return (
            key
            in {
                "substitutions",
                "esphome",
                "dashboard_import",
                "packages",
                "project",
                "name",
                "package_import_url",
                "files",
                "file",
                "<<",
            }
            or CT_NAME_RE.fullmatch(key) is not None
            or CT_GAIN_RE.fullmatch(key) is not None
            or VOLTAGE_GAIN_RE.fullmatch(key) is not None
            or GROUP_NAME_RE.fullmatch(key) is not None
            or METER_ID_RE.fullmatch(key) is not None
            or METER_SETTING_RE.fullmatch(key) is not None
        )

    def _scan_lexical_line(
        self, body: str, line: int, *, explicit_key: bool = False
    ) -> bool:
        expects_token = True
        flow_depth = 0
        flow_mapping_depth = 0
        position = 0
        while position < len(body):
            character = body[position]
            if character == "#" and (position == 0 or body[position - 1].isspace()):
                if flow_mapping_depth:
                    raise ESPHomeConfigParseError(
                        "unsupported multiline flow mapping", line
                    )
                comment = body[position:]
                if _HELPER_MARKER_HINT_RE.search(comment) and not (
                    position == 0 and comment in _MANAGED_MARKERS
                ):
                    raise ESPHomeConfigParseError(
                        "unrecognized managed block marker", line
                    )
                return explicit_key
            if character.isspace():
                position += 1
                continue
            if body.startswith("---", position) and position == 0 and (
                len(body) == 3 or body[3] in " \t"
            ):
                position = 3
                expects_token = True
                continue
            if character == "?" and expects_token and (
                position + 1 == len(body) or body[position + 1] in " \t"
            ):
                explicit_key = True
                position += 1
                continue
            if character in "[{":
                flow_depth += 1
                flow_mapping_depth += character == "{"
                explicit_key = False
                expects_token = True
                position += 1
                continue
            if character in "]}":
                flow_depth = max(0, flow_depth - 1)
                if character == "}":
                    flow_mapping_depth = max(0, flow_mapping_depth - 1)
                expects_token = False
                position += 1
                continue
            if character == ":" and (
                position + 1 == len(body) or body[position + 1] in " \t#[]{}"
            ):
                explicit_key = False
                expects_token = True
                position += 1
                continue
            if character == "-" and expects_token and (
                position + 1 == len(body) or body[position + 1].isspace()
            ):
                position += 1
                continue
            if character == "," and flow_depth:
                expects_token = True
                position += 1
                continue
            if expects_token and character in "!&":
                while position < len(body) and not body[position].isspace():
                    position += 1
                continue
            if expects_token and explicit_key and character == "*":
                raise ESPHomeConfigParseError("unsupported structural key syntax", line)
            if expects_token and character in "\"'":
                try:
                    end = (
                        self._double_quote_end(body[position:], line)
                        if character == "\""
                        else self._single_quote_end(body[position:], line)
                    )
                except ESPHomeConfigParseError as error:
                    raise ESPHomeConfigParseError(
                        "unsupported multiline quoted scalar", line
                    ) from error
                position += end
                explicit_key = False
                expects_token = False
                continue
            if expects_token:
                explicit_key = False
            expects_token = False
            position += 1
        if flow_mapping_depth:
            raise ESPHomeConfigParseError("unsupported multiline flow mapping", line)
        return explicit_key

    def _nested_scalar(
        self, section_name: str, parent_key: str, child_key: str
    ) -> ConfigScalar | None:
        bounds = self._section_lines(section_name)
        if bounds is None:
            return None
        start, end, section_indent = bounds
        direct_indent = self._direct_child_indent(start, end, section_indent)
        parents: list[tuple[int, _Mapping]] = []
        for index in range(start, end):
            mapping = self._mapping(index)
            if (
                mapping
                and mapping.indent == direct_indent
                and mapping.key == parent_key
            ):
                parents.append((index, mapping))
        if len(parents) > 1:
            raise ESPHomeConfigParseError(
                f"duplicate {parent_key} block", parents[1][0] + 1
            )
        if not parents:
            return None
        parent_index, parent_mapping = parents[0]
        if self._has_value(parent_mapping.rest):
            raise ESPHomeConfigParseError(
                f"{parent_key} must be a mapping", parent_index + 1
            )
        parent_end = end
        for index in range(parent_index + 1, end):
            body = self._bodies[index]
            if not body.strip() or body.lstrip().startswith("#"):
                continue
            indent = len(body) - len(body.lstrip(" "))
            if indent <= parent_mapping.indent:
                parent_end = index
                break
        child_indent = self._direct_child_indent(
            parent_index + 1, parent_end, parent_mapping.indent
        )
        children: list[tuple[int, _Mapping]] = []
        for index in range(parent_index + 1, parent_end):
            mapping = self._mapping(index)
            if mapping and mapping.indent == child_indent and mapping.key == child_key:
                children.append((index, mapping))
        if len(children) > 1:
            raise ESPHomeConfigParseError(f"duplicate {child_key}", children[1][0] + 1)
        return self._scalar(*children[0]) if children else None

    def _section_scalar(self, section_name: str, key: str) -> ConfigScalar | None:
        bounds = self._section_lines(section_name)
        if bounds is None:
            return None
        start, end, section_indent = bounds
        direct_indent = self._direct_child_indent(start, end, section_indent)
        matches: list[tuple[int, _Mapping]] = []
        for index in range(start, end):
            mapping = self._mapping(index)
            if mapping and mapping.indent == direct_indent and mapping.key == key:
                matches.append((index, mapping))
        if len(matches) > 1:
            raise ESPHomeConfigParseError(f"duplicate {key}", matches[1][0] + 1)
        if not matches:
            return None
        index, mapping = matches[0]
        if not self._has_value(mapping.rest) and index + 1 < end:
            continuation = self._bodies[index + 1]
            if (
                len(continuation) - len(continuation.lstrip(" ")) > mapping.indent
                and continuation.lstrip(" ").startswith("github://")
            ):
                return self._scalar_parts(index + 1, continuation, 0)
        return self._scalar(index, mapping)

    def _direct_child_indent(
        self, start: int, end: int, parent_indent: int
    ) -> int | None:
        indents = [
            len(body) - len(body.lstrip(" "))
            for body in self._bodies[start:end]
            if body.strip()
            and not body.lstrip().startswith("#")
            and len(body) - len(body.lstrip(" ")) > parent_indent
        ]
        return min(indents, default=None)

    @staticmethod
    def _has_value(rest: str) -> bool:
        value = rest.strip()
        return bool(value and not value.startswith("#"))

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
        if index in self._block_scalar_lines:
            return None
        match = _MAPPING_RE.match(self._bodies[index])
        if match is None:
            return None
        return _Mapping(
            indent=len(match.group("indent")),
            key=self._mapping_key(match.group("key"), index + 1),
            rest=match.group("rest"),
            rest_column=match.start("rest"),
        )

    def _sequence_mapping(self, index: int) -> _Mapping | None:
        if index in self._block_scalar_lines:
            return None
        match = _SEQUENCE_MAPPING_RE.match(self._bodies[index])
        if match is None:
            return None
        return _Mapping(
            indent=len(match.group("indent")),
            key=self._mapping_key(match.group("key"), index + 1),
            rest=match.group("rest"),
            rest_column=match.start("rest"),
        )

    @staticmethod
    def _mapping_key(token: str, line: int) -> str:
        if token[0] == "'":
            value = token[1:-1].replace("''", "'")
        elif token[0] == "\"":
            try:
                value = json.loads(token)
            except json.JSONDecodeError as error:
                raise ESPHomeConfigParseError("invalid quoted mapping key", line) from error
        else:
            value = token
        try:
            value.encode("utf-8")
        except UnicodeEncodeError as error:
            raise ESPHomeConfigParseError("mapping key is not valid UTF-8", line) from error
        if _CONTROL_RE.search(value):
            raise ESPHomeConfigParseError("mapping key is not safely bounded", line)
        return value

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
        try:
            value.encode("utf-8")
        except UnicodeEncodeError as error:
            raise ESPHomeConfigParseError("scalar is not valid UTF-8", line) from error
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
