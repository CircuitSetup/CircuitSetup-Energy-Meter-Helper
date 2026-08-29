# Guided Setup Workflow and Legacy-Configuration Design Specification

## Status and baseline

This specification assumes:

- CircuitSetup Energy Meter Helper PR #45 has been merged.
- The correctness issues identified during the PR #45 review have already been fixed, including restart completion routing, contextual Back behavior, complete calibration-resolution gating, CT-model resolution, and startup-readiness handling.
- The implementation starts from the first `main` commit containing that merged and corrected baseline.
- The reviewed PR #45 head, `9797abf36c6c48712c51be58a814fcbec1b5f9d8`, is a structural reference only. Do not reset or overwrite later fixes to match that commit.

This specification changes workflow presentation and orchestration. It does not replace the existing meter-configuration, calibration, configuration-transaction, source-hash, compile, install, reconnect-verification, rollback, or flash-clearing mechanisms.

This specification supersedes the earlier Priority 0 requirement that the UI expose one fixed linear list of permanent wizard steps. It does **not** add new metering features. It groups existing work into conditional phases and adds only the minimum review branch needed to protect pre-existing configurations.

## Goal

Make the helper understandable and safe for a person who has never configured an energy meter, while preserving expert functionality and supporting all of these cases:

1. A newly flashed meter being set up for the first time.
2. An existing meter whose configuration is already helper-managed.
3. An existing ESPHome Device Builder configuration that predates the helper or has never been adopted by it.
4. A compatible meter visible in Home Assistant but without an editable, authoritative ESPHome source.
5. A meter with resumable configuration or calibration work already in progress.

The workflow must always tell the user:

- What is being configured.
- Which information was read directly and which information was inferred.
- Whether the helper can edit the ESPHome source.
- Whether calibration will be stored in YAML, meter flash, or both temporarily.
- Which physical preparation is required before any live calibration action.
- What will happen next.

## Non-negotiable safety and data-integrity principles

1. **Do not alter the technical order of operations.**

   Configuration must still be settled and installed before calibration when configuration changes are requested. Live calibration must still follow safety acknowledgement. Restart verification must still precede any YAML gain handoff. Flash values must not be cleared until the calibrated YAML has been installed and verified.

2. **Opening an existing meter must be read-only.**

   Loading topology, configuration, CT inventory, or a legacy review page must not:
   - Set `canonicalConfigurationChanged`.
   - Reconcile or create automatic aggregates.
   - Replace custom gains with catalog presets.
   - Assign semantic circuit roles as if the user confirmed them.
   - Add helper-managed blocks.
   - Save helper metadata.
   - Open a transaction.

3. **Do not equate “parseable” with “helper-managed.”**

   A configuration is helper-managed only when a hash-bound `StoredMeterConfiguration` was successfully loaded and validated against the current ESPHome source. A compatible configuration contract, recognizable substitutions, or parseable YAML alone is insufficient.

4. **Do not force migration.**

   A legacy-but-editable meter must offer:
   - Review and manage the configuration with the helper.
   - Keep the existing ESPHome configuration and calibrate only.
   - Return without changes.

5. **Never pretend runtime-only changes are durable in YAML.**

   When no authoritative ESPHome source is available, the helper may perform supported runtime calibration, but the UI and summary must state that the result remains in meter flash and may be replaced by a future firmware installation.

6. **Preserve unowned YAML.**

   The existing bounded mutator and source-hash transaction model remain mandatory. No generic YAML editor is added. Unsupported or unowned YAML remains byte-for-byte preserved except for pre-existing normalization behavior already covered by tests.

7. **Inferred legacy semantics are not user confirmations.**

   Legacy fallback values such as `ElectricalSystem.CUSTOM`, all channels enabled, all channels assigned the `branch` role, a custom transformer, or an empty aggregate list are compatibility representations. The UI must not present them as known facts.

8. **An unknown existing CT is a valid preserve state.**

   A legacy channel with a functioning existing gain but no verified CT model may be represented as “Keep existing gain; CT model not recorded.” Preserving that unchanged value must not require the user to select a potentially incorrect model or make a new burden-output assertion.

