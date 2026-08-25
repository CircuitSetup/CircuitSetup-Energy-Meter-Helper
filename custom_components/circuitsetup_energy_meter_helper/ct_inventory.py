"""Topology-bounded current-transformer configuration inventory."""

from __future__ import annotations

import math
import unicodedata
from collections.abc import Iterable, Mapping
from dataclasses import dataclass

from .config_document import ESPHomeConfigDocument
from .ct_catalog import CTPresetCatalog
from .models import ChannelAddress, MeterTopology, StoredCTSelection
from .topology import channel_address


@dataclass(frozen=True, slots=True)
class CTChannelConfig:
    """One active CT channel and its configuration-backed model status."""

    channel: int
    name: str
    raw_gain_ct: int
    reporting_multiplier: float
    selected_model_id: str | None
    selection_verified_against_config: bool
    address: ChannelAddress
    display_label: str | None = None
    stored_selection_present: bool = False


@dataclass(frozen=True, slots=True)
class CTInventory:
    """All active channels from one authoritative ESPHome document."""

    channels: tuple[CTChannelConfig, ...]
    catalog: CTPresetCatalog

    @classmethod
    def from_document(
        cls,
        document: ESPHomeConfigDocument,
        topology: MeterTopology,
        catalog: CTPresetCatalog,
        config_sha256: str,
        stored_selections: Iterable[StoredCTSelection] = (),
        reporting_multipliers: Mapping[int, float] | None = None,
    ) -> CTInventory:
        """Build every active channel, refusing incomplete or duplicate inputs."""
        if len(config_sha256) != 64:
            raise ValueError("config_sha256 must be a SHA-256 hex digest")
        stored_by_channel: dict[int, StoredCTSelection] = {}
        for selection in stored_selections:
            if not 1 <= selection.channel <= topology.ct_count:
                raise ValueError("stored selection is outside topology")
            if selection.channel in stored_by_channel:
                raise ValueError(
                    f"duplicate stored selection for CT{selection.channel}"
                )
            stored_by_channel[selection.channel] = selection
        multipliers = reporting_multipliers or {}
        if any(
            channel not in range(1, topology.ct_count + 1) for channel in multipliers
        ):
            raise ValueError("reporting multiplier is outside topology")
        for key in document.substitutions:
            channel = _substitution_channel(key)
            if channel is not None and channel > topology.ct_count:
                raise ValueError("substitution is outside topology")

        channels: list[CTChannelConfig] = []
        for channel in range(1, topology.ct_count + 1):
            name_key = f"ct{channel}_name"
            gain_key = f"current_cal_ct{channel}"
            try:
                name = document.substitutions[name_key].value
                raw_gain = int(document.substitutions[gain_key].value)
            except KeyError as error:
                raise ValueError(
                    f"missing active substitution {error.args[0]}"
                ) from error
            except ValueError as error:
                raise ValueError(f"invalid gain for CT{channel}") from error
            _validate_name(name)
            if not 1 <= raw_gain <= 65535:
                raise ValueError(
                    f"gain for CT{channel} must be an ATM90E32 uint16 value"
                )
            multiplier = multipliers.get(channel, 1.0)
            if not math.isfinite(multiplier) or multiplier <= 0:
                raise ValueError(f"invalid reporting multiplier for CT{channel}")
            stored = stored_by_channel.get(channel)
            if stored is None:
                verified = False
                selected_model_id = catalog.infer_model(raw_gain, multiplier)
                display_label = None
            else:
                verified = (
                    stored.config_sha256 == config_sha256
                    and stored.raw_gain_ct == raw_gain
                    and stored.reporting_multiplier == multiplier
                )
                selected_model_id = stored.model_id if verified else None
                display_label = stored.display_label
            channels.append(
                CTChannelConfig(
                    channel,
                    name,
                    raw_gain,
                    multiplier,
                    selected_model_id,
                    verified,
                    channel_address(channel, topology),
                display_label,
                stored is not None,
                )
            )
        _reject_object_id_collisions(channels)
        return cls(tuple(channels), catalog)

    def warnings_for(self, model_id: str, multiplier: float) -> tuple[str, ...]:
        """Return the explicit unscaled-register warning for a selected preset."""
        preset = self.catalog.by_model_id(model_id)
        if preset is None:
            raise ValueError("unknown CT preset")
        if multiplier == 1 and preset.rated_current_a > 65.535:
            return ("Rated current exceeds the unscaled 65.535 A register range.",)
        return ()


def _validate_name(name: str) -> None:
    if (
        not name
        or len(name) > 64
        or any(unicodedata.category(character) == "Cc" for character in name)
    ):
        raise ValueError(
            "CT name must be non-empty, at most 64 characters, and control-free"
        )


def _substitution_channel(key: str) -> int | None:
    if key.startswith("ct") and key.endswith("_name"):
        return int(key.removeprefix("ct").removesuffix("_name"))
    if key.startswith("current_cal_ct"):
        return int(key.removeprefix("current_cal_ct"))
    return None


def _reject_object_id_collisions(channels: Iterable[CTChannelConfig]) -> None:
    for suffix in ("Amps", "Watts", "Ref Current"):
        object_ids: set[str] = set()
        for channel in channels:
            object_id = _esphome_object_id(f"{channel.name} {suffix}")
            if object_id in object_ids:
                raise ValueError(f"ESPHome object-ID collision for {suffix}")
            object_ids.add(object_id)


def _esphome_object_id(value: str) -> str:
    """Match ESPHome's native entity-name object-ID sanitizer exactly."""
    result = bytearray()
    for byte in value.encode("utf-8"):
        if byte == 0x20:
            result.append(0x5F)
        elif 0x41 <= byte <= 0x5A:
            result.append(byte + 0x20)
        elif (
            0x61 <= byte <= 0x7A
            or 0x30 <= byte <= 0x39
            or byte in (0x2D, 0x5F)
        ):
            result.append(byte)
        else:
            result.append(0x5F)
    return result.decode("ascii")
