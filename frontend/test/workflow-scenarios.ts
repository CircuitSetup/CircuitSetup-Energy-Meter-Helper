import type {
  DiscoveredDevice,
  MeterConfiguration,
  MeterTopology,
  RestartVerificationResult,
  SessionStatus,
  SetupSnapshot,
  TransactionStatus,
} from "../src/types";

export interface WorkflowScenario {
  setup: SetupSnapshot;
  device: DiscoveredDevice;
  topology: MeterTopology;
  meterConfiguration?: MeterConfiguration;
  session?: SessionStatus;
  transaction?: TransactionStatus;
  restartVerification?: RestartVerificationResult;
}

export const device: DiscoveredDevice = {
  entry_id: "meter-1",
  title: "Basement meter",
  project_name: "circuitsetup.6c-energy-meter",
  project_version: "2026.8.0",
  importable: true,
  configuration: null,
};

export const meterResponse = (
  electrical_system: "split_phase_120_240" | "single_phase_230" | "three_phase" | "custom" = "split_phase_120_240",
  line_frequency_hz: 50 | 60 = 60,
  update_interval_s: 1 | 2 | 5 | 10 | 30 | 60 = 5,
): MeterConfiguration => ({
  plan_id: "b".repeat(32),
  source_sha256: "a".repeat(64),
  topology: {
    addon_count: 0,
    board_count: 1,
    ct_count: 6,
    group_count: 2,
    connection_type: "wifi",
    voltage_layout: "standard",
    project_name: device.project_name,
    evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }],
  },
  configuration: {
    meter: {
      friendly_name: "Energy meter",
      electrical_system,
      line_frequency_hz,
      update_interval_s,
      voltage_layout: "standard",
      voltage_references: [{
        reference_id: "main",
        label: "Main",
        phase_label: "A",
        nominal_voltage_v: 120,
        transformer_model_id: "default",
        gain_voltage: 7305,
        group_keys: ["main_1", "main_2"],
      }],
    },
    channels: Array.from({ length: 6 }, (_, index) => ({
      channel: index + 1,
      enabled: true,
      name: `CT${index + 1}`,
      model_id: "model",
      reporting_multiplier: 1,
      role: "branch" as const,
      voltage_reference_id: "main",
      custom_gain_ct: null,
      custom_label: null,
      burden_output_acknowledged: false,
    })),
    aggregates: [],
    power_quality: [true],
    status_fields: [false],
    multi_reference_preparation_acknowledged: false,
  },
  capabilities: {
    configuration_authoritative: true,
    managed_totals: true,
    multi_reference: true,
    semantic_source: "helper_managed",
    reason_codes: [],
  },
  voltage_topology: { references: [["main", ["main_1", "main_2"]]], source: "legacy" },
  voltage_transformer_catalog: {
    presets: [{
      model_id: "default",
      label: "Default",
      primary_nominal_v: 120,
      secondary_nominal_v: 9,
      default_gain_voltage: 7305,
      notes: "Approved",
    }],
    source_repository: "CircuitSetup/repo",
    source_ref: "a".repeat(40),
    schema_version: 1,
  },
  ct_catalog: {
    presets: [],
    source_repository: "CircuitSetup/repo",
    source_ref: "approved",
    schema_version: 1,
  },
  warnings: [],
  configuration_impact: {
    enabled_channel_count: 6,
    numeric_entity_count: 38,
    text_entity_count: 0,
    energy_entity_count: 0,
    approximate_publications_per_second: 7.6,
  },
  channels: Array.from({ length: 6 }, (_, index) => ({
    channel: index + 1,
    name: `CT${index + 1}`,
    raw_gain_ct: 5500,
    reporting_multiplier: 1,
    selected_model_id: "model",
    selection_verified_against_config: true,
    address: {
      channel: index + 1,
      board_index: 0,
      group_index: Math.floor(index / 3),
      phase: (["A", "B", "C"] as const)[index % 3]!,
    },
    display_label: null,
    stored_selection_present: false,
  })),
  catalog: {
    presets: [],
    source_repository: "CircuitSetup/repo",
    source_ref: "approved",
    schema_version: 1,
  },
});

const configuredDevice = (): DiscoveredDevice => ({
  ...device,
  importable: false,
  configuration: "meter.yaml",
});

const setupFor = (selected: DiscoveredDevice, configurationAuthoritative = true): SetupSnapshot => ({
  state: "device_discovered",
  devices: [selected],
  configuration_authoritative: configurationAuthoritative,
  bound_device_id: selected.entry_id,
});

const transaction = (state: TransactionStatus["state"] = "previewed"): TransactionStatus => ({
  transaction_id: "2".repeat(32),
  state,
  source_sha256: "a".repeat(64),
  changes: [],
  redacted_diff: "",
  rollback_available: false,
  evidence: [],
  progress: [],
  validation_detail: null,
  upload_progress: [],
  aggregate_entity_mismatch: false,
  full_meter_configuration_verified: false,
});

const session: SessionStatus = {
  session_id: "3".repeat(32),
  device_id: device.entry_id,
  state: "verified",
  safety_acknowledged: true,
  preflight: { issues: [], zeroed_roles: [] },
  has_pending_calibration: false,
};

const restartVerification: RestartVerificationResult = {
  mac: "aabbccddeeff",
  config_filename: "meter.yaml",
  config_sha256: "a".repeat(64),
  topology_addon_count: 0,
  topology_project_name: device.project_name,
  topology_connection_type: "wifi",
  topology_voltage_layout: "standard",
  connection_generation: 1,
  groups: [{
    instance_id: "meter_main1",
    phase_gains: [[7305, 5500], [7305, 5500], [7305, 5500]],
  }],
  offset_groups: [],
  power_offset_groups: [],
  verification_id: "4".repeat(32),
  source_authority: "saved_flash",
  source_handoff_available: true,
  source_handoff_transaction_id: "2".repeat(32),
  source_handoff_firmware_installed: false,
};

const newDevice = { ...device };
const helperDevice = configuredDevice();
const helperConfiguration = meterResponse();
const legacyConfiguration = meterResponse();
legacyConfiguration.capabilities.managed_totals = false;
legacyConfiguration.capabilities.reason_codes = ["electrical_profile_requires_confirmation"];
legacyConfiguration.warnings = ["electrical_profile_requires_confirmation"];

export const newInstallScenario: WorkflowScenario = {
  setup: setupFor(newDevice),
  device: newDevice,
  topology: meterResponse().topology,
};

export const helperManagedScenario: WorkflowScenario = {
  setup: setupFor(helperDevice),
  device: helperDevice,
  topology: helperConfiguration.topology,
  meterConfiguration: helperConfiguration,
};

export const legacyEditableScenario: WorkflowScenario = {
  setup: setupFor(configuredDevice()),
  device: configuredDevice(),
  topology: legacyConfiguration.topology,
  meterConfiguration: legacyConfiguration,
};

export const importableExistingScenario: WorkflowScenario = {
  setup: setupFor({ ...device }),
  device: { ...device },
  topology: meterResponse().topology,
};

export const runtimeOnlyScenario: WorkflowScenario = {
  setup: setupFor({ ...device, importable: false }, false),
  device: { ...device, importable: false },
  topology: meterResponse().topology,
};

export const activeConfigurationTransactionScenario: WorkflowScenario = {
  ...helperManagedScenario,
  transaction: transaction("validated"),
};

export const activeCalibrationHandoffScenario: WorkflowScenario = {
  ...helperManagedScenario,
  session,
  transaction: transaction(),
  restartVerification,
};