## Configuration classification

### Backend semantic source

Extend `MeterConfigurationCapabilities` with an exact semantic-source discriminator:

```python
ConfigurationSemanticSource = Literal[
    "helper_managed",
    "legacy_inferred",
]

@dataclass(frozen=True, slots=True)
class MeterConfigurationCapabilities:
    configuration_authoritative: bool
    managed_totals: bool
    multi_reference: bool
    semantic_source: ConfigurationSemanticSource
    reason_codes: tuple[str, ...]
```

Classification rules:

- `helper_managed`
  - A current-source-hash-matched `StoredMeterConfiguration` exists.
  - It was converted to a request and passed full topology validation.
  - Its helper-owned voltage-reference evidence, when present, also validated.
- `legacy_inferred`
  - There is no matching stored helper configuration.
  - Stored semantics were invalid and the inventory safely fell back to `_legacy_request`.
  - The source is otherwise parseable and may still be authoritative and writable.

A stale helper-store record whose hash no longer matches the current source is not a fatal setup state. Ignore it as authority, parse the live source through the bounded legacy fallback, return `semantic_source="legacy_inferred"`, and include `stored_semantics_stale`. This provides a safe review path without trusting stale semantics.

The semantic source is independent from the write capability:

- `configuration_authoritative=true` means the helper has a source snapshot it is permitted to mutate through the existing transaction owner.
- `configuration_authoritative=false` means the UI must not offer ESPHome source edits.
- `semantic_source=legacy_inferred` means an explicit review/migration choice is required even when the source is authoritative.

### Frontend configuration mode

Derive one frontend mode from device discovery plus the meter-configuration response:

```ts
export type ConfigurationMode =
  | "helper_managed"
  | "legacy_editable"
  | "runtime_only";
```

Rules:

- `helper_managed`
  - A configuration is available.
  - `capabilities.configuration_authoritative === true`.
  - `capabilities.semantic_source === "helper_managed"`.

- `legacy_editable`
  - A configuration is available.
  - `capabilities.configuration_authoritative === true`.
  - `capabilities.semantic_source === "legacy_inferred"`.

- `runtime_only`
  - No Device Builder configuration is available and cannot be imported, or
  - A meter-configuration response is unavailable/non-authoritative while native runtime calibration remains available.

“Import required” is an entry condition, not a fourth mode. An importable existing meter must be imported first and then reclassified using the authoritative response.

### Journey origin

Track presentation origin separately:

```ts
export type JourneyOrigin = "new_install" | "existing_meter";
```

This affects copy and defaults only. It must not grant source authority.

Within the same verified provisioning flow, `journeyOrigin === "new_install"` suppresses the legacy-review page even though the just-imported template has not yet produced a stored helper configuration. The user is already explicitly creating that configuration in Meter and Circuits & CTs. The first verified install establishes helper-managed semantics.

If that meter is reopened after a browser or Home Assistant restart and the helper can no longer prove the new-install journey or prior helper-managed semantics, it must be treated as an existing `legacy_editable` configuration until explicitly reviewed. Never infer “new install” solely from project version or configuration contract.

## Visible workflow

### Main phases

The progress UI shows conditional phases, not a fixed list of every technical screen:

1. **Device**
2. **Review Existing Setup** — legacy editable only
3. **Meter**
4. **Circuits & CTs**
5. **Install Configuration** — only when a configuration transaction is required
6. **Calibration**
7. **Save Calibration** — only when verified gain handoff is available
8. **Complete**

The visible sequence is derived from the selected branch and current server state. It must never count a later phase and then return to an earlier number.

### Calibration substeps

Within the Calibration phase, show a subordinate progress indicator:

1. Calibration plan
2. Safety
3. Offset — full plan only; still skippable
4. Voltage
5. Current
6. Restart and verify — only when calibration changes were written

The top-level phase remains “Calibration” while these substeps advance.

