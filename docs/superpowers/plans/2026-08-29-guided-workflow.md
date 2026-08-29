# Guided Energy-Meter Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Use the checkbox items as the execution checklist. Use `superpowers:test-driven-development` for every behavioral change and `superpowers:verification-before-completion` before claiming any task or the full plan complete.

**Goal:** Replace the fixed, technically ordered ten-step presentation with a conditional, beginner-oriented workflow that preserves the existing safe backend order and correctly handles new meters, helper-managed meters, legacy editable ESPHome configurations, and runtime-only meters.

**Architecture:** Keep the existing source-hash-bound configuration transactions and calibration session engine. Add one small backend provenance field, a pure frontend workflow model, purpose-specific transaction routes, a legacy-review branch, and progressive disclosure inside existing configuration screens. The pure model derives visible phases and resume routes from explicit device/configuration/session state; the UI never uses sidebar position as workflow state.

**Tech Stack:** Python 3.14, Home Assistant custom integration APIs, Voluptuous, Lit 3.3, TypeScript 5.9, Vitest, Playwright, pytest, Ruff, mypy, Vite.

**Spec:** `docs/superpowers/specs/2026-08-29-guided-workflow-design.md`

**Baseline:** Start from the first `main` commit that contains merged PR #45 plus its agreed post-review fixes. Record that exact SHA in the implementation PR. The reviewed PR head `9797abf36c6c48712c51be58a814fcbec1b5f9d8` may be consulted for file locations but must not be used to overwrite later corrections.

## Global constraints

- [ ] Read the controlling spec and the merged PR #45 implementation before editing.
- [ ] Confirm the post-merge baseline tests are green before the first production-code change.
- [ ] Do not reimplement or undo the assumed PR #45 fixes.
- [ ] Preserve the order: configuration install → safety → optional offset → voltage → current → restart verification → optional YAML handoff.
- [ ] Do not change calibration equations, gain calculations, register limits, exact verification, source hashes, rollback, or transaction ownership.
- [ ] Do not add a generic YAML editor, board-revision field, CT inversion switch, new power-quality entities, or automatic load-role inference.
- [ ] Opening or reviewing a legacy configuration must produce zero writes and zero semantic changes.
- [ ] A legacy configuration must remain opt-in to helper management.
- [ ] A runtime-only flow must never claim YAML durability.
- [ ] Keep advanced controls available but collapsed; do not remove expert functionality.
- [ ] Add or update tests before each production implementation step.
- [ ] Commit after each task with the specified focused commit message or an equally narrow equivalent.

## Delivery map

### Create

- `docs/superpowers/specs/2026-08-29-guided-workflow-design.md`
- `docs/superpowers/plans/2026-08-29-guided-workflow.md`
- `frontend/src/workflow-model.ts`
- `frontend/src/components/workflow-progress.ts`
- `frontend/src/components/existing-configuration-step.ts`
- `frontend/src/components/calibration-plan-step.ts`
- `frontend/test/workflow-model.test.ts`
- `frontend/test/existing-configuration-step.test.ts`
- `frontend/test/calibration-plan-step.test.ts`
- `frontend/test/workflow-scenarios.ts`

### Modify

- `custom_components/circuitsetup_energy_meter_helper/meter_inventory.py`
- `custom_components/circuitsetup_energy_meter_helper/workflow.py`
- `custom_components/circuitsetup_energy_meter_helper/websocket_api.py`
- `frontend/src/types.ts`
- `frontend/src/api.ts`
- `frontend/src/panel.ts`
- `frontend/src/components/setup-device-step.ts`
- `frontend/src/components/topology-step.ts`
- `frontend/src/components/meter-settings-step.ts`
- `frontend/src/components/ct-inventory-step.ts`
- `frontend/src/components/build-install-step.ts`
- `frontend/src/components/config-review-step.ts`
- `frontend/src/components/safety-step.ts`
- `frontend/src/components/offset-step.ts`
- `frontend/src/components/voltage-step.ts`
- `frontend/src/components/current-step.ts`
- `frontend/src/components/restart-step.ts`
- `frontend/src/components/summary-step.ts`
- `frontend/src/styles.ts`
- `frontend/test/panel.test.ts`
- `frontend/test/accessibility.test.ts`
- `frontend/test/e2e/panel.spec.ts`
- `tests/test_meter_inventory.py`
- `tests/test_workflow.py`
- `tests/test_websocket_api.py`
- `tests/test_meter_config_mutator.py`
- `README.md`
- Generated files under `custom_components/circuitsetup_energy_meter_helper/frontend/` through `npm run build`

---

## Task 1: Establish the corrected post-PR baseline and scenario fixtures

**Files**

- Create: `frontend/test/workflow-scenarios.ts`
- Modify: `frontend/test/panel.test.ts`
- Test only; do not change production behavior in this task.

- [ ] Check out the first `main` commit containing merged PR #45 and its corrective commits.
- [ ] Record the SHA in the new implementation PR description and in the local execution notes.
- [ ] Run the focused existing suites:

```bash
pytest -q tests/test_meter_inventory.py tests/test_workflow.py tests/test_websocket_api.py
cd frontend
npm test -- panel.test.ts accessibility.test.ts
npm run typecheck
```

Expected: all pass before workflow edits.

- [ ] Extract reusable typed frontend fixtures from the oversized panel test into `frontend/test/workflow-scenarios.ts`. Include these exact scenarios:

```ts
export const newInstallScenario
export const helperManagedScenario
export const legacyEditableScenario
export const importableExistingScenario
export const runtimeOnlyScenario
export const activeConfigurationTransactionScenario
export const activeCalibrationHandoffScenario
```

- [ ] Make every scenario contain internally consistent:
  - `SetupSnapshot`
  - `DiscoveredDevice`
  - `MeterTopology`
  - optional `MeterConfiguration`
  - optional `SessionStatus`
  - optional `TransactionStatus`
  - optional `RestartVerificationResult`

