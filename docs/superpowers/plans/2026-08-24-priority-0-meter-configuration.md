# Priority 0 ESPHome Meter Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand CircuitSetup Energy Meter Helper from CT selection/calibration into a safe, topology-aware configurator for electrical system type, voltage references, reporting interval, circuit roles, grouped totals, energy reporting, and complete range scaling for the supported power-quality values.

**Architecture:** Keep the current line-preserving, hash-bound configuration transaction architecture. Add a typed meter-configuration domain model, parse only a bounded official YAML surface, and render deterministic helper-managed override blocks instead of serializing arbitrary YAML. Preserve the existing CT setup and calibration paths as compatibility wrappers while introducing generalized meter-configuration read/preview/apply commands.

**Tech Stack:** Python 3.13, Home Assistant custom integration APIs, Voluptuous, aioesphomeapi, aiohasupervisor, ESPHome Python code generation and C++, Lit 3, TypeScript, Vitest, Playwright, pytest, Ruff, mypy, GitHub Actions.

**Scope amendment (user):** Tasks 2–4 are canceled. The remaining work begins with Task 5.

**Spec:** The “Approved Requirements Baseline” section in this document is the controlling specification. Before implementation, copy it unchanged to `docs/superpowers/specs/2026-08-24-priority-0-meter-configuration-design.md` in `CircuitSetup/CircuitSetup-Energy-Meter-Helper`.

**Baseline:** Begin from `CircuitSetup/CircuitSetup-Energy-Meter-Helper` commit `27d1dfad665c9cc5a8371ab7de428d41f3306118` or a later `main` commit that contains PR #21, “Add per-board meter package options.” For the companion meter configurations, begin from `CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter` commit `b94637a4f084a3a4a35e3e5f48eb1586bbd972c3` or later; that baseline already categorizes status fields as diagnostic.

## Approved Requirements Baseline

### Included Priority 0 capabilities

1. **Electrical-system profile**
   - North American split-phase 120/240 V.
   - Single-phase 220–240 V.
   - Three-phase.
   - Custom.
   - Explicit 50 Hz or 60 Hz selection.
   - No geographic assumption may silently become authoritative.

2. **Voltage references and transformer configuration**
   - One or more named voltage references.
   - Nominal RMS voltage per reference.
   - Transformer preset or custom starting gain.
   - Explicit mapping from every ATM90E32 group to exactly one voltage reference.
   - Generic physical-preparation acknowledgement when more than one voltage reference is configured.
   - Voltage calibration operates by voltage reference, not by a hard-coded board pair.

3. **Reporting interval**
   - Supported choices: 1, 2, 5, 10, 30, or 60 seconds.
   - Configuration and calibration timeouts must account for the selected interval.
   - The UI must explain the traffic and calibration implications.

4. **Channel usage, role, phase/reference, and two-pole measurement**
   - Used or unused.
   - Roles: grid/mains, solar, generator, subpanel feeder, branch circuit, two-pole appliance, custom, unused.
   - Every used channel maps to one voltage reference.
   - Two-pole methods: two CTs summed, one CT with power doubled, both conductors through one CT, or direct single-channel measurement.
   - Register-range scaling and semantic circuit-power scaling remain separate.
   - Do not add a casual software CT-inversion switch.

5. **Totals, groups, and energy reporting**
   - User-defined grid, generation, subpanel, circuit, and custom aggregates.
   - No default “sum every CT” total when that can double-count branch circuits already included in mains or feeder measurements.
   - Energy modes: none, consumption, bidirectional import/export, and generation.
   - Aggregate power, optional aggregate current, and managed energy entities use deterministic IDs.
   - Existing official generic totals must be hidden or explicitly identified as unmanaged before replacement totals are exposed.

6. **Power-quality range scaling**
   - Existing `reporting_multiplier` values remain exactly `1`, `2`, `4`, or `8`.
   - Continue scaling current and active power.
   - Add matching scaling for reactive power and apparent power.
   - Do not multiply power factor or phase angle.
   - Harmonic power and peak current are not part of the helper-managed power-quality feature. When the existing full package is enabled by the helper, remove those two entities in the helper-managed override block.
   - Do not add harmonic-power or peak-current fields to new helper models, schemas, UI, entity estimates, or tests except tests proving they are absent/removed.

### Explicit exclusions

- **No board-revision option.** Do not add a `board_revision` type, field, UI control, persisted value, mutation, validation rule, diagnostic field, migration, or test-matrix dimension.
- No generic YAML editor.
- No arbitrary package paths, filters, lambdas, SPI pins, internal ATM90E32 IDs, `gain_pga`, or `current_phases` in the normal UI.
- No automatic Home Assistant notification creation.
- No software CT inversion in this work.
- No harmonic-power or peak-current management.
- No firmware permutation explosion for every electrical profile. New devices flash the standard topology firmware selected by add-on count and connection type; the helper applies electrical settings after adoption.
- Do not remove calibration controls or calibration sensor entities required by the current binding and verification flow.
- Do not bypass source hashes, explicit preview, compile, install confirmation, reconnect verification, or rollback.

### User-flow constraint

Add only one new main step, **Meter Settings**, between **Setup Device** and **Circuits & CTs**. Rename the existing **CT Settings** step to **Circuits & CTs**. Keep aggregate and energy controls inside that step rather than adding separate permanent wizard pages.

---

## Cross-Repository Delivery Order

Implement as dependency-ordered pull requests. Do not merge a later PR before all listed predecessors are available.

1. **Meter configuration contract PR** — `CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter`
   - Stable status metadata, stable legacy-total IDs, and helper contract assertions.
2. **Helper backend foundation PR** — models, catalog, storage, parser, topology, capabilities.
3. **Helper mutation and transaction PR** — generalized meter configuration, range scaling, aggregates.
4. **Helper calibration PR** — voltage-reference-aware calibration and interval-aware timing.
5. **Helper frontend PR** — Meter Settings, Circuits & CTs, review, summaries, accessibility.
6. **Integration/release PR** — full firmware contract matrix, E2E scenarios, documentation, version bump.

---

## Planned File Structure

### `CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter`

**Modify**
- `Software/ESPHome/status_fields/6chan_main_status.yaml`
- `Software/ESPHome/status_fields/6chan_addon1_status.yaml` through `6chan_addon6_status.yaml`
- `Software/ESPHome/6chan_energy_meter_main_board.yaml`
- Every supported Wi-Fi, LilyGO Ethernet, and Waveshare top-level meter YAML.
- `Software/ESPHome/README.md`
- `.github/workflows/esphome-compile.yml`

**Create**
- `scripts/validate_helper_contract.py`
- `.github/workflows/helper-contract.yml` if the existing compile workflow cannot run the contract script cleanly.

### `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Create**
- `custom_components/circuitsetup_energy_meter_helper/meter_configuration.py`
- `custom_components/circuitsetup_energy_meter_helper/voltage_transformer_catalog.py`
- `custom_components/circuitsetup_energy_meter_helper/data/voltage_transformers.json`
- `custom_components/circuitsetup_energy_meter_helper/meter_inventory.py`
- `custom_components/circuitsetup_energy_meter_helper/meter_config_mutator.py`
- `custom_components/circuitsetup_energy_meter_helper/config_blocks.py`
- `custom_components/circuitsetup_energy_meter_helper/entity_estimator.py`
- `frontend/src/components/meter-settings-step.ts`
- `frontend/src/components/circuit-aggregates.ts`
- `frontend/src/components/configuration-impact.ts`
- `tests/test_meter_configuration.py`
- `tests/test_voltage_transformer_catalog.py`
- `tests/test_meter_inventory.py`
- `tests/test_meter_config_mutator.py`
- `tests/test_entity_estimator.py`
- `frontend/test/meter-settings.test.ts`
- `frontend/test/circuit-aggregates.test.ts`
- `frontend/test/configuration-impact.test.ts`

**Modify**
- `custom_components/circuitsetup_energy_meter_helper/models.py`
- `custom_components/circuitsetup_energy_meter_helper/store.py`
- `custom_components/circuitsetup_energy_meter_helper/config_document.py`
- `custom_components/circuitsetup_energy_meter_helper/config_mutator.py`
- `custom_components/circuitsetup_energy_meter_helper/config_transaction.py`
- `custom_components/circuitsetup_energy_meter_helper/topology.py`
- `custom_components/circuitsetup_energy_meter_helper/workflow.py`
- `custom_components/circuitsetup_energy_meter_helper/websocket_api.py`
- `custom_components/circuitsetup_energy_meter_helper/device_builder.py`
- `custom_components/circuitsetup_energy_meter_helper/calibration_engine.py`
- `custom_components/circuitsetup_energy_meter_helper/entity_binding.py`
- `custom_components/circuitsetup_energy_meter_helper/preflight.py`
- `custom_components/circuitsetup_energy_meter_helper/diagnostics.py`
- `custom_components/circuitsetup_energy_meter_helper/repairs.py`
- `custom_components/circuitsetup_energy_meter_helper/__init__.py`
- `frontend/src/types.ts`
- `frontend/src/api.ts`
- `frontend/src/panel.ts`
- `frontend/src/components/setup-device-step.ts`
- `frontend/src/components/ct-inventory-step.ts`
- `frontend/src/components/package-options.ts`
- `frontend/src/components/config-review-step.ts`
- `frontend/src/components/summary-step.ts`
- `frontend/src/styles.ts`
- Existing Python/frontend/E2E tests for every modified surface.

