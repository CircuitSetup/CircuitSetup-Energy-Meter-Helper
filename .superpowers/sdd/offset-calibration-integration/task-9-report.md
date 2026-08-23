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

- Focused API suite: `15 passed`.
- Full frontend suite: `56 passed` across API, accessibility, and panel tests.
- TypeScript typecheck: passed.
- Production Vite build: passed (`26 modules transformed`, 136.60 kB / 34.04
  kB gzip). The generated integration bundle was restored to `HEAD` afterward
  and is not part of this task's changes.
- No source lint script is configured in `frontend/package.json`.
- `git diff --check`: clean.

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
- `frontend/test/panel.test.ts`

## Concerns

- Browser-rendered QA and live Home Assistant/hardware validation remain with
  the controller as assigned. Task 9 verification used the DOM-focused Vitest
  coverage, typecheck, and production compilation only.