- [ ] Add baseline regression assertions for the assumed post-PR fixes:
  - Verified restart without handoff reaches Summary.
  - Summary Back never opens an empty transaction.
  - Continue cannot falsely complete a partial voltage/current calibration.
  - A required unresolved model cannot pass in a new/helper-managed flow.
  - A verified normal install waits for startup evidence.

- [ ] Do not alter their production implementations unless the merged baseline unexpectedly lacks the agreed fixes. If one is absent, stop this workflow branch, repair it in a separate prerequisite commit, rerun baseline, and then continue.

- [ ] Commit:

```bash
git add frontend/test/workflow-scenarios.ts frontend/test/panel.test.ts
git commit -m "test: add workflow scenario fixtures"
```

---

## Task 2: Add explicit configuration semantic provenance

**Files**

- Modify: `custom_components/circuitsetup_energy_meter_helper/meter_inventory.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/workflow.py`
- Modify: `frontend/src/types.ts`
- Modify: `tests/test_meter_inventory.py`
- Modify: `tests/test_workflow.py`
- Modify: `tests/test_websocket_api.py`

### Step 1: Write failing backend tests

- [ ] Add a test proving an inventory with no matching `StoredMeterConfiguration` returns:

```python
capabilities.semantic_source == "legacy_inferred"
```

- [ ] Add a test proving a current-hash-matched, valid stored configuration returns:

```python
capabilities.semantic_source == "helper_managed"
```

- [ ] Add a test proving an invalid stored configuration that safely falls back to `_legacy_request` is `legacy_inferred`, not helper-managed.
- [ ] Add a workflow test proving a stale stored hash no longer aborts setup: the live source is returned through legacy fallback with `stored_semantics_stale` and no stale stored semantics are used.

- [ ] Add a serialization test proving `get_meter_configuration` exposes only the allowed literal and does not expose stored configuration internals.

Run:

```bash
pytest -q tests/test_meter_inventory.py -k "semantic_source or legacy or stored"
pytest -q tests/test_workflow.py -k "stale and meter_configuration"
pytest -q tests/test_websocket_api.py -k "meter_configuration"
```

Expected: new assertions fail because the field does not exist.

### Step 2: Implement the exact contract

- [ ] In `meter_inventory.py`, add:

```python
from typing import Literal

ConfigurationSemanticSource = Literal["helper_managed", "legacy_inferred"]
```

- [ ] Extend `MeterConfigurationCapabilities`:

```python
@dataclass(frozen=True, slots=True)
class MeterConfigurationCapabilities:
    configuration_authoritative: bool
    managed_totals: bool
    multi_reference: bool
    semantic_source: ConfigurationSemanticSource
    reason_codes: tuple[str, ...]
```

- [ ] Do not derive semantic source from `csemh_config_contract`.
- [ ] Set a local `semantic_source = "legacy_inferred"` before attempting `_stored_request`.
- [ ] Change it to `"helper_managed"` only after a hash-matched stored configuration has been converted and passed `validate_meter_configuration`.
- [ ] If stored conversion or validation falls back to `_legacy_request`, leave it `legacy_inferred`.
- [ ] Pass the value into the returned capabilities using `replace(...)` or a constructor that keeps capability calculation centralized.
- [ ] Update every direct constructor/test fixture.
- [ ] In `workflow.py::_async_get_meter_configuration`, remove the hard failure on `stored_read.stale`.
- [ ] Pass `stored_semantics_stale=stored_read.stale` into `MeterConfigurationInventory.from_document`.
- [ ] Continue passing the stored object only as an input to the inventory's existing hash-match check; never treat it as current when its hash differs.

- [ ] In `frontend/src/types.ts`, add:

```ts
export type ConfigurationSemanticSource =
  | "helper_managed"
  | "legacy_inferred";
```

and the required `semantic_source` field on `MeterConfigurationCapabilities`.

- [ ] Rerun focused tests, then:

```bash
pytest -q tests/test_meter_inventory.py tests/test_workflow.py tests/test_websocket_api.py
cd frontend
npm run typecheck
```

- [ ] Commit:

```bash
git add custom_components/circuitsetup_energy_meter_helper/meter_inventory.py \
  custom_components/circuitsetup_energy_meter_helper/workflow.py \
  frontend/src/types.ts tests/test_meter_inventory.py tests/test_workflow.py \
  tests/test_websocket_api.py
git commit -m "feat: expose configuration semantic provenance"
```

---

## Task 3: Implement a pure conditional workflow model

**Files**

- Create: `frontend/src/workflow-model.ts`
- Create: `frontend/test/workflow-model.test.ts`
- Modify: `frontend/src/types.ts`

### Step 1: Define and test the public frontend model

- [ ] Add these exact types in `workflow-model.ts`:

```ts
export type JourneyOrigin = "new_install" | "existing_meter";

export type ConfigurationMode =
  | "helper_managed"
  | "legacy_editable"
  | "runtime_only";

export type ExistingConfigurationChoice =
  | "manage_with_helper"
  | "calibrate_only"
  | null;

export type CalibrationPlan =
  | "keep_existing"
  | "standard"
  | "full"
  | null;

export type TransactionPurpose =
  | "install_configuration"
  | "save_calibration"
  | null;

export type WorkflowRoute =
  | "setup"
  | "legacy-review"
  | "meter"
  | "ct"
  | "install-configuration"
  | "calibration-plan"
  | "safety"
  | "offset"
  | "voltage"
  | "current"
  | "restart"
  | "save-calibration"
  | "summary";

export type WorkflowPhaseId =
  | "device"
  | "legacy-review"
  | "meter"
  | "ct"
  | "install-configuration"
  | "calibration"
  | "save-calibration"
  | "complete";
```

- [ ] Define a `WorkflowContext` containing only explicit, serializable facts needed for derivation. It must include:
  - journey origin
  - configuration mode
  - legacy choice
  - calibration plan
  - canonical configuration changed
  - normal transaction required/active/verified
  - transaction purpose
  - session state
  - offset disposition
  - pending calibration
  - restart verification
  - handoff availability/installation
  - completed-without-calibration flag

- [ ] Export pure functions:

