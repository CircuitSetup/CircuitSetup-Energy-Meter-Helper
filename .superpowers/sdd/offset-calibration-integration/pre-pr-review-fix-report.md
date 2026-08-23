# Pre-PR final-review fix report

## Result

Implemented the seven final-review findings as one minimal cross-repository fix wave.

- Helper base: `21fe93227246a1bcaa0d222c7ddc448e04e630b3`
- Helper implementation commit: `77618d84e08876581f85c8d30c65fc0285153863`
- ESPHome base: `e100484b0b0f86b2b05a650812efe97d0d2c68a9`
- ESPHome implementation commit: `5e866cf28164b9f7ea550a09d1d8a0485509298d`
- No push was performed.

## RED/GREEN record

### 1. Literal physical-preparation acknowledgement

RED tests were added at the direct workflow boundary, WebSocket schema boundary, API payload, and panel retry/stage behavior.

```text
.venv\Scripts\pytest.exe -q tests/test_workflow.py tests/test_websocket_api.py -k "preparation or offset_websocket_schemas"
6 failed: workflow did not accept/check the new argument and the schema rejected the then-extra field.

npm test -- --run test/api.test.ts test/panel.test.ts
2 failed: calibrate_offset payload omitted preparation_acknowledged and the panel retained acknowledgement after a run.
```

GREEN implementation:

- `calibrate_offset` requires `preparation_acknowledged` and validates it with identity (`is True`), rejecting missing, false, integers, strings, and other truthy values.
- The direct workflow boundary performs the same literal check before claiming or mutating the session.
- The API type accepts only literal `true`; the panel calls it only while the current stage's preparation checkbox is literally true.
- Every result clears that stage's acknowledgement and exact readiness entry, so a retry must re-acknowledge and re-check; the other stage retains its independent state.

```text
.venv\Scripts\pytest.exe -q tests/test_workflow.py tests/test_websocket_api.py -k "preparation or offset_websocket_schemas"
6 passed

npm test -- --run test/api.test.ts test/panel.test.ts
59 passed
```

### 2. No-change completion after uncertain mutation

RED added the reviewer reproduction: `partial`, `indeterminate` (including an empty parsed origin), `applied_pending_restart_verification`, and `result_outside_tolerance` were each offered to no-change completion without exact pending tables.

```text
.venv\Scripts\pytest.exe -q tests/test_workflow.py -k "complete_without_changes_rejects_mutation_or_recovery_state"
4 failed: each uncertain/mutating state was incorrectly finalized as verified.
```

GREEN uses the existing pending-origin invariant plus the smallest conservative state allowlist. Only genuinely untouched `ready`, `stable`, or `unstable` sessions may take the no-change path; verified remains idempotent. Partial, indeterminate, recovery, interruption, result-outside-tolerance, and any pending origin are rejected.

```text
.venv\Scripts\pytest.exe -q tests/test_workflow.py -k "complete_without_changes"
9 passed
```

### 3. Atomic final persistence

RED used a copy-on-load storage fake whose single save raises. This models Home Assistant storage accurately enough to prove the durable preexisting interruption marker remains and no verified record appears.

```text
.venv\Scripts\pytest.exe -q tests/test_store.py -k "final_verified_save_failure"
1 failed: HelperStore had no atomic finalization operation.
```

GREEN adds `HelperStore.async_finalize_verified_calibration()`: one update lock, one load, both document mutations, and one `async_save`. Restart verification now awaits that operation and consumes the in-memory calibration origin only after it succeeds. The restart failure regression also proves the origin claim is released for retry and the legacy standalone marker-clear callback is not invoked.

```text
.venv\Scripts\pytest.exe -q tests/test_store.py tests/test_restart_verification.py -k "final_verified_save_failure or final_save_failure or verified_persistence"
3 passed
```

### 4. Restore evidence correlation

RED added an exact contradictory untagged terminal plus duplicate, malformed, and wrong instance-tag cases.

```text
.venv\Scripts\pytest.exe -q tests/test_log_parser.py -k "restore_evidence_rejects"
4 failed: untagged/malformed evidence was ignored and duplicate/wrong tags did not fail with the strict correlation error.
```

GREEN pre-scans only restore evidence-bearing lines in the correlated window. Every such line must contain exactly one syntactically valid calibration instance tag and it must be expected. Unrelated logging remains ignored, and valid interleaving remains supported.

```text
.venv\Scripts\pytest.exe -q tests/test_log_parser.py -k "restore_evidence_rejects or restore_allows_valid_interleaving or missing_restore"
7 passed
```

### 5 and 7. ATM90E32 rollback readback and native seam quality

RED added two native rollback tests before production code: one requires restore-before-verify sequencing and successful exact signed readback; the other injects a real signed-register mismatch and requires the rollback result to remain failed.

```text
python script/cpp_unit_test.py atm90e32
Skipping unit tests on Windows
exit 1
```

