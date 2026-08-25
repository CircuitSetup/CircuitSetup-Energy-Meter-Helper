# Priority 0 Meter Configuration Design Specification

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
