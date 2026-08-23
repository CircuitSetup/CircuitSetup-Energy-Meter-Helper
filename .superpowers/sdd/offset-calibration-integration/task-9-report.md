# Task 9 report: offset calibration frontend

## Result

- Added Offset as the sixth top-level wizard step, between Safety and Voltage,
  and derived the mobile progress total from the shared 11-step definition.
- Added the two-stage offset workflow with accessible stage navigation, board
  tabs, physical preparation acknowledgements, measured-readiness evidence,
  backend thresholds, per-chip progress, signed saved-table evidence, recovery,
  reconnect, retry confirmation, skip, Back, and Continue controls.
- Capability-unavailable and capability-invalid sessions are skip-only; invalid
  capability responses show the backend repair reason. Stage 2 stays disabled
  until Stage 1 is complete on every board, while the backend remains the
  authority for mutation ordering.
- Included the required de-energization, transformer/input, CT open-circuit,
  USB-only, voltage-reference, physical-limit, and measured-readiness safety
  language directly beside the controls that depend on it.
- Added strict decoders for offset session state, readiness windows and
  thresholds, calibration partitions and signed tables, offset restart
  evidence, and the four new command responses. Malformed or cross-inconsistent
  payloads fail closed before rendering.
- Routed Current to restart only when the session has pending changes. Otherwise
  the UI calls `complete_calibration_without_changes` and presents a distinct
  no-change Summary/Technical Details record.
- Preserved existing gain-only voltage/current/restart behavior and reused the
  existing tabs, tables, panels, action footer, and styling primitives. No
  dependency or standalone evidence component was added.

## TDD evidence

RED:

- Eight focused failures established the missing step count/navigation, Offset
  UI and safety flow, no-change completion, API commands, strict session
  decoding, and offset-only restart acceptance.
- Follow-up focused failures established explicit no-change identity,
  `aria-current` stage semantics, restored partial recovery, partial skip
  completion, and top-level readiness-reason coherence.

GREEN:

- Focused API suite: `20 passed`.
- Full frontend suite: `62 passed` across API, accessibility, and panel tests.
- Browser-rendered Playwright suite: `6 passed`.
- TypeScript typecheck: passed.
- Production Vite build: passed (`26 modules transformed`, 138.73 kB / 34.70
  kB gzip). The generated integration bundle was restored to `HEAD` afterward
  and is not part of this task's changes.
- No source lint script is configured in `frontend/package.json`.
- `git diff --check`: clean.

## Fix round 1

- Restored the public offset result identity to the engine's actual group-key
  contract: `main_1`/`main_2` for the main board and `addonN_1`/`addonN_2` for
  add-ons. API and panel fixtures now mirror the engine DTO rather than restart
  record instance IDs.
- Bound readiness evidence to the requested board's exact six voltage roles and
  six CT current roles. The decoder recomputes the backend Stage 1/Stage 2
  threshold decisions, exact entity reasons, aggregate reasons, and ready state,
  including the backend's collection-generation failure suffix.
- Required no-change completion to return the requested session in terminal
  `verified` state with no pending calibration. Added an in-flight guard and
  disabled progress state so repeated activation sends one command.
- Updated the native WebSocket Playwright mock to the strict session and offset
  command contracts. Every prior flow now visibly traverses Safety, the Offset
  warning and measurement gate, explicit skip, Voltage, and the unchanged gain
  path.
- RED evidence covered the real main-board DTO, foreign readiness roles, Stage 1
  voltage at 120 V, malformed no-change responses, duplicate completion clicks,
  and the backend collection-generation suffix. All focused failures passed
  after the smallest decoder/panel/mock changes.

## Fix round 2

- Matched the readiness backend's disconnected branch: all twelve exact-board
  entities may carry the same null-window connection-generation reason while
  the top-level response contains that reason once without role prefixes.
- Normal null-window collection failures now accept only the backend grammar
  `fresh window unavailable: <nonempty detail>`. Arbitrary reasons, empty
  details, mixed disconnected evidence, and contradictory aggregates fail
  closed; numeric threshold and window-generation validation is unchanged.
- RED reproduced rejection of the valid disconnected DTO and acceptance of
  invented null-window reasons. GREEN covers the disconnected result, a valid
  timed-out gather result, and both malformed reason forms.

## Files

- `frontend/src/api.ts`
- `frontend/src/components/offset-step.ts`
- `frontend/src/components/restart-step.ts`
- `frontend/src/components/summary-step.ts`
- `frontend/src/components/technical-details.ts`
- `frontend/src/panel.ts`
- `frontend/src/styles.ts`
- `frontend/src/types.ts`
- `frontend/test/api.test.ts`
- `frontend/test/e2e/panel.spec.ts`
- `frontend/test/panel.test.ts`

## Concerns

- Live Home Assistant/hardware validation remains with the controller as
  assigned. Task 9 now also includes browser-rendered mocked-WebSocket coverage;
  it does not claim physical readiness or calibration accuracy.