```ts
export function configurationModeFor(...): ConfigurationMode;
export function workflowRoutes(context: WorkflowContext): WorkflowRoute[];
export function workflowPhases(
  context: WorkflowContext,
  activeRoute: WorkflowRoute,
): WorkflowPhase[];
export function calibrationSubsteps(
  context: WorkflowContext,
  activeRoute: WorkflowRoute,
): WorkflowSubstep[];
export function previousWorkflowRoute(
  context: WorkflowContext,
  activeRoute: WorkflowRoute,
): WorkflowRoute | null;
export function resumeWorkflowRoute(
  context: WorkflowContext,
): WorkflowRoute;
```

- [ ] Write table-driven tests for every acceptance-matrix scenario in the spec.
- [ ] Assert that no route sequence contains both transaction purposes under the same route ID.
- [ ] Assert that phase indexes never decrease while routes move forward.
- [ ] Assert runtime-only routes never include `meter`, `ct`, `install-configuration`, or `save-calibration`.
- [ ] Assert legacy `calibrate_only` omits configuration phases.
- [ ] Assert legacy `manage_with_helper` includes review before Meter.
- [ ] Assert a same-session `new_install` with legacy-inferred template semantics skips Legacy Review and proceeds to Meter.
- [ ] Assert the same meter reopened as `existing_meter` without helper-managed semantics includes Legacy Review.
- [ ] Assert a verified handoff transaction resumes at `save-calibration`.
- [ ] Assert a normal active transaction resumes at `install-configuration`.

Run:

```bash
cd frontend
npm test -- workflow-model.test.ts
```

Expected: fail until functions are implemented.

### Step 2: Implement the smallest pure model

- [ ] Do not import Lit, the panel class, WebSocket API, or DOM types.
- [ ] Build the route list from branch conditions rather than mutating a shared list.
- [ ] Map routes to phases in one constant table.
- [ ] Represent completed/current/upcoming status from the active route’s index in the derived route list.
- [ ] Treat Calibration routes as one top-level phase.
- [ ] Use calibration plan to include/exclude Offset.
- [ ] Include Restart only when pending calibration/restart evidence requires it.
- [ ] Include Save Calibration only when handoff is available or an active handoff transaction exists.
- [ ] Add exhaustive `never` checks for route/phase switches.

Run:

```bash
cd frontend
npm test -- workflow-model.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add frontend/src/workflow-model.ts frontend/test/workflow-model.test.ts frontend/src/types.ts
git commit -m "feat: derive conditional setup workflow"
```

---

## Task 4: Replace fixed step numbering with phase-based navigation

**Files**

- Create: `frontend/src/components/workflow-progress.ts`
- Modify: `frontend/src/panel.ts`
- Modify: `frontend/src/types.ts`
- Modify: `frontend/src/styles.ts`
- Modify: `frontend/test/panel.test.ts`
- Modify: `frontend/test/accessibility.test.ts`

### Step 1: Add failing navigation and progress tests

- [ ] Test a new-install route and assert the sidebar/mobile progress shows the conditional phase count, not `N of 10`.
- [ ] Test a normal configuration transaction:
  - active phase is Install Configuration
  - after verified Continue, active phase is Calibration
  - no phase number moves backward.
- [ ] Test a handoff transaction:
  - active phase is Save Calibration
  - it is not labeled Flash & Verify.
- [ ] Test a runtime-only meter:
  - only Device, Calibration, Complete appear.
- [ ] Test keyboard/focus behavior:
  - current phase has `aria-current="step"`
  - route navigation focuses `#step-heading`
  - mobile progress button has correct `aria-expanded`.

Run:

```bash
cd frontend
npm test -- panel.test.ts accessibility.test.ts
```

### Step 2: Split ambiguous routes

- [ ] Replace the `PanelStep` union with `WorkflowRoute`, or alias it temporarily and remove the old fixed `STEPS` array.
- [ ] Replace `step === "build"` with:
  - `step === "install-configuration"`
  - `step === "save-calibration"`
- [ ] Add explicit panel state:

```ts
private journeyOrigin: JourneyOrigin = "existing_meter";
private configurationMode: ConfigurationMode | null = null;
private existingConfigurationChoice: ExistingConfigurationChoice = null;
private calibrationPlan: CalibrationPlan = null;
private transactionPurpose: TransactionPurpose = null;
```

- [ ] Set `transactionPurpose="install_configuration"` before normal configuration previews.
- [ ] Set `transactionPurpose="save_calibration"` before calibrated-gain previews.
- [ ] Reconstruct purpose in `startSession()`/active-work recovery from the verified calibration transaction ID; do not guess from the current UI route.

### Step 3: Centralize route context and Back behavior

- [ ] Add one `workflowContext()` method that converts panel state into the pure model’s `WorkflowContext`.
- [ ] Make `navigate(route)` reject routes not present in `workflowRoutes(context)`, except controlled recovery routes.
- [ ] Replace the long positional `back()` chain with `previousWorkflowRoute(...)`.
- [ ] Retain side-effect-specific handlers:
  - leaving Safety closes/cancels the session as currently required
  - leaving a previewed transaction abandons/reloads through `backFromBuild`
- [ ] Do not use browser history as authority.
- [ ] Do not route Summary to a transaction unless the derived path actually contains one.

### Step 4: Render progress

- [ ] Implement `workflowProgress(phases, mobileOpen, toggle, navigateToSetup)` as a presentational component.
- [ ] Show completed/current/upcoming phase status.
- [ ] Permit only the existing safe “return to Device” action; do not make completed configuration/calibration phases freely clickable.
- [ ] Add calibration subprogress to the main content when the active phase is Calibration.

Run:

```bash
cd frontend
npm test -- workflow-model.test.ts panel.test.ts accessibility.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add frontend/src/components/workflow-progress.ts frontend/src/panel.ts \
  frontend/src/types.ts frontend/src/styles.ts frontend/test/panel.test.ts \
  frontend/test/accessibility.test.ts
git commit -m "refactor: use phase-based workflow navigation"
```

---

## Task 5: Simplify Device setup and classify existing meters clearly

