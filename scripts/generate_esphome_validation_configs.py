"""Generate disposable real-package configs for ESPHome validation."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from hashlib import sha256
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from custom_components.circuitsetup_energy_meter_helper.config_document import (
    ESPHomeConfigDocument,
)
from custom_components.circuitsetup_energy_meter_helper.config_mutator import (
    CTChangeRequest,
    _build_ct_mutation,
)
from custom_components.circuitsetup_energy_meter_helper.models import MeterTopology
from custom_components.circuitsetup_energy_meter_helper.topology import (
    topology_from_config,
)

_REMOTE_REF_RE = re.compile(r"^(?P<prefix>\s*ref:\s*)master\s*$", re.MULTILINE)
_DASHBOARD_REF_RE = re.compile(
    r"(github://CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter/[^\s]+)@master"
)


def _firmware_revision(firmware_root: Path) -> str:
    """Read the checked-out revision used for every disposable remote package."""
    try:
        result = subprocess.run(
            ["git", "-C", str(firmware_root), "rev-parse", "HEAD"],
            check=True,
            capture_output=True,
            text=True,
        )
    except (OSError, subprocess.CalledProcessError) as error:
        raise SystemExit(
            f"firmware checkout revision is unavailable: {firmware_root}"
        ) from error
    revision = result.stdout.strip()
    if not re.fullmatch(r"[0-9a-f]{40}", revision):
        raise SystemExit("firmware checkout revision is invalid")
    return revision


def _pin_firmware_package_refs(source: str, revision: str) -> str:
    """Pin disposable remote-package and dashboard refs to the checkout."""
    pinned = _REMOTE_REF_RE.sub(rf"\g<prefix>{revision}", source)
    return _DASHBOARD_REF_RE.sub(rf"\g<1>@{revision}", pinned)


def generate(firmware_root: Path, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    revision = _firmware_revision(firmware_root)
    print(f"firmware_package_revision={revision}")
    (output_dir / "validation-revision.txt").write_text(
        f"firmware_package_revision={revision}\n", encoding="utf-8"
    )

    def write_mutation(
        source_path: Path,
        output_name: str,
        channel: int,
        multiplier: int,
        power_quality: tuple[bool, ...],
        status_fields: tuple[bool, ...],
        enabled: bool,
    ) -> None:
        source = _pin_firmware_package_refs(
            source_path.read_text(encoding="utf-8"), revision
        )
        snapshot = SimpleNamespace(
            configuration=source_path.name,
            content=source,
            sha256=sha256(source.encode()).hexdigest(),
            configuration_authoritative=True,
        )
        topology: MeterTopology = topology_from_config(
            ESPHomeConfigDocument.parse(source)
        )
        plan = _build_ct_mutation(
            snapshot,
            topology,
            (
                CTChangeRequest(
                    channel,
                    f"CT {channel}",
                    "sct_006_20a_25ma",
                    multiplier,
                ),
            ),
            package_options={
                "power_quality": power_quality,
                "status_fields": status_fields,
            },
            phase_channels={channel: (enabled, multiplier)},
        )
        (output_dir / output_name).write_text(
            plan.proposed_content, encoding="utf-8"
        )

    source_path = firmware_root / "Software/ESPHome/6chan_energy_meter_main_board.yaml"
    for power_quality in (False, True):
        for multiplier in (1, 2, 4, 8):
            write_mutation(
                source_path,
                f"unused-m{multiplier}-pq-{int(power_quality)}.yaml",
                1,
                multiplier,
                (power_quality,),
                (True,),
                False,
            )

    write_mutation(
        source_path,
        "used-unity-pq.yaml",
        1,
        1,
        (True,),
        (True,),
        True,
    )

    write_mutation(
        firmware_root / "Software/ESPHome/6chan_energy_meter_6-addons.yaml",
        "max-topology-unused-m8.yaml",
        42,
        8,
        (True, False, True, False, True, False, True),
        (True,) * 7,
        False,
    )
    write_mutation(
        firmware_root / "Software/ESPHome/6chan_energy_meter_3-addons_2-voltages.yaml",
        "two-voltages-used-m8.yaml",
        18,
        8,
        (True, False, True, False),
        (False, False, True, False),
        True,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("firmware_root", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()
    generate(args.firmware_root, args.output_dir)
