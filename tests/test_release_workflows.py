"""Release workflows must be reproducible and least-privileged."""

import re
from pathlib import Path

ROOT = Path(__file__).parents[1]
WORKFLOWS = (ROOT / ".github/workflows/ci.yml", ROOT / ".github/workflows/release.yml")
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
    assert workflow.index("Require recorded physical validation") < workflow.index(
        "Create GitHub release"
    )


def test_ci_and_release_run_firmware_tests_and_generated_compile_matrix() -> None:
    for path in WORKFLOWS:
        workflow = path.read_text()
        assert "firmware/Software/ESPHome/tests" in workflow
        assert "firmware/Software/ESPHome/tests/compile_matrix.py" in workflow
        assert "esphome==2026.8.0" in workflow
        assert "esphome\", \"compile" in workflow


def test_hacs_validation_uses_the_event_ref() -> None:
    """HACS must validate the pushed branch or PR, not the default branch."""
    for path in WORKFLOWS:
        assert "INPUT_REPOSITORY" not in path.read_text()