**Files**

- Modify: `frontend/src/components/setup-device-step.ts`
- Modify: `frontend/src/components/topology-step.ts`
- Modify: `frontend/src/panel.ts`
- Modify: `frontend/src/styles.ts`
- Modify: `frontend/test/panel.test.ts`
- Modify: `frontend/test/accessibility.test.ts`

### Step 1: Write failing rendering tests

- [ ] No compatible devices:
  - “Set up a new meter” is the primary heading.
  - No error panel says “No compatible device found.”
- [ ] Existing configured device card:
  - shows “Managed in ESPHome Device Builder”
  - action is “Open setup.”
- [ ] Importable device card:
  - shows “Import available”
  - action is “Import configuration.”
- [ ] No-source device card:
  - shows “Calibration only — no editable source.”
  - action is “Open calibration,” not “Configure.”
- [ ] New-device page does not contain electrical-system or frequency controls.
- [ ] It contains “Add-on address jumper settings.”
- [ ] Topology default view shows the plain-language detected hardware summary; evidence table is under Technical details.

### Step 2: Remove duplicate electrical-profile entry

- [ ] Remove electrical-system/frequency arguments and controls from `setupDeviceStep`.
- [ ] Keep `InstallerIntent.electrical_system` and `line_frequency_hz` optional for compatibility, but pass `null` from the new UI.
- [ ] Remove new-install seeding that silently promotes installer-page electrical values in `setMeterConfiguration`.
- [ ] Reset the Meter-phase confirmation state for new and legacy journeys.

### Step 3: Reorder and relabel Device content

- [ ] When no compatible devices exist, render new setup first.
- [ ] When devices exist, render “Existing meters” first and new setup second.
- [ ] Derive card status only from `configuration` and `importable`.
- [ ] Preserve automatic discovery/import behavior for a newly flashed eligible meter.
- [ ] After import, fetch authoritative meter configuration and classify it; do not assume import made it helper-managed.

### Step 4: Simplify topology

- [ ] Keep `topologyMismatch()` unchanged except for necessary typing.
- [ ] Default summary includes boards, CT count, connection, and agreement.
- [ ] Move evidence rows, group count, source identifiers, and details into `<details>`.
- [ ] Keep mismatch blocking and fully visible.

Run:

```bash
cd frontend
npm test -- panel.test.ts accessibility.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add frontend/src/components/setup-device-step.ts \
  frontend/src/components/topology-step.ts frontend/src/panel.ts \
  frontend/src/styles.ts frontend/test/panel.test.ts \
  frontend/test/accessibility.test.ts
git commit -m "feat: clarify new and existing meter entry paths"
```

---

## Task 6: Add the legacy-configuration review and branch

**Files**

- Create: `frontend/src/components/existing-configuration-step.ts`
- Create: `frontend/test/existing-configuration-step.test.ts`
- Modify: `frontend/src/panel.ts`
- Modify: `frontend/src/styles.ts`
- Modify: `frontend/test/panel.test.ts`
- Modify: `tests/test_meter_inventory.py`
- Modify: `tests/test_meter_config_mutator.py`

### Step 1: Add component tests first

- [ ] Render a legacy-editable fixture and assert the page distinguishes:
  - read directly
  - inferred or not recorded
  - preserved if no migration occurs
- [ ] Assert warning codes are translated into user-facing copy and raw codes remain under Technical details.
- [ ] Assert actions:
  - `Review and manage with helper`
  - `Keep ESPHome configuration and calibrate only`
  - `Back`
- [ ] Assert helper-managed mode never renders this page.
- [ ] Assert selecting either branch has no API write by itself.

### Step 2: Prevent load-time semantic mutation

- [ ] Split the current `showInventory()` responsibilities into:
  - `initializeInventory(inventory)` to populate inventory/drafts without navigating
  - `showInventory()` or an explicit route action that navigates to Circuits & CTs
- [ ] Initialize the read-only inventory before Legacy Review so calibrate-only can use authoritative stored multipliers without visiting or mutating the CT screen.
- [ ] Refactor `setMeterConfiguration()`:
  - Set `configurationMode` from `capabilities`.
  - Store the pristine authoritative configuration separately from the editable draft.
  - Do not call `reconcileSplitPhaseAggregates()` for `legacy_editable` on load.
  - Do not mark `canonicalConfigurationChanged` from legacy fallback normalization.
  - Do not set helper-managed automatic aggregates until the user enters and confirms the manage branch.
- [ ] Add a regression test that loading legacy YAML and navigating Back results in:
  - no preview command
  - no transaction
  - no changed configuration
  - no new aggregates

### Step 3: Implement branch actions

- [ ] `manage_with_helper`:
  - navigate to Meter
  - require electrical-profile confirmation
  - require legacy role/usage review before first preview
  - retain all untouched raw gains
- [ ] `calibrate_only`:
  - skip Meter and CT routes
  - preserve `meterConfiguration` only as read-only context
  - do not pass CT draft changes into current calibration or gain handoff
  - navigate to Calibration Plan
- [ ] Preserve Home Assistant label-only behavior:
  - available for helper-managed or legacy-readable inventory
  - does not require profile/circuit semantic confirmations
  - sends only `setHaLabels`
  - does not open a YAML transaction or change `configurationMode`
  - continues to Calibration Plan or Summary after saving
- [ ] Runtime-only:
  - render the capability explanation in the Device phase
  - route to Calibration Plan
  - never attempt `getMeterConfiguration`, `previewMeterConfiguration`, or `setHaLabels` after the mode is known

### Step 4: Protect legacy source behavior in backend tests

- [ ] Add a fixture containing:
  - custom user YAML outside helper-owned spans
  - official generic totals
  - custom lambdas/filters outside owned spans
  - recognizable legacy gain/name substitutions
- [ ] Test a read-only inventory round trip leaves the source untouched.
- [ ] Test a gain-only calibrated handoff changes only allowed gain substitutions/blocks.
- [ ] Test a full opted-in migration preserves unowned YAML and does not remove generic/custom totals unless the requested reviewed configuration explicitly replaces the managed surface.