---

## Public Data Contracts

Define these names exactly unless an existing merged change creates a naming collision.

```python
# meter_configuration.py
from dataclasses import dataclass
from enum import StrEnum
from typing import Literal

LineFrequencyHz = Literal[50, 60]
UpdateIntervalSeconds = Literal[1, 2, 5, 10, 30, 60]

class ElectricalSystem(StrEnum):
    SPLIT_PHASE_120_240 = "split_phase_120_240"
    SINGLE_PHASE_230 = "single_phase_230"
    THREE_PHASE = "three_phase"
    CUSTOM = "custom"

class VoltageLayout(StrEnum):
    STANDARD = "standard"
    MULTI_REFERENCE = "multi_reference"
    CUSTOM = "custom"

class CircuitRole(StrEnum):
    GRID = "grid"
    SOLAR = "solar"
    GENERATOR = "generator"
    SUBPANEL = "subpanel"
    BRANCH = "branch"
    TWO_POLE = "two_pole"
    CUSTOM = "custom"
    UNUSED = "unused"

class MeasurementMethod(StrEnum):
    DIRECT = "direct"
    TWO_CT_SUM = "two_ct_sum"
    ONE_CT_DOUBLE_POWER = "one_ct_double_power"
    BOTH_CONDUCTORS_ONE_CT = "both_conductors_one_ct"

class EnergyMode(StrEnum):
    NONE = "none"
    CONSUMPTION = "consumption"
    BIDIRECTIONAL = "bidirectional"
    GENERATION = "generation"

@dataclass(frozen=True, slots=True)
class VoltageReferenceConfig:
    reference_id: str
    label: str
    phase_label: str
    nominal_voltage_v: float
    transformer_model_id: str
    gain_voltage: int
    group_keys: tuple[str, ...]

@dataclass(frozen=True, slots=True)
class MeterSettings:
    friendly_name: str
    electrical_system: ElectricalSystem
    line_frequency_hz: LineFrequencyHz
    update_interval_s: UpdateIntervalSeconds
    voltage_layout: VoltageLayout
    voltage_references: tuple[VoltageReferenceConfig, ...]

@dataclass(frozen=True, slots=True)
class ChannelSettings:
    channel: int
    enabled: bool
    name: str
    model_id: str
    reporting_multiplier: float
    role: CircuitRole
    voltage_reference_id: str
    custom_gain_ct: int | None = None
    custom_label: str | None = None
    burden_output_acknowledged: bool = False

@dataclass(frozen=True, slots=True)
class CircuitAggregate:
    aggregate_id: str
    name: str
    role: CircuitRole
    channels: tuple[int, ...]
    measurement_method: MeasurementMethod
    parent_id: str | None
    energy_mode: EnergyMode
    expose_power: bool = True
    expose_current: bool = False

@dataclass(frozen=True, slots=True)
class MeterConfigurationRequest:
    meter: MeterSettings
    channels: tuple[ChannelSettings, ...]
    aggregates: tuple[CircuitAggregate, ...]
    power_quality: tuple[bool, ...]
    status_fields: tuple[bool, ...]
    multi_reference_preparation_acknowledged: bool = False
```

The request’s `multi_reference_preparation_acknowledged` value is operation-scoped and must not be stored as a claim that hardware was physically verified.

```python
# meter_inventory.py
@dataclass(frozen=True, slots=True)
class MeterConfigurationCapabilities:
    configuration_authoritative: bool
    managed_totals: bool
    multi_reference: bool
    reason_codes: tuple[str, ...]

@dataclass(frozen=True, slots=True)
class MeterConfigurationInventory:
    plan_id: str
    source_sha256: str
    topology: MeterTopology
    configuration: MeterConfigurationRequest
    capabilities: MeterConfigurationCapabilities
    voltage_transformer_catalog: VoltageTransformerCatalog
    ct_catalog: CTPresetCatalog
    warnings: tuple[str, ...]
```

```python
# meter_config_mutator.py
def build_meter_configuration_mutation(
    snapshot: ConfigSnapshot,
    topology: MeterTopology,
    current: MeterConfigurationInventory,
    requested: MeterConfigurationRequest,
    *,
    calibrated: VerifiedCalibrationRecord | None = None,
) -> ConfigMutationPlan
```

```python
# entity_estimator.py
@dataclass(frozen=True, slots=True)
class ConfigurationImpact:
    enabled_channel_count: int
    numeric_entity_count: int
    text_entity_count: int
    energy_entity_count: int
    approximate_publications_per_second: float

def estimate_configuration_impact(
    request: MeterConfigurationRequest,
    topology: MeterTopology,
) -> ConfigurationImpact
```

---

# Detailed Tasks

## Task 1: Freeze the approved design and execution baseline

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Create: `docs/superpowers/specs/2026-08-24-priority-0-meter-configuration-design.md`
- Create: `docs/superpowers/plans/2026-08-24-priority-0-meter-configuration.md`

**Interfaces:**
- Consumes: The Approved Requirements Baseline and Public Data Contracts above.
- Produces: The committed spec and this executable plan.

- [ ] **Step 1: Create an isolated worktree**

Run:

```bash
git fetch origin
git worktree add ../energy-meter-helper-priority-0 -b feat/priority-0-meter-configuration origin/main
cd ../energy-meter-helper-priority-0
git rev-parse HEAD
```

Expected: the printed commit contains PR #21 or is newer than `27d1dfad665c9cc5a8371ab7de428d41f3306118`.

- [ ] **Step 2: Save the design specification**

Copy the complete “Approved Requirements Baseline,” “User-flow constraint,” “Explicit exclusions,” and “Public Data Contracts” sections into:

```text
docs/superpowers/specs/2026-08-24-priority-0-meter-configuration-design.md
```

- [ ] **Step 3: Save this implementation plan**

Save this complete document to:

```text
docs/superpowers/plans/2026-08-24-priority-0-meter-configuration.md
```

- [ ] **Step 4: Verify prohibited scope is absent**

Run:

```bash
grep -RniE 'board_revision|board revision' \
  docs/superpowers/specs/2026-08-24-priority-0-meter-configuration-design.md \
  docs/superpowers/plans/2026-08-24-priority-0-meter-configuration.md
```

Expected: matches appear only in explicit exclusion statements; no proposed type, field, control, or task uses board revision.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-08-24-priority-0-meter-configuration-design.md \
        docs/superpowers/plans/2026-08-24-priority-0-meter-configuration.md
git commit -m "docs: specify priority zero meter configuration"
```

---

## Task 5: Harden official status packages and legacy total IDs

**Repository:** `CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter`

**Files:**
- Modify all `Software/ESPHome/status_fields/6chan_*_status.yaml`.
- Modify every official top-level meter YAML.
- Modify `Software/ESPHome/README.md`.

**Interfaces:**
- Produces:
  - Diagnostic, disabled-by-default status text entities.
  - Stable IDs for official generic total power/current/energy entities.
  - An official configuration contract suitable for helper mutation.

- [ ] **Step 1: Complete status entity categorization**

The baseline already sets `entity_category: diagnostic`. Verify it exists on every phase/frequency status entity, then add:

```yaml
disabled_by_default: true
```

Keep names and component IDs compatible with current helper binding.

- [ ] **Step 2: Add stable IDs to generic totals**

Use consistent official IDs:

```yaml
id: totalAmps
id: totalWatts
id: totalEnergyDaily
```

For board totals retain existing IDs such as `totalAmpsMain`, `totalWattsMain`, and add missing IDs consistently.

- [ ] **Step 3: Add a configuration-contract scalar**

Add to every official top-level file:

```yaml
substitutions:
  csemh_config_contract: "2"
