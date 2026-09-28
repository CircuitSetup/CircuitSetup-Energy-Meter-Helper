"""Release workflows must be reproducible and least-privileged."""

import re
import subprocess
import sys
from os import environ, pathsep
from pathlib import Path
from shutil import which
from tempfile import TemporaryDirectory

import yaml

ROOT = Path(__file__).parents[1]
WORKFLOW_DIR = ROOT / ".github/workflows"
WORKFLOWS = tuple(WORKFLOW_DIR.glob("*.yml"))
HACS_IMAGE = (
    "docker://ghcr.io/hacs/action@"
    "sha256:41f6310585d9fb72c7a0e183cce0594355715bc24112b62bc4279b83412edccb"
)
_git_bash = Path(which("git") or "").parents[1] / "bin/bash.exe"
BASH = str(_git_bash if _git_bash.is_file() else which("bash"))


def _workflow_run_block(name: str) -> str:
    """Return a named bash block exactly as GitHub Actions will run it."""
    for job in yaml.safe_load((WORKFLOW_DIR / "release.yml").read_text())["jobs"].values():
        for step in job.get("steps", []):
            if step.get("name") == name:
                return step["run"]
    raise AssertionError(f"release workflow step not found: {name}")


def _workflow_run_command(name: str) -> str:
    return _workflow_run_block(name)


def _ci_filter_run_block() -> str:
    for step in yaml.safe_load((WORKFLOW_DIR / "ci.yml").read_text())["jobs"]["changes"]["steps"]:
        if step.get("id") == "filter":
            return step["run"]
    raise AssertionError("CI firmware filter step not found")


def _run(
    command: list[str], cwd: Path, **kwargs: object
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=cwd, text=True, capture_output=True, check=True, **kwargs)


def _path_with_stub(stub_dir: Path) -> str:
    separator = ":" if BASH.endswith("bash.exe") else pathsep
    return f"{stub_dir.as_posix()}{separator}{environ['PATH']}"


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


def test_firmware_filter_matches_firmware_inputs_without_frontend_artifacts() -> None:
    workflow = (WORKFLOW_DIR / "ci.yml").read_text()
    pattern = re.search(r"'([\^].*\$)'; then", workflow)
    assert pattern is not None
    matches = re.compile(pattern[1], re.MULTILINE)
    component = "custom_components/circuitsetup_energy_meter_helper/"
    for path in (
        component + "config_mutator.py",
        component + "package_contract.py",
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
        "README.md",
    )
    assert not matches.search("\n".join(unrelated))
    assert matches.search("\n".join((*unrelated, component + "config_blocks.py")))
    # A renamed generator must still be detected through its deleted old path.
    assert "git diff --no-renames --name-only" in workflow
    assert "if: needs.changes.outputs.firmware == 'true'" in workflow


def test_firmware_filter_runs_for_every_contract_input() -> None:
    """Changes to contract data, pins, and the workflow itself trigger firmware CI."""
    component = "custom_components/circuitsetup_energy_meter_helper/"
    with TemporaryDirectory(prefix="csea-ci-") as directory:
        repository = Path(directory)
        _run(["git", "init", "-q"], repository)
        _run(["git", "config", "user.email", "test@example.invalid"], repository)
        _run(["git", "config", "user.name", "Test"], repository)
        (repository / "base").write_text("base", encoding="utf-8")
        _run(["git", "add", "."], repository)
        _run(["git", "commit", "-qm", "base"], repository)
        for path in (
            component + "data/ct_presets.json",
            component + "data/voltage_transformers.json",
            component + "ct_inventory.py",
            component + "device_builder.py",
            ".github/workflows/ci.yml",
            ".github/workflows/release.yml",
            "pyproject.toml",
            "tests/test_firmware_contract.py",
        ):
            base = _run(["git", "rev-parse", "HEAD"], repository).stdout.strip()
            changed = repository / path
            changed.parent.mkdir(parents=True, exist_ok=True)
            changed.write_text("changed", encoding="utf-8")
            _run(["git", "add", "."], repository)
            _run(["git", "commit", "-qm", "change"], repository)
            head = _run(["git", "rev-parse", "HEAD"], repository).stdout.strip()
            output = repository / "github-output"

            result = subprocess.run(
            [BASH, "-c", _ci_filter_run_block()],
                cwd=repository,
                text=True,
                capture_output=True,
                env={
                    **environ,
                    "EVENT_NAME": "push",
                    "PUSH_BEFORE_SHA": base,
                    "PUSH_SHA": head,
                    "GITHUB_OUTPUT": str(output),
                },
                check=False,
            )

            assert result.returncode == 0, result.stderr
            assert output.read_text(encoding="utf-8") == "firmware=true\n", path
            output.unlink()


