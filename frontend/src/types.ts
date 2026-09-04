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
export type TotalOrigin = "advanced" | "migrated";

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

export interface MeterSettingsDraft extends MeterSettings {
  authoritative: boolean;
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
  sources: TotalSource[];
  measurement_method: MeasurementMethod;
  energy_mode: EnergyMode;
  outputs: TotalOutputSettings;
  origin: TotalOrigin;
}

export interface TotalOutputSettings {
  watts: boolean;
  amps: boolean;
  kwh: boolean;
}

export interface BoardTotalSettings {
  board_index: number;
  outputs: TotalOutputSettings;
}

export interface DefaultTotalsSettings {
  overall: TotalOutputSettings;
  boards: BoardTotalSettings[];
}

export type TotalSource =
  | { kind: "channel"; channel: number }
  | { kind: "native_total"; source_id: string }
  | { kind: "aggregate"; aggregate_id: string };

export interface AutomaticTotalSettings {
  candidate_id: string;
  enabled: boolean;
  outputs: TotalOutputSettings;
}

export interface MeterConfigurationRequest {
  meter: MeterSettings;
  channels: ChannelSettings[];
  default_totals: DefaultTotalsSettings;
  automatic_totals: AutomaticTotalSettings[];
  aggregates: CircuitAggregate[];
  power_quality: boolean[];
  status_fields: boolean[];
  multi_reference_preparation_acknowledged?: boolean;
  totals_change_intent?: TotalsChangeIntent;
}

export interface TotalsChangeIntent {
  adopt_managed_totals: boolean;
  legacy_parent_decisions: Array<{ child_id: string; proposed_parent_id: string; accepted: boolean }>;
}

export interface NativeTotalDefinition {
  source_id: string;
  label: string;
  leaf_channels: number[];
  power_id: string;
  current_id: string;
  existing_energy_id: string | null;
  upstream_defaults: TotalOutputSettings;
}

export interface AutomaticTotalCandidate {
  candidate_id: string;
  aggregate_id: string;
  name: string;
  role: CircuitRole;
  sources: Array<{ kind: "channel"; channel: number }>;
  measurement_method: MeasurementMethod;
  energy_mode: EnergyMode;
  recommended_outputs: TotalOutputSettings;
}

export interface ResolvedAutomaticTotal {
  candidate: AutomaticTotalCandidate;
  enabled: boolean;
  outputs: TotalOutputSettings;
}

export interface TotalsInventory {
  native_sources: NativeTotalDefinition[];
  automatic_candidates: AutomaticTotalCandidate[];
  automatic_totals: ResolvedAutomaticTotal[];
  stale_automatic_total_settings: AutomaticTotalSettings[];
  migration: {
    parent_review_required: boolean;
    legacy_parent_links: Array<{ child_id: string; proposed_parent_id: string }>;
    native_visibility_confirmation_required: boolean;
    native_visibility_resolved: boolean;
  };
}

interface TotalOutputEvidence {
  total_id: string;
  ownership: "helper_managed" | "source_owned";
  public_outputs: string[];
  internal_outputs: string[];
  unverified_outputs: string[];
}

export type TotalSummary = TotalOutputEvidence &
  ({ kind: "aggregate" } | { kind: "native_total"; native_sources: string[] });

export interface TotalGraphPreview {
  configuration_impact: ConfigurationImpact;
  plan_id: string;
  source_sha256: string;
  automatic_candidates: AutomaticTotalCandidate[];
  automatic_totals: ResolvedAutomaticTotal[];
  stale_automatic_total_settings: AutomaticTotalSettings[];
  graph: {
    native_visibility: Array<{ sensor_id: string; internal: boolean }>;
    ordered_nodes: Array<{
      aggregate: CircuitAggregate; power_id: string; current_id: string;
      sources: Array<{ label: string; power_id: string; current_id: string; leaf_channels: number[] }>;
      power_required: boolean; current_required: boolean; energy_required: boolean;
    }>;
    leaf_channels: Record<string, number[]>;
    independent_overlap_warnings: Array<{ first_id: string; second_id: string; leaf_channels: number[] }>;
  };
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
  display_label: string | null;
  stored_selection_present: boolean;
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
  native_totals_readable: boolean;
  native_totals_writable: boolean;
  managed_automatic_totals: boolean;
  managed_advanced_totals: boolean;
  multi_reference: boolean;
  semantic_source: ConfigurationSemanticSource;
  reason_codes: string[];
}