```

Do not add any board-revision scalar.

- [ ] **Step 4: Preserve the full manual power-quality packages**

Do not delete harmonic-power or peak-current definitions from the existing manual package files. Update documentation to state:
- Manual package users still receive the full set.
- CircuitSetup Energy Meter Helper intentionally removes harmonic power and peak current from its managed configuration.

- [ ] **Step 5: Update documentation**

Document the stable IDs and helper-managed status behavior.

- [ ] **Step 6: Commit**

```bash
git add Software/ESPHome
git commit -m "feat(esphome): publish helper configuration contract"
```

---

## Task 6: Add an automated official-config contract validator

**Repository:** `CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter`

**Files:**
- Create: `scripts/validate_helper_contract.py`
- Modify: `.github/workflows/esphome-compile.yml`
- Optionally create: `.github/workflows/helper-contract.yml`

**Interfaces:**
- Consumes: Official YAML changes from Task 5.
- Produces: A CI gate proving the helper’s expected bounded surface exists.

- [ ] **Step 1: Write failing validator tests or self-tests**

The script must enumerate official top-level meter YAML and assert:
- `csemh_config_contract: "2"` exists once.
- `friendly_name`, `update_time`, `electric_freq`, `voltage_cal1`, and `voltage_cal2` exist once.
- Every active CT has `ctN_name` and `current_cal_ctN`.
- Every optional power-quality and status package line exists at most once.
- Generic total IDs are stable.
- No `board_revision` key exists.
- Status packages mark entities diagnostic and disabled by default.

- [ ] **Step 2: Implement the validator**

Use `ruamel.yaml` only if already available in CI; otherwise use line-oriented validation so the script does not introduce a runtime dependency.

- [ ] **Step 3: Add CI invocation**

```bash
python scripts/validate_helper_contract.py
```

Run before the firmware compile matrix.

- [ ] **Step 4: Compile representative official configurations**

At minimum:
- Main-board Wi-Fi.
- Main-board LilyGO Ethernet.
- Main-board Waveshare Ethernet.
- One add-on.
- Three add-ons.
- Six add-ons.

- [ ] **Step 5: Commit**

```bash
git add scripts/validate_helper_contract.py .github/workflows
git commit -m "test: enforce energy meter helper contract"
```

---

## Task 7: Add typed meter configuration models and invariants

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Create: `custom_components/circuitsetup_energy_meter_helper/meter_configuration.py`
- Create: `tests/test_meter_configuration.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/models.py`

**Interfaces:**
- Consumes: Public Data Contracts.
- Produces:
  - All enums/dataclasses listed above.
  - `validate_meter_configuration(request, topology) -> None`.
  - `default_meter_configuration(topology, package_options) -> MeterConfigurationRequest`.

- [ ] **Step 1: Write failing model tests**

Tests must cover:
- Allowed update intervals only.
- Exactly 50 or 60 Hz.
- Every topology group assigned to exactly one voltage reference.
- Every used channel assigned to a valid reference.
- Unused channels require role `UNUSED`.
- Used channels cannot use role `UNUSED`.
- Aggregate IDs are unique safe slugs.
- Aggregate channel lists are unique and in topology.
- `TWO_CT_SUM` requires exactly two enabled channels.
- `ONE_CT_DOUBLE_POWER` requires exactly one enabled channel.
- `BOTH_CONDUCTORS_ONE_CT` requires exactly one enabled channel.
- Parent references exist and contain no cycles.
- Power-quality/status arrays contain one Boolean per board.
- Multi-reference configuration requires operation acknowledgement.
- No field or attribute named `board_revision`.
- No field containing `harmonic` or `peak_current`.

Example:

```python
def test_one_ct_double_power_requires_one_channel(topology):
    aggregate = CircuitAggregate(
        "dryer", "Dryer", CircuitRole.TWO_POLE, (1, 2),
        MeasurementMethod.ONE_CT_DOUBLE_POWER, None,
        EnergyMode.CONSUMPTION,
    )
    with pytest.raises(ValueError, match="one_ct_double_power requires one channel"):
        validate_meter_configuration(request_with(aggregate), topology)
```

- [ ] **Step 2: Run tests and confirm failure**

```bash
uv run pytest -q tests/test_meter_configuration.py
```

Expected: import failure.

- [ ] **Step 3: Implement enums/dataclasses**

Implement the exact Public Data Contracts. Use finite-number validation and control-character rejection. Bounds:
- Friendly/reference/aggregate names: 1–64 characters.
- Nominal voltage: 1–600 V.
- Gain voltage: integer 1–65535.

- [ ] **Step 4: Implement topology-wide validation**

Validation must be pure and deterministic. It must not access Home Assistant or files.

- [ ] **Step 5: Add default profile builders**

Use explicit defaults:

```python
PROFILE_DEFAULTS = {
    ElectricalSystem.SPLIT_PHASE_120_240: (60, 120.0),
    ElectricalSystem.SINGLE_PHASE_230: (50, 230.0),
}
```

For `THREE_PHASE` and `CUSTOM`, require the user to explicitly choose line frequency and reference nominal voltages; do not silently choose authoritative values.

- [ ] **Step 6: Run tests**

```bash
uv run pytest -q tests/test_meter_configuration.py
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper/meter_configuration.py \
        custom_components/circuitsetup_energy_meter_helper/models.py \
        tests/test_meter_configuration.py
git commit -m "feat: model meter and circuit configuration"
```

---

## Task 8: Add a voltage-transformer catalog

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Create: `custom_components/circuitsetup_energy_meter_helper/voltage_transformer_catalog.py`
- Create: `custom_components/circuitsetup_energy_meter_helper/data/voltage_transformers.json`
- Create: `tests/test_voltage_transformer_catalog.py`

**Interfaces:**
- Produces:
  - `VoltageTransformerPreset`.
  - `VoltageTransformerCatalog.load()`.
  - `by_model_id()`.
  - `starting_gain()`.

- [ ] **Step 1: Create catalog data**

Schema:

```json
{
  "schema_version": 1,
  "source_repository": "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter",
  "source_ref": "b94637a4f084a3a4a35e3e5f48eb1586bbd972c3",
  "presets": [
    {
      "model_id": "jameco_reliapro_9vac_120v",
      "label": "Jameco Reliapro 120 V to 9 VAC",
      "primary_nominal_v": 120.0,
      "secondary_nominal_v": 9.0,
      "default_gain_voltage": 7305,
      "notes": "Official CircuitSetup starting value; calibrate for best accuracy."
    }
  ]
}
```

Do not invent a starting gain for unknown 230 V transformers. `custom` is created in code and requires an explicit gain.

- [ ] **Step 2: Write failing tests**

Cover schema version, duplicate IDs, gain bounds, custom validation, and source metadata.

- [ ] **Step 3: Implement catalog loading**

Follow the existing `CTPresetCatalog` resource-loading pattern.

- [ ] **Step 4: Run tests**

```bash
uv run pytest -q tests/test_voltage_transformer_catalog.py
```

- [ ] **Step 5: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper/voltage_transformer_catalog.py \
        custom_components/circuitsetup_energy_meter_helper/data/voltage_transformers.json \
        tests/test_voltage_transformer_catalog.py
git commit -m "feat: add voltage transformer presets"
```

---

## Task 9: Derive meter configuration capabilities

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Create: `custom_components/circuitsetup_energy_meter_helper/meter_inventory.py`
- Create: `tests/test_meter_inventory.py`

**Interfaces:**
- Produces: `MeterConfigurationCapabilities`.

- [ ] **Step 1: Write failing capability tests**

Cover authoritative and non-authoritative configurations with and without contract 2.

- [ ] **Step 2: Implement capability derivation**

```python
def meter_configuration_capabilities(
    *,
    configuration_authoritative: bool,
    config_contract: int | None,
) -> MeterConfigurationCapabilities
```

Rules:
- `configuration_authoritative` gates every YAML write.
- `managed_totals` requires authoritative config and contract 2.
- `multi_reference` requires authoritative config; contract 2 is preferred but helper-managed blocks may be parsed on older configs.
- Return stable reason codes, not provider text.

- [ ] **Step 3: Run tests**

```bash
uv run pytest -q tests/test_meter_inventory.py
```

- [ ] **Step 4: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper/meter_inventory.py \
        tests/test_meter_inventory.py
git commit -m "feat: detect meter configuration capabilities"
```

---

## Task 10: Persist safe meter semantics with a storage migration

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `custom_components/circuitsetup_energy_meter_helper/models.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/store.py`
- Modify: `tests/test_store.py`

**Interfaces:**
- Produces:
  - `StoredMeterConfiguration`.
  - `HelperStore.async_get_meter_configuration(mac)`.
  - `HelperStore.async_save_verified_meter_configuration(mac, configuration)`.

- [ ] **Step 1: Define stored metadata**

Store:
- Config SHA-256.
- Meter settings.
- Channel roles/reference assignments.
- Aggregates.
- Package options.
- Transformer model IDs.

Do not store:
- Raw YAML.
- Credentials.
- Hardware-preparation acknowledgements.
- Board revision.
- Calibration reference measurements.

- [ ] **Step 2: Write migration tests**

Bump:

```python
STORAGE_MINOR_VERSION = 4
```

Migration from 1.3 must add no fabricated meter configuration. Existing CT selections remain unchanged.

- [ ] **Step 3: Implement strict serialization/deserialization**

Reject:
- Unknown enum values.
- Future schema versions.
- Invalid topology channel/group references.
- Config hashes not matching `[0-9a-f]{64}`.
- Any unexpected nested keys.

- [ ] **Step 4: Bind stored semantics to source hash**

`async_get_meter_configuration()` returns `None` when its stored `config_sha256` differs from the current configuration hash.

- [ ] **Step 5: Run tests**

```bash
uv run pytest -q tests/test_store.py
```

- [ ] **Step 6: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper/models.py \
        custom_components/circuitsetup_energy_meter_helper/store.py \
        tests/test_store.py
git commit -m "feat: persist verified meter configuration metadata"
```

