# Task 8 report: all-skipped backend completion

## Result

- Added `complete_calibration_without_changes` as an admin-only WebSocket
  mutation with the existing owned session-handle schema, router sanitization,
  and workflow delegation.
- Unchanged sessions transition directly to the existing terminal `verified`
  state and publish that status exactly once. Repeated completion returns the
  same terminal status without publishing again.
- The workflow consults the authoritative `SessionManager` before every
  completion attempt. Any retained gain, voltage/current offset, active/reactive
  power-offset, partial, or mixed values refuse completion and remain available
  for the normal restart-verification path.
- Completion reuses the existing safety, session ownership, TTL, active-task,
  revision, and stale-claim guards. The shared claim path now refuses every
  calibration mutation after a session reaches `verified`.
- The no-change path never calls the native restart operation, restart
  verification, interrupted-session persistence, or verified-calibration
  persistence, and creates no `VerifiedCalibrationRecord`.
- Per the Task 8/Task 9 ownership ruling, no frontend file was changed.

## TDD evidence

RED:

- Eight focused failures confirmed the missing workflow method and missing
  WebSocket registration/delegation.
- One additional focused failure confirmed that an idempotent terminal retry
  still must refuse if authoritative pending values are present.

GREEN:

- Focused completion, route, and admin-boundary suite: `28 passed`.
- Adjacent workflow/WebSocket/readiness/offset-engine/session/restart suite:
  `177 passed`.
- Full Python suite: `544 passed` (five third-party deprecation warnings only).
- Targeted Ruff lint: clean.
- Ruff format check for `tests/test_workflow.py`: clean. The three touched
  legacy files remain globally unformatted from the prior task and were not
  reformatted to avoid unrelated churn.
- Targeted mypy for `workflow.py` and `websocket_api.py`: clean.
- `git diff --check`: clean.

## Fix round 1: terminal acknowledgement escape

- Audited every public session mutation. `async_acknowledge_safety` was the only
  mutation that bypassed `_claim_ready_session` and could reopen `verified`;
  `async_cancel_session` intentionally remains available, and idempotent
  no-change completion intentionally remains readable.
- Added the sibling terminal guard to `async_acknowledge_safety`, so a verified
  session cannot return to `ready` or emit another terminal publication.
- RED: the direct workflow regression showed acknowledgement did not raise, and
  the registered WebSocket regression showed acknowledgement and skip both
  succeeded after terminal completion.
- GREEN: both regressions pass. The expanded focused suite passed `29` tests,
  the adjacent suite passed `178`, and the full Python suite passed `545`.
- Targeted Ruff lint, `test_workflow.py` format, mypy, and `git diff --check`
  remain clean; `test_websocket_api.py` retains its documented pre-existing
  whole-file format debt, while the new hunk matches Ruff's proposed layout.

## Files

- `custom_components/circuitsetup_energy_meter_helper/workflow.py`
- `custom_components/circuitsetup_energy_meter_helper/websocket_api.py`
- `tests/test_workflow.py`
- `tests/test_websocket_api.py`

## Concerns

- Frontend routing is intentionally deferred to Task 9 by the ledger ruling.
- No hardware was attached; Task 8 changes only server-owned workflow state and
  WebSocket behavior.
- `workflow.py`, `websocket_api.py`, and `test_websocket_api.py` retain
  pre-existing Ruff format debt; Task 8 did not expand scope to reformat them.
