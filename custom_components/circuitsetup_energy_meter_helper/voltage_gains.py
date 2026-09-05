"""Resolve and write helper-owned voltage gains without serializing YAML."""

from __future__ import annotations

import json
import re
from collections.abc import Mapping
from typing import cast

from .config_document import ESPHomeConfigDocument
from .models import MeterTopology, SubstitutionChange

_ROOT_SENSOR_RE = re.compile(r"^(?:sensor|['\"]sensor['\"])[ \t]*:")
_GAIN_KEY_RE = re.compile(
    r"(?:^|[\s{,])(?:gain_voltage|'gain_voltage'|\"gain_voltage\")[ \t]*:"
)
_CIRCUITSETUP_REPOSITORY = (
    "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter"
)
_CIRCUITSETUP_GITHUB = f"github://{_CIRCUITSETUP_REPOSITORY}/"
_CIRCUITSETUP_URL = f"https://github.com/{_CIRCUITSETUP_REPOSITORY}"


def effective_voltage_gains(
    document: ESPHomeConfigDocument,
    topology: MeterTopology,
) -> dict[str, tuple[int, int, int]]:
    """Resolve A/B/C gains per canonical instance from supported local YAML."""
    values = _effective_voltage_gain_slots(document, topology)
    if any(gain is None for gains in values.values() for gain in gains):
        raise ValueError("voltage gain inheritance is not locally authoritative")
    return {
        instance: cast(tuple[int, int, int], tuple(gains))
        for instance, gains in values.items()
    }


def apply_voltage_gain_changes(
    content: str,
    topology: MeterTopology,
    gains_by_instance: Mapping[str, tuple[int, int, int]],
) -> str:
    """Apply complete targets while preserving every untouched effective gain."""
    if not isinstance(gains_by_instance, Mapping):
        raise ValueError("voltage gain targets are invalid")  # noqa: TRY004
    instances = _instances(topology)
    unknown = set(gains_by_instance).difference(instances)
    if unknown:
        raise ValueError("voltage gain target has an unknown instance ID")
    targets: dict[str, tuple[int, int, int]] = {}
    for instance, target_gains in gains_by_instance.items():
        if (
            not isinstance(instance, str)
            or not isinstance(target_gains, tuple)
            or len(target_gains) != 3
            or any(
                type(gain) is not int or not 1 <= gain <= 65535
                for gain in target_gains
            )
        ):
            raise ValueError("voltage gain targets are invalid")
        targets[instance] = target_gains

    document = ESPHomeConfigDocument.parse(content)
    slots = _effective_voltage_gain_slots(document, topology)
    desired: dict[str, tuple[int, int, int]] = {}
    for instance, inherited_gains in slots.items():
        if instance in targets:
            desired[instance] = targets[instance]
        elif any(gain is None for gain in inherited_gains):
            raise ValueError("voltage gain inheritance is not locally authoritative")
        else:
            desired[instance] = cast(tuple[int, int, int], tuple(inherited_gains))
    scalar_values = {
        group: _substitution_gain(document, group) for group in (1, 2)
    }
    scalar_changes: list[SubstitutionChange] = []
    replacements: dict[str, str] = {}
    for group in (1, 2):
        consumers = {instance for instance in instances if _group(instance) == group}
        if not consumers.issubset(targets):
            continue
        distinct = {
            gain for instance in consumers for gain in targets[instance]
        }
        if len(distinct) != 1:
            continue
        value = distinct.pop()
        if scalar_values[group] == value:
            continue
        key = f"voltage_cal{group}"
        scalar_changes.append(
            SubstitutionChange(
                key,
                document.substitutions[key].value
                if key in document.substitutions
                else None,
                str(value),
            )
        )
        replacements[key] = str(value)
        scalar_values[group] = value
    if scalar_changes:
        from .config_mutator import _apply_changes

        content = _apply_changes(document, scalar_changes, replacements)

    content = _strip_legacy_gains(content, topology)
    exceptions: dict[str, dict[int, int]] = {}
    for instance, gains in desired.items():
        baseline = scalar_values[_group(instance)]
        phases = {
            phase: gain
            for phase, gain in enumerate(gains)
            if baseline is None or gain != baseline
        }
        if phases:
            exceptions[instance] = phases
    return _write_calibration_block(content, topology, exceptions)