---

## Task 11: Extend the bounded configuration parser

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `custom_components/circuitsetup_energy_meter_helper/config_document.py`
- Modify: `tests/test_config_document.py`
- Add fixtures under: `tests/fixtures/`

**Interfaces:**
- Produces parsed spans for:
  - `friendly_name`.
  - `update_time`.
  - `electric_freq`.
  - `csemh_config_contract`.
  - Existing CT/group/gain substitutions.
  - Helper-managed block boundaries.

- [ ] **Step 1: Write failing parser tests**

Fixtures must include:
- Quoted/unquoted allowed values.
- CRLF.
- Comments.
- Missing optional contract.
- Duplicate scalar rejection.
- Unsafe tags/aliases rejection.
- A managed block with exact start/end markers.
- A malicious marker nested inside a scalar/comment that must not count.

- [ ] **Step 2: Add scalar regexes**

```python
METER_SETTING_RE = re.compile(
    r"^(?:friendly_name|update_time|electric_freq|csemh_config_contract)$"
)
```

Parse `friendly_name` from substitutions first because official files place it there. Do not silently fall back to unrelated `esphome.name`.

- [ ] **Step 3: Add managed-block parsing**

Recognize only exact top-level marker comments:

```text
# CircuitSetup Energy Meter Helper: voltage references v1
# End CircuitSetup Energy Meter Helper: voltage references v1
# CircuitSetup Energy Meter Helper: phase overrides v1
# End CircuitSetup Energy Meter Helper: phase overrides v1
# CircuitSetup Energy Meter Helper: aggregates v1
# End CircuitSetup Energy Meter Helper: aggregates v1
```

Reject duplicate, nested, overlapping, or unterminated blocks.

- [ ] **Step 4: Keep arbitrary YAML out of the model**

The parser returns exact spans and normalized bounded values; it does not create a general YAML object tree.

- [ ] **Step 5: Run tests**

```bash
uv run pytest -q tests/test_config_document.py
```

- [ ] **Step 6: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper/config_document.py \
        tests/test_config_document.py tests/fixtures
git commit -m "feat: parse bounded meter configuration fields"
```

---

## Task 12: Separate board topology from voltage-reference topology

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `custom_components/circuitsetup_energy_meter_helper/topology.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/models.py`
- Modify: `tests/test_topology.py`
- Modify calibration/topology fixtures as required.

**Interfaces:**
- Produces:
  - Existing `MeterTopology` remains authoritative for board/group/channel count.
  - `VoltageReferenceTopology` is derived from helper blocks or legacy project metadata.
  - `group_key(board_index, group_index)` remains stable.

- [ ] **Step 1: Write failing topology tests**

Cover:
- Standard legacy project maps all groups to one inferred reference.
- Existing `-2-voltages` project is recognized as legacy multi-reference evidence.
- Helper-managed voltage block overrides legacy inference only when structurally valid.
- Every group must be covered exactly once.
- Unknown project suffix still fails closed for board-count inference.
- Three-phase/custom profiles do not alter board count.
- No board-revision data is accepted.

- [ ] **Step 2: Stop using project suffix as the final voltage authority**

Project metadata remains corroborating evidence. The helper-managed block becomes authoritative after a verified transaction.

- [ ] **Step 3: Update calibration verification identity**

Replace a bare string comparison of `topology_voltage_layout` with a deterministic voltage-topology fingerprint derived from ordered reference IDs and group assignments.

- [ ] **Step 4: Maintain legacy compatibility**

Existing verified records using `standard` or `two_voltages` remain readable and are normalized into the new fingerprint during storage migration/reverification.

- [ ] **Step 5: Run tests**

```bash
uv run pytest -q tests/test_topology.py tests/test_store.py
```

- [ ] **Step 6: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper/topology.py \
        custom_components/circuitsetup_energy_meter_helper/models.py \
        tests/test_topology.py tests/test_store.py
git commit -m "refactor: separate meter and voltage topology"
```

---

## Task 13: Build a complete meter configuration inventory

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `custom_components/circuitsetup_energy_meter_helper/meter_inventory.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/workflow.py`
- Create/modify: `tests/test_meter_inventory.py`
- Modify: `tests/test_workflow.py`

**Interfaces:**
- Produces `Workflow.async_get_meter_configuration(device_id)` and a server-owned plan handle containing:
  - Snapshot.
  - Topology.
  - Parsed configuration.
  - CT and voltage catalogs.
  - Capabilities.
  - Warnings.

- [ ] **Step 1: Write failing inventory tests**

Legacy official config defaults:
- All CTs enabled.
- Existing names/gains preserved.
- Roles default to `CUSTOM`, not guessed from names.
- One inferred voltage reference.
- Electrical system is `CUSTOM` with `needs_electrical_confirmation`.
- Existing package options are detected.
- No aggregate is fabricated from generic totals.

Stored verified semantics with matching hash:
- Restore roles, reference mapping, and aggregates exactly.

- [ ] **Step 2: Implement `MeterConfigurationInventory.from_document()`**

Merge:
1. Authoritative YAML values.
2. Stored semantic metadata only when hash matches.
3. Explicit defaults for fields not inferable.

- [ ] **Step 3: Create generalized plan handles**

Replace `_PlanHandle.inventory: CTInventory` with:

```python
inventory: MeterConfigurationInventory
```

Keep `async_get_ct_inventory()` as a wrapper returning the CT subset.

- [ ] **Step 4: Return capability warnings**

Examples:
- `electrical_profile_requires_confirmation`
- `legacy_generic_totals_unmanaged`
- `stored_semantics_stale`

- [ ] **Step 5: Run tests**

```bash
uv run pytest -q tests/test_meter_inventory.py tests/test_workflow.py
```

- [ ] **Step 6: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper/meter_inventory.py \
        custom_components/circuitsetup_energy_meter_helper/workflow.py \
        tests/test_meter_inventory.py tests/test_workflow.py
git commit -m "feat: inventory complete meter configuration"
```

---

## Task 14: Create deterministic helper-managed block rendering

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Create: `custom_components/circuitsetup_energy_meter_helper/config_blocks.py`
- Create: `tests/test_meter_config_mutator.py`
- Create: `custom_components/circuitsetup_energy_meter_helper/meter_config_mutator.py`

**Interfaces:**
- Produces:
  - `replace_managed_block(content, block_name, rendered) -> str`.
  - Deterministic renderers for voltage references, phase overrides, and aggregates.

- [ ] **Step 1: Write failing block tests**

Cover:
- Insert when absent.
- Replace exactly one existing block.
- Remove an empty block.
- Preserve CRLF.
- Preserve unrelated comments and YAML byte-for-byte.
- Reject duplicate/overlapping markers.
- Deterministic output regardless of input mapping order.

- [ ] **Step 2: Implement exact marker ownership**

Only the three marker pairs defined in Task 11 may be edited.

- [ ] **Step 3: Insert blocks at deterministic locations**

- Voltage references and phase overrides: at the end of the top-level `sensor:` section.
- Aggregates: after phase overrides within `sensor:`.
- Text-status internal overrides: within a dedicated top-level `text_sensor:` managed block if needed.

If a safe insertion point cannot be identified, raise `ConfigMutationError` with a manual snippet; never serialize the document.

- [ ] **Step 4: Add a generalized mutation entry point**

Implement the exact `build_meter_configuration_mutation()` signature.

- [ ] **Step 5: Keep the old CT API as a wrapper**

`build_ct_mutation()` constructs a `MeterConfigurationRequest` from the current inventory plus CT/package changes and delegates to the generalized builder.

- [ ] **Step 6: Run tests**

```bash
uv run pytest -q tests/test_meter_config_mutator.py tests/test_config_mutator.py
```

- [ ] **Step 7: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper/config_blocks.py \
        custom_components/circuitsetup_energy_meter_helper/meter_config_mutator.py \
        custom_components/circuitsetup_energy_meter_helper/config_mutator.py \
        tests/test_meter_config_mutator.py tests/test_config_mutator.py
git commit -m "refactor: render managed meter configuration blocks"
```

---

## Task 15: Extend register-range scaling to supported power-quality values

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `custom_components/circuitsetup_energy_meter_helper/meter_config_mutator.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/config_mutator.py`
- Modify: `tests/test_meter_config_mutator.py`
- Modify: firmware contract fixtures/tests.

