# Task 6 report: restart verification and storage

## Result

- Generalized the existing pending calibration claim to accept gain-only, offset-only, and mixed category aggregates.
- Restart verification still dispatches Restart exactly once, then requires a new connection generation and fresh entity rebind.
- Restore collection now carries one server-owned operation sequence plus the exact requested categories for each changed instance into `parse_restore` (or the session restore waiter).
- Validation rejects missing or extra instances/categories, fallback or absent register-readback success, SPI failures, and any exact-table mismatch before persistence.
- Persisted records retain gain groups separately from signed voltage/current and active/reactive power-offset groups, so existing gain source handoff remains unchanged.
- Storage minor version is 1.2. The explicit 1.1 migration preserves legacy gain-only payloads unchanged; absent offset fields deserialize as empty tuples and remain absent when gain-only records are reserialized.

## TDD evidence

RED (`.venv\\Scripts\\python.exe -m pytest` focused selectors):

- Offset-only restart failed at the gain-only `claim_calibration_origin` guard.
- Mixed evidence failed because restart validation treated an offset-only instance as unexpected.
- Storage migration asserted `STORAGE_MINOR_VERSION == 2` but observed `1`; signed offset group imports/record fields were absent.

GREEN:

- Focused new restart cases: `6 passed`.
- Focused new storage cases: `3 passed`.
- Adjacent restart/store/session/parser/calibration suite: `146 passed`.
- Full Python suite: `520 passed` (five third-party deprecation warnings only).
- Targeted Ruff check and format check: clean.
- Targeted mypy for `calibration_engine.py`, `session_manager.py`, and `store.py`: clean.
- `git diff --check`: clean.

## Files

- `custom_components/circuitsetup_energy_meter_helper/session_manager.py`
- `custom_components/circuitsetup_energy_meter_helper/calibration_engine.py`
- `custom_components/circuitsetup_energy_meter_helper/store.py`
- `tests/test_restart_verification.py`
- `tests/test_store.py`

## Concerns

- No hardware was attached; this verifies server correlation, signed-table comparison, persistence gating, and compatibility in software only.
- Existing Home Assistant/backoff dependencies emit five deprecation warnings under Python 3.14; no Task 6 failure is involved.

## Fix round 1

- Important finding: finalization cleared the interrupted marker after verified persistence and pending-origin consumption. A marker-store failure therefore reported an error after committing both finalization effects.
- RED: an injected marker-clear `OSError` observed one verified write and no pending origin.
- GREEN: marker cleanup now runs first inside the existing connection-generation guard. Failure produces no verified write or origin consumption; the exact claim is released, the pending aggregate remains retryable, and Restart was dispatched once.
- Focused regression: `3 passed`; adjacent restart/storage/parser/calibration suite: `147 passed`; full Python suite: `521 passed`.
- Targeted Ruff check/format, mypy, and `git diff --check`: clean.