def test_ci_firmware_filter_uses_the_full_pr_range_and_push_predecessor() -> None:
    workflow = (WORKFLOW_DIR / "ci.yml").read_text()

    assert "PR_ACTION:" not in workflow
    assert "PR_BEFORE_SHA:" not in workflow
    assert (
        'if [[ "$EVENT_NAME" == "pull_request" ]]; then\n'
        '            base="$PR_BASE_SHA"\n'
        '            head="$PR_HEAD_SHA"\n'
        '          else\n'
        '            base="$PUSH_BEFORE_SHA"\n'
        '            head="$PUSH_SHA"\n'
        '          fi'
    ) in workflow
    assert 'git diff --no-renames --name-only "$base" "$head"' in workflow
    assert 'git show --format= --name-only "$head"' in workflow


def test_release_runs_firmware_tests_without_compiling_every_meter() -> None:
    workflow = (WORKFLOW_DIR / "release.yml").read_text()

    assert "firmware/Software/ESPHome/tests" in workflow
    assert "firmware/Software/ESPHome/tests/compile_matrix.py" not in workflow
    assert "esphome\", \"compile" not in workflow
    assert "Require recorded physical validation" not in workflow


def test_release_bundle_gate_rejects_stale_committed_artifacts(tmp_path: Path) -> None:
    """The release's post-build Git gate rejects changed installed bundle files."""
    component = tmp_path / "custom_components/circuitsetup_energy_meter_helper/frontend"
    component.mkdir(parents=True)
    bundle = component / "panel.js"
    bundle.write_text("committed", encoding="utf-8")
    _run(["git", "init", "-q"], tmp_path)
    _run(["git", "config", "user.email", "test@example.invalid"], tmp_path)
    _run(["git", "config", "user.name", "Test"], tmp_path)
    _run(["git", "add", "."], tmp_path)
    _run(["git", "commit", "-qm", "initial"], tmp_path)
    result = subprocess.run(
        [BASH, "-c", _workflow_run_command("Require committed frontend artifacts to match the build")],
        cwd=tmp_path,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    bundle.write_text("rebuilt", encoding="utf-8")
    result = subprocess.run(
        [BASH, "-c", _workflow_run_command("Require committed frontend artifacts to match the build")],
        cwd=tmp_path,
        text=True,
        capture_output=True,
        check=False,
    )
    assert result.returncode == 1


def test_release_binds_notes_and_new_tag_to_validated_sha(tmp_path: Path) -> None:
    """A new release names the workflow commit even when default HEAD differs."""
    (tmp_path / "custom_components/circuitsetup_energy_meter_helper").mkdir(parents=True)
    (tmp_path / "custom_components/circuitsetup_energy_meter_helper/manifest.json").write_text(
        '{"version": "1.2.3"}', encoding="utf-8"
    )
    _run(["git", "init", "-q"], tmp_path)
    _run(["git", "config", "user.email", "test@example.invalid"], tmp_path)
    _run(["git", "config", "user.name", "Test"], tmp_path)
    _run(["git", "add", "."], tmp_path)
    _run(["git", "commit", "-qm", "validated"], tmp_path)
    validated = _run(["git", "rev-parse", "HEAD"], tmp_path).stdout.strip()
    (tmp_path / "default-head").write_text("later", encoding="utf-8")
    _run(["git", "add", "."], tmp_path)
    _run(["git", "commit", "-qm", "default advanced"], tmp_path)
    stub_dir = tmp_path / "bin"
    stub_dir.mkdir()
    calls = tmp_path / "gh-calls"
    (stub_dir / "gh").write_text(
        "#!/usr/bin/env bash\n"
        "printf '%s\\n' \"$*\" >> \"$GH_CALLS\"\n"
        "if [[ \"$1\" == api ]]; then echo notes; fi\n",
        encoding="utf-8",
    )
    (stub_dir / "gh").chmod(0o755)
    script = _workflow_run_block("Create GitHub release").replace(
        "${{ github.repository }}", "$GITHUB_REPOSITORY"
    )
    environment = {
        "GH_TOKEN": "test",
        "GITHUB_REPOSITORY": "owner/repo",
        "VALIDATED_SHA": validated,
        "GH_CALLS": str(calls),
        "PATH": _path_with_stub(stub_dir),
    }

    result = subprocess.run(
        [BASH, "-c", script],
        cwd=tmp_path,
        text=True,
        capture_output=True,
        env=environment,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    recorded = calls.read_text(encoding="utf-8")
    assert f"target_commitish={validated}" in recorded
    assert f"release create v1.2.3 --target {validated}" in recorded


def test_release_rejects_existing_tag_for_another_commit(tmp_path: Path) -> None:
    """Annotated tags are resolved before publication and cannot name another commit."""
    (tmp_path / "custom_components/circuitsetup_energy_meter_helper").mkdir(parents=True)
    (tmp_path / "custom_components/circuitsetup_energy_meter_helper/manifest.json").write_text(
        '{"version": "1.2.3"}', encoding="utf-8"
    )
    _run(["git", "init", "-q"], tmp_path)
    _run(["git", "config", "user.email", "test@example.invalid"], tmp_path)
    _run(["git", "config", "user.name", "Test"], tmp_path)
    _run(["git", "add", "."], tmp_path)
    _run(["git", "commit", "-qm", "validated"], tmp_path)
    validated = _run(["git", "rev-parse", "HEAD"], tmp_path).stdout.strip()
    (tmp_path / "other").write_text("other", encoding="utf-8")
    _run(["git", "add", "."], tmp_path)
    _run(["git", "commit", "-qm", "other"], tmp_path)
    _run(["git", "tag", "-am", "existing", "v1.2.3"], tmp_path)
    stub_dir = tmp_path / "bin"
    stub_dir.mkdir()
    (stub_dir / "gh").write_text(
        "#!/usr/bin/env bash\nif [[ \"$1\" == api ]]; then echo 'notes'; fi\n",
        encoding="utf-8",
    )
    (stub_dir / "gh").chmod(0o755)
    script = _workflow_run_block("Create GitHub release")
    result = subprocess.run(
        [BASH, "-c", script],
        cwd=tmp_path,
        text=True,
        capture_output=True,
        env={
            "GH_TOKEN": "test",
            "GITHUB_REPOSITORY": "owner/repo",
            "VALIDATED_SHA": validated,
            "PATH": _path_with_stub(stub_dir),
        },
        check=False,
    )

    assert result.returncode != 0
    assert "not validated commit" in result.stderr


def test_release_allows_annotated_tag_for_validated_commit(tmp_path: Path) -> None:
    """An existing annotated tag is accepted when it resolves to the workflow SHA."""
    component = tmp_path / "custom_components/circuitsetup_energy_meter_helper"
    component.mkdir(parents=True)
    (component / "manifest.json").write_text('{"version": "1.2.3"}', encoding="utf-8")
    _run(["git", "init", "-q"], tmp_path)
    _run(["git", "config", "user.email", "test@example.invalid"], tmp_path)
    _run(["git", "config", "user.name", "Test"], tmp_path)
    _run(["git", "add", "."], tmp_path)
    _run(["git", "commit", "-qm", "validated"], tmp_path)
    validated = _run(["git", "rev-parse", "HEAD"], tmp_path).stdout.strip()
    _run(["git", "tag", "-am", "existing", "v1.2.3", validated], tmp_path)
    stub_dir = tmp_path / "bin"
    stub_dir.mkdir()
    (stub_dir / "gh").write_text(
        "#!/usr/bin/env bash\nif [[ \"$1\" == api ]]; then echo notes; fi\n",
        encoding="utf-8",
    )
    (stub_dir / "gh").chmod(0o755)

    result = subprocess.run(
        [
            BASH,
            "-c",
            _workflow_run_block("Create GitHub release").replace(
                "${{ github.repository }}", "$GITHUB_REPOSITORY"
            ),
        ],
        cwd=tmp_path,
        text=True,
        capture_output=True,
        env={
            "GH_TOKEN": "test",
            "GITHUB_REPOSITORY": "owner/repo",
            "VALIDATED_SHA": validated,
            "PATH": _path_with_stub(stub_dir),
        },
        check=False,
    )

    assert result.returncode == 0, result.stderr


def test_release_rejects_tag_that_does_not_resolve_to_a_commit(tmp_path: Path) -> None:
    """A malformed existing tag cannot be mistaken for an absent tag."""
    component = tmp_path / "custom_components/circuitsetup_energy_meter_helper"
    component.mkdir(parents=True)
    (component / "manifest.json").write_text('{"version": "1.2.3"}', encoding="utf-8")
    _run(["git", "init", "-q"], tmp_path)
    _run(["git", "config", "user.email", "test@example.invalid"], tmp_path)
    _run(["git", "config", "user.name", "Test"], tmp_path)
    _run(["git", "add", "."], tmp_path)
    _run(["git", "commit", "-qm", "validated"], tmp_path)
    validated = _run(["git", "rev-parse", "HEAD"], tmp_path).stdout.strip()
    blob = _run(["git", "hash-object", "-w", "--stdin"], tmp_path, input="blob").stdout.strip()
    _run(["git", "update-ref", "refs/tags/v1.2.3", blob], tmp_path)

    result = subprocess.run(
        [
            BASH,
            "-c",
            _workflow_run_block("Create GitHub release").replace(
                "${{ github.repository }}", "$GITHUB_REPOSITORY"
            ),
        ],
        cwd=tmp_path,
        text=True,
        capture_output=True,
        env={
            "GH_TOKEN": "test",
            "GITHUB_REPOSITORY": "owner/repo",
            "VALIDATED_SHA": validated,
            "PATH": environ["PATH"],
        },
        check=False,
    )

    assert result.returncode != 0
    assert "does not resolve to a commit" in result.stderr


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
