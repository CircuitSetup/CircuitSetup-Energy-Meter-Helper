export type ConnectionType =
  | "wifi"
  | "ethernet_lilygo"
  | "ethernet_waveshare"
  | "unknown";

export type FirmwareCatalogState = "idle" | "loading" | "ready" | "error";

export type ElectricalSystem =
  | "split_phase_120_240"
  | "single_phase_230"
  | "three_phase"
  | "custom";
export type LineFrequencyHz = 50 | 60;
export type UpdateIntervalSeconds = 1 | 2 | 5 | 10 | 30 | 60;
export type VoltageLayout = "standard" | "multi_reference" | "custom";
export type CircuitRole = "grid" | "solar" | "generator" | "subpanel" | "branch" | "two_pole" | "custom" | "unused";
export type MeasurementMethod = "direct" | "two_ct_sum" | "one_ct_double_power" | "both_conductors_one_ct";
export type EnergyMode = "none" | "consumption" | "bidirectional" | "generation";

export type SetupState =
  | "no_device"
  | "installer_guide"
  | "waiting_for_discovery"
  | "device_discovered"
  | "waiting_for_adoption"
  | "reading_config"
  | "topology_review"
  | "ct_configuration"
  | "config_review"
  | "config_writing"
  | "config_validating"
  | "config_compiling"
  | "waiting_for_install_confirmation"
  | "config_installing"
  | "waiting_for_reconnect"
  | "ready_for_calibration"
  | "failed";

export interface DiscoveredDevice {
  entry_id: string;
  title: string;
  project_name: string;
  project_version: string | null;
  importable: boolean | null;
  configuration: string | null;
}

export interface InstallerIntent {
  addon_count: number;
  connection_type: Exclude<ConnectionType, "unknown">;
  firmware_product_id?: string;
  esphome_version?: string;
  power_quality?: boolean[];
  status_fields?: boolean[];
  electrical_system?: ElectricalSystem;
  line_frequency_hz?: LineFrequencyHz;
}

export interface MeterSettingsDraft {
  electrical_system: ElectricalSystem;
  line_frequency_hz: LineFrequencyHz;
  authoritative: boolean;
  update_interval_s: number;
  voltage_references: Array<{ reference_id: string; label: string; group_keys: string[] }>;
  warnings: string[];
}

export interface VoltageReferenceConfig {
  reference_id: string;
  label: string;
  phase_label: string;
  nominal_voltage_v: number;
  transformer_model_id: string;
  gain_voltage: number;
  group_keys: string[];
}

export interface MeterSettings {
  friendly_name: string;
  electrical_system: ElectricalSystem;
  line_frequency_hz: LineFrequencyHz;
  update_interval_s: UpdateIntervalSeconds;
  voltage_layout: VoltageLayout;
  voltage_references: VoltageReferenceConfig[];
}

export interface ChannelSettings {
  channel: number;
  enabled: boolean;
  name: string;
  model_id: string;
  reporting_multiplier: number;
  role: CircuitRole;
  voltage_reference_id: string;
  custom_gain_ct: number | null;
  custom_label: string | null;
  burden_output_acknowledged: boolean;
}

export interface CircuitAggregate {
  aggregate_id: string;
  name: string;
  role: CircuitRole;
  channels: number[];
  measurement_method: MeasurementMethod;
  parent_id: string | null;
  energy_mode: EnergyMode;
  expose_power: boolean;
  expose_current: boolean;
}

export interface MeterConfigurationRequest {
  meter: MeterSettings;
  channels: ChannelSettings[];
  aggregates: CircuitAggregate[];
  power_quality: boolean[];
  status_fields: boolean[];
  multi_reference_preparation_acknowledged?: boolean;
}

export interface BoardPackageOptions {
  power_quality: boolean[];
  status_fields: boolean[];
}

export interface SetupSnapshot {
  state: SetupState;
  devices: DiscoveredDevice[];
  configuration_authoritative?: boolean;
  installer_intent?: InstallerIntent;
  bound_device_id?: string | null;
}

export interface TopologyEvidence {
  source:
    | "config_project"
    | "config_packages"
    | "dashboard_import"
    | "native_project"
    | "native_entity_counts";
  addon_count: number;
  detail: string;
}

