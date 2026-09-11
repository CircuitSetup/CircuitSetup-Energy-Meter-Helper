import { expect, it } from "vitest";
import { HelperApi, type HomeAssistant } from "../src/api";
import type { MeterTopology } from "../src/types";

const topology: MeterTopology = {
  addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
  connection_type: "wifi", voltage_layout: "two_groups",
  project_name: "circuitsetup.6c-energy-meter", evidence: [],
};
const transaction = {
  transaction_id: "transaction", state: "validated", source_sha256: "a".repeat(64),
  changes: [{ key: "channel.1.name", old_value: "CT 1", new_value: "Kitchen" }],
  redacted_diff: "Reviewed rename", rollback_available: true, evidence: [], progress: [],
  validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false,
  full_meter_configuration_verified: false,
};

function api(result: unknown): HelperApi {
  const hass: HomeAssistant = {
    callWS: async <T>() => result as T,
    connection: { subscribeMessage: async () => () => undefined },
  };
  return new HelperApi(hass, "helper");
}

it("accepts reviewed change keys only inside the active-work transaction", async () => {
  const result = { session: null, transaction, verified_calibration: null };
  await expect(api(result).getActiveWork("meter", topology)).resolves.toEqual(result);
  await expect(api(result).getDiagnosticsSummary()).rejects.toThrow("private field key");
  await expect(api({ ...result, session: { changes: [{ key: "channel.1.name" }] } })
    .getActiveWork("meter", topology)).rejects.toThrow("private field key");
});

it("still refuses private fields and malformed changes in recovered transactions", async () => {
  for (const change of [
    { key: "logger", old_value: "old", new_value: "new" },
    { key: "channel.1.name", old_value: "old", new_value: "new", password: "private" },
    { nested: { key: "channel.1.name" } },
  ]) {
    await expect(api({ session: null, transaction: { ...transaction, changes: [change] }, verified_calibration: null })
      .getActiveWork("meter", topology)).rejects.toThrow();
  }
});