def _instances(topology: MeterTopology) -> tuple[str, ...]:
    return tuple(
        f"meter_main{group}" if board == 0 else f"addon{board}_{group}"
        for board in range(topology.board_count)
        for group in (1, 2)
    )


def _effective_voltage_gain_slots(
    document: ESPHomeConfigDocument, topology: MeterTopology
) -> dict[str, list[int | None]]:
    _validate_package_sources(document)
    _validate_package_mappings(document, topology)
    values: dict[str, list[int | None]] = {
        instance: [_substitution_gain(document, _group(instance))] * 3
        for instance in _instances(topology)
    }
    _reject_unowned_gains(document)
    block_names = sorted(
        (
            name
            for name in ("voltage_references", "calibrated_voltage_gains")
            if name in document.managed_blocks
        ),
        key=lambda name: document.managed_blocks[name].span.start,
    )
    for block_name in block_names:
        for instance, phases in _owned_overrides(document, topology, block_name).items():
            for phase, gain in phases.items():
                values[instance][phase] = gain
    return values


def _group(instance: str) -> int:
    return int(instance[-1])


def _meter_key(instance: str) -> str:
    group = _group(instance)
    if instance.startswith("meter_main"):
        return f"main_meter_id{group}"
    return f"addon{instance.removeprefix('addon').split('_', 1)[0]}_id{group}"


def _validate_package_mappings(
    document: ESPHomeConfigDocument, topology: MeterTopology
) -> None:
    packages = tuple(
        path.replace("\\", "/")
        for path in document.package_files
        if "/meter_sensors/" in path.replace("\\", "/")
    )
    known = re.compile(
        r"/meter_sensors/(?P<name>main|6chan_main_sensor|6chan_addon[1-6])\.yaml$"
    )
    matches = [known.search(path) for path in packages]
    if any(match is None for match in matches):
        raise ValueError("voltage gain package mapping is unknown")
    if not matches:
        return
    names = {match.group("name") for match in matches if match is not None}
    main = names.intersection({"main", "6chan_main_sensor"})
    addons = {f"6chan_addon{board}" for board in range(1, topology.board_count)}
    if len(main) != 1 or names.difference(main) != addons:
        raise ValueError("voltage gain package mapping does not match topology")


def _validate_package_sources(document: ESPHomeConfigDocument) -> None:
    roots: list[tuple[int, str]] = []
    for index, line in enumerate(document.code_lines):
        if (value := _package_root_value(line)) is not None:
            roots.append((index, value))
    if not roots:
        return
    if len(roots) != 1:
        raise ValueError("voltage gain package source is ambiguous")
    root, root_value = roots[0]
    if root_value.strip():
        raise ValueError("voltage gain package source is not trusted")
    start = root + 1
    end = next(
        (
            index
            for index in range(start, len(document.code_lines))
            if document.code_lines[index]
            and not document.code_lines[index].startswith(" ")
        ),
        len(document.code_lines),
    )
    meaningful = [
        (index, document.code_lines[index])
        for index in range(start, end)
        if document.code_lines[index].strip()
    ]
    if not meaningful:
        return
    item_indent = min(len(line) - len(line.lstrip(" ")) for _, line in meaningful)
    items = [
        position
        for position, (_index, line) in enumerate(meaningful)
        if len(line) - len(line.lstrip(" ")) == item_indent
    ]
    for item_position, item_start in enumerate(items):
        item_end = items[item_position + 1] if item_position + 1 < len(items) else len(meaningful)
        _validate_package_source_item(
            [line for _index, line in meaningful[item_start:item_end]], item_indent
        )


def _package_root_value(line: str) -> str | None:
    match = re.fullmatch(
        r"(?P<key>packages|'packages'|\"(?:[^\"\\]|\\.)*\")[ \t]*:"
        r"(?P<value>.*)",
        line,
    )
    if match is None:
        return None
    token = match["key"]
    key = (
        json.loads(token)
        if token.startswith('"')
        else token[1:-1].replace("''", "'")
        if token.startswith("'")
        else token
    )
    return match["value"] if key == "packages" else None