### New installation path

```text
Device
  → Meter
  → Circuits & CTs
  → Install Configuration
  → Calibration Plan
      → Keep Existing Calibration → Complete
      → Standard → Safety → Voltage → Current → Restart if needed
      → Full → Safety → Offset → Voltage → Current → Restart if needed
  → Save Calibration when available
  → Complete
```

The Device phase handles hardware/add-on selection, connection type, firmware version, ESP Web Tools installation, Home Assistant discovery, Device Builder import, and detected-topology confirmation.

Electrical system and line frequency are selected once, in Meter. They are not authoritative fields on the firmware-install screen.

### Existing helper-managed path

```text
Device
  → Meter
  → Circuits & CTs
  → Install Configuration only if changed
  → Calibration Plan
  → conditional calibration/save
  → Complete
```

Opening the meter does not imply that it must be changed or recalibrated. “Keep existing calibration” and “Finish without changes” remain first-class outcomes.

### Existing legacy-editable path

```text
Device
  → Review Existing Setup
      → Manage with helper
          → Meter
          → Circuits & CTs
          → Review migration diff
          → Install Configuration
          → optional Calibration
          → Complete
      → Keep existing ESPHome configuration and calibrate only
          → Calibration Plan
          → optional Save Calibration if gain-only handoff is supported
          → Complete
      → Back/exit without changes
```

The review page must explain that names, substitutions, current gains, frequency, update interval, package state, and physical topology may have been read directly, while electrical profile, transformer identity, CT identity, used/unused state, circuit roles, and aggregate intent may be inferred or unknown.

The existing Home Assistant label-only path remains available for a meter with a readable configuration inventory. Saving display labels must not claim or perform a legacy YAML migration, must not require electrical/circuit semantic confirmation, and must leave the configuration mode `legacy_editable`.

### Runtime-only path

```text
Device
  → Calibration Plan
      → Keep Existing Calibration → Complete
      → Standard/Full as supported → Safety → calibration → Restart
  → Complete
```

Do not show Meter, Circuits & CTs, Install Configuration, or Save Calibration as editable phases when no authoritative source exists.

The runtime-only capability page must state:

- The meter is connected to Home Assistant.
- ESPHome source editing is unavailable.
- Circuit names, CT models, roles, multipliers, entities, and totals cannot be changed by this helper in this mode.
- Supported calibration is saved in meter flash.
- Installing firmware later may replace flash-only calibration.
- Importing the meter into ESPHome Device Builder, when available, is the path to editable configuration.
- Current calibration requires explicit confirmation of the reporting multiplier because no authoritative CT inventory is available; the helper must not assume `×1`.

## Route and progress architecture

Keep technical route state distinct from visible phase state.

Use these route identifiers:

```ts
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
```

Do not retain one ambiguous `build` route. `install-configuration` and `save-calibration` may render the same component, but they are different workflow destinations with different copy, predecessors, successors, and recovery behavior.

Create a pure workflow model that derives:

- Configuration mode.
- Valid route sequence.
- Top-level phase sequence.
- Active phase.
- Calibration substep sequence.
- Previous and next valid routes.
- Resume route for an active transaction/session.
- Transaction purpose.

The model must be deterministic from explicit context. Do not use the sidebar index as workflow state. Do not use a browser-only navigation history as the source of truth because active work must resume correctly after panel reload.

### Transaction purpose

Use an explicit discriminator:

```ts
export type TransactionPurpose =
  | "install_configuration"
  | "save_calibration";
```

Set it when previewing a transaction and reconstruct it when resuming active work:

- If the active transaction ID is the verified calibration handoff transaction, purpose is `save_calibration`.
- Otherwise it is `install_configuration`.

The shared transaction component receives this purpose and renders purpose-specific labels.

## Device phase requirements

### Existing device cards

Each card must present one of:

- **Managed in ESPHome Device Builder**
- **Import available**
- **Calibration only — no editable source**

Use explicit actions:

- `Open setup`
- `Import configuration`
- `Retry import`