export type ConfigurationSemanticSource =
  | "helper_managed"
  | "legacy_inferred";

export interface ConfigurationImpact {
  public_total_entity_count: number;
  internal_total_sensor_count: number;
  enabled_channel_count: number;
  numeric_entity_count: number;
  text_entity_count: number;
  energy_entity_count: number;
  approximate_publications_per_second: number;
}

export interface VoltageReferenceTopology {
  references: Array<[string, string[]]>;
  source: "helper" | "legacy";
}

export interface MeterConfiguration extends CtInventory {
  total_details: TotalSummary[];
  plan_id: string;
  source_sha256: string;
  topology: MeterTopology;
  configuration: MeterConfigurationRequest;
  capabilities: MeterConfigurationCapabilities;
  totals: TotalsInventory;
  voltage_topology: VoltageReferenceTopology;
  voltage_transformer_catalog: VoltageTransformerCatalog;
  ct_catalog: CtCatalog;
  warnings: string[];
  configuration_impact: ConfigurationImpact;
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
  purpose: Exclude<import("./workflow-model").TransactionPurpose, null>;
  transaction_id: string;
  state: TransactionState;
  source_sha256: string;
  changes: SubstitutionChange[];
  redacted_diff: string;
  rollback_available: boolean;
  evidence: string[];
  progress: string[];
  validation_detail: {
    code: number | null;
    reported_error_count: number | null;
    reported_warning_count: number | null;
    error_record_count: number;
    warning_record_count: number;
  } | null;
  upload_progress: Array<{ stage: string; percentage: number | null }>;
  aggregate_entity_mismatch: boolean;
  full_meter_configuration_verified: boolean;
  communication_failed_cs_pins?: number[];
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
  calibration_plan?: "standard" | "full";
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
  saved_offset_sources: Array<[string, "flash" | "configuration" | "unknown"]>;
}

export type OffsetTable = [[number, number], [number, number], [number, number]];

export interface OffsetCalibrationResult {
  state: "applied_pending_restart_verification" | "captured_pending_configuration" | "partial" | "indeterminate";
  board_index: number;
  stage: 1 | 2;
  expected_tables: Array<[string, OffsetTable]>;
  unfinished_group_keys: string[];
  retry_allowed: boolean;
  error: string | null;
}

export interface OffsetPreparationStatus {
  backup_available: boolean;
  operation_id: string | null;
  stage: 1 | 2 | null;
  targets: string[];
  installed: boolean;
  cancelled: boolean;
  action_ready: boolean;
  attempted: string[];
  completed: Array<[string, 1 | 2]>;
}

export interface OffsetFinalizationStatus {
  purpose: "offset_preparation" | "offset_finalization";
  operation_id: string | null;
  transaction_id: string | null;
  stage: 1 | 2 | null;
  board_index: number | null;
  targets: string[];
  backup_available: boolean;
  installed: boolean;
  cancelled: boolean;
  configuration_selected: boolean;
  action_ready: boolean;
  register_verified: false;
  gain_verification_id: string | null;
  results: Array<[string, 1 | 2, OffsetTable, boolean]>;
}

export interface OffsetPreparationPreview {
  operation_id: string;
  stage: 1 | 2;
  targets: string[];
  backup_available: true;
  transaction: TransactionStatus;
}

export interface OffsetFinalizationPreview {
  purpose: "offset_finalization";
  operation_id: string;
  targets: string[];
  transaction: TransactionStatus;
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