def _validate_package_source_item(lines: list[str], item_indent: int) -> None:
    header = lines[0]
    match = re.fullmatch(rf" {{{item_indent}}}[^:]+:(?P<value>.*)", header)
    if match is None:
        raise ValueError("voltage gain package source is unsupported")
    value = _plain_package_scalar(match["value"])
    if value:
        if not value.startswith(_CIRCUITSETUP_GITHUB):
            raise ValueError("voltage gain package source is not trusted")
        return
    nested = lines[1:]
    if any("!include" in line for line in nested):
        raise ValueError("voltage gain package source is not trusted")
    urls = [
        _plain_package_scalar(candidate.group("value"))
        for line in nested
        if (
            candidate := re.fullmatch(
                rf" {{{item_indent + 2}}}url:(?P<value>.*)", line
            )
        )
    ]
    if urls:
        if urls != [_CIRCUITSETUP_URL]:
            raise ValueError("voltage gain package source is not trusted")
        return
    paths = [
        _plain_package_scalar(candidate.group("value"))
        for line in nested
        if (candidate := re.fullmatch(r"\s+-\s+(?P<value>.+)", line))
    ]
    if not paths or any(
        re.fullmatch(
            r"Software/ESPHome/(?:power_quality|status_fields)/[\w-]+\.yaml",
            path.replace("\\", "/"),
        )
        is None
        for path in paths
    ):
        raise ValueError("voltage gain package source is not trusted")