The Windows harness cannot supply a behavioral RED/GREEN result. WSL and a local `g++` were also unavailable, so the same tests must compile/run in Linux CI. This limitation was explicitly allowed by the brief and was not bypassed with a non-production test double.

GREEN production behavior for both normal offsets and power offsets:

- Rewrite all prior runtime/register values through the existing write functions.
- Invoke the existing real register verifiers immediately after the rewrite.
- Preserve preference rollback where a persistence attempt occurred.
- Log “previous values restored” only after readback verification succeeds.
- Emit a distinct rollback-readback-failure terminal and return failed on mismatch/read failure.
- Never dispatch a clear-offset or clear-power-offset control.

The helper parser was also taught to recognize both new terminals as exact evidence and fail closed.

```text
.venv\Scripts\pytest.exe -q tests/test_log_parser.py -k "rollback_readback_failure"
2 failed before parser support: terminal reported missing.
4 passed after support (normal and power paths plus existing failure coverage).

python script/cpp_unit_test.py atm90e32
Skipping unit tests on Windows
exit 1
```

### 6. Duplicate YAML keys in firmware contract

RED added fixtures with a second `name` and with a second `disabled_by_default: false` in an otherwise valid control block.

```text
.venv\Scripts\pytest.exe -q tests/test_firmware_contract.py -k "calibration_button_contract"
2 failed, 4 passed: both duplicate-key fixtures incorrectly passed.
```

GREEN requires exactly one `name:` field, exactly one `disabled_by_default:` field, the expected name, and exactly one literal `disabled_by_default: true` in every control body.

```text
.venv\Scripts\pytest.exe -q tests/test_firmware_contract.py -k "calibration_button_contract"
6 passed
```

## Final verification

Helper backend and static checks:

```text
rtk .\.venv\Scripts\pytest.exe -q
564 passed, 5 dependency deprecation warnings in 15.78s

rtk .\.venv\Scripts\ruff.exe check custom_components scripts tests
All checks passed!

rtk .\.venv\Scripts\mypy.exe custom_components/circuitsetup_energy_meter_helper/calibration_engine.py custom_components/circuitsetup_energy_meter_helper/log_parser.py custom_components/circuitsetup_energy_meter_helper/store.py custom_components/circuitsetup_energy_meter_helper/websocket_api.py custom_components/circuitsetup_energy_meter_helper/workflow.py
Success: no issues found in 5 source files

git diff --check
pass
```

Frontend and bundle:

```text
rtk npm test
3 files passed; 62 tests passed

rtk npm run typecheck
tsc --noEmit: pass

rtk npm run build
26 modules transformed; bundle 139.01 kB / 34.76 kB gzip

SHA-256 frontend/dist/circuitsetup-energy-meter-helper-panel.js
8AEB99D8D1AD68081C662D73F7A7CB7C497EA0AFD46582C6ABD2F88CEE02788F
SHA-256 installed custom-component bundle
8AEB99D8D1AD68081C662D73F7A7CB7C497EA0AFD46582C6ABD2F88CEE02788F
```

ESPHome:

```text
python script/test_build_components.py -c atm90e32 -t esp32-idf --no-grouping -e config
Configuration is valid; 1 passed, 0 failed (expected GPIO5 strapping warning).

clang-format 13 applied to the three changed C++ files.

git diff --check
pass
```

An initial unqualified system-Python pytest attempt could not collect because that interpreter lacked the worktree's Home Assistant dependencies (`aiohasupervisor`/`aiohttp`). It was discarded as an environment invocation error; all behavioral runs used the checked-in worktree `.venv` and passed as recorded above.

## Self-review

- Literal-true validation occurs at both public trust boundaries and before any session claim or device mutation.
- The panel's acknowledgement remains stage-specific, and retry/stage transitions cannot reuse the completed attempt's readiness evidence.
- No-change completion still supports untouched sessions and preserves verified idempotence while closing every demonstrated uncertain-mutation state.
- Final persistent state is one document save. A failed save leaves the prior durable marker intact and leaves the in-memory origin available for retry.
- Restore correlation checks only evidence-bearing lines, so unrelated logs do not become false positives; all correlated evidence fails closed on missing, duplicate, malformed, or wrong tags.
- Both firmware rollback branches call their real verifier after restoring through existing write paths. Success wording is unreachable on rollback readback failure.
- No clear-offset control is referenced or dispatched by rollback.
- Existing generation, ownership, lease, TTL, admin, connection guard, stage-order, gain/current calibration, and optional-offset compatibility paths remain in place.
- The contract checker change is textual and local; it adds no YAML parser dependency or speculative abstraction.
- Diff and test review found no unrelated source changes. The large generated-bundle diff is the deterministic Vite output and has exact hash parity with `frontend/dist`.

## Limitations and concerns

- Native C++ tests are skipped by ESPHome's Windows harness with exit 1. Linux CI must provide the compile/run result for the two new rollback tests.
- No hardware-in-the-loop meter run was performed; register behavior is covered by the production verifier path, native seam source, parser regressions, and ESPHome configuration validation.