Do not use “Configure” when the actual next action may only be calibration.

### New device presentation

When there are no existing compatible devices, this is a normal first-run state, not an error. Lead with “Set up a new meter.” Place “Existing meters” second or omit it when empty.

New-device inputs:

- Add-on board count.
- Network connection type.
- ESPHome firmware version.
- Add-on address jumper summary.
- ESP Web Tools install control.

Remove electrical system and frequency from this page. The standard topology firmware is installed first; the authoritative electrical profile is applied after import.

Rename “Jumper summary” to “Add-on address jumper settings.”

### Topology presentation

Default view:

```text
Detected meter
Main board + N add-ons
X CT inputs
Wi-Fi / Ethernet
Hardware and firmware agree
```

Place source evidence, group counts, project identity details, and raw evidence strings inside an expanded-on-demand Technical details section. A mismatch remains blocking.

## Legacy review and migration contract

### Read-only legacy review

The review screen must show:

- ESPHome configuration filename.
- Project/version.
- Board and CT count.
- Read-directly values.
- Inferred/unconfirmed values.
- Existing warnings:
  - `electrical_profile_requires_confirmation`
  - `legacy_generic_totals_unmanaged`
  - `stored_semantics_stale`, if the backend permits a safe legacy fallback
  - `config_contract_upgrade_required`
- What a helper-managed migration changes.
- What it deliberately preserves.

No draft mutation occurs until the user chooses a branch.

### Manage-with-helper branch

Before previewing the first helper-managed transaction:

- Electrical profile and frequency must be explicitly confirmed.
- Every enabled legacy CT must be either:
  - Assigned a verified preset.
  - Assigned a newly entered custom gain with the required physical acknowledgement.
  - Marked “Keep existing gain; CT model not recorded.”
- The user must confirm that used/unused states and circuit roles were reviewed.
- Automatic totals must not be synthesized before that confirmation.
- Existing generic or custom totals remain untouched unless the reviewed migration explicitly replaces them.
- The first transaction review must be titled as a migration and show the human-readable semantic changes before the redacted diff.

After a successful install and startup verification, the stored helper configuration becomes hash-bound to the new source. A subsequent reload should classify it as `helper_managed`.

### Calibrate-only branch

- Preserve the ESPHome source exactly.
- Do not reconcile totals or write CT semantics.
- Permit supported live calibration.
- If a verified gain-only YAML handoff is available, offer it as a separate Save Calibration decision. This does not imply that the full configuration has been migrated.
- If the user keeps gains in flash, disclose the durability limitation.

## Meter phase requirements

The normal view includes:

- Friendly name.
- Electrical system.
- Line frequency.
- Reporting interval.
- Voltage transformer selection for each displayed voltage reference.

Advanced voltage and entity options are collapsed by default:

- Power-quality entities.
- Status fields.
- Multiple voltage references.
- Phase labels.
- Voltage-group assignments.
- Nominal voltage for custom/three-phase systems.
- Custom starting voltage gain.

A preset’s starting gain is read-only information. Show an editable gain input only when Custom is selected.

For new and legacy journeys, Continue remains disabled until the electrical profile is explicitly confirmed. A default-looking value must not silently become authoritative.

## Circuits & CTs phase requirements

### Normal CT presentation

Lead with:

- Used.
- Circuit name.
- Circuit type.
- CT model/rating.
- Measurement range status.

Place these under Technical details:

- Raw gain register value.
- Resulting divided gain.
- Reporting multiplier override.
- Secondary-output specification.
- Voltage-reference identifier.
- Burden notes and other catalog metadata.

### Reporting multiplier

Calculate the minimum safe recommendation using the ATM90E32 65.535 A unscaled range:

- `×1` through 65.535 A.
- `×2` through 131.07 A.
- `×4` through 262.14 A.
- `×8` through 524.28 A.

Selecting a preset chooses the minimum safe multiplier unless the user has explicitly switched that row to manual override. A multiplier whose effective range is below the selected CT rating is blocking, not merely informational.