**Interfaces:**
- Consumes: `ChannelSettings.reporting_multiplier` and per-board power-quality selection.
- Produces managed phase overrides for:
  - Current.
  - Active power.
  - Reactive power.
  - Apparent power.
  - Removal of harmonic power and peak current.

- [ ] **Step 1: Write failing scaling tests**

For a channel with multiplier 4 and power quality enabled, assert exact YAML:

```yaml
phase_a:
  current:
    filters:
      - multiply: 4
  power:
    filters:
      - multiply: 4
  reactive_power:
    filters:
      - multiply: 4
  apparent_power:
    filters:
      - multiply: 4
  harmonic_power: !remove
  peak_current: !remove
```

Also assert:
- `power_factor` absent from filters.
- `phase_angle` absent from filters.
- Multiplier 1 removes scaling filters.
- Harmonic/peak removal occurs only when the helper-managed PQ package is active for that board.
- Unused channels remove all PQ outputs.
- External conflicting filters fail closed.

- [ ] **Step 2: Replace the old multiplier-only block**

Retire `_MULTIPLIER_START/_END` after adding a migration reader. Render all phase overrides under the v1 phase-override block.

- [ ] **Step 3: Migrate an existing helper multiplier block**

Parse the existing marker block, preserve its current/power multipliers, and rewrite it into the new phase-override block during the next explicit preview. The diff must show the migration.

- [ ] **Step 4: Extend conflict detection**

Reject pre-existing filters on:
- `current`
- `power`
- `reactive_power`
- `apparent_power`

Do not inspect or manage harmonic/peak filters because those entities are removed by the helper block.

- [ ] **Step 5: Validate with ESPHome**

Compile representative configurations:
- PQ disabled, multiplier 4.
- PQ enabled, multiplier 4.
- PQ enabled, multiplier 1.
- Mixed multipliers across one ATM90E32.
- Main plus one add-on.

- [ ] **Step 6: Run tests**

```bash
uv run pytest -q tests/test_meter_config_mutator.py tests/test_config_mutator.py \
  tests/test_firmware_contract.py
```

- [ ] **Step 7: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper/meter_config_mutator.py \
        custom_components/circuitsetup_energy_meter_helper/config_mutator.py \
        tests
git commit -m "fix: scale supported power quality measurements"
```

---

## Task 16: Render electrical settings and voltage references

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `custom_components/circuitsetup_energy_meter_helper/meter_config_mutator.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/config_document.py`
- Modify: `tests/test_meter_config_mutator.py`

**Interfaces:**
- Consumes: `MeterSettings`, `VoltageReferenceConfig`, capabilities.
- Produces:
  - `friendly_name`, `update_time`, and `electric_freq` substitutions.
  - Per-group gain/reference overrides.
  - Visible voltage/frequency entities for each configured reference.

- [ ] **Step 1: Write failing mutation tests**

Assert:
- `update_interval_s=5` writes `update_time: 5s`.
- 50 Hz writes `electric_freq: "50Hz"` while preserving quoting style when possible.
- Friendly name is safely quoted when required.
- Every group has one `gain_voltage`.
- One representative voltage and frequency sensor is exposed per reference.
- Non-representative calibration voltage sensors remain diagnostic/disabled.
- Multi-reference request without acknowledgement fails.
- No board-revision key is generated.

- [ ] **Step 2: Render reference sensor exposure**

Choose the lowest ordered group key assigned to the reference as its representative. Expose exactly one voltage entity and one frequency entity for that reference, with deterministic names and existing stable IDs where possible.

- [ ] **Step 3: Run tests and ESPHome validation**

```bash
uv run pytest -q tests/test_meter_config_mutator.py
```

Then validate one 60 Hz split-phase, one 50 Hz single-phase, and one three-reference configuration.

- [ ] **Step 4: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper/meter_config_mutator.py \
        custom_components/circuitsetup_energy_meter_helper/config_document.py \
        tests/test_meter_config_mutator.py
git commit -m "feat: configure electrical settings"
```

---

## Task 17: Render used/unused channels and two-pole measurement semantics

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `custom_components/circuitsetup_energy_meter_helper/meter_config_mutator.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/entity_binding.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/preflight.py`
- Modify: `tests/test_meter_config_mutator.py`
- Modify: `tests/test_entity_binding.py`
- Modify: `tests/test_preflight.py`

**Interfaces:**
- Consumes: `ChannelSettings`.
- Produces:
  - Unused-channel visibility overrides.
  - Calibration-compatible bindings despite user-hidden runtime entities.
  - Separate circuit power multiplication in aggregate rendering, never in CT gain.

- [ ] **Step 1: Write failing unused-channel tests**

For unused CT3:
- Current and power remain present for native calibration binding but are `internal: true`.
- PQ entities are removed.
- Status phase text is `internal: true` or removed through a tested supported ESPHome override.
- CT gain and calibration references remain intact.
- The channel is excluded from aggregates and entity-impact counts.

- [ ] **Step 2: Keep native calibration contracts intact**

Do not `!remove` current, power, reference current, voltage calibration sensor, or calibration buttons needed by `bind_meter()`/preflight.

- [ ] **Step 3: Implement semantic power methods only in aggregates**

- `DIRECT`: sum selected powers once.
- `TWO_CT_SUM`: sum two selected powers once.
- `ONE_CT_DOUBLE_POWER`: multiply aggregate power-like values by 2; do not double current.
- `BOTH_CONDUCTORS_ONE_CT`: use one channel with no semantic multiplier.

Do not alter `reporting_multiplier` for these methods.

- [ ] **Step 4: Add validation that unused channels cannot participate**

Reject any aggregate containing an unused channel.

- [ ] **Step 5: Run tests**

```bash
uv run pytest -q tests/test_meter_config_mutator.py \
  tests/test_entity_binding.py tests/test_preflight.py
```

- [ ] **Step 6: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper/meter_config_mutator.py \
        custom_components/circuitsetup_energy_meter_helper/entity_binding.py \
        custom_components/circuitsetup_energy_meter_helper/preflight.py \
        tests
git commit -m "feat: configure channel usage and circuit methods"
```

---

## Task 18: Generate accurate aggregates and energy entities

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `custom_components/circuitsetup_energy_meter_helper/meter_config_mutator.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/config_blocks.py`
- Modify: `tests/test_meter_config_mutator.py`
- Modify: `tests/test_firmware_contract.py`

**Interfaces:**
- Consumes: `CircuitAggregate`.
- Produces deterministic ESPHome template and `total_daily_energy` entities.

- [ ] **Step 1: Write failing aggregate-rendering tests**

For a bidirectional grid aggregate using CT1/CT2, assert deterministic IDs:

```text
csemh_grid_power
csemh_grid_import_power
csemh_grid_export_power
csemh_grid_import_energy
csemh_grid_export_energy
```

For consumption:
- Clamp negative power to zero before integration.

For generation:
- Use the configured expected sign and normalize to positive production power.

For one-CT doubled power:
- Apply `* 2.0` to power and energy source.
- Do not double aggregate current.

- [ ] **Step 2: Implement safe lambda generation**

Generate lambdas only from validated numeric channel IDs and fixed operators. Never interpolate arbitrary user text into C++.

Example internal representation:

```python
terms = tuple(f"id(ct{channel}Watts).state" for channel in channels)
expression = " + ".join(terms)
```

Names are emitted only as YAML scalars through the existing safe renderer.

- [ ] **Step 3: Avoid implicit all-channel totals**

Generate no aggregate unless present in `requested.aggregates`.

- [ ] **Step 4: Hide official generic totals**

For contract-2 configurations, set stable official generic total entities `internal: true` before exposing helper totals.

For older configurations:
- Set capability `managed_totals=False`.
- Return `legacy_generic_totals_unmanaged`.
- Reject aggregate preview rather than creating duplicate authoritative totals.

- [ ] **Step 5: Validate parent hierarchy**

Parents are metadata for display and double-count warnings; aggregate formulas use only their explicit channel list. Reject cycles.

- [ ] **Step 6: Compile representative aggregate configurations**

Compile:
- Grid consumption.
- Bidirectional grid.
- Solar generation.
- Subpanel informational group.
- Two-CT appliance.
- One-CT doubled appliance.
- Main plus six add-ons with sparse aggregates.

- [ ] **Step 7: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper/meter_config_mutator.py \
        custom_components/circuitsetup_energy_meter_helper/config_blocks.py \
        tests
git commit -m "feat: generate managed circuit totals and energy"
```

---

## Task 19: Generalize configuration transactions and reconnect verification

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `custom_components/circuitsetup_energy_meter_helper/config_transaction.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/workflow.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/store.py`
- Modify: `tests/test_config_transaction.py`
- Modify: `tests/test_workflow.py`

**Interfaces:**
- Produces:
  - `async_preview_meter_configuration()`.
  - Verified persistence of full meter semantics.
  - Backward-compatible CT wrappers.