export interface MeterTopology {
  addon_count: number;
  board_count: number;
  ct_count: number;
  group_count: number;
  connection_type: ConnectionType;
  voltage_layout: string;
  project_name: string;
  evidence: TopologyEvidence[];
}

export interface TopologyResult {
  configuration_authoritative?: boolean;
  topology?: MeterTopology;
  package_options?: BoardPackageOptions;
}

export interface ChannelAddress {
  channel: number;
  board_index: number;
  group_index: number;
  phase: "A" | "B" | "C";
}

export interface CtChannel {
  channel: number;
  name: string;
  raw_gain_ct: number;
  reporting_multiplier: number;
  selected_model_id: string | null;
  selection_verified_against_config: boolean;
  address: ChannelAddress;
  display_label?: string | null;
}

export interface CtPreset {
  model_id: string;
  label: string;
  rated_current_a: number;
  secondary: string;
  default_gain_ct: number | null;
  requires_burden_jumper_cut: boolean;
  notes: string;
}

export interface CtCatalog {
  presets: CtPreset[];
  source_repository: string;
  source_ref: string;
  schema_version: number;
}

export interface CtInventory {
  plan_id: string;
  source_sha256: string;
  channels: CtChannel[];
  catalog: CtCatalog;
}

export interface VoltageTransformerPreset {
  model_id: string;
  label: string;
  primary_nominal_v: number;
  secondary_nominal_v: number;
  default_gain_voltage: number;
  notes: string;
}

export interface VoltageTransformerCatalog {
  presets: VoltageTransformerPreset[];
  source_repository: string;
  source_ref: string;
  schema_version: number;
}

export interface MeterConfigurationCapabilities {
  configuration_authoritative: boolean;
  managed_totals: boolean;
  multi_reference: boolean;
  reason_codes: string[];
}

export interface VoltageReferenceTopology {
  references: Array<[string, string[]]>;
  source: "helper" | "legacy";
}

export interface MeterConfiguration extends CtInventory {
  plan_id: string;
  source_sha256: string;
  topology: MeterTopology;
  configuration: MeterConfigurationRequest;
  capabilities: MeterConfigurationCapabilities;
  voltage_topology: VoltageReferenceTopology;
  voltage_transformer_catalog: VoltageTransformerCatalog;
  ct_catalog: CtCatalog;
  warnings: string[];
}

export interface CtChange {
  channel: number;
  name: string;
  model_id: string;
  reporting_multiplier?: number;
  custom_gain_ct?: number;
  custom_label?: string;
  burden_output_acknowledged?: boolean;
}

export interface LabelUpdateResult {
  mode: "home_assistant_labels";
  results: Array<{ channel: number; state: "updated" | "unchanged" }>;
}

export type TransactionState =
  | "previewed"
  | "write_confirmed"
  | "written"
  | "validated"
  | "compiled"
  | "install_confirmation_required"
  | "installing"
  | "reconnecting"
  | "verified"
  | "rolled_back"
  | "failed";

export interface SubstitutionChange {
  key: string;
  old_value: string | null;
  new_value: string;
}

export interface TransactionStatus {
  transaction_id: string;
  state: TransactionState;
  source_sha256: string;
  changes: SubstitutionChange[];
  redacted_diff: string;
  rollback_available: boolean;
  evidence: string[];
  progress: string[];
  validation_detail?: {
    code: number | null;
    reported_error_count: number | null;
    reported_warning_count: number | null;
    error_record_count: number;
    warning_record_count: number;
  } | null;
  upload_progress?: Array<{ stage: string; progress?: number | null; percentage?: number | null }>;
  aggregate_entity_mismatch: boolean;
  full_meter_configuration_verified: boolean;
}

export interface PreflightIssue {
  code: string;
  role: string;
  detail: string;
}