Run:

```bash
pytest -q tests/test_meter_inventory.py tests/test_meter_config_mutator.py
cd frontend
npm test -- existing-configuration-step.test.ts panel.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add frontend/src/components/existing-configuration-step.ts \
  frontend/test/existing-configuration-step.test.ts frontend/src/panel.ts \
  frontend/src/styles.ts frontend/test/panel.test.ts \
  tests/test_meter_inventory.py tests/test_meter_config_mutator.py
git commit -m "feat: add opt-in legacy configuration workflow"
```

---

## Task 7: Make Meter Settings beginner-first without losing expert controls

**Files**

- Modify: `frontend/src/components/meter-settings-step.ts`
- Modify: `frontend/src/panel.ts`
- Modify: `frontend/src/styles.ts`
- Modify: `frontend/test/meter-settings-step.test.ts`
- Modify: `frontend/test/panel.test.ts`
- Modify: `frontend/test/accessibility.test.ts`

### Step 1: Write failing tests

- [ ] Basic view contains only:
  - friendly name
  - electrical system
  - line frequency
  - reporting interval
  - transformer selection
- [ ] Advanced section is collapsed initially and contains:
  - board package options
  - multi-reference controls
  - phase labels
  - group assignment
  - custom/three-phase nominal voltage
- [ ] Custom gain input appears only for `transformer_model_id === "custom"`.
- [ ] A preset shows its starting gain as read-only information.
- [ ] New and legacy modes cannot Continue until profile confirmation.
- [ ] Helper-managed unchanged mode begins confirmed.
- [ ] Changing electrical system or frequency clears confirmation.
- [ ] Keyboard operation of `<details>` and confirmation control passes accessibility tests.

### Step 2: Implement UI-only profile confirmation

- [ ] Add panel state:

```ts
private meterProfileConfirmed = false;
```

- [ ] Initialize:
  - helper-managed existing: `true`
  - new install: `false`
  - legacy editable manage branch: `false`
- [ ] Reset to false when electrical system, frequency, or nominal voltage changes.
- [ ] Do not persist the confirmation flag.
- [ ] Keep the operation-scoped multi-reference physical acknowledgement separate.

### Step 3: Reorganize component markup

- [ ] Keep basic fields above the fold.
- [ ] Move package options and advanced voltage wiring into named `<details>` sections.
- [ ] Preserve every existing callback and validation rule.
- [ ] Replace “Setup Device choices remain onboarding suggestions” with direct copy explaining that these are the authoritative values to install.
- [ ] In legacy mode, show a compact banner that existing profile identity was not recorded and must be confirmed.

Run:

```bash
cd frontend
npm test -- meter-settings-step.test.ts panel.test.ts accessibility.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add frontend/src/components/meter-settings-step.ts frontend/src/panel.ts \
  frontend/src/styles.ts frontend/test/meter-settings-step.test.ts \
  frontend/test/panel.test.ts frontend/test/accessibility.test.ts
git commit -m "feat: simplify authoritative meter settings"
```

---

## Task 8: Redesign Circuits & CTs around safe defaults and legacy preservation

**Files**

- Modify: `frontend/src/components/ct-inventory-step.ts`
- Modify: `frontend/src/panel.ts`
- Modify: `frontend/src/styles.ts`
- Modify: `frontend/test/panel.test.ts`
- Modify: `frontend/test/accessibility.test.ts`

### Step 1: Add pure recommendation and preservation tests

- [ ] Add/export a pure function:

```ts
export function recommendedReportingMultiplier(
  ratedCurrentA: number,
): 1 | 2 | 4 | 8 | null;
```

Expected:
- 50 A → 1
- 65.535 A → 1
- 100 A → 2
- 131.07 A → 2
- 200 A → 4
- 262.14 A → 4
- 400 A → 8
- over 524.28 A → `null`

- [ ] Test that selecting a preset chooses the recommendation when `multiplierMode === "automatic"`.
- [ ] Test manual override remains unchanged when another preset still fits.
- [ ] Test an undersized effective range blocks Continue.
- [ ] Test a legacy unknown model can select “Keep existing gain; CT model not recorded.”
- [ ] Test preserving the existing gain produces no `CtChange`.
- [ ] Test changing from preserve mode to a preset/custom gain invokes normal model and burden validation.
- [ ] Preserve the post-PR new/helper-managed unresolved-model blocking behavior.

### Step 2: Extend UI draft state

- [ ] Extend `CtDraft`:

```ts
preserveExistingGain: boolean;
multiplierMode: "automatic" | "manual";
```

- [ ] Initialize preserve mode only when:
  - configuration mode is legacy editable
  - no model selection is verified against current configuration
  - a valid current gain exists
- [ ] Never serialize `preserveExistingGain` into backend models.
- [ ] `isDirty()` must treat untouched preserve mode as unchanged.
- [ ] `changesFromDrafts()` must omit it.
- [ ] A newly entered custom gain still requires the existing physical/burden acknowledgement.

### Step 3: Reorder CT presentation

- [ ] Normal row/card order:
  - CT number
  - Used
  - Circuit name
  - Circuit type
  - CT model/rating
  - Range status
- [ ] Move raw gain, divided gain, multiplier manual override, voltage-reference ID, secondary output, and notes into expandable Technical details.
- [ ] Keep a visible, plain-language physical warning near any burden-related choice.
- [ ] Display effective range in amperes, not only a multiplier number.

### Step 4: Gate legacy roles and automatic totals

- [ ] Add panel state:

```ts
private legacyCircuitSemanticsConfirmed = false;
```

- [ ] Show this required acknowledgement only in the legacy manage branch:
  - “I reviewed used/unused channels and circuit roles.”
- [ ] Do not call `reconcileSplitPhaseAggregates()` for legacy drafts until this is true.
- [ ] When true, reconcile only the existing supported exact pairs; never sum all CTs.
- [ ] Keep the existing Home Assistant label-only mode as a non-migrating path; when label-only is active, skip model, profile, role, total, and firmware-write validation.
- [ ] Display a concise automatic-total preview.
- [ ] Move the full aggregate editor under “Advanced totals.”
- [ ] Keep `legacy_generic_totals_unmanaged` visible until a reviewed transaction explicitly replaces the applicable managed total surface.