### Preserving an unknown existing gain

Use explicit UI state rather than pretending that the model is known:

```ts
export interface CtDraft {
  // existing fields
  preserveExistingGain: boolean;
  multiplierMode: "automatic" | "manual";
}
```

Rules:

- `preserveExistingGain` is available only for a legacy channel whose current gain was read from the source/runtime and whose model was not verified.
- Leaving it selected produces no CT change request.
- It does not require a new burden acknowledgement.
- Choosing a preset or entering a new custom gain exits preserve mode and applies normal validation.
- Helper-managed and new-install channels still require a resolved model under the post-PR #45 validation rules.

### Totals

Show a concise automatic-total preview in the normal view, for example:

```text
Mains total = CT1 + CT2
Solar total = CT3 + CT4
```

Place the full aggregate editor under “Advanced totals.”

On an existing legacy configuration:

- Do not run automatic reconciliation on load.
- Do not create totals until roles/usage have been reviewed.
- Keep unmanaged generic totals visibly identified.
- Never add a sum-all-CT total.

## Calibration plan and safety

### Plan choices

Show three choices before starting a live session:

- **Keep existing calibration**
  - No live calibration session.
  - No safety acknowledgement.
  - Continue to Summary with calibration unchanged.

- **Standard calibration**
  - Preserve existing offset values.
  - Calibrate voltage and selected current channels.
  - Start a session with `calibration_plan="standard"`.

- **Full calibration**
  - Offer offset, voltage, and selected current calibration.
  - Start a session with `calibration_plan="full"`.

Persist `calibration_plan` in the server session status so refresh/resume does not depend on browser memory. Existing sessions that predate the field default to the current full-flow behavior unless their offset disposition proves that offset was already skipped.

### Safety position

Safety acknowledgement remains immediately before live calibration. The Calibration Plan page may explain requirements, but it does not replace the dedicated safety gate.

For a standard session, mark offset calibration skipped while preserving existing flash offsets, then route from Safety to Voltage.

For a full session, route from Safety to Offset. Offset remains individually skippable.

## Calibration screens

### Voltage

Display:

- Plain-language preparation.
- The reference label.
- Unit `V`.
- Waiting-for-data, unstable-data, and stable-ready states as distinct messages.
- Board/reference completion status.

### Current

Display:

- CT number and circuit name.
- Unit `A`.
- Explanation that blank channels keep their existing gain.
- Which channels in the displayed group are calibrated, preserved, skipped, or unresolved.
- Busy state for both stability collection and calibration.

The post-PR #45 complete-resolution gate remains authoritative. The workflow refactor must not regress it.

### Restart

Restart verification remains mandatory whenever pending calibration exists. After verification:

- Gain handoff available → Save Calibration route.
- No handoff available → Summary.
- Verification failed → remain on Restart with recovery actions.
- Offset calibration present → Summary explains flash authority.

## Install Configuration and Save Calibration

Use one rendering component with a required purpose argument.

### Install Configuration copy

- Heading: `Install meter configuration`
- Buttons:
  - `Save and validate configuration`
  - `Build firmware`
  - `Install on meter`
- Verified Continue target: Calibration Plan.

For the first legacy migration, heading becomes `Install reviewed helper configuration`.

### Save Calibration copy

- Heading: `Save verified calibration`
- Buttons:
  - `Write verified gains to ESPHome`
  - `Build firmware`
  - `Install calibrated firmware`
- After verified installation, clear flash only through the existing exact authority checks.
- Also offer `Keep calibration in meter flash` before source handoff is applied, with a durability warning.

The redacted YAML diff, validation record counts, transaction IDs, raw evidence, and upload trace remain available under Technical details.

## Summary

The Summary must be outcome-specific.

Always show:

- Meter topology.
- Project version.
- Configuration mode and authority.
- Whether configuration was changed, migrated, or left untouched.
- Calibration plan and outcome.
- Calibration storage authority.
- Used channel and aggregate summary when authoritative configuration is available.
- Any unresolved/unmanaged legacy items.
- Clear next step.

