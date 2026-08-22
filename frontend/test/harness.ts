import "../src/index";
import type { HomeAssistant } from "../src/api";
import type { CircuitSetupPanel } from "../src/panel";
import type { CtChannel } from "../src/types";

const device = {
  entry_id: "meter-live-1",
  title: "CircuitSetup meter",
  project_name: "circuitsetup.6c-energy-meter",
  importable: true,
  configuration: null,
};

const channels: CtChannel[] = Array.from({ length: 42 }, (_, index) => ({
  channel: index + 1,
  name: `CT${index + 1}`,
  raw_gain_ct: index === 3 ? 27518 : 5500,
  reporting_multiplier: 1,
  selected_model_id: index === 3 ? null : "cs-ct-200a",
  selection_verified_against_config: index !== 3,
  address: {
    channel: index + 1,
    board_index: Math.floor(index / 6),
    group_index: Math.floor((index % 6) / 3) + 1,
    phase: (["A", "B", "C"] as const)[index % 3]!,
  },
}));

let setup = { state: "no_device", devices: [] as typeof device[] };
const hass: HomeAssistant = {
  async callWS<T>(message: Record<string, unknown>): Promise<T> {
    const operation = String(message.type).split("/").at(-1);
    if (operation === "setup_status" || operation === "set_installer_intent") return setup as T;
    if (operation === "rescan") {
      setup = { state: "device_discovered", devices: [device] };
      return setup as T;
    }
    if (operation === "get_topology") return {
      addon_count: 6,
      board_count: 7,
      ct_count: 42,
      group_count: 14,
      connection_type: "wifi",
      voltage_layout: "two_groups_per_board",
      project_name: device.project_name,
      evidence: [
        { source: "config_project", addon_count: 6, detail: "Project declares six add-on boards" },
        { source: "config_packages", addon_count: 6, detail: "Seven board packages loaded" },
        { source: "native_entity_counts", addon_count: 6, detail: "42 CT channels and 14 voltage groups" },
      ],
    } as T;
    if (operation === "get_ct_inventory") return {
      plan_id: "plan-qa",
      source_sha256: "a".repeat(64),
      channels,
      catalog: {
        presets: [{
          model_id: "cs-ct-200a",
          label: "CS-CT-200A-333mV",
          rated_current_a: 200,
          secondary: "333 mV @ 200 A",
          default_gain_ct: 5500,
          requires_burden_jumper_cut: false,
          notes: "Use burden at least 1 VA for best accuracy.",
        }, {
          model_id: "sct-016",
          label: "SCT-016",
          rated_current_a: 120,
          secondary: "50 mA @ 120 A",
          default_gain_ct: 41787,
          requires_burden_jumper_cut: true,
          notes: "Review the board burden jumper before use.",
        }],
        source_repository: "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter",
        source_ref: "1e5e153",
        schema_version: 1,
      },
    } as T;
    if (operation === "preview_ct_config") return {
      transaction_id: "transaction-qa",
      state: "previewed",
      source_sha256: "a".repeat(64),
      changes: [{ old_value: "CT1", new_value: "Grid Import" }],
      redacted_diff: "- ct1_name: CT1\n+ ct1_name: Grid Import",
      rollback_available: false,
      evidence: [],
      progress: [],
    } as T;
    return {} as T;
  },
  connection: {
    async subscribeMessage() {
      return () => undefined;
    },
  },
};

const panel = document.querySelector("circuitsetup-energy-meter-helper-panel") as CircuitSetupPanel;
panel.panel = { config: { entry_id: "qa-entry" } };
panel.hass = hass;