- [ ] **Step 1: Write failing transaction tests**

Verify:
- Preview stores full request only in memory.
- Write/validate/compile/install flow is unchanged.
- Reconnect verification checks expected CT names, reference voltage/frequency entity IDs, and aggregate entity IDs.
- Verified meter metadata persists only after reconnect success.
- Rollback never persists requested metadata.
- Transaction scrubbing removes full request and YAML.
- Calibration handoff can include meter configuration changes atomically.

- [ ] **Step 2: Generalize transaction private state**

Replace `selections` with:

```python
meter_configuration: StoredMeterConfiguration | None
expected_entity_ids: frozenset[str]
```

Keep CT selections available through the stored meter configuration.

- [ ] **Step 3: Extend reconnect evidence**

```python
@dataclass(frozen=True, slots=True)
class ReconnectEvidence:
    mac: str
    topology: MeterTopology
    ct_names: Mapping[int, str]
    current_sensor_count: int
    object_ids: frozenset[str]
```

Verify only deterministic expected IDs; do not require optional disabled entities to be enabled in Home Assistant.

- [ ] **Step 4: Preserve old commands**

`async_preview_ct_config()` delegates to `async_preview_meter_configuration()` using the current non-CT settings.

- [ ] **Step 5: Run tests**

```bash
uv run pytest -q tests/test_config_transaction.py tests/test_workflow.py
```

- [ ] **Step 6: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper/config_transaction.py \
        custom_components/circuitsetup_energy_meter_helper/workflow.py \
        custom_components/circuitsetup_energy_meter_helper/store.py \
        tests/test_config_transaction.py tests/test_workflow.py
git commit -m "refactor: transact complete meter configuration"
```

---

## Task 20: Add strict generalized WebSocket commands

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `custom_components/circuitsetup_energy_meter_helper/websocket_api.py`
- Modify: `tests/test_websocket_api.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/diagnostics.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/repairs.py`

**Interfaces:**
- Produces commands:
  - `get_meter_configuration`
  - `preview_meter_configuration`
  - Existing apply/compile/install/rollback transaction commands remain usable.

- [ ] **Step 1: Add failing schema tests**

Test:
- All enums.
- Numeric bounds.
- Maximum 42 channels, 32 aggregates, 8 voltage references.
- Unique IDs enforced in workflow validation.
- Payload remains under 64 KiB.
- `board_revision` rejected as extra.
- `harmonic_power` and `peak_current` rejected as extra.
- Non-admin mutation denied.
- Foreign/stale plan IDs denied.
- Forbidden credential/YAML keys still rejected.

- [ ] **Step 2: Add exact nested Voluptuous schemas**

Use `extra=vol.PREVENT_EXTRA` for every nested mapping.

- [ ] **Step 3: Generalize safe transaction-change serialization**

Replace `_PACKAGE_CHANGE_RE` with an allowlist of server-generated change paths:

```python
_ALLOWED_CHANGE_PATH = re.compile(
    r"(?:meter|voltage_reference|channel|aggregate|package)\.[a-z0-9_.-]+"
)
```

Never allow browser-supplied change records.

- [ ] **Step 4: Add diagnostics signals**

Stable codes:
- `meter_configuration_invalid`
- `legacy_totals_unmanaged`
- `voltage_reference_mismatch`
- `aggregate_entity_mismatch`

- [ ] **Step 5: Run tests**

```bash
uv run pytest -q tests/test_websocket_api.py \
  tests/test_diagnostics.py tests/test_repairs.py
```

- [ ] **Step 6: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper/websocket_api.py \
        custom_components/circuitsetup_energy_meter_helper/diagnostics.py \
        custom_components/circuitsetup_energy_meter_helper/repairs.py \
        tests
git commit -m "feat: expose safe meter configuration api"
```

---

## Task 21: Carry electrical intent through new-device onboarding

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `custom_components/circuitsetup_energy_meter_helper/models.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/provisioning.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/websocket_api.py`
- Modify: `frontend/src/firmware-installer.ts`
- Modify: `frontend/src/components/setup-device-step.ts`
- Modify: `frontend/src/panel.ts`
- Modify corresponding Python/frontend tests.

**Interfaces:**
- Extends `InstallerIntent` with:
  - `electrical_system`.
  - `line_frequency_hz`.
- Does not change firmware product resolution by electrical profile.

- [ ] **Step 1: Write failing intent tests**

Assert:
- Split-phase defaults to a suggested 60 Hz but the user must explicitly select/confirm it.
- Single-phase profile defaults to a suggested 50 Hz but remains editable.
- Three-phase/custom requires explicit line-frequency selection.
- Intent contains no board revision.
- Existing stored installer intent without new fields receives non-authoritative UI defaults.

- [ ] **Step 2: Extend models/schema**

Add exact enum values and strict frequency validation.

- [ ] **Step 3: Keep firmware resolver topology-only**

`resolveMeterProductIds(addonCount, connectionType)` remains unchanged. Do not create profile/frequency firmware permutations.

- [ ] **Step 4: Seed post-adoption Meter Settings**

After automatic adoption, populate the Meter Settings draft from installer intent, then load the authoritative imported configuration before allowing preview.

- [ ] **Step 5: Run tests**

```bash
uv run pytest -q tests/test_provisioning.py tests/test_websocket_api.py
npm --prefix frontend test -- firmware-installer.test.ts panel.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper \
        frontend/src frontend/test tests
git commit -m "feat: carry electrical profile through onboarding"
```

---

## Task 22: Make voltage calibration reference-aware

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `custom_components/circuitsetup_energy_meter_helper/calibration_engine.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/workflow.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/entity_binding.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/preflight.py`
- Modify: `tests/test_calibration_engine_voltage.py`
- Modify: `tests/test_entity_binding.py`
- Modify: `tests/test_preflight.py`
- Modify: `tests/test_workflow.py`

**Interfaces:**
- Produces:
  - Voltage stability/calibration targets keyed by `reference_id`.
  - Arbitrary non-empty group sets per reference.
  - Verified per-group voltage gains rendered by the generalized mutator.

- [ ] **Step 1: Write failing calibration tests**

Cover:
- One reference assigned to all groups.
- Two references assigned across groups.
- Three references.
- Reference with one group.
- Reference with multiple groups across boards.
- Missing/duplicate group assignment rejected before hardware operations.
- Calibration verification preserves per-group gains rather than collapsing only to `voltage_cal1/2`.

- [ ] **Step 2: Change stability request**

Replace the fixed two-group voltage target with:

```python
async_check_stability(
    session_id: str,
    target: Literal["voltage"],
    target_id: str,  # reference_id
) -> tuple[StabilityResult, ...]
```

Resolve group keys server-side from the session’s immutable configuration.

- [ ] **Step 3: Change voltage calibration request**

```python
async_calibrate_voltage(
    session_id: str,
    reference_id: str,
    reference_voltage: float,
    confirm_iteration: bool,
) -> tuple[CalibrationResult, ...]
```

Set the same trusted reference voltage on every group assigned to that reference, run each group’s gain button, and verify each result.

- [ ] **Step 4: Preserve per-group voltage gains**

The final configuration renderer emits exact `gain_voltage` overrides for every group/phase represented by verified evidence. Do not reject valid differences merely because groups share an old `voltage_cal1` or `voltage_cal2` substitution.

- [ ] **Step 5: Keep offset workflow board-scoped**

Offset stages remain per physical board because their preparation and two-chip execution are board-oriented. Do not couple them to the voltage-reference UI.

- [ ] **Step 6: Run tests**

```bash
uv run pytest -q tests/test_calibration_engine_voltage.py \
  tests/test_entity_binding.py tests/test_preflight.py tests/test_workflow.py
```

- [ ] **Step 7: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper \
        tests/test_calibration_engine_voltage.py \
        tests/test_entity_binding.py tests/test_preflight.py tests/test_workflow.py
git commit -m "feat: calibrate by voltage reference"
```

---

## Task 23: Make calibration timing honor the reporting interval

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `custom_components/circuitsetup_energy_meter_helper/calibration_engine.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/offset_readiness.py`
- Modify: `custom_components/circuitsetup_energy_meter_helper/workflow.py`
- Modify calibration tests.

**Interfaces:**
- Produces:
  - `CalibrationTimingPolicy`.
  - Interval-aware sample/evidence deadlines.

- [ ] **Step 1: Add a pure timing policy**

```python
@dataclass(frozen=True, slots=True)
class CalibrationTimingPolicy:
    update_interval_s: int
    sample_count: int

    @property
    def sensor_window_timeout_s(self) -> float:
        return max(35.0, self.update_interval_s * (self.sample_count + 1) + 5.0)

    @property
    def evidence_timeout_s(self) -> float:
        return max(35.0, self.update_interval_s * 2.0 + 15.0)
