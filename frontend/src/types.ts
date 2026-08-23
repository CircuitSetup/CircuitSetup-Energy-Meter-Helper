export type ConnectionType =
  | "wifi"
  | "ethernet_lilygo"
  | "ethernet_waveshare"
  | "unknown";

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
}

export interface SetupSnapshot {
  state: SetupState;
  devices: DiscoveredDevice[];
  configuration_authoritative?: boolean;
  installer_intent?: InstallerIntent;
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
  calibration_sources?: Record<string, "flash" | "configuration" | "unknown">;
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
  | "topology"
  | "ct"
  | "build"
  | "safety"
  | "voltage"
  | "current"
  | "restart"
  | "summary";
