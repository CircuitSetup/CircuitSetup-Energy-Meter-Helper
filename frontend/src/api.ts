import type {
  CalibrationResult,
  ConnectionType,
  CtChange,
  CtInventory,
  DiscoveredDevice,
  MeterTopology,
  SessionStatus,
  SetupSnapshot,
  StabilityResult,
  TransactionStatus,
} from "./types";

export interface HomeAssistant {
  callWS<T>(message: Record<string, unknown>): Promise<T>;
  connection: {
    subscribeMessage<T>(
      callback: (message: T) => void,
      message: Record<string, unknown>,
    ): Promise<() => void>;
  };
}

const PREFIX = "circuitsetup_energy_meter_helper/";
const PRIVATE_FIELD = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i;

export class HelperApi {
  public constructor(
    private readonly hass: HomeAssistant,
    private readonly entryId: string,
  ) {}

  public static assertPublicPayload(value: unknown, depth = 0): void {
    if (depth > 8) throw new Error("payload nesting is too deep");
    if (Array.isArray(value)) {
      for (const item of value) this.assertPublicPayload(item, depth + 1);
      return;
    }
    if (value === null || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (PRIVATE_FIELD.test(key)) throw new Error(`private field ${key} refused`);
      this.assertPublicPayload(item, depth + 1);
    }
  }

  private async call<T>(operation: string, data: Record<string, unknown> = {}): Promise<T> {
    const result = await this.hass.callWS<T>({
      type: `${PREFIX}${operation}`,
      entry_id: this.entryId,
      ...data,
    });
    HelperApi.assertPublicPayload(result);
    return result;
  }

  private subscribe<T>(
    operation: string,
    data: Record<string, unknown>,
    callback: (message: T) => void,
  ): Promise<() => void> {
    return this.hass.connection.subscribeMessage<T>((message) => {
      HelperApi.assertPublicPayload(message);
      callback(message);
    }, { type: `${PREFIX}${operation}`, entry_id: this.entryId, ...data });
  }

  public setupStatus = () => this.call<SetupSnapshot>("setup_status");
  public listMeters = () => this.call<DiscoveredDevice[]>("list_meters");
  public getTopology = (deviceId: string) =>
    this.call<MeterTopology | { topology: MeterTopology }>("get_topology", { device_id: deviceId });
  public getCtInventory = (deviceId: string) =>
    this.call<CtInventory>("get_ct_inventory", { device_id: deviceId });
  public getSession = (sessionId: string) =>
    this.call<SessionStatus>("get_session", { session_id: sessionId });
  public getDiagnosticsSummary = () => this.call<Record<string, unknown>>("get_diagnostics_summary");
  public setInstallerIntent = (addonCount: number, connectionType: Exclude<ConnectionType, "unknown">) =>
    this.call<SetupSnapshot>("set_installer_intent", { addon_count: addonCount, connection_type: connectionType });
  public rescan = () => this.call<SetupSnapshot>("rescan");
  public adoptDevice = (deviceId: string) =>
    this.call<{ device_id: string; configuration: string }>("adopt_device", { device_id: deviceId });
  public previewCtConfig = (
    deviceId: string,
    planId: string,
    sourceSha256: string,
    changes: CtChange[],
  ) => this.call<TransactionStatus>("preview_ct_config", {
    device_id: deviceId,
    plan_id: planId,
    source_sha256: sourceSha256,
    changes,
  });
  private transaction = (operation: string, deviceId: string, transactionId: string, sourceSha256: string) =>
    this.call<TransactionStatus>(operation, {
      device_id: deviceId,
      transaction_id: transactionId,
      source_sha256: sourceSha256,
    });
  public applyCtConfig = (deviceId: string, transactionId: string, sourceSha256: string) =>
    this.transaction("apply_ct_config", deviceId, transactionId, sourceSha256);
  public compileCtConfig = (deviceId: string, transactionId: string, sourceSha256: string) =>
    this.transaction("compile_ct_config", deviceId, transactionId, sourceSha256);
  public installCtConfig = (deviceId: string, transactionId: string, sourceSha256: string) =>
    this.transaction("install_ct_config", deviceId, transactionId, sourceSha256);
  public rollbackCtConfig = (deviceId: string, transactionId: string, sourceSha256: string) =>
    this.transaction("rollback_ct_config", deviceId, transactionId, sourceSha256);
  public startSession = (deviceId: string) =>
    this.call<SessionStatus>("start_session", { device_id: deviceId });
  public acknowledgeSafety = (sessionId: string) =>
    this.call<SessionStatus>("acknowledge_safety", { session_id: sessionId, acknowledged: true });
  public checkStability = (sessionId: string, target: "voltage" | "current", targetId: string) =>
    this.call<StabilityResult>("check_stability", { session_id: sessionId, target, target_id: targetId });
  public calibrateVoltage = (sessionId: string, groupKey: string, reference: number, confirmIteration: boolean) =>
    this.call<CalibrationResult>("calibrate_voltage", {
      session_id: sessionId,
      group_key: groupKey,
      reference,
      confirm_iteration: confirmIteration,
    });
  public calibrateCurrent = (sessionId: string, channel: number, reference: number, confirmIteration: boolean) =>
    this.call<CalibrationResult>("calibrate_current", {
      session_id: sessionId,
      channel,
      reference,
      confirm_iteration: confirmIteration,
    });
  public restartAndVerify = (sessionId: string) =>
    this.call<Record<string, unknown>>("restart_and_verify", { session_id: sessionId });
  public cancelSession = (sessionId: string) =>
    this.call<SessionStatus>("cancel_session", { session_id: sessionId });
  public subscribeSetup = (callback: (message: SetupSnapshot) => void) =>
    this.subscribe("subscribe_setup", {}, callback);
  public subscribeConfigTransaction = (
    deviceId: string,
    transactionId: string,
    sourceSha256: string,
    callback: (message: TransactionStatus) => void,
  ) => this.subscribe("subscribe_config_transaction", {
    device_id: deviceId,
    transaction_id: transactionId,
    source_sha256: sourceSha256,
  }, callback);
  public subscribeSession = (sessionId: string, callback: (message: SessionStatus) => void) =>
    this.subscribe("subscribe_session", { session_id: sessionId }, callback);
}