Run:

```bash
cd frontend
npm test -- panel.test.ts accessibility.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add frontend/src/components/ct-inventory-step.ts frontend/src/panel.ts \
  frontend/src/styles.ts frontend/test/panel.test.ts \
  frontend/test/accessibility.test.ts
git commit -m "feat: make circuit and CT setup beginner-safe"
```

---

## Task 9: Add a persisted calibration plan before the safety gate

**Files**

- Create: `frontend/src/components/calibration-plan-step.ts`
- Create: `frontend/test/calibration-plan-step.test.ts`
- Modify: `custom_components/circuitsetup_energy_meter_helper/workflow.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/websocket_api.py`
- Modify: `frontend/src/types.ts`
- Modify: `frontend/src/api.ts`
- Modify: `frontend/src/panel.ts`
- Modify: `tests/test_workflow.py`
- Modify: `tests/test_websocket_api.py`
- Modify: `frontend/test/panel.test.ts`

### Step 1: Write backend tests

- [ ] `start_session` accepts only `"standard"` or `"full"`.
- [ ] Session status includes `calibration_plan`.
- [ ] Standard session:
  - preserves existing offset values
  - reports offset disposition as skipped
  - resumes at Voltage after safety
- [ ] Full session:
  - begins with offset not started
  - resumes at Offset after safety
- [ ] Existing active sessions lacking the new field follow the current full-flow fallback.
- [ ] Invalid values return the existing safe typed WebSocket error style.

Run:

```bash
pytest -q tests/test_workflow.py -k "calibration_plan or start_session or offset"
pytest -q tests/test_websocket_api.py -k "start_session"
```

### Step 2: Implement server session contract

- [ ] Add:

```python
CalibrationPlan = Literal["standard", "full"]
```

- [ ] Add `calibration_plan` to `_SessionHandle` and `SessionStatus`.
- [ ] Change `async_start_session(device_id, calibration_plan)`.
- [ ] For standard:
  - initialize `offset_skipped=True`
  - do not clear or write offset values
- [ ] For full:
  - preserve current behavior
- [ ] Add the required Voluptuous field to `start_session`.
- [ ] Include the value in subscription/status serialization.

### Step 3: Add frontend plan component

- [ ] Render three choices:
  - Keep existing calibration
  - Standard calibration
  - Full calibration
- [ ] Include concise preparation/durability descriptions.
- [ ] Change normal CT Continue, no-source topology Continue, and verified normal-install Continue to navigate to Calibration Plan rather than starting a session immediately.
- [ ] `keep_existing`:
  - does not call `startSession`
  - sets `completedWithoutChanges=true`
  - routes to Summary
- [ ] Standard/full:
  - call `api.startSession(deviceId, plan)`
  - route to Safety
- [ ] Do not show Safety for keep-existing.
- [ ] If full offset capability later proves unavailable, show the existing reason and allow continuing with offset skipped; do not fail the whole calibration path.

### Step 4: Resume correctly

- [ ] Populate frontend `calibrationPlan` from active `SessionStatus`.
- [ ] Remove any route choice based solely on browser-local `voltageSkipped/currentSkipped`.
- [ ] Use session plan plus offset disposition in `resumeWorkflowRoute`.

Run:

```bash
pytest -q tests/test_workflow.py tests/test_websocket_api.py
cd frontend
npm test -- calibration-plan-step.test.ts workflow-model.test.ts panel.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add frontend/src/components/calibration-plan-step.ts \
  frontend/test/calibration-plan-step.test.ts \
  custom_components/circuitsetup_energy_meter_helper/workflow.py \
  custom_components/circuitsetup_energy_meter_helper/websocket_api.py \
  frontend/src/types.ts frontend/src/api.ts frontend/src/panel.ts \
  tests/test_workflow.py tests/test_websocket_api.py frontend/test/panel.test.ts
git commit -m "feat: add resumable calibration plans"
```

---

## Task 10: Clarify calibration preparation, status, and subprogress

**Files**

- Modify: `frontend/src/components/safety-step.ts`
- Modify: `frontend/src/components/offset-step.ts`
- Modify: `frontend/src/components/voltage-step.ts`
- Modify: `frontend/src/components/current-step.ts`
- Modify: `frontend/src/components/restart-step.ts`
- Modify: `frontend/src/panel.ts`
- Modify: `frontend/src/styles.ts`
- Modify: `frontend/test/panel.test.ts`
- Modify: `frontend/test/accessibility.test.ts`

### Step 1: Write copy/state tests

- [ ] Voltage input visibly uses `V`.
- [ ] Current input visibly uses `A`.
- [ ] Current targets show CT number plus configured circuit name.
- [ ] Voltage status distinguishes:
  - waiting for live data
  - data changing too much
  - stable and ready
- [ ] Current copy says blank entries keep existing gains.
- [ ] Runtime-only current calibration requires an explicit reporting multiplier selection and explains why it cannot be read from ESPHome source.
- [ ] Calibration subprogress shows only applicable steps for standard/full.
- [ ] Standard Safety Continue routes to Voltage.
- [ ] Full Safety Continue routes to Offset.
- [ ] Current stability and calibration actions share a busy guard.
- [ ] The assumed post-PR all-target resolution gating still passes its regression tests.

### Step 2: Update presentation only

- [ ] Keep all existing safety acknowledgements and backend readiness checks.
- [ ] Add a short “What you will do” roadmap to Safety.
- [ ] Add a physical-work warning on Circuits & CTs without moving the full safety gate.
- [ ] Label Offset as optional and explain the required power/wiring-state changes before the user enters the sequence.
- [ ] Explain that offset values remain in flash.
- [ ] Add circuit names to current groups using `inventory`.
- [ ] Translate backend state into user messages; keep raw state in Technical details.
- [ ] Keep all retry/reconnect/cancel controls.