def _plain_package_scalar(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def _substitution_gain(document: ESPHomeConfigDocument, group: int) -> int | None:
    scalar = document.substitutions.get(f"voltage_cal{group}")
    if scalar is None:
        return None
    return _gain_value(scalar.value)


def _gain_value(value: str) -> int:
    if re.fullmatch(r"[1-9]\d*", value) is None:
        raise ValueError("voltage gain value is invalid")
    gain = int(value)
    if gain > 65535:
        raise ValueError("voltage gain value is invalid")
    return gain


def _owner_id(
    token: str, document: ESPHomeConfigDocument, topology: MeterTopology
) -> str:
    aliases: dict[str, str] = {}
    ambiguous: set[str] = set()
    for instance in _instances(topology):
        key = _meter_key(instance)
        candidates = {instance}
        if scalar := document.substitutions.get(key):
            candidates.add(f"${{{key}}}")
            if re.fullmatch(r"[\w${}-]+", scalar.value):
                candidates.add(scalar.value)
        for alias in candidates:
            if alias in aliases and aliases[alias] != instance:
                ambiguous.add(alias)
            else:
                aliases[alias] = instance
    for alias in ambiguous:
        aliases.pop(alias, None)
    try:
        return aliases[token]
    except KeyError as error:
        raise ValueError("voltage gain block has an unknown instance ID") from error


def _owned_overrides(
    document: ESPHomeConfigDocument,
    topology: MeterTopology,
    block_name: str,
) -> dict[str, dict[int, int]]:
    block = document.managed_blocks.get(block_name)
    if block is None:
        return {}
    lines = block.content.replace("\r\n", "\n").splitlines()[1:-1]
    if block_name == "voltage_references" and not any(
        _contains_gain_key(_managed_code(line)) for line in lines
    ):
        return {}
    sensor = document.writable_sensor_span
    if sensor is None or not (
        sensor.start <= block.span.start and block.span.end <= sensor.end
    ):
        raise ValueError("voltage gain block is outside the writable sensor section")
    items = _managed_voltage_items(lines, document.sensor_item_indent)
    overrides: dict[str, dict[int, int]] = {}
    for token, body in items.items():
        instance = _owner_id(token, document, topology)
        if instance in overrides:
            raise ValueError("voltage gain block has duplicate instance IDs")
        entries = _managed_mappings(body, 4)
        phases: dict[int, int] = {}
        for key, (value, nested) in entries.items():
            match = re.fullmatch(r"phase_([abc])", key)
            if match is None:
                if key == "gain_voltage" or _contains_gain_key(value) or any(
                    _contains_gain_key(_managed_code(line)) for line in nested
                ):
                    raise ValueError("voltage gain block has an invalid gain location")
                continue
            if value:
                raise ValueError("voltage gain phase is not a block mapping")
            nested_entries = _managed_mappings(nested, 6)
            gain_entry = nested_entries.get("gain_voltage")
            gain_occurrences = sum(
                _contains_gain_key(_managed_code(line)) for line in nested
            )
            if gain_entry is None:
                if gain_occurrences:
                    raise ValueError("voltage gain block has an invalid gain location")
                continue
            if gain_occurrences != 1:
                raise ValueError("voltage gain block has an invalid gain location")
            if not _managed_body_is_empty(gain_entry[1]):
                raise ValueError("voltage gain value is invalid")
            phases["abc".index(match.group(1))] = _gain_value(gain_entry[0])
            if block_name == "calibrated_voltage_gains" and set(nested_entries) != {
                "gain_voltage"
            }:
                raise ValueError("calibrated voltage gain phase is invalid")
        if block_name == "calibrated_voltage_gains" and (
            not phases
            or set(entries)
            != {
                f"phase_{'abc'[phase]}" for phase in phases
            }
        ):
            raise ValueError("calibrated voltage gain block is invalid")
        overrides[instance] = phases
    return overrides


def _reject_unowned_gains(document: ESPHomeConfigDocument) -> None:
    owned = tuple(
        block.span
        for name, block in document.managed_blocks.items()
        if name in {"voltage_references", "calibrated_voltage_gains"}
    )
    offset = 0
    for raw_line, code_line in zip(document.lines, document.code_lines, strict=True):
        if not any(span.start <= offset < span.end for span in owned) and _contains_gain_key(
            code_line
        ):
            raise ValueError("local voltage gain override is not helper-owned")
        offset += len(raw_line)


def _strip_legacy_gains(content: str, topology: MeterTopology) -> str:
    document = ESPHomeConfigDocument.parse(content)
    block = document.managed_blocks.get("voltage_references")
    if block is None:
        return content
    if not any(
        _contains_gain_key(_managed_code(line))
        for line in block.content.splitlines()[1:-1]
    ):
        return content
    _owned_overrides(document, topology, "voltage_references")
    raw = block.content.splitlines(keepends=True)
    inner = raw[1:-1]
    normalized = (
        [f"  {line}" if line.strip("\r\n") else line for line in inner]
        if document.sensor_item_indent == 0
        else list(inner)
    )
    remove: set[int] = set()
    headers = [
        index
        for index, line in enumerate(normalized)
        if _managed_code(line).startswith("  - ")
    ]
    for owner_index, start in enumerate(headers):
        end = headers[owner_index + 1] if owner_index + 1 < len(headers) else len(inner)
        phases = [
            index
            for index in range(start + 1, end)
            if re.fullmatch(r"    phase_[abc]:", _managed_code(normalized[index]))
        ]
        for phase_start in phases:
            phase_end = next(
                (
                    index
                    for index in range(phase_start + 1, end)
                    if _managed_code(normalized[index]).strip()
                    and len(_managed_code(normalized[index]))
                    - len(_managed_code(normalized[index]).lstrip(" "))
                    <= 4
                ),
                end,
            )
            for index in range(phase_start + 1, phase_end):
                code = _managed_code(normalized[index])
                if re.fullmatch(r"      gain_voltage: [1-9]\d*", code):
                    remove.add(index)
            if not any(
                _managed_code(normalized[index]).strip() and index not in remove
                for index in range(phase_start + 1, phase_end)
            ):
                remove.update(range(phase_start, phase_end))
        if not any(
            _managed_code(normalized[index]).strip() and index not in remove
            for index in range(start + 1, end)
        ):
            remove.update(range(start, end))
    replacement = raw[0] + "".join(
        line for index, line in enumerate(inner) if index not in remove
    ) + raw[-1]
    return content[: block.span.start] + replacement + content[block.span.end :]


def _write_calibration_block(
    content: str,
    topology: MeterTopology,
    exceptions: Mapping[str, Mapping[int, int]],
) -> str:
    from .config_blocks import render_phase_overrides, replace_managed_block

    entries: dict[str, str] = {}
    document = ESPHomeConfigDocument.parse(content)
    for instance, phases in exceptions.items():
        key = _meter_key(instance)
        owner = f"${{{key}}}" if key in document.substitutions else instance
        body = [f"  - id: !extend {owner}"]
        for phase, gain in sorted(phases.items()):
            body.extend(
                (f"    phase_{'abc'[phase]}:", f"      gain_voltage: {gain}")
            )
        entries[instance] = "\n".join(body) + "\n"
    rendered = render_phase_overrides(entries)
    if not rendered and "calibrated_voltage_gains" not in document.managed_blocks:
        return content
    if (
        rendered
        and document.writable_sensor_span is None
        and not any(_ROOT_SENSOR_RE.match(line) for line in content.splitlines())
    ):
        newline = "\r\n" if "\r\n" in content else "\n"
        content += ("" if content.endswith(("\n", "\r")) else newline) + "sensor:" + newline
    return replace_managed_block(content, "calibrated_voltage_gains", rendered)


def _managed_voltage_items(
    lines: list[str], item_indent: int | None
) -> dict[str, list[str]]:
    """Return exact direct meter items from the helper-owned sensor block."""
    if item_indent == 0:
        lines = [f"  {line}" if line else line for line in lines]
    headers: list[tuple[str, int]] = []
    for index, line in enumerate(lines):
        code = _managed_code(line)
        if not code.strip():
            continue
        if _ambiguous_managed_yaml(code):
            raise ValueError("managed voltage references are ambiguous")
        if code.startswith("  - "):
            match = re.fullmatch(r"  - id: !extend (?P<id>[^\s]+)", code)
            if match is None:
                raise ValueError("managed voltage reference item is invalid")
            headers.append((match["id"], index))
        elif not headers or len(code) - len(code.lstrip(" ")) <= 2:
            raise ValueError("managed voltage reference item is invalid")
    items: dict[str, list[str]] = {}
    for item_index, (meter_id, start) in enumerate(headers):
        end = headers[item_index + 1][1] if item_index + 1 < len(headers) else len(lines)
        if meter_id in items:
            raise ValueError("managed voltage reference gains are ambiguous")
        items[meter_id] = lines[start + 1 : end]
    return items


def _managed_mappings(lines: list[str], indent: int) -> dict[str, tuple[str, list[str]]]:
    entries: dict[str, tuple[str, list[str]]] = {}
    index = 0
    while index < len(lines):
        line = lines[index]
        code = _managed_code(line)
        if not code.strip():
            index += 1
            continue
        if _ambiguous_managed_yaml(code):
            raise ValueError("managed voltage references are ambiguous")
        if len(code) - len(code.lstrip(" ")) != indent:
            raise ValueError("managed voltage reference structure is invalid")
        match = re.fullmatch(
            rf" {' ' * (indent - 1)}(?P<key>[a-z][a-z0-9_]*):(?P<value>.*)", code
        )
        if match is None or match["key"] in entries:
            raise ValueError("managed voltage reference structure is invalid")
        end = index + 1
        while end < len(lines):
            candidate_code = _managed_code(lines[end])
            if candidate_code.strip() and (
                len(candidate_code) - len(candidate_code.lstrip(" "))
            ) <= indent:
                break
            end += 1
        entries[match["key"]] = (match["value"].strip(), lines[index + 1 : end])
        index = end
    return entries


def _managed_body_is_empty(lines: list[str]) -> bool:
    return not any(_managed_code(line).strip() for line in lines)


def _managed_code(line: str) -> str:
    quote: str | None = None
    index = 0
    while index < len(line):
        character = line[index]
        if quote is not None:
            if quote == '"' and character == "\\":
                index += 2
                continue
            if character == quote:
                if quote == "'" and line[index + 1 : index + 2] == "'":
                    index += 2
                    continue
                quote = None
        elif character in {"'", '"'}:
            quote = character
        elif character == "#" and (index == 0 or line[index - 1].isspace()):
            return line[:index].rstrip()
        index += 1
    return line.rstrip()


def _ambiguous_managed_yaml(line: str) -> bool:
    stripped = line.lstrip()
    lexical = re.sub(r'"(?:[^"\\]|\\.)*"|\'(?:[^\']|\'\')*\'', '""', stripped)
    if lexical.startswith("- id: !extend "):
        return False
    return (
        re.search(r"(?:^|[\s\-\[\{,])(?:\?|<<:|[&*!][^\s]+)", lexical)
        is not None
    )


def _contains_gain_key(line: str) -> bool:
    return _GAIN_KEY_RE.search(line) is not None
