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