Run:

```bash
cd frontend
npm test -- panel.test.ts accessibility.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add frontend/src/components/safety-step.ts \
  frontend/src/components/offset-step.ts \
  frontend/src/components/voltage-step.ts \
  frontend/src/components/current-step.ts \
  frontend/src/components/restart-step.ts frontend/src/panel.ts \
  frontend/src/styles.ts frontend/test/panel.test.ts \
  frontend/test/accessibility.test.ts
git commit -m "feat: clarify guided calibration workflow"
```

---

## Task 11: Make configuration install and calibration save purpose-specific

**Files**

- Modify: `frontend/src/components/build-install-step.ts`
- Modify: `frontend/src/components/config-review-step.ts`
- Modify: `frontend/src/panel.ts`
- Modify: `frontend/src/styles.ts`
- Modify: `frontend/test/panel.test.ts`
- Modify: `frontend/test/accessibility.test.ts`

### Step 1: Write purpose-specific tests

- [ ] `install_configuration` renders:
  - “Install meter configuration”
  - “Save and validate configuration”
  - “Build firmware”
  - “Install on meter”
- [ ] A legacy first migration renders “Install reviewed helper configuration.”
- [ ] `save_calibration` renders:
  - “Save verified calibration”
  - “Write verified gains to ESPHome”
  - “Build firmware”
  - “Install calibrated firmware”
- [ ] Verified normal install Continue routes to Calibration Plan.
- [ ] Verified calibration install performs the existing flash-clear verification and routes to Summary.
- [ ] A handoff-available user can choose “Keep calibration in meter flash.”
- [ ] Keeping flash:
  - makes no YAML transaction
  - does not clear flash
  - routes to Summary with a durability warning
- [ ] Technical details contain redacted diff, validation counts, and evidence; normal view contains the human-readable configuration summary.

### Step 2: Require purpose in the shared component

- [ ] Change signature:

```ts
export function buildInstallStep(
  purpose: Exclude<TransactionPurpose, null>,
  status: TransactionStatus | null,
  // existing callbacks...
): TemplateResult
```

- [ ] Remove default `status?.state ?? "previewed"` behavior when no transaction exists. Render a blocking “No active review” state with only a safe Back action.
- [ ] Rename buttons by purpose without changing API operations.
- [ ] Move validation record counts and diff into `<details>`.
- [ ] Keep progress, retry, rollback, and startup verification unchanged.

### Step 3: Update panel transitions

- [ ] Normal preview → `install-configuration`.
- [ ] Gain preview → `save-calibration`.
- [ ] Normal verified install:
  - accept installed drafts
  - update verified configuration
  - mark mode helper-managed after a successful legacy migration
  - route to Calibration Plan
- [ ] Gain install:
  - retain current exact handoff/clear sequence
  - route to Summary only after authority is proven
- [ ] Active-work restore chooses the correct purpose/route.
- [ ] Back from each purpose returns to its own valid predecessor.

Run:

```bash
cd frontend
npm test -- panel.test.ts accessibility.test.ts workflow-model.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add frontend/src/components/build-install-step.ts \
  frontend/src/components/config-review-step.ts frontend/src/panel.ts \
  frontend/src/styles.ts frontend/test/panel.test.ts \
  frontend/test/accessibility.test.ts
git commit -m "feat: separate configuration and calibration transactions"
```

---

## Task 12: Make Summary branch-aware and authoritative

**Files**

- Modify: `frontend/src/components/summary-step.ts`
- Modify: `frontend/src/panel.ts`
- Modify: `frontend/src/styles.ts`
- Modify: `frontend/test/panel.test.ts`
- Modify: `frontend/test/accessibility.test.ts`

### Step 1: Add outcome-matrix tests

- [ ] New/helper-managed with YAML authority:
  - configuration installed
  - calibration stored in ESPHome
- [ ] Helper-managed, no changes:
  - existing calibration kept
  - no false restart record
- [ ] Legacy manage branch:
  - migration installed
  - any unmanaged generic totals listed
- [ ] Legacy calibrate-only with gain handoff:
  - gains saved
  - remaining configuration explicitly not migrated
- [ ] Legacy calibrate-only, flash retained:
  - source untouched
  - flash durability warning
- [ ] Runtime-only:
  - no authoritative source
  - no configuration fields claimed installed
  - flash-only warning
- [ ] Offset:
  - remains in flash by design
- [ ] No-handoff restart:
  - Finish available
  - no dead end
- [ ] Summary Back:
  - uses derived predecessor when workflow is not finalized
  - never opens an absent transaction
- [ ] Finish:
  - clears selected workflow UI state
  - returns to Device
  - does not erase backend calibration/configuration records.

### Step 2: Implement an explicit summary view model

- [ ] Create a local pure `summaryOutcome(...)` helper in the component or `workflow-model.ts`.
- [ ] Derive:
  - configuration status
  - migration status
  - calibration status
  - authority/storage message
  - warnings
  - available actions
- [ ] Do not infer installed configuration from a pending draft.
- [ ] Show channel/aggregate/entity details only from `verifiedMeterConfiguration`.
- [ ] Put verification IDs, source hashes, transaction IDs, and raw evidence under Technical details.
- [ ] Use “Complete” as the phase label; keep page heading “Setup complete” or “Review complete” based on outcome.

Run:

```bash
cd frontend
npm test -- panel.test.ts accessibility.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add frontend/src/components/summary-step.ts frontend/src/panel.ts \
  frontend/src/styles.ts frontend/test/panel.test.ts \
  frontend/test/accessibility.test.ts
git commit -m "feat: report workflow-specific completion outcomes"
```

---

## Task 13: Add end-to-end coverage for every supported journey

**Files**

- Modify: `frontend/test/e2e/panel.spec.ts`
- Modify: E2E fixtures/mocks already used by that file
- Modify: `frontend/test/workflow-scenarios.ts` if shared fixtures need browser-safe forms

- [ ] Add one deterministic E2E scenario for each:

