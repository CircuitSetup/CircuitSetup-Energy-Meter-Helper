import { describe, expect, it } from "vitest";

import { HelperApi, type HomeAssistant } from "../src/api";

class FakeHass implements HomeAssistant {
  public messages: Record<string, unknown>[] = [];
  public connection: HomeAssistant["connection"] = {
    subscribeMessage: async <T>(
      _callback: (message: T) => void,
      message: Record<string, unknown>,
    ) => {
      this.messages.push(message);
      return () => undefined;
    },
  };

  public async callWS<T>(message: Record<string, unknown>): Promise<T> {
    this.messages.push(message);
    return {} as T;
  }
}

describe("HelperApi", () => {
  it("sends the exact Task 19 command identifiers and confirmation handles", async () => {
    const hass = new FakeHass();
    const api = new HelperApi(hass, "entry-1");
    const hash = "a".repeat(64);

    await api.setupStatus();
    await api.listMeters();
    await api.getTopology("meter-1");
    await api.getCtInventory("meter-1");
    await api.setInstallerIntent(6, "ethernet_waveshare");
    await api.rescan();
    await api.adoptDevice("meter-1");
    await api.previewCtConfig("meter-1", "plan-1", hash, [
      {
        channel: 42,
        name: "Workshop",
        model_id: "custom",
        reporting_multiplier: 2,
        custom_gain_ct: 32000,
        custom_label: "Clamp",
        burden_output_acknowledged: true,
      },
    ]);
    await api.applyCtConfig("meter-1", "tx-1", hash);
    await api.compileCtConfig("meter-1", "tx-1", hash);
    await api.installCtConfig("meter-1", "tx-1", hash);
    await api.rollbackCtConfig("meter-1", "tx-1", hash);
    await api.startSession("meter-1");
    await api.getSession("session-1");
    await api.acknowledgeSafety("session-1");
    await api.checkStability("session-1", "current", "42");
    await api.calibrateVoltage("session-1", "addon6_2", 120, true);
    await api.calibrateCurrent("session-1", 42, 25, true);
    await api.restartAndVerify("session-1");
    await api.cancelSession("session-1");
    await api.getDiagnosticsSummary();
    await api.subscribeSetup(() => undefined);
    await api.subscribeConfigTransaction("meter-1", "tx-1", hash, () => undefined);
    await api.subscribeSession("session-1", () => undefined);

    expect(hass.messages.map((message) => message.type)).toEqual([
      "circuitsetup_energy_meter_helper/setup_status",
      "circuitsetup_energy_meter_helper/list_meters",
      "circuitsetup_energy_meter_helper/get_topology",
      "circuitsetup_energy_meter_helper/get_ct_inventory",
      "circuitsetup_energy_meter_helper/set_installer_intent",
      "circuitsetup_energy_meter_helper/rescan",
      "circuitsetup_energy_meter_helper/adopt_device",
      "circuitsetup_energy_meter_helper/preview_ct_config",
      "circuitsetup_energy_meter_helper/apply_ct_config",
      "circuitsetup_energy_meter_helper/compile_ct_config",
      "circuitsetup_energy_meter_helper/install_ct_config",
      "circuitsetup_energy_meter_helper/rollback_ct_config",
      "circuitsetup_energy_meter_helper/start_session",
      "circuitsetup_energy_meter_helper/get_session",
      "circuitsetup_energy_meter_helper/acknowledge_safety",
      "circuitsetup_energy_meter_helper/check_stability",
      "circuitsetup_energy_meter_helper/calibrate_voltage",
      "circuitsetup_energy_meter_helper/calibrate_current",
      "circuitsetup_energy_meter_helper/restart_and_verify",
      "circuitsetup_energy_meter_helper/cancel_session",
      "circuitsetup_energy_meter_helper/get_diagnostics_summary",
      "circuitsetup_energy_meter_helper/subscribe_setup",
      "circuitsetup_energy_meter_helper/subscribe_config_transaction",
      "circuitsetup_energy_meter_helper/subscribe_session",
    ]);
    expect(hass.messages[7]).toEqual({
      type: "circuitsetup_energy_meter_helper/preview_ct_config",
      entry_id: "entry-1",
      device_id: "meter-1",
      plan_id: "plan-1",
      source_sha256: hash,
      changes: [
        {
          channel: 42,
          name: "Workshop",
          model_id: "custom",
          reporting_multiplier: 2,
          custom_gain_ct: 32000,
          custom_label: "Clamp",
          burden_output_acknowledged: true,
        },
      ],
    });
  });

  it("refuses recursively nested browser payload fields that may contain secrets", () => {
    expect(() => HelperApi.assertPublicPayload({ raw_gain_ct: 27518 })).not.toThrow();
    expect(() => HelperApi.assertPublicPayload({ raw_gain_ct_secret: "no" })).toThrow(
      "private field",
    );
    expect(() => HelperApi.assertPublicPayload({ raw_gain_ct_debug: "no" })).toThrow(
      "private field",
    );
    expect(() =>
      HelperApi.assertPublicPayload({
        safe: [{ nested: { api_key: "must never render" } }],
      }),
    ).toThrow("private field");
    for (const key of ["raw", "raw_log", "raw_logs"]) {
      expect(() => HelperApi.assertPublicPayload({ [key]: ["line"] })).toThrow(
        "private field",
      );
    }
    expect(() => HelperApi.assertPublicPayload({ nested: { wifi_password: "no" } })).toThrow(
      "private field",
    );
    expect(() => HelperApi.assertPublicPayload({ authentication_token_value: "no" })).toThrow(
      "private field",
    );
  });
});