export interface SessionStatus {
  session_id: string;
  device_id: string;
  state: string;
  safety_acknowledged: boolean;
  preflight: { issues: PreflightIssue[]; zeroed_roles: string[] };
  entity_role_counts?: Record<string, number>;
  calibration_sources?: Record<string, "flash" | "configuration" | "unknown">;
  offset_capability?: {
    status: "available" | "unavailable" | "invalid";
    repair_reason: string | null;
  };
  offset_disposition?: "not_started" | "in_progress" | "completed" | "skipped" | "partial";
  offset_boards?: OffsetBoardStatus[];
  has_pending_calibration?: boolean;
}

export type OffsetStageState = "not_started" | "in_progress" | "completed" | "skipped" | "partial" | "indeterminate";

export interface OffsetBoardStatus {
  board_index: number;
  stages: Array<{ stage: 1 | 2; state: OffsetStageState }>;
}

export interface OffsetReadinessThresholds {
  sample_count: number;
  zero_voltage_peak_volts: number;
  zero_voltage_spread_volts: number;
  zero_current_peak_amps: number;
  zero_current_spread_amps: number;
  voltage_present_minimum_volts: number;
  voltage_present_spread_volts: number;
}

export interface OffsetReadinessResult {
  stage: 1 | 2;
  ready: boolean;
  connection_generation: number;
  entities: Array<{
    role: string;
    quantity: "voltage" | "current";
    ready: boolean;
    reasons: string[];
    window: {
      values: number[];
      received_at: number[];
      connection_generation: number;
      mean: number;
      minimum: number;
      maximum: number;
      absolute_peak: number;
      absolute_spread: number;
    } | null;
  }>;
  reasons: string[];
  thresholds: OffsetReadinessThresholds;
}

export type OffsetTable = [[number, number], [number, number], [number, number]];

export interface OffsetCalibrationResult {
  state: "applied_pending_restart_verification" | "partial" | "indeterminate";
  board_index: number;
  stage: 1 | 2;
  expected_tables: Array<[string, OffsetTable]>;
  unfinished_group_keys: string[];
  retry_allowed: boolean;
  error: string | null;
}

export interface ActiveWork {
  session: SessionStatus | null;
  transaction: TransactionStatus | null;
  verified_calibration: RestartVerificationResult | null;
}

export interface StabilityResult {
  target: "voltage" | "current";
  target_id: string;
  stable: boolean;
  windows: Array<{
    samples: number[];
    mean: number;
    standard_deviation: number;
    range_percent: number;
  }>;
}

export interface CalibrationResult {
  state: string;
  group_key: string;
  phase: string | null;
  changed_channels: number[];
  iteration: number;
  before_values: number[];
  after_values: number[];
  error_percent_values: number[];
  retry_allowed: boolean;
  gain_evidence: {
    connection_generation: number;
    operation_sequence: number;
    instance_id: string;
    phases: Array<{
      phase: "A" | "B" | "C";
      measured_voltage: number;
      measured_current: number;
      reference_voltage: number;
      reference_current: number;
      old_voltage_gain: number;
      new_voltage_gain: number;
      old_current_gain: number;
      new_current_gain: number;
    }>;
    flash_saved: boolean;
    register_mismatch_phases: Array<"A" | "B" | "C">;
    calibration_disabled: boolean;
    matching_lines: string[];
  } | null;
  restore_evidence: Record<string, unknown> | null;
}

interface RestartVerificationBase {
  mac: string;
  topology_addon_count: number;
  topology_project_name: string;
  topology_connection_type: ConnectionType;
  topology_voltage_layout: string;
  connection_generation: number;
  groups: Array<{ instance_id: string; phase_gains: number[][] }>;
  offset_groups: Array<{ instance_id: string; phase_offsets: OffsetTable }>;
  power_offset_groups: Array<{ instance_id: string; phase_power_offsets: OffsetTable }>;
  verification_id: string;
  source_authority: "saved_flash" | "configuration";
  config_filename: string | null;
  config_sha256: string | null;
  source_handoff_available: boolean;
  source_handoff_transaction_id: string | null;
  source_handoff_firmware_installed: boolean;
}

export type RestartVerificationResult = RestartVerificationBase;

export type PanelStep =
  | "setup"
  | "ct"
  | "build"
  | "safety"
  | "offset"
  | "voltage"
  | "current"
  | "restart"
  | "summary";
