# Task 7 report: offset WebSocket operations and session status

## Result

- Added admin-only `check_offset_readiness`, `calibrate_offset`, and
  `skip_offset_calibration` WebSocket mutations with bounded board/stage schemas.
- Reused the existing session claim, ownership, TTL, capability, readiness,
  generation, calibration-engine, pending-origin, and safe serialization paths.
- One `calibrate_offset` request delegates to exactly one board/stage engine
  operation. The workflow never references or dispatches either clear control.
- Session status now exposes the safe offset capability status/repair reason,
  overall disposition (`not_started`, `in_progress`, `completed`, `skipped`, or
  `partial`), per-board/stage state, and authoritative
  `has_pending_calibration` for gain-only, offset-only, or mixed pending state.
- Skip before mutation performs one terminal skip transition without an API or
  engine call. Skip after a retained partial/completed offset result preserves
  the pending values, reports `partial`, and keeps restart verification required.
- Missing optional offset capability remains compatible with gain-only runtime
  bindings: status reports `unavailable`, readiness/calibration are refused, and
  skip remains available.
- Per the ledger ruling, Task 8's `complete_calibration_without_changes`
  behavior/API was not implemented or reserved because Task 7 sequencing does
  not require it. No frontend files were changed.

## TDD evidence

RED:

- Workflow contract: 8 expected failures for absent offset status fields,
  readiness/calibration/skip methods, and per-session offset result state.
- WebSocket contract: 2 expected failures because the new commands and schemas
  were not registered.
- Completion disposition: the focused test observed `in_progress` until the
  all-board/all-stage completion branch was added.
- Gain-only compatibility: the focused test exposed an `AttributeError` for a
  binding without `offset_capability`; adjacent cleanup tests exposed the status
  adapter's incompatible argument.

GREEN:

- Focused workflow/WebSocket suite: `86 passed`.
- Adjacent workflow/WebSocket/readiness/offset-engine/session/restart suite:
  `168 passed`.
- Full Python suite: `535 passed` (five third-party deprecation warnings only).
- Targeted Ruff check: clean.
- Ruff format check for the new Task 7 test file: clean. Existing touched legacy
  files retain their pre-existing formatting to avoid unrelated churn.
- Targeted mypy for `workflow.py` and `websocket_api.py`: clean.
- `git diff --check`: clean.

## Fix round 1: canonical offset targets

- Found that Python numeric equality and Voluptuous coercion allowed boolean or
  float aliases for canonical integer targets. After a partial result for board
  `0`, stage `1`, values such as `False`/`True` or `0`/`1.0` could produce a
  different engine operation key and bypass retry confirmation.
- RED: WebSocket schema regressions accepted boolean/float board and stage
  values; a direct workflow regression reached the engine a second time with a
  noncanonical alias after the canonical target returned `partial`.
- GREEN: both WebSocket operations now require exact, non-boolean integers, and
  the workflow repeats that exact-type check before engine keying for direct
  callers. No operation or disposition behavior was otherwise expanded.
- Focused workflow/WebSocket suite: `87 passed`.
- Adjacent workflow/WebSocket/readiness/offset-engine/session/restart suite:
  `169 passed`.
- Full Python suite: `536 passed` (five third-party deprecation warnings only).
- Targeted Ruff, Ruff format, mypy, and `git diff --check`: clean.

## Files

- `custom_components/circuitsetup_energy_meter_helper/workflow.py`
- `custom_components/circuitsetup_energy_meter_helper/websocket_api.py`
- `tests/test_workflow.py`
- `tests/test_websocket_api.py`

## Concerns

- No hardware was attached; this verifies backend ownership, correlation,
  delegation, state, and serialization behavior in software only.
- Home Assistant/backoff dependencies emit five deprecation warnings under
  Python 3.14; no Task 7 failure is involved.
- Task 8 must add and test the actual no-change completion path before the
  unchanged-session frontend route can be enabled.