Specific messages:

- Helper-managed + YAML authority:
  - “Configuration and calibration are installed in ESPHome.”
- Flash-only gain calibration:
  - “Calibration is stored in meter flash. Installing firmware may replace it.”
- Offset calibration:
  - “Offset calibration remains stored in meter flash by design.”
- Runtime-only:
  - “ESPHome source was not changed because no authoritative configuration was available.”
- No calibration:
  - “Existing calibration was kept unchanged.”
- Legacy calibrate-only with gain handoff:
  - “Calibration gains were saved; the remaining legacy configuration was not migrated.”

Do not route Summary Back to a nonexistent transaction. Before completion, Back is derived from the current workflow path. After authoritative completion, the primary action is Finish; reopening setup begins a fresh read.

## Resume and recovery

On panel load or selected-device change:

1. Read setup/device state.
2. Read topology.
3. Derive configuration mode.
4. Read active work.
5. Reconstruct transaction purpose.
6. Derive the valid route from server state.
7. Render the matching conditional phase list.

Required resume mappings:

- Normal configuration transaction → Install Configuration.
- Calibration handoff transaction → Save Calibration.
- `safety_required`/`preflight_failed` session → Safety.
- Standard session with offset skipped → Voltage.
- Full session with offset in progress → Offset.
- Pending calibration requiring restart → Restart.
- Verified session with handoff available → Save Calibration.
- Verified session without handoff → Summary.

A source-hash mismatch remains blocking. Reload live state and preserve local drafts only under the existing stale-confirmation safeguards.

## Accessibility and responsive behavior

- Top-level progress uses an ordered list with current/completed/upcoming states.
- Mobile text uses “Phase N of M,” not the index of an internal route.
- Calibration subprogress has its own label.
- `<details>`/`<summary>` controls are keyboard accessible.
- Focus moves to the route heading after navigation.
- Announcements describe semantic outcomes, not internal state names.
- Disabled actions include adjacent explanatory text when the reason is not obvious.
- CT cards/rows retain associated labels and deterministic focus order.
- All new warning, success, and capability messages meet existing contrast requirements.

## Explicit non-goals

- No generic YAML editor.
- No automatic inference of mains, solar, generator, or appliance roles from live power.
- No board-revision selector.
- No software CT inversion control.
- No new metering entities or power-quality fields.
- No new firmware permutation by electrical profile.
- No changes to calibration equations or ATM90E32 gain math.
- No removal of source hashes, preview, validation, compile, install confirmation, reconnect verification, rollback, or exact calibration verification.
- No forced migration of legacy configurations.
- No automatic replacement of custom/unmanaged totals.
- No new permanent top-level page for every advanced option.

## Acceptance matrix

| Scenario | Configuration phases | Migration prompt | Calibration persistence | Required summary |
|---|---|---:|---|---|
| New meter | Meter, CTs, Install | No | YAML when gain handoff is available; flash for offsets | Installed configuration and calibration authority |
| Existing helper-managed | Meter, CTs, conditional Install | No | Existing handoff rules | Changed or unchanged helper-managed setup |
| Existing legacy editable, manage branch | Legacy Review, Meter, CTs, Install | Yes | Handoff rules after migration | Migration installed; remaining unmanaged items listed |
| Existing legacy editable, calibrate-only | Legacy Review, Calibration | Yes | Gain-only YAML handoff if available, otherwise flash | ESPHome configuration left untouched |
| Existing importable | Import, then reclassify | After import if inferred | Depends on resulting mode | Import and authority status |
| Runtime-only | Calibration only | No | Flash only | No authoritative source; durability warning |
| Active normal transaction | Install Configuration | No duplicate prompt | N/A until complete | Resume existing transaction |
| Active handoff transaction | Save Calibration | No duplicate prompt | Pending YAML authority | Resume existing handoff |
| Existing calibration kept | No live calibration | No safety gate | Unchanged | Existing calibration kept |