```

- [ ] **Step 2: Write tests for every supported interval**

Expected sensor-window minimums:
- 1/2/5/10 seconds retain at least 35 seconds.
- 30/60 seconds receive longer deadlines.
- No unbounded timeout.
- Session cancellation still interrupts promptly.

- [ ] **Step 3: Pass parsed current interval into the session**

Calibration uses the currently installed interval, not an uninstalled draft.

- [ ] **Step 4: Add UI warning metadata**

Inventory warning:
- `slow_interval_extends_calibration` for 30/60 seconds.

Do not force a temporary flash in this release.

- [ ] **Step 5: Run tests**

```bash
uv run pytest -q tests/test_calibration_engine_voltage.py \
  tests/test_calibration_engine_current.py \
  tests/test_calibration_engine_offset.py \
  tests/test_offset_readiness.py tests/test_workflow.py
```

- [ ] **Step 6: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper \
        tests
git commit -m "fix: account for meter interval during calibration"
```

---

## Task 24: Add frontend types and API methods

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `frontend/src/types.ts`
- Modify: `frontend/src/api.ts`
- Modify: `frontend/test/api.test.ts`

**Interfaces:**
- Produces TypeScript equivalents of all public meter-configuration types.
- Produces:
  - `HelperApi.getMeterConfiguration(deviceId)`.
  - `HelperApi.previewMeterConfiguration(deviceId, planId, sourceSha256, configuration)`.

- [ ] **Step 1: Add compile-failing type tests/API tests**

Validate exact WebSocket payloads and response decoding.

- [ ] **Step 2: Add discriminated unions**

Use literal unions matching backend enum values. Do not add `board_revision`, `harmonic_power`, or `peak_current`.

- [ ] **Step 3: Keep old CT methods**

Existing `getCtInventory` and `previewCtConfig` remain until all callers migrate.

- [ ] **Step 4: Run tests/typecheck**

```bash
npm --prefix frontend test -- api.test.ts
npm --prefix frontend run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types.ts frontend/src/api.ts frontend/test/api.test.ts
git commit -m "feat(frontend): add meter configuration api types"
```

---

## Task 25: Add the Meter Settings step

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Create: `frontend/src/components/meter-settings-step.ts`
- Modify: `frontend/src/panel.ts`
- Modify: `frontend/src/types.ts`
- Modify: `frontend/src/styles.ts`
- Create: `frontend/test/meter-settings.test.ts`
- Modify: `frontend/test/accessibility.test.ts`
- Modify: `frontend/test/panel.test.ts`

**Interfaces:**
- Consumes: Meter inventory, capabilities, voltage-transformer catalog.
- Produces: A valid `MeterSettings` draft and voltage-reference list.

- [ ] **Step 1: Write failing component tests**

Required controls:
- Friendly name.
- Electrical system.
- Line frequency.
- Reporting interval.
- Voltage-reference cards.
- Transformer selection/custom gain.
- Nominal voltage.
- Phase label.
- Group assignment.
- Generic multi-reference preparation acknowledgement.

Assert there is no board-revision control.

- [ ] **Step 2: Implement profile defaults as suggestions**

When profile changes, populate suggested values only for untouched fields. Never overwrite explicit user edits.

- [ ] **Step 3: Implement group assignment**

Every ATM group appears once across reference cards. Moving a group removes it from its prior reference atomically.

- [ ] **Step 4: Add impact copy for interval**

Display:
- “1–5 seconds: high traffic.”
- “10 seconds: standard.”
- “30–60 seconds: lower traffic; guided calibration takes longer.”

- [ ] **Step 5: Add step navigation**

Flow:

```text
Setup Device → Meter Settings → Circuits & CTs → Safety → …
```

- [ ] **Step 6: Run frontend tests**

```bash
npm --prefix frontend test -- meter-settings.test.ts panel.test.ts accessibility.test.ts
npm --prefix frontend run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src frontend/test
git commit -m "feat(frontend): add meter settings step"
```

---

## Task 26: Expand CT Settings into Circuits & CTs

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `frontend/src/components/ct-inventory-step.ts`
- Create: `frontend/src/components/circuit-aggregates.ts`
- Modify: `frontend/src/panel.ts`
- Modify: `frontend/src/styles.ts`
- Create: `frontend/test/circuit-aggregates.test.ts`
- Modify: `frontend/test/panel.test.ts`
- Modify: `frontend/test/accessibility.test.ts`

**Interfaces:**
- Produces valid `ChannelSettings` and `CircuitAggregate` drafts.

- [ ] **Step 1: Rename visible step**

Change “CT Settings” to “Circuits & CTs” in navigation, heading, announcements, and tests. Internal `PanelStep` may remain `"ct"` to minimize migration.

- [ ] **Step 2: Add channel usage/role/reference controls**

Keep the compact row focused on:
- Used.
- Name.
- CT model.
- Role.
- Voltage reference.
- Status.

Move:
- Reporting multiplier.
- Custom gain.
- Burden acknowledgement.
- Two-pole details.

into the existing expandable row details.

- [ ] **Step 3: Implement unused behavior**

Selecting unused:
- Sets role to `unused`.
- Removes the channel from aggregate drafts after explicit confirmation in the same interaction.
- Disables CT model edits only if the current model/gain remains available for calibration.
- Clearly states calibration entities remain internal.

- [ ] **Step 4: Implement aggregate editor**

Fields:
- Name.
- Role.
- Channels.
- Measurement method.
- Parent.
- Energy mode.
- Expose current.

Provide preset actions:
- Create grid pair from two selected channels.
- Create solar/generator pair.
- Create two-pole appliance.
- Create subpanel feeder.

- [ ] **Step 5: Add double-count prevention**

Do not auto-create an all-channel total. Warn when:
- A root grid aggregate includes branch channels in addition to mains.
- A one-leg-doubled circuit uses two channels.
- A channel is assigned to incompatible two-pole aggregates.

- [ ] **Step 6: Run tests**

```bash
npm --prefix frontend test -- circuit-aggregates.test.ts panel.test.ts accessibility.test.ts
npm --prefix frontend run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src frontend/test
git commit -m "feat(frontend): configure circuits and aggregates"
```

---

## Task 27: Add entity/publication impact estimation

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Create: `custom_components/circuitsetup_energy_meter_helper/entity_estimator.py`
- Create: `tests/test_entity_estimator.py`
- Create: `frontend/src/components/configuration-impact.ts`
- Create: `frontend/test/configuration-impact.test.ts`
- Modify backend inventory/WebSocket and frontend types/panel.

**Interfaces:**
- Produces `ConfigurationImpact`.

- [ ] **Step 1: Define exact counting rules**

Count helper-managed public entities:
- Two base numeric entities per used channel: current and active power.
- Four PQ numeric entities per used channel on PQ-enabled boards: reactive power, apparent power, power factor, phase angle.
- Zero harmonic-power entities.
- Zero peak-current entities.
- One phase-status text entity per used channel on status-enabled boards.
- One voltage and one frequency entity per voltage reference.
- Aggregate power/current/clamp/energy entities according to energy mode.
- Exclude internal calibration entities from the public count.

- [ ] **Step 2: Write estimator tests**

Include:
- 6-channel default.
- 42-channel all-PQ configuration.
- Mixed unused channels.
- Bidirectional grid aggregate.
- One-CT doubled appliance.

- [ ] **Step 3: Compute publication estimate**

```python
approximate_publications_per_second = (
    numeric_measurement_entities + text_status_entities
) / update_interval_s
```

Label it approximate because text statuses may publish only when evaluated/changed and energy sensors can have component-specific behavior.

- [ ] **Step 4: Render impact summary**

Show:
- Enabled channels.
- Approximate public entity count.
- Energy entities.
- Approximate publications per second.
- A documented warning trigger, not arbitrary color-only UI.

- [ ] **Step 5: Run tests**

```bash
uv run pytest -q tests/test_entity_estimator.py
npm --prefix frontend test -- configuration-impact.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add custom_components/circuitsetup_energy_meter_helper/entity_estimator.py \
        tests/test_entity_estimator.py frontend/src frontend/test
git commit -m "feat: estimate configuration entity impact"
```

---

## Task 28: Update review, build, restart, and summary flows

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `frontend/src/components/config-review-step.ts`
- Modify: `frontend/src/components/build-install-step.ts`
- Modify: `frontend/src/components/restart-step.ts`
- Modify: `frontend/src/components/summary-step.ts`
- Modify: `frontend/src/panel.ts`
- Modify corresponding tests.

**Interfaces:**
- Produces a complete review and final summary for meter configuration.

- [ ] **Step 1: Review physical assumptions**

Show:
- Electrical profile/frequency.
- Voltage references and group mapping.
- Multi-reference hardware-preparation acknowledgement when applicable.
- CT burden acknowledgements.
- Two-pole measurement methods.

Do not show board revisions.

- [ ] **Step 2: Review semantic changes**

Show:
- Channel role/reference changes.
- Aggregate formulas in readable text.
- Energy modes.
- PQ/status boards.
- Reporting interval.
- Entity impact.

