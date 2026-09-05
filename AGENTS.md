# Project instructions

Applies to CircuitSetup Energy Meter Helper. Keep this file focused on lasting
project conventions; task plans and temporary status belong elsewhere.

## Repository documents

- Do not commit planning, specification, or agent working documents to this repository. Keep them outside the repository or in the already-ignored `.superpowers/` and `docs/superpowers/` paths.

## Working agreement

- Carry authorized work through implementation, relevant verification, and commit.
  Make routine, reversible decisions from context instead of stopping for approval.
- Ask only when missing information materially changes correctness, scope, or an
  irreversible action. Finish independent, authorized preparation first. Existing
  authorization remains valid across turns.
- Follow explicit user instructions over skill guidelines, subject to system and
  developer requirements. If a skill blocks progress, link its exact `SKILL.md`,
  quote the blocking rule, and explain why it applies.
- Keep updates and final answers brief and concrete. Report the result, checks
  actually run, and remaining limitations. Do not claim success without evidence.

## Repository map

- `custom_components/circuitsetup_energy_meter_helper/`: Home Assistant integration,
  ESPHome configuration, provisioning, calibration, persistence, and WebSocket API.
- `frontend/src/`: Lit and TypeScript panel; `frontend/test/`: Vitest and Playwright tests.
- `tests/`: Python tests. `scripts/verify_firmware_contract.py`: upstream firmware contract check.
- `pyproject.toml`, `frontend/package.json`, and `.github/workflows/`: dependency,
  command, and CI sources of truth. Python requires at least 3.14.2; CI uses Node 22.
- `docs/hardware-validation.md` and `.json`: physical validation requirements and evidence.

## Implementation

- Read the affected flow and all callers before changing shared behavior. Fix bugs
  at their source and cover sibling paths, not just the reported symptom.
- Reuse existing code, the standard library, native platform features, and installed
  dependencies before adding anything. Prefer the smallest complete change; avoid
  speculative abstractions, dependencies, or unrelated cleanup.
- Preserve input validation, configuration rollback, accessibility, and hardware
  calibration controls. Automated contract checks do not establish physical accuracy.
- Keep frontend payload types and backend WebSocket behavior consistent when either changes.
- Edit frontend source, then rebuild. `npm run build` replaces the integration's
  `frontend/` directory with the generated bundle and chunks; include those artifacts
  with the source change. Do not hand-edit generated JavaScript.
- Inspect Git status before editing. Preserve existing user changes and stage only
  the intended task files or hunks; do not reset, discard, or commit unrelated work.

## Tools and evidence collection

- On John's Windows environment, read `C:\Users\John\.codex\RTK.md` if available.
  Use `rtk` for supported verbose external commands; use native PowerShell cmdlets
  directly. Elsewhere, use the equivalent native tools.
- Use `rg` or `rtk grep` for text and `rg --files` for file discovery. Use `sg` for
  syntax-aware searches and refactors, for example
  `sg run --lang python --pattern '<pattern>' <paths>`.
- Use `jq` for JSON and `yq` for YAML structure. Use `jq -r` for scalars,
  `jq empty file.json` for validation, and `--arg` for literal values in PowerShell.
- If the repository has `.codegraph/`, use `codegraph_explore` or
  `codegraph explore "<question or symbols>"` before searching or reading code to
  locate or understand it. If absent, skip CodeGraph; do not create an index.
- For read-heavy investigations with three or more known independent operations,
  use the `bounded-batch` skill before gathering evidence. Keep output bounded and
  preserve failures and truncation evidence. Do not batch dependent debugging,
  approval-sensitive actions, or overlapping mutations.
- In PowerShell, keep filesystem operations in one shell and use `-LiteralPath`.
  Verify resolved targets before recursive moves or deletion. Never expose secrets
  through command interpolation, logs, or commits.

## Verification

Select checks based on changed behavior and the current CI workflows. Add a small
regression check for nontrivial logic; use the existing test setup. Documentation
and trivial edits need inspection and a diff check, not new test infrastructure.
After relevant checks pass, expand or repeat them only for a specific unresolved risk.

Commands below are native equivalents; apply the RTK wrapper where supported.

| Scope | Commands | Working directory |
| --- | --- | --- |
| Python setup | `uv sync --all-groups` | Repository root |
| Python lint and types | `uv run ruff check .`; `uv run mypy custom_components/circuitsetup_energy_meter_helper` | Repository root |
| Python tests | `uv run pytest -q` (narrow to affected tests during iteration) | Repository root |
| Python dependencies | `uv pip check` | Repository root |
| Frontend setup | `npm ci` | `frontend/` |
| Frontend checks | `npm run typecheck`; `npm run test`; `npm run build` | `frontend/` |
| Browser behavior and accessibility | `npx playwright install chromium` once if needed; `npm run test:e2e` | `frontend/` |
| Firmware contracts | `python scripts/verify_firmware_contract.py . <firmware-checkout>` using the revision pinned in CI | Repository root |
| Final patch | `git diff --check`; inspect staged diff before committing | Repository root |

For releases, run the workflow's full checks, including dependency audit and bundle
consistency. Record unavailable checks accurately. Do not mark hardware evidence
complete from mocks, browser tests, or firmware contract tests.

## GitHub and releases

- Confirm `gh auth status` before GitHub work. Prefer authenticated `gh` for Actions
  logs, runs, releases, and thread-aware review state. Use the GitHub connector for
  PR creation, structured metadata, comments, and Codex workflows when clearer.
- Commit verified task changes unless the user says otherwise. When asked for a PR,
  push the verified branch and create it without asking again. Do not prefix titles
  with `[codex]`. Use structured bodies or `--body-file` for multiline text.
- For releases, reconcile versions in `pyproject.toml`, the integration manifest,
  `frontend/package.json`, and its lockfile. Check tags, workflow results, hardware
  evidence, and the published release before reporting completion.
- A coding request alone does not authorize publishing a release, flashing a meter,
  or changing a live Home Assistant installation. Follow the deployment instructions
  for the actual target when deployment is requested.

## Delegation

- Work in this task by default. Delegate only when the user or an applicable skill
  explicitly calls for parallel agents and the work can be separated safely.
- Activate `subculture` only for the standalone instruction `SUBCULTURE`. In that
  mode, its user-visible `create_thread` protocol overrides Superpowers internal
  dispatch; retain applicable non-dispatch skills and Ponytail's minimal scope.

## Guidance sources

Reviewed 2026-09-05. The working agreement and verification scope adapt OpenAI's
[GPT-6 Astra guidance](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra).
File scope follows [Codex AGENTS.md guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
Repository commands and workflow preferences above are project conventions.
