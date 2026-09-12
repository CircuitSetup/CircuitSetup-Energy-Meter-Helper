"""Release workflows must be reproducible and least-privileged."""

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parents[1]
WORKFLOW_DIR = ROOT / ".github/workflows"
WORKFLOWS = tuple(WORKFLOW_DIR.glob("*.yml"))
HACS_IMAGE = (
    "docker://ghcr.io/hacs/action@"
    "sha256:41f6310585d9fb72c7a0e183cce0594355715bc24112b62bc4279b83412edccb"
)


def test_every_release_dependency_is_immutable() -> None:
    """No workflow may execute a moving action tag or nested moving HACS image."""
    uses = [
        value
        for path in WORKFLOWS
        for value in re.findall(
            r"^\s*(?:-\s*)?uses:\s*(\S+)", path.read_text(), re.MULTILINE
        )
    ]

    assert HACS_IMAGE in uses
    assert all(not value.startswith("hacs/action@") for value in uses)
    assert all(
        re.search(r"@[0-9a-f]{40}$", value) or re.search(r"@sha256:[0-9a-f]{64}$", value)
        for value in uses
    )


def test_release_validation_is_read_only_until_publish() -> None:
    """Only the final publish job receives repository write permission."""
    workflow = (ROOT / ".github/workflows/release.yml").read_text()

    assert "permissions:\n  contents: read" in workflow
    assert re.search(
        r"(?ms)^  publish:\n    needs: validate\n    permissions:\n      contents: write\n",
        workflow,
    )
    assert workflow.index("  validate:") < workflow.index("  publish:")


def test_release_notes_omit_pull_request_usernames() -> None:
    """Generated PR entries keep their links but omit GitHub usernames."""
    workflow = (WORKFLOW_DIR / "release.yml").read_text()
    generated = (
        "## What's Changed\n"
        "* Add meter options by @CircuitSetup in https://github.com/CircuitSetup/repo/pull/21\n"
        "* Bump dependency by @dependabot[bot] in https://github.com/CircuitSetup/repo/pull/22\n"
        "Thanks @CircuitSetup\n"
    )

    result = subprocess.run(
        [sys.executable, ROOT / "scripts/strip_release_usernames.py"],
        input=generated,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert "python scripts/strip_release_usernames.py" in workflow
    assert "--generate-notes" not in workflow
    assert result.stdout == (
        "## What's Changed\n"
        "* Add meter options in https://github.com/CircuitSetup/repo/pull/21\n"
        "* Bump dependency in https://github.com/CircuitSetup/repo/pull/22\n"
        "Thanks @CircuitSetup\n"
    )


def test_ci_runs_firmware_tests_without_compiling_every_meter() -> None:
    workflow = (WORKFLOW_DIR / "ci.yml").read_text()

    assert "firmware/Software/ESPHome/tests" in workflow
    assert "firmware/Software/ESPHome/tests/compile_matrix.py" not in workflow
    assert "esphome\", \"compile" not in workflow


def test_firmware_filter_only_matches_yaml_configuration_changes() -> None:
    workflow = (WORKFLOW_DIR / "ci.yml").read_text()
    pattern = re.search(r"'([\^].*\$)'; then", workflow)
    assert pattern is not None
    matches = re.compile(pattern[1], re.MULTILINE)
    component = "custom_components/circuitsetup_energy_meter_helper/"
    for path in (
        component + "config_mutator.py",
        component + "meter_config_mutator.py",
        component + "total_graph.py",
        component + "voltage_gains.py",
        component + "templates/meter.yaml",
        "tests/fixtures/device_builder/meter.yml",
        "scripts/generate_esphome_validation_configs.py",
        "scripts/verify_firmware_contract.py",
    ):
        assert matches.search(path), path
    unrelated = (
        "frontend/src/panel.ts",
        component + "frontend/circuitsetup-energy-meter-helper-panel.js",
        component + "websocket_api.py",
        component + "workflow.py",
        component + "store.py",
        "tests/test_firmware_contract.py",
        ".github/workflows/ci.yml",
        "pyproject.toml",
        "README.md",
    )
    assert not matches.search("\n".join(unrelated))
    assert matches.search("\n".join((*unrelated, component + "config_blocks.py")))
    # A renamed generator must still be detected through its deleted old path.
    assert "git diff --no-renames --name-only" in workflow
    assert "if: needs.changes.outputs.firmware == 'true'" in workflow


def test_release_runs_firmware_tests_without_compiling_every_meter() -> None:
    workflow = (WORKFLOW_DIR / "release.yml").read_text()

    assert "firmware/Software/ESPHome/tests" in workflow
    assert "firmware/Software/ESPHome/tests/compile_matrix.py" not in workflow
    assert "esphome\", \"compile" not in workflow
    assert "Require recorded physical validation" not in workflow


def test_hacs_validation_uses_the_event_ref() -> None:
    """HACS must validate the pushed branch or PR, not the default branch."""
    for path in WORKFLOWS:
        assert "INPUT_REPOSITORY" not in path.read_text()


def test_ci_matches_energy_analyzer_check_surface() -> None:
    ci = (WORKFLOW_DIR / "ci.yml").read_text()
    validation_path = WORKFLOW_DIR / "validate.yml"

    assert "Unit tests and lint" in ci
    assert "Browser E2E and accessibility" in ci
    assert "Home Assistant contract tests (${{ matrix.ha-channel }})" in ci
    assert "Home Assistant control entity contract" in ci
    assert "ha-channel: stable" in ci
    assert "ha-channel: dev" in ci
    assert validation_path.exists()

    validation = validation_path.read_text()
    assert "schedule:" in validation
    assert "workflow_dispatch:" in validation
    assert "home-assistant/actions/hassfest@" in validation
    assert HACS_IMAGE in validation