- [ ] **Step 3: Review exact YAML diff**

Continue using the redacted line-oriented diff. Group changes by:
- Meter.
- Voltage reference.
- Channel.
- Aggregate.
- Package.

- [ ] **Step 4: Preserve current transactional flow**

Explicit preview → admin write → validate → compile → install confirmation → upload → reconnect verification → metadata persistence.

- [ ] **Step 5: Update summary**

Report:
- Configuration authority.
- Calibration authority.
- Installed electrical profile.
- Voltage-reference count.
- Used channel count.
- Aggregate/energy count.
- PQ/status scope.

- [ ] **Step 6: Run tests**

```bash
npm --prefix frontend test -- panel.test.ts accessibility.test.ts
npm --prefix frontend run test:e2e
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src frontend/test
git commit -m "feat(frontend): review complete meter configuration"
```

---

## Task 29: Add end-to-end and regression scenarios

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify/create under: `frontend/test/e2e/`
- Modify: `frontend/test/harness.ts`
- Modify: Python workflow fixtures.
- Modify: `tests/test_firmware_contract.py`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/validate.yml`

**Interfaces:**
- Produces release-blocking regression coverage.

- [ ] **Step 1: Add E2E scenario — standard split-phase**

- New Wi-Fi main-board meter.
- Split-phase, 60 Hz, 10 seconds.
- One voltage reference.
- Two mains CTs.
- Bidirectional grid aggregate.
- No PQ.
- Main-board status enabled.
- Preview and complete through summary.

- [ ] **Step 2: Add E2E scenario — 50 Hz single-phase with scaling**

- Existing one-add-on meter.
- 230 V, 50 Hz.
- Multiplier 4 on one channel.
- PQ enabled on that board.
- Assert preview scales current/active/reactive/apparent and removes harmonic/peak.
- Consumption energy aggregate.

- [ ] **Step 3: Add E2E scenario — three references**

- Three-phase profile.
- Explicit line frequency and three references.
- Generic hardware-preparation acknowledgement.
- Groups assigned exactly once.
- Voltage calibration iterates reference-by-reference.

- [ ] **Step 4: Add E2E scenario — unused channels and two-pole appliance**

- Unused channels hidden.
- Two-CT appliance sum.
- One-CT doubled appliance.
- No double counting in grid aggregate.

- [ ] **Step 5: Add recovery regressions**

- Source hash changes before preview.
- Validation failure after write rolls back.
- Reconnect missing one aggregate entity rolls back/fails safely.
- Cancel during slow-interval calibration releases locks.
- Legacy generic totals block aggregate creation with a clear upgrade message.

- [ ] **Step 6: Run full frontend checks**

```bash
npm --prefix frontend audit
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run test:e2e
```

- [ ] **Step 7: Commit**

```bash
git add frontend/test tests .github/workflows
git commit -m "test: cover priority zero meter configuration"
```

---

## Task 30: Run the full backend, firmware, and Home Assistant verification matrix

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify CI/contract scripts only if failures expose missing deterministic coverage.

**Interfaces:**
- Produces final evidence for release.

- [ ] **Step 1: Run Python quality gates**

```bash
uv run ruff check .
uv run mypy custom_components/circuitsetup_energy_meter_helper
uv run pytest -q \
  --cov=custom_components/circuitsetup_energy_meter_helper \
  --cov-report=term-missing
uv pip check
```

Expected: all pass; no reduction below the repository’s existing coverage gate.

- [ ] **Step 2: Run Home Assistant contract tests**

Run the repository’s stable and development Home Assistant test matrix.

- [ ] **Step 3: Run frontend quality gates**

```bash
npm --prefix frontend ci
npm --prefix frontend audit
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run test:e2e
```

- [ ] **Step 4: Verify built bundle equality**

Build the production frontend and confirm the installed bundle under:

```text
custom_components/circuitsetup_energy_meter_helper/frontend/
```

is byte-identical to the generated output expected by the current release process.

- [ ] **Step 5: Run firmware contracts**

Validate/compile at least:
1. 0 add-ons, Wi-Fi, split-phase, no PQ.
2. 0 add-ons, Wi-Fi, multiplier 4 with PQ.
3. 1 add-on, LilyGO Ethernet, 50 Hz single-phase.
4. 1 add-on, Waveshare Ethernet, three references.
5. 3 add-ons, multi-reference.
6. 6 add-ons, sparse used channels and aggregates.

- [ ] **Step 6: Search prohibited output**

```bash
grep -RniE 'board_revision|board revision' \
  custom_components frontend/src tests frontend/test
```

Expected: no model/schema/UI implementation. Test names may mention rejection.

```bash
grep -RniE 'harmonic_power|peak_current' \
  custom_components/circuitsetup_energy_meter_helper \
  frontend/src
```

Expected: only managed removal constants/rendering and explanatory copy; no selectable field, estimator count, or scaling implementation.

- [ ] **Step 7: Run `git diff --check`**

```bash
git diff --check origin/main...
```

- [ ] **Step 8: Commit any deterministic verification fixes**

Use focused commits by failing subsystem; do not combine unrelated cleanup.

---

## Task 31: Documentation and release

**Repository:** `CircuitSetup/CircuitSetup-Energy-Meter-Helper`

**Files:**
- Modify: `README.md`
- Create/modify user documentation under: `docs/`
- Modify: `custom_components/circuitsetup_energy_meter_helper/manifest.json`
- Modify: `pyproject.toml`
- Modify frontend package/version metadata required by the existing release process.
- Modify release notes/changelog.

**Interfaces:**
- Produces the user-facing release.

- [ ] **Step 1: Document the normal flow**

Explain:
- Setup Device.
- Meter Settings.
- Circuits & CTs.
- Optional calibration.
- Flash & Verify.
- Summary.

- [ ] **Step 2: Document electrical/voltage assumptions**

Explain:
- Profiles are starting structures, not proof of wiring.
- Multiple references require physical preparation.
- No board-revision selection is requested or stored.
- Every CT must use the matching voltage reference for correct power/PF.

- [ ] **Step 3: Document scaling semantics**

Clearly separate:
- Register-range multiplier: current, active power, reactive power, apparent power.
- Circuit power method: one-leg power doubling.
- Power factor and phase angle are never multiplied.
- Harmonic power and peak current are not exposed by helper-managed PQ.

- [ ] **Step 4: Document status packages**

Explain that status entities are diagnostic and disabled by default when their package is enabled.

- [ ] **Step 5: Document totals/double counting**

Explain why mains plus branch channels must not be summed into one total and how explicit aggregates prevent this.

- [ ] **Step 6: Version the release**

Because this adds a new generalized configuration API and user flow, use a minor-version release unless the project’s semantic-versioning policy requires a major version for the command additions.

- [ ] **Step 7: Final review**

Request:
1. Requirements review against the spec.
2. Backend safety review.
3. ESPHome/YAML review.
4. Frontend accessibility review.
5. Cross-repository release-order review.

- [ ] **Step 8: Commit**

```bash
git add README.md docs custom_components pyproject.toml frontend
git commit -m "docs: publish priority zero meter configuration"
```

---

# Acceptance Criteria

The work is complete only when all of the following are demonstrated:

1. A user can configure split-phase, single-phase, three-phase, or custom electrical semantics without editing YAML.
2. Every active ATM90E32 group is assigned to exactly one voltage reference.
3. No board-revision option exists anywhere.
4. The operational interval is one of 1/2/5/10/30/60 seconds and calibration timing remains bounded and correct.
5. Unused channels do not clutter normal Home Assistant entities but calibration remains functional.
6. Register-range multipliers scale current, active power, reactive power, and apparent power consistently.
7. Power factor and phase angle remain unscaled.
8. Helper-managed PQ exposes no harmonic-power or peak-current entities.
9. User-defined aggregates do not rely on an automatic sum of all CTs.
10. Bidirectional grid import/export and generation energy configurations compile and reconnect successfully.
11. Two-CT and one-CT doubled two-pole methods produce the intended formulas without corrupting CT gain.
12. All mutations remain hash-bound, reviewed, validated, compiled, confirmed, installed, reconnect-verified, and rollback-capable.
13. Existing CT-only callers/tests remain supported through wrappers.
14. Runtime-only devices without Device Builder remain read-only except for existing Home Assistant label behavior.
15. Full Python, frontend, Home Assistant, firmware-contract, and E2E test matrices pass.

# Codex Execution Notes

- Use test-driven development for every task.
- Use a fresh subagent for each task or PR-sized workstream.
- Run the focused test before and after each implementation step.
- Commit after every independently reviewable task.
- Do not opportunistically refactor unrelated calibration, provisioning, or frontend code.
- When current `main` differs from the paths/signatures in this plan, preserve the plan’s interfaces and adapt only the file placement necessary to match the repository’s established structure.