1. New meter → import → Meter → CTs → install → keep calibration → Complete.
2. New meter → standard calibration → restart → save gains → Complete.
3. Existing helper-managed meter → no config changes → full calibration with offset → flash-authority Summary.
4. Existing legacy editable → manage branch → explicit confirmations → migration diff → install → Complete.
5. Existing legacy editable → calibrate-only → gain-only handoff → Summary says configuration was not migrated.
6. Runtime-only meter → standard calibration → restart → flash-only Summary.
7. Importable existing meter → import → legacy review.
8. Active normal configuration transaction resumes at Install Configuration.
9. Active calibration handoff transaction resumes at Save Calibration.
10. Mobile flow shows monotonically increasing conditional phase counts.

- [ ] In every scenario, assert no unexpected WebSocket mutations occur before the first explicit mutating action.
- [ ] Assert source-hash/transaction IDs used by the mocked mutations match the latest server response.
- [ ] Assert runtime-only never invokes configuration read/write commands after classification.
- [ ] Assert legacy calibrate-only never invokes a configuration preview.
- [ ] Assert Back from a preview uses abandon/reload before editable drafts resume.

Run:

```bash
cd frontend
npm run test:e2e
```

- [ ] Commit:

```bash
git add frontend/test/e2e/panel.spec.ts frontend/test/workflow-scenarios.ts
git commit -m "test: cover guided workflow journeys end to end"
```

---

## Task 14: Update documentation, build the shipped bundle, and run full verification

**Files**

- Modify: `README.md`
- Add in repository:
  - `docs/superpowers/specs/2026-08-29-guided-workflow-design.md`
  - `docs/superpowers/plans/2026-08-29-guided-workflow.md`
- Regenerate: `custom_components/circuitsetup_energy_meter_helper/frontend/**`

### Step 1: Update user documentation

- [ ] Document the four user-facing cases:
  - new meter
  - existing helper-managed
  - existing configuration not set up with helper
  - calibration-only meter without Device Builder source
- [ ] Explain configuration authority versus calibration authority.
- [ ] Explain standard versus full calibration.
- [ ] Explain that offset calibration remains in flash.
- [ ] Explain that flash-only calibration may be replaced by firmware installation.
- [ ] Explain that legacy migration is opt-in and preserves unowned YAML.
- [ ] Update screenshots/text descriptions only if the repository already maintains them; do not add a screenshot maintenance subsystem.

### Step 2: Full backend verification

Run from repository root:

```bash
pytest -q
ruff check .
mypy custom_components/circuitsetup_energy_meter_helper
```

Expected: all pass with no new ignores unless a specific typed third-party boundary already follows repository convention.

### Step 3: Full frontend verification

```bash
cd frontend
npm test
npm run typecheck
npm run test:e2e
npm run build
```

Expected:

- Vitest passes.
- TypeScript passes.
- Playwright passes.
- Vite emits the stable panel bundle and separate ESP Web Tools chunk.
- The build copies `dist` to `custom_components/circuitsetup_energy_meter_helper/frontend/`.

### Step 4: Review generated and behavioral diff

- [ ] Confirm the generated frontend bundle is the only expected built artifact change.
- [ ] Search for old labels and remove stale user-facing references:

```bash
rg -n 'Flash & Verify|Setup Device choices remain onboarding suggestions|No compatible device found|[0-9]+ of 10' \
  frontend/src frontend/test README.md
```

- [ ] Search for ambiguous build routing:

```bash
rg -n '"build"|step === "build"|navigate\("build"\)' frontend/src
```

Expected: no workflow-route use of the old ambiguous `build` step.

- [ ] Search for load-time legacy aggregate reconciliation and confirm every call is guarded by helper-managed state or explicit legacy semantic confirmation.

- [ ] Confirm no runtime-only path calls:
  - `getMeterConfiguration`
  - `previewMeterConfiguration`
  - `previewCtConfig`
  - `setHaLabels`
  - `previewCalibratedGains`

except gain handoff where an authoritative source was actually established after classification.

### Step 5: Final verification report

- [ ] Include in the PR description:
  - baseline SHA
  - task/commit list
  - backend/frontend/E2E command results
  - acceptance-matrix results
  - screenshots or short recordings for desktop and mobile only if repository review practice normally uses them
  - explicit statement that calibration math and transaction safety were not changed
  - explicit statement that legacy migration is opt-in

- [ ] Commit documentation and generated bundle:

```bash
git add README.md docs/superpowers/specs/2026-08-29-guided-workflow-design.md \
  docs/superpowers/plans/2026-08-29-guided-workflow.md \
  custom_components/circuitsetup_energy_meter_helper/frontend
git commit -m "docs: document guided meter setup workflow"
```

## Final acceptance checklist

- [ ] New users see one forward-moving sequence.
- [ ] Progress never moves backward after a conditional install.
- [ ] Normal configuration install and calibration save have distinct routes and copy.
- [ ] Electrical system/frequency are entered authoritatively once.
- [ ] Advanced voltage, package, gain, and aggregate controls remain available but collapsed.
- [ ] Existing helper-managed meters open without migration prompts.
- [ ] Legacy editable meters are read-only until the user chooses to manage them.
- [ ] Legacy calibrate-only makes no configuration changes.
- [ ] Unknown legacy CT models can preserve existing gains without a false model or burden claim.
- [ ] Existing Home Assistant label-only editing remains non-migrating.
- [ ] Automatic totals are not created from unconfirmed legacy roles.
- [ ] Runtime-only meters never show configuration actions or YAML durability claims.
- [ ] Standard calibration skips offset while preserving current offset values.
- [ ] Full calibration retains the current offset → voltage → current order.
- [ ] Keep Existing Calibration requires no safety acknowledgement.
- [ ] Restart verification remains mandatory after calibration writes.
- [ ] Gain handoff remains conditional on exact backend authority.
- [ ] Offset calibration remains flash-authoritative.
- [ ] Summary accurately states configuration and calibration authority.
- [ ] Active work resumes at the correct conditional route.
- [ ] All backend, frontend, accessibility, E2E, type, lint, and build checks pass.
