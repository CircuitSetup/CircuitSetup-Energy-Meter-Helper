import { render } from "lit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import "../src/index";
import { espWebInstaller } from "../src/components/esp-web-installer";
import { configReview } from "../src/components/config-review-step";
import { buildInstallStep } from "../src/components/build-install-step";
import { summaryStep } from "../src/components/summary-step";
import type { HomeAssistant } from "../src/api";
import type { CircuitSetupPanel } from "../src/panel";
import { changesFromDrafts, circuitConfigurationIsValid, ctInventoryStep, type CtDraft } from "../src/components/ct-inventory-step";
import { meterSettingsStep } from "../src/components/meter-settings-step";
import type { FirmwareOption } from "../src/firmware-installer";
import { panelStyles } from "../src/styles";
import type { CtInventory, MeterConfigurationRequest, MeterSettingsDraft, MeterTopology } from "../src/types";

const tick = async () => {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

it("renders the live Install percentage", () => {
  const host = document.createElement("div");
  const status = { transaction_id: "1".repeat(32), state: "installing", source_sha256: "a".repeat(64), changes: [], redacted_diff: "", rollback_available: true, evidence: [], progress: ["firmware_compiled"], validation_detail: null, upload_progress: [{ stage: "uploading", percentage: 48 }], aggregate_entity_mismatch: false, full_meter_configuration_verified: false } as import("../src/types").TransactionStatus;
  const noop = () => undefined;
  render(buildInstallStep(status, noop, noop, noop, noop, noop, noop, null, null, false, false, "install"), host);

  const progress = host.querySelector<HTMLProgressElement>("progress");
  expect(progress?.value).toBe(48);
  expect(progress?.getAttribute("aria-label")).toBe("Install progress: 48%");
});

it("does not relabel retained Compile progress while Install starts", () => {
  const host = document.createElement("div");
  const status = { transaction_id: "1".repeat(32), state: "install_confirmation_required", source_sha256: "a".repeat(64), changes: [], redacted_diff: "", rollback_available: true, evidence: [], progress: ["firmware_compiled"], validation_detail: null, upload_progress: [{ stage: "transfer", percentage: 65 }], aggregate_entity_mismatch: false, full_meter_configuration_verified: false } as import("../src/types").TransactionStatus;
  const noop = () => undefined;
  render(buildInstallStep(status, noop, noop, noop, noop, noop, noop, null, null, false, false, "install"), host);

  const progress = host.querySelector<HTMLProgressElement>("progress");
  expect(progress?.hasAttribute("value")).toBe(false);
  expect(progress?.getAttribute("aria-label")).toBe("Install progress: in progress");
});

it.each(["entity_mismatch", "reconnect_unavailable"] as const)("shows only the latest determinate Install progress and allows %s retry", (evidence) => {
  const host = document.createElement("div");
  const status = { transaction_id: "1".repeat(32), state: "install_confirmation_required", source_sha256: "a".repeat(64), changes: [], redacted_diff: "", rollback_available: true, evidence: [evidence], progress: ["firmware_compiled", "ota_uploaded"], validation_detail: null, upload_progress: [{ stage: "uploading", percentage: 99 }, { stage: "uploading", percentage: 100 }, { stage: "uploading", percentage: null }], aggregate_entity_mismatch: false, full_meter_configuration_verified: false } as import("../src/types").TransactionStatus;
  const noop = () => undefined;
  render(buildInstallStep(status, noop, noop, noop, noop, noop, noop), host);

  expect(host.textContent).toContain("Build or install needs attention");
  expect(host.querySelectorAll(".upload-progress li")).toHaveLength(0);
  expect(host.querySelector<HTMLProgressElement>("progress")?.value).toBe(100);
  expect([...host.querySelectorAll("button")].find((button) => button.textContent === "Retry Install")?.disabled).toBe(false);
  expect([...host.querySelectorAll("button")].some((button) => button.textContent === "Rollback")).toBe(true);
});

const device = {
  entry_id: "meter-1",
  title: "Basement meter",
  project_name: "circuitsetup.6c-energy-meter",
  project_version: "2026.8.0",
  importable: true,
  configuration: null,
};

const firmwareIndex = [
  { productId: "6chan_energy_meter_main_board", name: "Main board", versions: [{ version: "2026.8.0" }, { version: "2026.7.0" }] },
  { productId: "6chan_energy_meter_1-addon", name: "One add-on", versions: [{ version: "2026.8.0" }, { version: "2026.6.0" }] },
  { productId: "6chan_energy_meter_1-addon_ethernet", name: "One add-on Ethernet", versions: [{ version: "2026.6.0" }] },
  { productId: "6chan_energy_meter_1-addon_ethernet_waveshare", name: "One add-on Waveshare", versions: [{ version: "2026.9.0" }] },
];

const firmwareResponse = (index = firmwareIndex) => new Response(JSON.stringify(index), { status: 200 });
const offsetReadinessEntities = (voltage = 0) => [0, 1].flatMap((groupOffset) => [
  ...["a", "b", "c"].map((phase) => ({ role: `main_${groupOffset + 1}.voltage_${phase}`, quantity: "voltage", ready: true, reasons: [],
    window: { values: [voltage, voltage, voltage], received_at: [1, 2, 3], connection_generation: 4,
      mean: voltage, minimum: voltage, maximum: voltage, absolute_peak: Math.abs(voltage), absolute_spread: 0 } })),
  ...[1, 2, 3].map((offset) => ({ role: `ct${groupOffset * 3 + offset}.current_sensor`, quantity: "current", ready: true, reasons: [],
    window: { values: [0, 0, 0], received_at: [1, 2, 3], connection_generation: 4,
      mean: 0, minimum: 0, maximum: 0, absolute_peak: 0, absolute_spread: 0 } })),
]);

const makeHass = (responses: Record<string, unknown>): HomeAssistant => ({
  callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
    const operation = String(message.type).split("/").at(-1) ?? "";
    const response = responses[operation] ?? {};
    if (response instanceof Error) throw response;
    return response as T;
  },
  connection: {
    subscribeMessage: async () => () => undefined,
  },
});

const meterResponse = (electrical_system = "split_phase_120_240", line_frequency_hz = 60, update_interval_s = 5) => ({
  plan_id: "b".repeat(32), source_sha256: "a".repeat(64), topology: { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2, connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name, evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] },
  configuration: { meter: { friendly_name: "Energy meter", electrical_system, line_frequency_hz, update_interval_s, voltage_layout: "standard", voltage_references: [{ reference_id: "main", label: "Main", phase_label: "A", nominal_voltage_v: 120, transformer_model_id: "default", gain_voltage: 7305, group_keys: ["main_1", "main_2"] }] }, channels: Array.from({ length: 6 }, (_, index) => ({ channel: index + 1, enabled: true, name: `CT${index + 1}`, model_id: "model", reporting_multiplier: 1, role: "branch", voltage_reference_id: "main", custom_gain_ct: null, custom_label: null, burden_output_acknowledged: false })), aggregates: [], power_quality: [true], status_fields: [false], multi_reference_preparation_acknowledged: false },
  capabilities: { configuration_authoritative: true, managed_totals: true, multi_reference: true, reason_codes: [] }, voltage_topology: { references: [["main", ["main_1", "main_2"]]], source: "legacy" }, voltage_transformer_catalog: { presets: [{ model_id: "default", label: "Default", primary_nominal_v: 120, secondary_nominal_v: 9, default_gain_voltage: 7305, notes: "Approved" }], source_repository: "CircuitSetup/repo", source_ref: "a".repeat(40), schema_version: 1 }, ct_catalog: { presets: [], source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 }, warnings: [], configuration_impact: { enabled_channel_count: 6, numeric_entity_count: 38, text_entity_count: 0, energy_entity_count: 0, approximate_publications_per_second: 7.6 }, channels: Array.from({ length: 6 }, (_, index) => ({ channel: index + 1, name: `CT${index + 1}`, raw_gain_ct: 5500, reporting_multiplier: 1, selected_model_id: "model", selection_verified_against_config: true, address: { channel: index + 1, board_index: 0, group_index: Math.floor(index / 3), phase: (["A", "B", "C"] as const)[index % 3] }, display_label: null, stored_selection_present: false })), catalog: { presets: [], source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 },
});

const mount = async (hass: HomeAssistant) => {
  const panel = document.createElement(
    "circuitsetup-energy-meter-helper-panel",
  ) as CircuitSetupPanel;
  panel.panel = { config: { entry_id: "entry-1" } };
  panel.hass = hass;
  document.body.append(panel);
  await tick();
  await panel.updateComplete;
  return panel;
};

const text = (panel: CircuitSetupPanel) => panel.shadowRoot?.textContent ?? "";

const contrastRatio = (first: string, second: string): number => {
  const luminance = (color: string) => {
    const channels = color.slice(1).match(/../g)!.map((value) => Number.parseInt(value, 16) / 255)
      .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
  };
  const values = [luminance(first), luminance(second)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
};

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(firmwareResponse()))));

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("meter configuration review and summary", () => {
  it("reviews physical, semantic, package, and entity details without threshold controls", () => {
    const meter = meterResponse() as unknown as import("../src/types").MeterConfiguration;
    meter.configuration.aggregates = [{ aggregate_id: "main-service", name: "Main service", role: "grid", channels: [1, 2], measurement_method: "two_ct_sum", parent_id: null, energy_mode: "bidirectional", expose_power: true, expose_current: true }];
    const transaction = { transaction_id: "1".repeat(32), state: "previewed", source_sha256: "a".repeat(64), changes: [], redacted_diff: "Meter:\n+ interval: 5", rollback_available: false, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: true } as import("../src/types").TransactionStatus;
    const root = document.createElement("div");
    render(configReview(transaction, meter.configuration, meter.configuration_impact), root);
    const review = root.textContent ?? "";
    expect(review).toContain("Electrical profile");
    expect(review).toContain("Voltage references");
    expect(review).toContain("CT1 CT1: branch on main");
    expect(review).toContain("Main service = CT1 + CT2");
    expect(review).toContain("Power quality");
    expect(review).not.toContain("threshold");

    const finish = vi.fn();
    render(summaryStep(meter.topology, null, { ...transaction, state: "verified" }, new Map(), new Map(), null, false, "2026.8.0", () => undefined, () => undefined, meter, meter.configuration_impact, finish), root);
    const summary = root.textContent ?? "";
    expect(summary).toContain("Configuration authority");
    expect(summary).toContain("Installed electrical profile");
    expect(summary).toContain("Aggregate energy");
    expect(summary).toContain("Installed package scope");
    expect(summary).toContain("Main board");
    expect(summary).toContain("Reporting and entities");
    root.querySelector<HTMLButtonElement>('[data-action="finish"]')?.click();
    expect(finish).toHaveBeenCalledOnce();

    render(summaryStep(meter.topology, null, null, new Map(), new Map(), null, true, "2026.8.0", () => undefined, () => undefined, meter, meter.configuration_impact), root);
    expect(root.textContent).toContain("Installed electrical profile");
    render(summaryStep(meter.topology, null, { ...transaction, state: "failed" }, new Map(), new Map(), null, false, "2026.8.0", () => undefined, () => undefined, null), root);
    expect(root.textContent).not.toContain("Installed electrical profile");
  });

  it("uses the verified configuration for a no-change summary, never a pending edit", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    const verified = meterResponse() as unknown as import("../src/types").MeterConfiguration;
    const pending = { ...verified, configuration: { ...verified.configuration, meter: { ...verified.configuration.meter, line_frequency_hz: 50 as import("../src/types").LineFrequencyHz } } };
    const state = panel as unknown as { verifiedMeterConfiguration: typeof verified | null; meterConfiguration: typeof verified | null; transaction: import("../src/types").TransactionStatus | null; completedWithoutChanges: boolean };
    state.verifiedMeterConfiguration = verified;
    state.meterConfiguration = pending;
    state.transaction = null;
    state.completedWithoutChanges = true;
    panel.showState("summary"); await panel.updateComplete;
    expect(text(panel)).toContain("60 Hz");
    expect(text(panel)).not.toContain("50 Hz");

    state.verifiedMeterConfiguration = null;
    state.transaction = { transaction_id: "1".repeat(32), state: "failed", source_sha256: "a".repeat(64), changes: [], redacted_diff: "", rollback_available: false, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };
    panel.requestUpdate(); await panel.updateComplete;
    expect(text(panel)).not.toContain("Installed electrical profile");
  });

  it("does not treat a non-authoritative configuration response as installed", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    const configuration = meterResponse() as unknown as import("../src/types").MeterConfiguration;
    configuration.capabilities = { ...configuration.capabilities, configuration_authoritative: false };
    const state = panel as unknown as {
      setMeterConfiguration(configuration: import("../src/types").MeterConfiguration): void;
      completedWithoutChanges: boolean;
      transaction: import("../src/types").TransactionStatus | null;
    };
    state.setMeterConfiguration(configuration);
    state.completedWithoutChanges = true;
    state.transaction = null;
    panel.showState("summary"); await panel.updateComplete;

    expect(text(panel)).not.toContain("Installed electrical profile");
  });
});

describe("ESP Web Tools installer", () => {
  const option: FirmwareOption = {
    productId: "6chan_energy_meter_main_board",
    version: "2026.8.0",
  };
  const manifest = "https://circuitsetup.github.io/ESPWebInstaller/manifests/manifest_6chan_energy_meter_main_board-2026.8.0.json";

  it("loads ESP Web Tools when the installer is rendered", async () => {
    const alreadyLoaded = customElements.get("esp-web-install-button") !== undefined;

    const root = document.createElement("div");
    render(espWebInstaller(option), root);

    if (!alreadyLoaded) {
      expect(root.querySelector('[role="status"]')?.textContent).toContain("Loading installer");
      expect(root.querySelector("esp-web-install-button")).toBeNull();
    }
    await vi.waitFor(() => expect(root.querySelector("esp-web-install-button")).not.toBeNull());
  });

  it("renders one install button for a resolved firmware option", async () => {
    const root = document.createElement("div");
    render(espWebInstaller(option), root);

    await vi.waitFor(() => expect(root.querySelector("esp-web-install-button")).not.toBeNull());
    const installer = root.querySelector<HTMLElement & { manifest: string }>("esp-web-install-button");
    expect(root.querySelectorAll("esp-web-install-button")).toHaveLength(1);
    expect(installer?.manifest).toBe(manifest);
    expect(root.textContent).toContain("6chan_energy_meter_main_board · ESPHome 2026.8.0");
    expect(root.textContent).not.toContain("https://");
    expect(installer?.querySelector<HTMLButtonElement>('[slot="activate"]')?.getAttribute("aria-label")).toBe("Install firmware");
    expect(installer?.querySelector('[slot="unsupported"]')?.textContent).toContain("supported Chromium browser");
    expect(installer?.querySelector('[slot="not-allowed"]')?.textContent).toContain("HTTPS or localhost");
  });

  it("renders no active install button without a resolved option", () => {
    const root = document.createElement("div");
    render(espWebInstaller(null), root);

    expect(root.querySelector("esp-web-install-button")).toBeNull();
  });

  it("renders no active install button for an invalid resolved option", () => {
    const root = document.createElement("div");
    render(espWebInstaller({ productId: "not/a-product", version: "2026.8.0" }), root);

    expect(root.querySelector("esp-web-install-button")).toBeNull();
  });

  it("updates the existing install button manifest when the selected version changes", async () => {
    const root = document.createElement("div");
    render(espWebInstaller(option), root);
    await vi.waitFor(() => expect(root.querySelector("esp-web-install-button")).not.toBeNull());
    const installer = root.querySelector<HTMLElement & { manifest: string }>("esp-web-install-button");

    render(espWebInstaller({ ...option, version: "2026.8.1" }), root);

    expect(root.querySelector("esp-web-install-button")).toBe(installer);
    expect(installer?.manifest).toBe(
      "https://circuitsetup.github.io/ESPWebInstaller/manifests/manifest_6chan_energy_meter_main_board-2026.8.1.json",
    );
  });

  it("does not provide an external navigation control", async () => {
    const root = document.createElement("div");
    render(espWebInstaller(option), root);

    await vi.waitFor(() => expect(root.querySelector("esp-web-install-button")).not.toBeNull());
    expect(root.querySelector("a")).toBeNull();
  });
});

describe("CircuitSetup panel", () => {
  it("explains that voltage-reference configuration must match physical wiring", () => {
    const response = meterResponse();
    const root = document.createElement("div");
    render(meterSettingsStep(response.configuration.meter as MeterSettingsDraft, response.voltage_transformer_catalog, false,
      () => undefined, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined, () => undefined), root);

    expect(root.textContent).toContain("must match the meter's physical voltage wiring");
    expect(root.textContent).toContain("main-board voltage reference applies to every board");
  });

  it("keeps circuit controls in each board row and voltage references read only", async () => {
    const configuration = meterResponse();
    const panel = document.createElement("circuitsetup-energy-meter-helper-panel") as CircuitSetupPanel;
    document.body.append(panel);
    (panel as unknown as { meterConfiguration: typeof configuration }).meterConfiguration = configuration;
    (panel as unknown as { showInventory: (value: CtInventory) => void }).showInventory(configuration as unknown as CtInventory);
    await panel.updateComplete;
    const row = panel.shadowRoot?.querySelector('[data-ct-row][aria-label="CT1"]');
    expect(row?.querySelector('[aria-label="CT1 used"]')).not.toBeNull();
    expect(row?.querySelector('[aria-label="CT1 role"]')).not.toBeNull();
    expect(row?.querySelector('[data-voltage-reference]')?.textContent).toContain("Main");
    expect(panel.shadowRoot?.querySelector('select[aria-label="CT1 voltage reference"]')).toBeNull();
    expect(panel.shadowRoot?.querySelector('[aria-label="CT1 circuit"]')).toBeNull();
    expect(text(panel)).toContain("top-left connector on each board");
    expect(text(panel)).toContain("continues counterclockwise");
    expect(text(panel)).toContain("cannot be changed in software");

    const role = row?.querySelector<HTMLSelectElement>('[aria-label="CT1 role"]');
    if (!role) throw new Error("CT1 role control missing");
    role.value = "solar";
    role.dispatchEvent(new Event("change"));
    await panel.updateComplete;
    expect((panel as unknown as { meterConfiguration: typeof configuration }).meterConfiguration.configuration.channels[0]?.role).toBe("solar");

    panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT1 used"]')?.click();
    await panel.updateComplete;
    expect((panel as unknown as { meterConfiguration: typeof configuration }).meterConfiguration.configuration.channels[0]).toMatchObject({ enabled: false, role: "unused" });
  });

  it("rejects aggregate channels that overlap or include disabled circuits", () => {
    const configuration = meterResponse().configuration as MeterConfigurationRequest;
    const aggregate = { aggregate_id: "main-service", name: "Main service", role: "grid" as const, channels: [1, 2], measurement_method: "two_ct_sum" as const, parent_id: null, energy_mode: "bidirectional" as const, expose_power: true, expose_current: true };
    expect(circuitConfigurationIsValid({ ...configuration, aggregates: [aggregate] }, 6)).toBe(true);
    expect(circuitConfigurationIsValid({ ...configuration, aggregates: [aggregate, { ...aggregate, aggregate_id: "duplicate", channels: [2, 3] }] }, 6)).toBe(false);
    expect(circuitConfigurationIsValid({ ...configuration, channels: [{ ...configuration.channels[0]!, enabled: false, role: "unused" }, ...configuration.channels.slice(1)], aggregates: [aggregate] }, 6)).toBe(false);
  });

  it("rejects a channel reference that does not own its physical ATM group", () => {
    const configuration = meterResponse().configuration as MeterConfigurationRequest;
    const references = [
      { ...configuration.meter.voltage_references[0]!, group_keys: ["main_1"] },
      { ...configuration.meter.voltage_references[0]!, reference_id: "secondary", label: "Secondary", group_keys: ["main_2"] },
    ];
    const channels = configuration.channels.map((channel) => ({ ...channel,
      voltage_reference_id: channel.channel >= 4 ? "secondary" : "main" }));
    expect(circuitConfigurationIsValid({ ...configuration, meter: { ...configuration.meter, voltage_references: references }, channels }, 6)).toBe(true);
    expect(circuitConfigurationIsValid({ ...configuration, meter: { ...configuration.meter, voltage_references: references }, channels: [{ ...channels[0]!, voltage_reference_id: "secondary" }, ...channels.slice(1)] }, 6)).toBe(false);
  });

  it("keeps existing aggregates reviewable but disables edits without managed totals", () => {
    const response = meterResponse();
    const configuration = response.configuration as MeterConfigurationRequest;
    configuration.aggregates = [{ aggregate_id: "main-service", name: "Main service", role: "grid", channels: [1, 2], measurement_method: "two_ct_sum", parent_id: null, energy_mode: "bidirectional", expose_power: true, expose_current: true }];
    const root = document.createElement("div");
    render(ctInventoryStep(response as unknown as CtInventory, 0, new Map(), () => undefined, () => undefined, () => undefined, () => undefined, false, false, configuration, () => undefined, () => undefined, false, "unmanaged_total_present"), root);
    expect(root.textContent).toContain("Aggregate editing unavailable");
    expect(root.textContent).toContain("Upgrade the meter configuration before editing aggregate totals.");
    expect(root.textContent).not.toContain("unmanaged_total_present");
    expect(root.textContent).toContain("Main service");
    expect(root.querySelector<HTMLFieldSetElement>('[aria-label="Main service aggregate"]')?.disabled).toBe(true);
    expect(root.querySelector('[data-action="add-aggregate"]')).toBeNull();
  });

  it("uses friendly labels for serialized circuit roles", () => {
    const response = meterResponse();
    const root = document.createElement("div");
    render(ctInventoryStep(response as unknown as CtInventory, 0, new Map(), () => undefined, () => undefined, () => undefined, () => undefined, false, false, response.configuration as MeterConfigurationRequest), root);

    const roleOptions = [...root.querySelectorAll<HTMLSelectElement>('select[aria-label="CT1 role"] option')].map((option) => option.textContent);
    expect(roleOptions).toContain("Mains");
    expect(roleOptions).toContain("Branch circuit");
    expect(root.querySelector('[aria-label="Preset channels"]')).toBeNull();
  });

  it("reconciles split-phase role pairs and derives nominal voltage without overwriting other meter settings", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    const state = panel as unknown as Record<string, unknown> & {
      setMeterConfiguration(configuration: import("../src/types").MeterConfiguration): void;
    };
    const response = meterResponse("split_phase_120_240", 60, 10) as unknown as import("../src/types").MeterConfiguration;
    response.configuration.meter = { ...response.configuration.meter, friendly_name: "Garage meter",
      voltage_references: [{ ...response.configuration.meter.voltage_references[0]!, nominal_voltage_v: 240 }] };
    const manual = { aggregate_id: "manual-load", name: "Manual load", role: "branch" as const, channels: [3], measurement_method: "direct" as const, parent_id: null, energy_mode: "consumption" as const, expose_power: true, expose_current: false };
    response.configuration.channels = response.configuration.channels.map((channel) => channel.channel <= 2
      ? { ...channel, role: "grid" }
      : [4, 5].includes(channel.channel) ? { ...channel, role: "solar" } : channel);
    response.configuration.aggregates = [manual];

    state.setMeterConfiguration(response);

    const configuration = (state.meterConfiguration as import("../src/types").MeterConfiguration).configuration;
    expect(configuration.meter).toMatchObject({ friendly_name: "Garage meter", line_frequency_hz: 60, update_interval_s: 10,
      voltage_references: [{ nominal_voltage_v: 120 }] });
    expect(configuration.aggregates).toContainEqual(manual);
    expect(configuration.aggregates).toContainEqual({
      aggregate_id: "auto-mains",
      name: "Mains",
      role: "grid",
      channels: [1, 2],
      measurement_method: "two_ct_sum",
      parent_id: null,
      energy_mode: "bidirectional",
      expose_power: true,
      expose_current: false,
    });
    expect(configuration.aggregates).toContainEqual({
      aggregate_id: "auto-solar",
      name: "Solar",
      role: "solar",
      channels: [4, 5],
      measurement_method: "two_ct_sum",
      parent_id: null,
      energy_mode: "generation",
      expose_power: true,
      expose_current: false,
    });
  });

  it("previews an automatic aggregate imported without installer edits", async () => {
    const previews: MeterConfigurationRequest[] = [];
    const preview = { transaction_id: "1".repeat(32), state: "previewed", source_sha256: "a".repeat(64), changes: [], redacted_diff: "", rollback_available: false, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return { state: "no_device", devices: [] } as T;
        if (operation === "preview_meter_configuration") {
          previews.push(message.configuration as MeterConfigurationRequest);
          return preview as T;
        }
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & {
      setMeterConfiguration(configuration: import("../src/types").MeterConfiguration): void;
      continueFromCt(): Promise<void>;
    };
    const response = meterResponse() as unknown as import("../src/types").MeterConfiguration;
    response.configuration.channels = response.configuration.channels.map((channel) => channel.channel <= 2 ? { ...channel, role: "grid" } : channel);
    state.selectedDeviceId = "meter-1";
    state.topology = response.topology;
    state.setMeterConfiguration(response);
    panel.showInventory(response as unknown as CtInventory);

    await state.continueFromCt();

    expect(previews).toHaveLength(1);
    expect(previews[0]?.aggregates).toContainEqual(expect.objectContaining({ aggregate_id: "auto-mains", channels: [1, 2] }));
  });

  it("does not append an automatic aggregate over a preserved reserved ID", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    const state = panel as unknown as Record<string, unknown> & {
      setMeterConfiguration(configuration: import("../src/types").MeterConfiguration): void;
    };
    const response = meterResponse() as unknown as import("../src/types").MeterConfiguration;
    response.configuration.channels = response.configuration.channels.map((channel) => channel.channel <= 2 ? { ...channel, role: "grid" } : channel);
    const collision = { aggregate_id: "auto-mains", name: "Manual reserved total", role: "branch" as const, channels: [3], measurement_method: "direct" as const, parent_id: null, energy_mode: "consumption" as const, expose_power: true, expose_current: false };
    response.configuration.aggregates = [collision];

    state.setMeterConfiguration(response);

    expect((state.meterConfiguration as import("../src/types").MeterConfiguration).configuration.aggregates).toEqual([collision]);
  });

  it("preserves a channel edit to an automatic reserved-ID aggregate", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    const state = panel as unknown as Record<string, unknown> & {
      setMeterConfiguration(configuration: import("../src/types").MeterConfiguration): void;
      updateCircuitConfiguration(configuration: MeterConfigurationRequest): void;
    };
    const response = meterResponse() as unknown as import("../src/types").MeterConfiguration;
    response.configuration.channels = response.configuration.channels.map((channel) => channel.channel <= 2 ? { ...channel, role: "grid" } : channel);
    state.setMeterConfiguration(response);
    const current = () => (state.meterConfiguration as import("../src/types").MeterConfiguration).configuration;
    const automatic = current().aggregates.find((aggregate) => aggregate.aggregate_id === "auto-mains")!;

    state.updateCircuitConfiguration({ ...current(), aggregates: current().aggregates.map((aggregate) =>
      aggregate === automatic ? { ...aggregate, channels: [1, 3] } : aggregate) });

    expect(current().aggregates).toContainEqual({ ...automatic, channels: [1, 3] });
  });

  it("rebuilds supported split-phase aggregates and removes stale automatic pairs", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    const state = panel as unknown as Record<string, unknown> & {
      setMeterConfiguration(configuration: import("../src/types").MeterConfiguration): void;
      updateCircuitConfiguration(configuration: MeterConfigurationRequest): void;
    };
    state.setMeterConfiguration(meterResponse() as unknown as import("../src/types").MeterConfiguration);
    const current = () => (state.meterConfiguration as import("../src/types").MeterConfiguration).configuration;
    const setRoles = (role: "solar" | "subpanel" | "two_pole", channels: number[]) => state.updateCircuitConfiguration({ ...current(),
      channels: current().channels.map((channel) => channels.includes(channel.channel) ? { ...channel, role } : { ...channel, role: "branch" }) });

    setRoles("solar", [1, 2]);
    expect(current().aggregates).toContainEqual({ aggregate_id: "auto-solar", name: "Solar", role: "solar", channels: [1, 2], measurement_method: "two_ct_sum", parent_id: null, energy_mode: "generation", expose_power: true, expose_current: false });
    setRoles("subpanel", [1, 2]);
    expect(current().aggregates).toContainEqual({ aggregate_id: "auto-subpanel", name: "Subpanel", role: "subpanel", channels: [1, 2], measurement_method: "two_ct_sum", parent_id: null, energy_mode: "consumption", expose_power: true, expose_current: false });
    setRoles("two_pole", [1, 2]);
    expect(current().aggregates).toContainEqual({ aggregate_id: "auto-two-pole", name: "Two-pole circuit", role: "two_pole", channels: [1, 2], measurement_method: "two_ct_sum", parent_id: null, energy_mode: "consumption", expose_power: true, expose_current: false });

    state.updateCircuitConfiguration({ ...current(), channels: current().channels.map((channel) => channel.channel === 2 ? { ...channel, role: "branch" } : channel) });
    expect(current().aggregates).not.toContainEqual(expect.objectContaining({ aggregate_id: "auto-two-pole" }));
    state.updateCircuitConfiguration({ ...current(), meter: { ...current().meter, electrical_system: "single_phase_230" }, channels: current().channels.map((channel) => channel.channel <= 2 ? { ...channel, role: "grid" } : channel) });
    expect(current().aggregates).not.toContainEqual(expect.objectContaining({ aggregate_id: "auto-mains" }));
  });

  it("does not claim manual aggregate channels or build partial automatic pairs", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    const state = panel as unknown as Record<string, unknown> & {
      setMeterConfiguration(configuration: import("../src/types").MeterConfiguration): void;
    };
    const response = meterResponse() as unknown as import("../src/types").MeterConfiguration;
    response.configuration.channels = response.configuration.channels.map((channel) => channel.channel <= 3 ? { ...channel, role: "grid" } : channel);
    const manual = { aggregate_id: "manual-service", name: "Manual service", role: "grid" as const, channels: [1, 2], measurement_method: "two_ct_sum" as const, parent_id: null, energy_mode: "bidirectional" as const, expose_power: true, expose_current: true };
    response.configuration.aggregates = [manual];

    state.setMeterConfiguration(response);

    const configuration = (state.meterConfiguration as import("../src/types").MeterConfiguration).configuration;
    expect(configuration.aggregates).toEqual([manual]);
  });

  it("reuses the canonical meter plan when advancing to CTs and preview", async () => {
    const operations: Array<{ operation: string; planId: unknown }> = [];
    let activePlan = "b".repeat(32);
    const preview = { transaction_id: "1".repeat(32), state: "previewed", source_sha256: "a".repeat(64), changes: [], redacted_diff: "", rollback_available: false, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        operations.push({ operation, planId: message.plan_id });
        if (operation === "setup_status") return { state: "no_device", devices: [] } as T;
        if (operation === "get_ct_inventory") { activePlan = "c".repeat(32); return { ...meterResponse(), plan_id: activePlan } as T; }
        if (operation === "preview_meter_configuration") {
          if (message.plan_id !== activePlan) throw Object.assign(new Error("stale"), { code: "stale_confirmation" });
          return preview as T;
        }
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & {
      setMeterConfiguration(configuration: import("../src/types").MeterConfiguration): void;
      updateMeterSettings(draft: import("../src/types").MeterSettingsDraft): void;
      continueFromMeterSettings(): Promise<void>;
      continueFromCt(): Promise<void>;
    };
    state.selectedDeviceId = "meter-1";
    const configuration = meterResponse() as unknown as import("../src/types").MeterConfiguration;
    state.topology = configuration.topology;
    state.setMeterConfiguration(configuration);
    state.updateMeterSettings({ ...(state.meterSettingsDraft as import("../src/types").MeterSettingsDraft), friendly_name: "Kitchen meter" });
    await state.continueFromMeterSettings();
    await state.continueFromCt();
    expect(operations.some(({ operation }) => operation === "get_ct_inventory")).toBe(false);
    expect(operations.find(({ operation }) => operation === "preview_meter_configuration")?.planId).toBe("b".repeat(32));
    expect((state.transaction as { state: string }).state).toBe("previewed");
  });

  it("abandons a consumed review and preserves edits on a fresh plan", async () => {
    const operations: Array<{ operation: string; planId: unknown }> = [];
    let activePlan: string | null = "b".repeat(32);
    let pendingTransaction = false;
    let planGeneration = 0;
    let releaseAbandon: () => void = () => undefined;
    const abandonGate = new Promise<void>((resolve) => { releaseAbandon = resolve; });
    const preview = { transaction_id: "1".repeat(32), state: "previewed", source_sha256: "a".repeat(64), changes: [], redacted_diff: "", rollback_available: false, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        operations.push({ operation, planId: message.plan_id });
        if (operation === "setup_status") return { state: "no_device", devices: [] } as T;
        if (operation === "preview_meter_configuration") {
          if (message.plan_id !== activePlan || pendingTransaction) throw Object.assign(new Error("stale"), { code: "stale_confirmation" });
          activePlan = null; pendingTransaction = true;
          return preview as T;
        }
        if (operation === "abandon_ct_config") {
          if (!pendingTransaction) throw Object.assign(new Error("stale"), { code: "stale_confirmation" });
          await abandonGate;
          pendingTransaction = false;
          return { ...preview, state: "failed", evidence: ["cancelled"] } as T;
        }
        if (operation === "get_meter_configuration") {
          planGeneration += 1;
          activePlan = (planGeneration === 1 ? "c" : "d").repeat(32);
          return { ...meterResponse(), plan_id: activePlan } as T;
        }
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & {
      setMeterConfiguration(configuration: import("../src/types").MeterConfiguration): void;
      updateMeterSettings(draft: import("../src/types").MeterSettingsDraft): void;
      continueFromMeterSettings(): Promise<void>;
      continueFromCt(): Promise<void>;
      backFromBuild(): Promise<void>;
    };
    state.selectedDeviceId = "meter-1";
    const configuration = meterResponse() as unknown as import("../src/types").MeterConfiguration;
    state.topology = configuration.topology;
    state.setMeterConfiguration(configuration);
    state.updateMeterSettings({ ...(state.meterSettingsDraft as import("../src/types").MeterSettingsDraft), friendly_name: "Preserved edit" });
    await state.continueFromMeterSettings();
    await state.continueFromCt();

    const returning = state.backFromBuild();
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .secondary")?.disabled).toBe(true);
    expect(panel.shadowRoot?.querySelector(".action-footer .secondary")?.textContent).toBe("Loading…");
    releaseAbandon();
    await returning;

    expect(pendingTransaction).toBe(false);
    expect(state.step).toBe("ct");
    expect((state.meterConfiguration as import("../src/types").MeterConfiguration).plan_id).toBe("c".repeat(32));
    expect((state.meterConfiguration as import("../src/types").MeterConfiguration).configuration.meter.friendly_name).toBe("Preserved edit");
    expect((state.meterConfiguration as import("../src/types").MeterConfiguration).configuration.multi_reference_preparation_acknowledged).toBe(false);
    await state.continueFromCt();
    expect(operations.filter(({ operation }) => operation === "preview_meter_configuration").map(({ planId }) => planId)).toEqual(["b".repeat(32), "c".repeat(32)]);
  });

  it("keeps a failed review cancellation visible and does not discard edits", async () => {
    const preview = { transaction_id: "1".repeat(32), state: "previewed", source_sha256: "a".repeat(64), changes: [], redacted_diff: "", rollback_available: false, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return { state: "no_device", devices: [] } as T;
        if (operation === "abandon_ct_config") throw Object.assign(new Error("busy"), { code: "stale_confirmation" });
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & { backFromBuild(): Promise<void> };
    state.selectedDeviceId = "meter-1";
    state.meterConfiguration = meterResponse();
    state.transaction = preview;
    state.step = "build";

    await state.backFromBuild();
    await panel.updateComplete;

    expect(state.step).toBe("build");
    expect(state.transaction).toBe(preview);
    expect(state.error).toBe("The review could not be cancelled. Retry Back before editing the configuration.");
    expect(panel.shadowRoot?.querySelector("[role=alert]")?.textContent).toContain("The review could not be cancelled");
  });

  it("rejects preserved review drafts when the source changes before reload", async () => {
    const previews: Array<{ planId: unknown; sourceSha256: unknown; configuration: unknown }> = [];
    let activePlan: string | null = "b".repeat(32);
    let pendingTransaction = false;
    const preview = { transaction_id: "1".repeat(32), state: "previewed", source_sha256: "a".repeat(64), changes: [], redacted_diff: "", rollback_available: false, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return { state: "no_device", devices: [] } as T;
        if (operation === "preview_meter_configuration") {
          previews.push({ planId: message.plan_id, sourceSha256: message.source_sha256, configuration: message.configuration });
          if (message.plan_id !== activePlan || pendingTransaction) throw Object.assign(new Error("stale"), { code: "stale_confirmation" });
          activePlan = null;
          pendingTransaction = true;
          return preview as T;
        }
        if (operation === "abandon_ct_config") {
          pendingTransaction = false;
          return { ...preview, state: "failed", evidence: ["cancelled"] } as T;
        }
        if (operation === "get_meter_configuration") {
          activePlan = "c".repeat(32);
          const fresh = meterResponse() as unknown as import("../src/types").MeterConfiguration;
          return { ...fresh, plan_id: activePlan, source_sha256: "f".repeat(64),
            configuration: { ...fresh.configuration,
              meter: { ...fresh.configuration.meter, friendly_name: "External meter" },
              channels: fresh.configuration.channels.map((channel) => channel.channel <= 2 ? { ...channel, role: "grid" } : channel) } } as T;
        }
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & {
      setMeterConfiguration(configuration: import("../src/types").MeterConfiguration): void;
      updateMeterSettings(draft: import("../src/types").MeterSettingsDraft): void;
      updateDraft(channel: number, patch: Partial<CtDraft>): void;
      updateCircuitConfiguration(configuration: import("../src/types").MeterConfigurationRequest): void;
      setPackageOptions(options: import("../src/types").BoardPackageOptions): void;
      continueFromMeterSettings(): Promise<void>;
      continueFromCt(): Promise<void>;
      backFromBuild(): Promise<void>;
    };
    state.selectedDeviceId = "meter-1";
    const configuration = meterResponse() as unknown as import("../src/types").MeterConfiguration;
    state.topology = configuration.topology;
    state.setMeterConfiguration(configuration);
    state.updateMeterSettings({ ...(state.meterSettingsDraft as import("../src/types").MeterSettingsDraft), friendly_name: "Stale draft" });
    await state.continueFromMeterSettings();
    state.updateDraft(1, { name: "Stale channel" });
    const stale = (state.meterConfiguration as import("../src/types").MeterConfiguration).configuration;
    state.updateCircuitConfiguration({ ...stale, aggregates: [{ aggregate_id: "stale-total", name: "Stale total", role: "grid",
      channels: [1], measurement_method: "direct", parent_id: null, energy_mode: "bidirectional", expose_power: true, expose_current: true }] });
    state.setPackageOptions({ power_quality: [false], status_fields: [true] });
    await state.continueFromCt();

    await state.backFromBuild();

    const fresh = state.meterConfiguration as import("../src/types").MeterConfiguration;
    expect(fresh.source_sha256).toBe("f".repeat(64));
    expect(fresh.configuration.meter.friendly_name).toBe("External meter");
    expect(fresh.configuration.channels[0]?.name).toBe("CT1");
    expect(fresh.configuration.aggregates).toContainEqual(expect.objectContaining({ aggregate_id: "auto-mains", channels: [1, 2] }));
    expect(fresh.configuration.power_quality).toEqual([true]);
    expect(fresh.configuration.status_fields).toEqual([false]);
    expect((state.drafts as Map<number, CtDraft>).get(1)?.name).toBe("CT1");
    expect(state.error).toContain("source changed");
    expect(panel.shadowRoot?.querySelector("[role=alert]")?.textContent).toContain("drafts were not restored");
    state.updateMeterSettings({ ...(state.meterSettingsDraft as import("../src/types").MeterSettingsDraft), friendly_name: "Reviewed external meter" });
    await state.continueFromMeterSettings();
    await state.continueFromCt();

    expect(previews).toHaveLength(2);
    expect(previews[1]).toMatchObject({ planId: "c".repeat(32), sourceSha256: "f".repeat(64),
      configuration: { meter: { friendly_name: "Reviewed external meter" }, aggregates: [expect.objectContaining({ aggregate_id: "auto-mains", channels: [1, 2] })],
        power_quality: [true], status_fields: [false] } });
    expect(JSON.stringify(previews[1]?.configuration)).not.toContain("Stale draft");
    expect(JSON.stringify(previews[1]?.configuration)).not.toContain("Stale channel");
    expect(JSON.stringify(previews[1]?.configuration)).not.toContain("Stale total");
  });

  it("moves channel references with physical groups and resets operation acknowledgement", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    const response = meterResponse() as unknown as import("../src/types").MeterConfiguration;
    response.configuration.multi_reference_preparation_acknowledged = true;
    const state = panel as unknown as Record<string, unknown> & {
      setMeterConfiguration(configuration: import("../src/types").MeterConfiguration): void;
      updateMeterSettings(draft: import("../src/types").MeterSettingsDraft): void;
    };
    state.setMeterConfiguration(response);
    expect(state.multiReferencePreparationAcknowledged).toBe(false);
    expect((state.meterConfiguration as import("../src/types").MeterConfiguration).configuration.multi_reference_preparation_acknowledged).toBe(false);
    state.multiReferencePreparationAcknowledged = true;
    const draft = state.meterSettingsDraft as import("../src/types").MeterSettingsDraft;
    state.updateMeterSettings({ ...draft, voltage_layout: "multi_reference", voltage_references: [
      { ...draft.voltage_references[0]!, group_keys: ["main_1"] },
      { ...draft.voltage_references[0]!, reference_id: "secondary", label: "Secondary", group_keys: ["main_2"] },
    ] });
    const configuration = (state.meterConfiguration as import("../src/types").MeterConfiguration).configuration;
    expect(configuration.channels.map((channel) => channel.voltage_reference_id)).toEqual(["main", "main", "main", "secondary", "secondary", "secondary"]);
    expect(configuration.multi_reference_preparation_acknowledged).toBe(false);
    expect(state.multiReferencePreparationAcknowledged).toBe(false);
  });

  it("loads existing meter settings instead of installer intent", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    const state = panel as unknown as Record<string, unknown> & {
      setMeterConfiguration(configuration: import("../src/types").MeterConfiguration): void;
    };
    state.electricalSystem = "single_phase_230";
    state.lineFrequencyHz = 50;
    state.electricalProfileConfirmed = true;
    state.setMeterConfiguration(meterResponse("split_phase_120_240", 60, 30) as unknown as import("../src/types").MeterConfiguration);
    expect(state.meterSettingsDraft).toMatchObject({ electrical_system: "split_phase_120_240", line_frequency_hz: 60,
      update_interval_s: 30, voltage_references: [{ nominal_voltage_v: 120 }] });
    expect((state.meterConfiguration as import("../src/types").MeterConfiguration).configuration.meter).toMatchObject({
      electrical_system: "split_phase_120_240", line_frequency_hz: 60, update_interval_s: 30,
    });
    expect(state.canonicalConfigurationChanged).toBe(false);
  });

  it("seeds a newly installed meter from explicit installer intent", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    const state = panel as unknown as Record<string, unknown> & {
      setMeterConfiguration(configuration: import("../src/types").MeterConfiguration): void;
    };
    state.selectedDeviceId = "meter-1";
    state.newInstallDeviceId = "meter-1";
    state.electricalSystem = "single_phase_230";
    state.lineFrequencyHz = 50;
    state.electricalProfileConfirmed = true;
    state.setMeterConfiguration(meterResponse() as unknown as import("../src/types").MeterConfiguration);
    expect(state.meterSettingsDraft).toMatchObject({ electrical_system: "single_phase_230", line_frequency_hz: 50,
      voltage_references: [{ nominal_voltage_v: 230 }] });
    expect(state.canonicalConfigurationChanged).toBe(true);
  });

  it("keeps a verified install on the selected meter until Continue starts safety", async () => {
    const preview = { transaction_id: "1".repeat(32), state: "install_confirmation_required", source_sha256: "a".repeat(64), changes: [], redacted_diff: "", rollback_available: false, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };
    const operations: string[] = [];
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        operations.push(operation);
        if (operation === "setup_status") return { state: "no_device", devices: [] } as T;
        if (operation === "install_ct_config") return { ...preview, state: "verified", full_meter_configuration_verified: true } as T;
        if (operation === "get_active_work") return { session: null, transaction: null, verified_calibration: null } as T;
        if (operation === "start_session") return { session_id: "session", device_id: "meter-1", state: "safety_required", safety_acknowledged: false, preflight: { issues: [], zeroed_roles: [] } } as T;
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & {
      setMeterConfiguration(configuration: import("../src/types").MeterConfiguration): void;
      transactionAction(action: "install"): Promise<void>;
    };
    state.selectedDeviceId = "meter-1";
    const configuration = meterResponse() as unknown as import("../src/types").MeterConfiguration;
    state.topology = configuration.topology;
    state.setMeterConfiguration(configuration);
    state.transaction = preview;
    panel.showState("build");
    await state.transactionAction("install");
    await panel.updateComplete;
    expect(state.selectedDeviceId).toBe("meter-1");
    expect(state.verifiedMeterConfiguration).not.toBeNull();
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Flash & Verify");
    const continueButton = panel.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="continue"]');
    expect(continueButton?.disabled).toBe(false);
    expect(state.pendingAction).toBe("");
    expect(state.sessionStarting).toBe(false);
    continueButton?.click();
    await tick(); await tick(); await panel.updateComplete;
    expect(operations).toContain("start_session");
    expect(state.selectedDeviceId).toBe("meter-1");
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Safety");
  });

  it("shows Compile as busy while the firmware build is pending", async () => {
    let finishCompile!: (value: unknown) => void;
    const pendingCompile = new Promise((resolve) => { finishCompile = resolve; });
    const validated = { transaction_id: "1".repeat(32), state: "validated", source_sha256: "a".repeat(64), changes: [], redacted_diff: "", rollback_available: true, evidence: ["write_verified"], progress: ["config_validated"], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return { state: "no_device", devices: [] } as T;
        if (operation === "compile_ct_config") return pendingCompile as Promise<T>;
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown>;
    state.selectedDeviceId = "meter-1";
    state.transaction = validated;
    panel.showState("build");
    await panel.updateComplete;

    const compile = [...panel.shadowRoot!.querySelectorAll("button")].find((button) => button.textContent === "Compile");
    compile?.click();
    await tick(); await panel.updateComplete;

    const compiling = [...panel.shadowRoot!.querySelectorAll("button")].find((button) => button.textContent === "Compiling…");
    expect(compiling?.disabled).toBe(true);
    state.transaction = { ...validated, upload_progress: [{ stage: "transfer", percentage: 65 }] };
    panel.requestUpdate(); await panel.updateComplete;
    const progress = panel.shadowRoot!.querySelector<HTMLProgressElement>("progress");
    expect(progress?.value).toBe(65);
    expect(progress?.getAttribute("aria-label")).toBe("Compile progress: 65%");
    finishCompile({ ...validated, state: "install_confirmation_required", progress: ["config_validated", "firmware_compiled"] });
    await tick(); await panel.updateComplete;
  });

  it("loads the firmware catalog once when the panel connects", async () => {
    const fetcher = vi.fn(() => Promise.resolve(firmwareResponse()));
    vi.stubGlobal("fetch", fetcher);

    await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("aborts an in-flight firmware catalog request when disconnected", async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      signal = init?.signal ?? undefined;
      signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    })));
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));

    panel.remove();
    await tick();

    expect(signal?.aborted).toBe(true);
  });

  it("disables firmware selection while the catalog is loading", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)));
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));

    expect(panel.shadowRoot?.querySelector<HTMLSelectElement>("[data-action=firmware-version]")?.disabled).toBe(true);
    expect(panel.shadowRoot?.querySelector("esp-web-install-button")).toBeNull();
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=rescan]")?.disabled).toBe(false);
  });

  it("keeps the firmware selector labelled and disabled when no firmware is available", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(firmwareResponse([]))));
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    await tick();
    await panel.updateComplete;

    const selector = panel.shadowRoot?.querySelector<HTMLSelectElement>("[data-action=firmware-version]");
    expect(selector?.labels?.[0]?.textContent).toContain("ESPHome firmware version");
    expect(selector?.disabled).toBe(true);
    expect(text(panel)).toContain("No firmware version is available for this hardware.");
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=rescan]")?.disabled).toBe(false);
  });

  it("shows a catalog retry without disabling discovery rescan", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    await tick();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=firmware-retry]")?.disabled).toBe(false);
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=rescan]")?.disabled).toBe(false);
    expect(panel.shadowRoot?.querySelector<HTMLSelectElement>("[data-action=firmware-version]")?.disabled).toBe(true);
  });

  it("retries a failed catalog request and renders its versions", async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(firmwareResponse());
    vi.stubGlobal("fetch", fetcher);
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    await tick();

    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=firmware-retry]")?.click();
    await tick();
    await panel.updateComplete;

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(panel.shadowRoot?.querySelector<HTMLSelectElement>("[data-action=firmware-version]")?.value).toBe("2026.8.0");
    expect(panel.shadowRoot?.querySelector("[data-action=firmware-retry]")).toBeNull();
  });

  it("selects the newest firmware version initially", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    await tick();

    const selector = panel.shadowRoot?.querySelector<HTMLSelectElement>("[data-action=firmware-version]");
    expect(selector?.value).toBe("2026.8.0");
    expect(selector?.labels?.[0]?.textContent).toContain("ESPHome firmware version");
    expect(selector?.options[0]?.textContent).toBe("2026.8.0 (newest)");
  });

  it("recomputes firmware versions when add-on hardware changes", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    await tick();
    panel.shadowRoot?.querySelector<HTMLInputElement>('[name="addon-count"][value="1"]')?.click();
    await panel.updateComplete;

    expect([...panel.shadowRoot?.querySelectorAll<HTMLOptionElement>("[data-action=firmware-version] option") ?? []]
      .map((option) => option.value)).toEqual(["2026.8.0", "2026.6.0"]);
  });

  it("keeps a selected firmware version when the new hardware still supports it", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    await tick();
    panel.shadowRoot?.querySelector<HTMLInputElement>('[name="addon-count"][value="1"]')?.click();
    await panel.updateComplete;
    const version = panel.shadowRoot?.querySelector<HTMLSelectElement>("[data-action=firmware-version]");
    if (version) { version.value = "2026.6.0"; version.dispatchEvent(new Event("change")); }
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLInputElement>('[name="connection-type"][value="ethernet_lilygo"]')?.click();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector<HTMLSelectElement>("[data-action=firmware-version]")?.value).toBe("2026.6.0");
  });

  it("falls back to the newest available version and announces an unavailable selection", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    await tick();
    panel.shadowRoot?.querySelector<HTMLInputElement>('[name="addon-count"][value="1"]')?.click();
    await panel.updateComplete;
    const version = panel.shadowRoot?.querySelector<HTMLSelectElement>("[data-action=firmware-version]");
    if (version) { version.value = "2026.6.0"; version.dispatchEvent(new Event("change")); }
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLInputElement>('[name="connection-type"][value="ethernet_waveshare"]')?.click();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector<HTMLSelectElement>("[data-action=firmware-version]")?.value).toBe("2026.9.0");
    expect(panel.shadowRoot?.querySelector(".sr-status")?.textContent).toContain("2026.9.0");
  });

  it("ignores a stale catalog completion from an earlier panel connection", async () => {
    let resolveFirst: ((response: Response) => void) | undefined;
    let resolveSecond: ((response: Response) => void) | undefined;
    const fetcher = vi.fn(() => new Promise<Response>((resolve) => {
      if (fetcher.mock.calls.length === 1) resolveFirst = resolve;
      else resolveSecond = resolve;
    }));
    vi.stubGlobal("fetch", fetcher);
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    panel.remove();
    document.body.append(panel);
    await tick();
    resolveSecond?.(firmwareResponse([{ productId: "6chan_energy_meter_main_board", name: "Current", versions: [{ version: "2026.9.0" }] }]));
    await tick();
    resolveFirst?.(firmwareResponse([{ productId: "6chan_energy_meter_main_board", name: "Stale", versions: [{ version: "2026.1.0" }] }]));
    await tick();
    await panel.updateComplete;

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(panel.shadowRoot?.querySelector<HTMLSelectElement>("[data-action=firmware-version]")?.value).toBe("2026.9.0");
  });

  it("shows existing meters with semantic ten-step navigation and setup controls", async () => {
    const panel = await mount(
      makeHass({ setup_status: { state: "device_discovered", devices: [device] } }),
    );

    expect(text(panel)).toContain("CircuitSetup Energy Meter Helper");
    const steps = Array.from(panel.shadowRoot?.querySelectorAll("nav ol li") ?? []).map((item) => item.textContent?.trim());
    expect(steps).toHaveLength(10);
    expect(steps).toContain("5Offset");
    expect(steps.join(" ")).not.toContain("Discover");
    expect(steps.join(" ")).not.toContain("Topology");
    expect(panel.shadowRoot?.querySelector(".mobile-progress")?.textContent).toContain("of 10");
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Setup Device");
    expect(text(panel)).toContain("Configure an existing device");
    expect(text(panel)).toContain("Basement meter");
    expect(text(panel)).toContain("Device Builder: Yes — import available");
    expect(text(panel)).toContain("Set up a new device");
    expect(panel.shadowRoot?.querySelectorAll('[name="addon-count"]')).toHaveLength(7);
    expect(panel.shadowRoot?.querySelectorAll('[name="connection-type"]')).toHaveLength(3);
    expect(panel.shadowRoot?.querySelectorAll('[name="electrical-system"]')).toHaveLength(4);
    expect(panel.shadowRoot?.querySelector('[name="line-frequency"]')).not.toBeNull();
    expect(panel.shadowRoot?.querySelector('[data-action="confirm-electrical-profile"]')).not.toBeNull();
    expect(text(panel)).toContain("Install firmware");
    expect(Array.from(panel.shadowRoot?.querySelectorAll(".next-steps li") ?? [], (item) => item.textContent?.trim())).toEqual([
      "Install the selected firmware and select Next in ESP Web Tools.",
      "Select Add to Home Assistant and approve the discovered ESPHome device.",
      "Return here. The helper will import it into ESPHome Builder and continue.",
    ]);
    expect(text(panel)).toContain("Rescan for device");
    expect(text(panel)).toContain("USB data cable");
    expect(panel.shadowRoot?.querySelector("esp-web-install-button")).not.toBeNull();
    expect(panel.shadowRoot?.querySelector("button.installer")).toBeNull();
    expect([...panel.shadowRoot?.querySelectorAll("dt") ?? []].some((term) => term.textContent === "IO0")).toBe(false);
    expect([...panel.shadowRoot?.querySelectorAll("input") ?? []].some((input) =>
      [input.getAttribute("name"), input.getAttribute("aria-label"), input.getAttribute("autocomplete"), input.getAttribute("data-testid")]
        .some((value) => /ssid|network password|wifi password|passphrase/i.test(value ?? "")))).toBe(false);
    expect(panel.shadowRoot?.querySelector("details")).toBeNull();
    const setupOrder = [
      panel.shadowRoot?.querySelector('[name="addon-count"]')?.closest("fieldset"),
      panel.shadowRoot?.querySelector('[name="electrical-system"]')?.closest("fieldset"),
      panel.shadowRoot?.querySelector('[name="connection-type"]')?.closest("fieldset"),
      panel.shadowRoot?.querySelector('[aria-labelledby="jumper-heading"]'),
      panel.shadowRoot?.querySelector('[data-action="firmware-version"]'),
      panel.shadowRoot?.querySelector("esp-web-install-button"),
      panel.shadowRoot?.querySelector(".next-steps"),
      panel.shadowRoot?.querySelector(".info-band"),
      panel.shadowRoot?.querySelector('[data-action="rescan"]'),
    ];
    const completeOrder = setupOrder.filter((element): element is Element => Boolean(element));
    expect(completeOrder).toHaveLength(setupOrder.length);
    expect(completeOrder.slice(1).every((element, index) => Boolean(
      completeOrder[index]!.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING,
    ))).toBe(true);
    panel.shadowRoot?.querySelector<HTMLInputElement>('[name="addon-count"][value="6"]')?.click();
    await panel.updateComplete;
    expect(text(panel)).toContain("Add-on 6");
    expect(text(panel)).toContain("(15, 26)");
  });

  it("does not send suggested electrical values until the user confirms them", async () => {
    const messages: Record<string, unknown>[] = [];
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        messages.push(message);
        const operation = String(message.type).split("/").at(-1);
        return (operation === "rescan"
          ? { state: "no_device", devices: [] }
          : { state: "installer_guide", devices: [] }) as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);

    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=rescan]")?.click();
    await tick();
    const initial = messages.find((message) => String(message.type).endsWith("set_installer_intent"));
    expect(initial).not.toHaveProperty("electrical_system");
    expect(initial).not.toHaveProperty("line_frequency_hz");

    expect(panel.shadowRoot?.querySelector<HTMLInputElement>('[name="electrical-system"][value="split_phase_120_240"]')?.checked).toBe(true);
    expect(panel.shadowRoot?.querySelector<HTMLInputElement>('[name="line-frequency"][value="60"]')?.checked).toBe(true);

    panel.shadowRoot?.querySelector<HTMLInputElement>('[name="electrical-system"][value="single_phase_230"]')?.click();
    panel.shadowRoot?.querySelector<HTMLInputElement>('[name="line-frequency"][value="50"]')?.click();
    panel.shadowRoot?.querySelector<HTMLInputElement>('[data-action="confirm-electrical-profile"]')?.click();
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=rescan]")?.click();
    await tick();
    expect(messages.filter((message) => String(message.type).endsWith("set_installer_intent")).at(-1)).toMatchObject({
      electrical_system: "single_phase_230",
      line_frequency_hz: 50,
    });
  });

  it.each([
    ["split_phase_120_240", "60"],
    ["single_phase_230", "50"],
  ] as const)("confirms the %s frequency suggestion", async (system, frequency) => {
    const messages: Record<string, unknown>[] = [];
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        messages.push(message);
        return { state: "installer_guide", devices: [] } as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    panel.shadowRoot?.querySelector<HTMLInputElement>(`[name="electrical-system"][value="${system}"]`)?.click();
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector<HTMLInputElement>(`[name="line-frequency"][value="${frequency}"]`)?.checked).toBe(true);
    panel.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="confirm-electrical-profile"]')?.click();
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=rescan]")?.click();
    await tick();

    expect(messages.filter((message) => String(message.type).endsWith("set_installer_intent")).at(-1)).toMatchObject({
      electrical_system: system,
      line_frequency_hz: Number(frequency),
    });
  });

  it.each(["custom", "three_phase"] as const)("requires an explicit frequency for %s", async (system) => {
    const messages: Record<string, unknown>[] = [];
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        messages.push(message);
        return { state: "installer_guide", devices: [] } as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    panel.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="confirm-electrical-profile"]')?.click();
    panel.shadowRoot?.querySelector<HTMLInputElement>(`[name="electrical-system"][value="${system}"]`)?.click();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="confirm-electrical-profile"]')?.disabled).toBe(true);
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=rescan]")?.click();
    await tick();
    const intent = messages.filter((message) => String(message.type).endsWith("set_installer_intent")).at(-1);
    expect(intent).not.toHaveProperty("electrical_system");
    expect(intent).not.toHaveProperty("line_frequency_hz");
  });

  it("loads imported meter configuration before topology after adoption", async () => {
    const operations: string[] = [];
    let adopted = false;
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1)!;
        operations.push(operation);
        if (operation === "setup_status") return (adopted
          ? { state: "device_discovered", devices: [{ ...device, configuration: "meter.yaml" }], bound_device_id: device.entry_id }
          : { state: "no_device", devices: [] }) as T;
        if (operation === "adopt_device") { adopted = true; return { device_id: device.entry_id, configuration: "meter.yaml" } as T; }
        if (operation === "get_meter_configuration") return meterResponse("split_phase_120_240", 60) as T;
        if (operation === "get_topology") return { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
          connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name,
          evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] } as T;
        return { state: "installer_guide", devices: [] } as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & { adopt: (id: string) => Promise<void> };
    state.electricalSystem = "single_phase_230";
    state.lineFrequencyHz = 50;
    state.electricalProfileConfirmed = true;
    await state.adopt(device.entry_id);
    await panel.updateComplete;

    expect(state.error).toBe("");
    expect(operations.indexOf("get_meter_configuration")).toBeGreaterThan(operations.indexOf("adopt_device"));
    expect(operations.indexOf("get_topology")).toBeGreaterThan(operations.indexOf("get_meter_configuration"));
    expect(state.meterSettingsDraft).toMatchObject({ electrical_system: "single_phase_230", line_frequency_hz: 50,
      update_interval_s: 5, voltage_references: [{ nominal_voltage_v: 230 }], authoritative: true });
  });

  it("takes control before configuring an unbound importable meter", async () => {
    const operations: string[] = [];
    let adopted = false;
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1)!;
        operations.push(operation);
        if (operation === "setup_status") return {
          state: "device_discovered",
          devices: [{ ...device, configuration: adopted ? "meter.yaml" : null }],
          bound_device_id: adopted ? device.entry_id : null,
        } as T;
        if (operation === "adopt_device") {
          adopted = true;
          return { device_id: device.entry_id, configuration: "meter.yaml" } as T;
        }
        if (operation === "get_meter_configuration") return meterResponse() as T;
        if (operation === "get_topology") {
          if (!adopted) throw Object.assign(new Error("stale"), { code: "stale_handle" });
          return { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
            connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name,
            evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] } as T;
        }
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=configure-device]")?.click();
    await tick(); await panel.updateComplete;

    expect(operations.indexOf("adopt_device")).toBeGreaterThan(operations.indexOf("setup_status"));
    expect(operations.indexOf("get_topology")).toBeGreaterThan(operations.indexOf("adopt_device"));
    expect(text(panel)).toContain("Topology evidence");
    expect(text(panel)).not.toContain("The selected device changed or is no longer available");
  });

  it("always derives nominal voltage for fixed electrical profiles", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as { meterSettingsDraft: Record<string, unknown>; meterFrequencyTouched: boolean;
      meterNominalVoltageTouched: Set<string>; setMeterProfile(system: string): void; setMeterFrequency(value: 50 | 60): void;
      setMeterNominalVoltage(referenceId: string, value: number): void };
    state.meterSettingsDraft = { ...meterResponse().configuration.meter, authoritative: true, warnings: [] };
    state.setMeterProfile("single_phase_230");
    expect(state.meterSettingsDraft).toMatchObject({ line_frequency_hz: 50, voltage_references: [{ nominal_voltage_v: 230 }] });
    state.setMeterFrequency(60);
    state.setMeterProfile("custom");
    state.setMeterNominalVoltage("main", 208);
    state.setMeterProfile("split_phase_120_240");
    expect(state.meterSettingsDraft).toMatchObject({ line_frequency_hz: 60, voltage_references: [{ nominal_voltage_v: 120 }] });
  });

  it("shows ordered setup guidance with Ethernet-only details", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    panel.shadowRoot?.querySelector<HTMLInputElement>('[name="connection-type"][value="ethernet_lilygo"]')?.click();
    await panel.updateComplete;

    expect(Array.from(panel.shadowRoot?.querySelectorAll(".next-steps li") ?? [], (item) => item.textContent?.trim())).toHaveLength(3);
    expect(text(panel)).toContain("connect Ethernet and power, then wait for an address from DHCP");
    expect(text(panel)).not.toContain("ESP Web Tools asks for your Wi-Fi network and password");
    const handoff = panel.shadowRoot?.querySelector(".info-band")?.textContent ?? "";
    expect(handoff).not.toMatch(/wi-fi|password|credential/i);
  });

  it("requires a choice when multiple new compatible devices are discovered", async () => {
    let setupCallback: ((message: unknown) => void) | undefined;
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return { state: "no_device", devices: [] } as T;
        return {} as T;
      },
      connection: { subscribeMessage: async (callback) => {
        setupCallback = callback as (message: unknown) => void;
        return () => undefined;
      } },
    };
    const panel = await mount(hass);
    const meter2 = { ...device, entry_id: "meter-2", title: "Garage meter" };
    setupCallback?.({ state: "device_discovered", devices: [meter2, device] });
    await panel.updateComplete;

    const state = panel as unknown as { selectedDeviceId: string | null };
    expect(state.selectedDeviceId).toBeNull();
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Setup Device");
    expect(panel.shadowRoot?.querySelector(".sr-status")?.textContent).toContain("Multiple CircuitSetup meters were discovered.");
    expect(panel.shadowRoot?.querySelector('[name="addon-count"]')).not.toBeNull();
  });

  it("times out an unresolved rebind status call", async () => {
    let setupCallback: ((message: unknown) => void) | undefined;
    let setupStatusCalls = 0;
    const panel = await mount({
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") {
          if (++setupStatusCalls === 1) return { state: "no_device", devices: [] } as T;
          return await new Promise<T>(() => undefined);
        }
        if (operation === "adopt_device") return { device_id: device.entry_id, configuration: "meter.yaml" } as T;
        return {} as T;
      },
      connection: { subscribeMessage: async (callback) => {
        setupCallback = callback as (message: unknown) => void;
        return () => undefined;
      } },
    });

    vi.useFakeTimers();
    try {
      setupCallback?.({ state: "device_discovered", devices: [device] });
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(10_000);
      await panel.updateComplete;

      expect(text(panel)).toContain(
        "Import completed, but Home Assistant is still reconnecting. Retry import or reload the helper.",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not reset selection for a repeated setup snapshot", async () => {
    let setupCallback: ((message: unknown) => void) | undefined;
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        if (String(message.type).endsWith("/setup_status")) return { state: "no_device", devices: [] } as T;
        return {} as T;
      },
      connection: { subscribeMessage: async (callback) => {
        setupCallback = callback as (message: unknown) => void;
        return () => undefined;
      } },
    };
    const panel = await mount(hass);
    const meter2 = { ...device, entry_id: "meter-2", title: "Garage meter" };
    const snapshot = { state: "device_discovered", devices: [device, meter2] };
    setupCallback?.(snapshot);
    await panel.updateComplete;
    const state = panel as unknown as { selectedDeviceId: string | null; showState(step: "setup"): void };
    state.selectedDeviceId = "meter-2";
    state.showState("setup");
    setupCallback?.(snapshot);
    await panel.updateComplete;

    expect(state.selectedDeviceId).toBe("meter-2");
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Setup Device");
  });

  it("records discovery updates later in the flow without returning to Setup Device", async () => {
    let setupCallback: ((message: unknown) => void) | undefined;
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        if (String(message.type).endsWith("/setup_status")) return { state: "no_device", devices: [] } as T;
        return {} as T;
      },
      connection: { subscribeMessage: async (callback) => {
        setupCallback = callback as (message: unknown) => void;
        return () => undefined;
      } },
    };
    const panel = await mount(hass);
    const state = panel as unknown as { showState(step: "ct" | "setup"): void };
    state.showState("ct");
    setupCallback?.({ state: "device_discovered", devices: [device] });
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Circuits & CTs");
    state.showState("setup");
    setupCallback?.({ state: "device_discovered", devices: [device] });
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Setup Device");
  });

  it("renders live package impact and a textual high-count warning", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "no_device", devices: [] } }));
    const response = meterResponse();
    const state = panel as unknown as { meterConfiguration: typeof response; inventory: { plan_id: string; source_sha256: string; channels: typeof response.channels; catalog: typeof response.catalog }; packageOptions: { power_quality: boolean[]; status_fields: boolean[] } };
    state.meterConfiguration = response;
    state.inventory = { plan_id: response.plan_id, source_sha256: response.source_sha256, channels: response.channels, catalog: response.catalog };
    (response.configuration as MeterConfigurationRequest).power_quality = [false];
    (response.configuration as MeterConfigurationRequest).status_fields = [false];
    panel.showState("ct");
    await panel.updateComplete;
    expect(text(panel)).toContain("14 public entities");
    (response.configuration as MeterConfigurationRequest).power_quality = [true];
    (response.configuration as MeterConfigurationRequest).status_fields = [true];
    (response.configuration as MeterConfigurationRequest).aggregates = Array.from({ length: 20 }, (_, index) => ({ aggregate_id: `grid-${index}`, name: `Grid ${index}`, role: "grid" as const, channels: [1], measurement_method: "direct" as const, parent_id: null, energy_mode: "bidirectional" as const, expose_power: true, expose_current: true }));
    panel.requestUpdate();
    await panel.updateComplete;
    expect(text(panel)).toContain("Warning: high entity count.");
    expect(text(panel)).toContain("public entities");
  });

  it("routes accepted safety acknowledgement to the Offset step", async () => {
    const ready = { session_id: "session", device_id: "meter-1", state: "ready",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] }, entity_role_counts: {},
      offset_capability: { status: "unavailable", repair_reason: null }, offset_disposition: "not_started",
      offset_boards: [{ board_index: 0, stages: [{ stage: 1, state: "not_started" }, { stage: 2, state: "not_started" }] }],
      has_pending_calibration: false };
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] },
      acknowledge_safety: ready }));
    const state = panel as unknown as Record<string, unknown> & { acknowledgeSafety(): Promise<void> };
    state.session = { ...ready, state: "safety_required", safety_acknowledged: false };

    await state.acknowledgeSafety();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Offset");
  });

  it("renders ordered offset preparation, gates Stage 2, and bounds seven-board tabs", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.topology = { addon_count: 6, board_count: 7, ct_count: 42, group_count: 14,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 6, detail: "Runtime identity" }] };
    state.session = { session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] }, entity_role_counts: {},
      offset_capability: { status: "available", repair_reason: null }, offset_disposition: "not_started",
      offset_boards: Array.from({ length: 7 }, (_, board_index) => ({ board_index, stages: [
        { stage: 1, state: "not_started" }, { stage: 2, state: "not_started" },
      ] })), has_pending_calibration: false };

    panel.showState("offset" as never);
    await panel.updateComplete;

    const copy = text(panel);
    expect(copy.indexOf("open-circuit current-output CT")).toBeLessThan(copy.indexOf("unplug the voltage transformer"));
    expect(copy).toContain("de-energize all conductors");
    expect(copy).toContain("power the meter from USB only");
    expect(copy).toContain("check that every voltage/current phase reads near zero");
    expect(copy).toContain("Measurements cannot prove");
    expect(panel.shadowRoot?.querySelectorAll("[data-offset-board]")).toHaveLength(7);
    expect(panel.shadowRoot?.querySelector("[data-offset-stage='1']")?.getAttribute("aria-current")).toBe("step");
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-offset-stage='2']")?.disabled).toBe(true);
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action='calibrate-offset']")?.disabled).toBe(true);
  });

  it("shows invalid offset capability as repair-aware skip-only", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name, evidence: [] };
    state.session = { session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] }, entity_role_counts: {},
      offset_capability: { status: "invalid", repair_reason: "duplicate run control" }, offset_disposition: "not_started",
      offset_boards: [{ board_index: 0, stages: [{ stage: 1, state: "not_started" }, { stage: 2, state: "not_started" }] }],
      has_pending_calibration: false };

    panel.showState("offset" as never);
    await panel.updateComplete;

    expect(text(panel)).toContain("duplicate run control");
    expect(panel.shadowRoot?.querySelector("[data-action='check-offset']")).toBeNull();
    expect(panel.shadowRoot?.querySelector("[data-action='calibrate-offset']")).toBeNull();
    expect(panel.shadowRoot?.querySelector("[data-action='skip-offset']")).not.toBeNull();
  });

  it("runs measured readiness and requires confirmation before retrying an unfinished chip", async () => {
    const messages: Record<string, unknown>[] = [];
    let runs = 0;
    const readiness = { stage: 1, ready: true, connection_generation: 4,
      entities: offsetReadinessEntities(), reasons: [], thresholds: { sample_count: 3, zero_voltage_peak_volts: 1,
        zero_voltage_spread_volts: 0.5, zero_current_peak_amps: 0.25, zero_current_spread_amps: 0.1,
        voltage_present_minimum_volts: 90, voltage_present_spread_volts: 2 } };
    const panel = await mount({
      callWS: async <T>(message: Record<string, unknown>) => {
        messages.push(message);
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return { state: "device_discovered", devices: [device] } as T;
        if (operation === "check_offset_readiness") return readiness as T;
        if (operation === "calibrate_offset") {
          runs += 1;
          return (runs === 1 ? { state: "partial", board_index: 0, stage: 1,
            expected_tables: [["main_1", [[1, -1], [2, -2], [3, -3]]]],
            unfinished_group_keys: ["main_2"], retry_allowed: true, error: "second chip failed" }
            : { state: "applied_pending_restart_verification", board_index: 0, stage: 1,
              expected_tables: [["main_1", [[1, -1], [2, -2], [3, -3]]], ["main_2", [[4, -4], [5, -5], [6, -6]]]],
              unfinished_group_keys: [], retry_allowed: false, error: null }) as T;
        }
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    });
    const state = panel as unknown as Record<string, unknown>;
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name, evidence: [] };
    state.session = { session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] }, entity_role_counts: {},
      offset_capability: { status: "available", repair_reason: null }, offset_disposition: "not_started",
      offset_boards: [{ board_index: 0, stages: [{ stage: 1, state: "not_started" }, { stage: 2, state: "not_started" }] }],
      has_pending_calibration: false };
    panel.showState("offset" as never);
    await panel.updateComplete;

    panel.shadowRoot?.querySelector<HTMLInputElement>("#offset-board-panel > label.check-row input")?.click();
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action='check-offset']")?.click();
    await tick(); await panel.updateComplete;
    expect(text(panel)).toContain("Measured readiness passed");
    expect(text(panel)).toContain("Zero current peak0.25 A");

    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action='calibrate-offset']")?.click();
    await tick(); await panel.updateComplete;
    expect(text(panel)).toContain("One chip finished; recovery is required");
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action='calibrate-offset']")?.disabled).toBe(true);
    expect(panel.shadowRoot?.querySelector<HTMLInputElement>("#offset-board-panel > label.check-row input")?.checked).toBe(false);
    panel.shadowRoot?.querySelector<HTMLInputElement>("#offset-board-panel > label.check-row input")?.click();
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action='check-offset']")?.click();
    await tick(); await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLInputElement>(".recovery-panel input")?.click();
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action='calibrate-offset']")?.click();
    await tick(); await panel.updateComplete;

    expect(messages.filter((message) => String(message.type).endsWith("/calibrate_offset"))
      .map((message) => ({ board_index: message.board_index, stage: message.stage,
        preparation_acknowledged: message.preparation_acknowledged, confirm_retry: message.confirm_retry })))
      .toEqual([
        { board_index: 0, stage: 1, preparation_acknowledged: true, confirm_retry: false },
        { board_index: 0, stage: 1, preparation_acknowledged: true, confirm_retry: true },
      ]);
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-offset-stage='2']")?.disabled).toBe(false);
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-offset-stage='2']")?.click();
    await panel.updateComplete;
    expect(text(panel)).toContain("Power down before rewiring, keep CT inputs unplugged and CTs off current-carrying conductors");
    expect(text(panel)).toContain("connect/enclose/energize only the voltage reference");
    expect(text(panel)).toContain("check that voltage is present on both chips and every current phase reads near zero");
  });

  it("restores a server-skipped Offset step with only Back and Continue enabled", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.session = { session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] }, entity_role_counts: {},
      offset_capability: { status: "unavailable", repair_reason: null }, offset_disposition: "skipped",
      offset_boards: [{ board_index: 0, stages: [{ stage: 1, state: "skipped" }, { stage: 2, state: "skipped" }] }],
      has_pending_calibration: false };
    panel.showState("offset" as never);
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action='skip-offset']")?.disabled).toBe(true);
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".offset-footer .primary")?.disabled).toBe(false);
  });

  it("restores partial recovery and enables Continue after the server finalizes a partial skip", async () => {
    const partial = { session_id: "session", device_id: "meter-1", state: "partial", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] }, entity_role_counts: {},
      offset_capability: { status: "available", repair_reason: null }, offset_disposition: "partial",
      offset_boards: [{ board_index: 0, stages: [{ stage: 1, state: "partial" }, { stage: 2, state: "not_started" }] }],
      has_pending_calibration: true };
    const skipped = { ...partial, state: "applied_pending_restart_verification",
      offset_boards: [{ board_index: 0, stages: [{ stage: 1, state: "partial" }, { stage: 2, state: "skipped" }] }] };
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] },
      skip_offset_calibration: skipped }));
    const state = panel as unknown as Record<string, unknown>;
    state.session = partial;
    panel.showState("offset" as never);
    await panel.updateComplete;

    expect(text(panel)).toContain("Recovery is required");
    expect(text(panel)).toContain("Reconnect and inspect");
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action='skip-offset']")?.click();
    await tick(); await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".offset-footer .primary")?.disabled).toBe(false);
  });

  it("finishes unchanged calibration without restart and routes to Summary", async () => {
    const calls: string[] = [];
    let releaseCompletion!: (value: unknown) => void;
    const completion = new Promise<unknown>((resolve) => { releaseCompletion = resolve; });
    const completed = { session_id: "session", device_id: "meter-1", state: "verified", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] }, entity_role_counts: {},
      offset_capability: { status: "unavailable", repair_reason: null }, offset_disposition: "skipped",
      offset_boards: [{ board_index: 0, stages: [{ stage: 1, state: "skipped" }, { stage: 2, state: "skipped" }] }],
      has_pending_calibration: false };
    const panel = await mount({
      callWS: async <T>(message: Record<string, unknown>) => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        calls.push(operation);
        if (operation === "setup_status") return { state: "device_discovered", devices: [device] } as T;
        if (operation === "complete_calibration_without_changes") return await completion as T;
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    });
    const state = panel as unknown as Record<string, unknown>;
    state.session = { ...completed, state: "ready" };
    panel.showState("current");
    await panel.updateComplete;

    panel.shadowRoot?.querySelectorAll<HTMLButtonElement>(".action-footer button")[1]?.click();
    await panel.updateComplete;
    const finish = panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary");
    finish?.click();
    finish?.click();
    await panel.updateComplete;

    expect(calls.filter((operation) => operation === "complete_calibration_without_changes")).toHaveLength(1);
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.disabled).toBe(true);
    releaseCompletion(completed);
    await tick();
    await panel.updateComplete;

    expect(calls).toContain("complete_calibration_without_changes");
    expect(calls).not.toContain("restart_and_verify");
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Summary");
    expect(text(panel)).toContain("Completed without calibration changes");
  });

  it("refuses a malformed no-change response without leaving Current", async () => {
    const completed = { session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] }, entity_role_counts: {},
      offset_capability: { status: "unavailable", repair_reason: null }, offset_disposition: "skipped",
      offset_boards: [{ board_index: 0, stages: [{ stage: 1, state: "skipped" }, { stage: 2, state: "skipped" }] }],
      has_pending_calibration: false };
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] },
      complete_calibration_without_changes: completed }));
    const state = panel as unknown as Record<string, unknown>;
    state.session = completed;
    panel.showState("current");
    await panel.updateComplete;

    panel.shadowRoot?.querySelectorAll<HTMLButtonElement>(".action-footer button")[1]?.click();
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.click();
    await tick(); await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Current");
    expect(panel.shadowRoot?.querySelector("[role=alert]")?.textContent).toContain("could not be confirmed");
  });

  it("routes pending calibration to Restart without calling no-change completion", async () => {
    const calls: string[] = [];
    const panel = await mount({
      callWS: async <T>(message: Record<string, unknown>) => {
        calls.push(String(message.type).split("/").at(-1) ?? "");
        return { state: "device_discovered", devices: [device] } as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    });
    const state = panel as unknown as Record<string, unknown>;
    state.session = { session_id: "session", device_id: "meter-1", state: "applied_pending_restart_verification",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] }, has_pending_calibration: true };
    panel.showState("current");
    await panel.updateComplete;

    panel.shadowRoot?.querySelectorAll<HTMLButtonElement>(".action-footer button")[1]?.click();
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.click();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Restart");
    expect(calls).not.toContain("complete_calibration_without_changes");
  });

  it("does not infer no-change completion from an unowned verified subscription", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.session = { session_id: "session", device_id: "meter-1", state: "verified", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] } };
    panel.showState("summary");
    await panel.updateComplete;

    expect(text(panel)).not.toContain("Completed without calibration changes");
    expect(text(panel)).toContain("Restart verification is not complete");
  });

  it("rescans to the discovered device without a separate page or USB completion claim", async () => {
    const hass = makeHass({
      setup_status: { state: "no_device", devices: [] },
      set_installer_intent: { state: "installer_guide", devices: [] },
      rescan: { state: "device_discovered", devices: [device] },
    });
    const panel = await mount(hass);
    const button = panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=rescan]");
    button?.click();
    await tick();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Setup Device");
    expect((panel as unknown as { selectedDeviceId: string | null }).selectedDeviceId).toBe("meter-1");
    expect(text(panel)).toContain("Basement meter");
    expect(text(panel)).toContain("2026.8.0");
    expect(text(panel)).not.toMatch(/(?:USB flash|installation|provisioning) complete/i);
  });

  it("persists new-install package defaults with installer intent", async () => {
    const messages: Record<string, unknown>[] = [];
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        messages.push(message);
        const operation = String(message.type).split("/").at(-1);
        return (operation === "rescan"
          ? { state: "no_device", devices: [] }
          : { state: "installer_guide", devices: [] }) as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    panel.shadowRoot?.querySelector<HTMLInputElement>('[name="addon-count"][value="1"]')?.click();
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector('[data-feature="power_quality"]')).toBeNull();
    panel.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="rescan"]')?.click();
    await tick();

    expect(messages.find((message) => String(message.type).endsWith("set_installer_intent"))).toMatchObject({
      power_quality: [false, false],
      status_fields: [true, false],
    });
  });

  it("loads existing package state without exposing it before Meter Settings", async () => {
    const configured = {
      ...device,
      project_name: "circuitsetup.6c-energy-meter-1-addon",
      importable: false,
      configuration: "meter.yaml",
    };
    const existingTopology: MeterTopology = {
      addon_count: 1,
      board_count: 2,
      ct_count: 12,
      group_count: 4,
      connection_type: "wifi",
      voltage_layout: "two_groups",
      project_name: configured.project_name,
      evidence: [{ source: "config_project", addon_count: 1, detail: configured.project_name }],
    };
    const panel = await mount(makeHass({
      setup_status: { state: "device_discovered", devices: [configured] },
      get_topology: {
        topology: existingTopology,
        package_options: { power_quality: [true, false], status_fields: [false, true] },
      },
    }));

    panel.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="configure-device"]')?.click();
    await tick();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector('[data-feature="power_quality"]')).toBeNull();
    expect((panel as unknown as { packageOptions: import("../src/types").BoardPackageOptions }).packageOptions).toEqual({
      power_quality: [true, false], status_fields: [false, true],
    });
  });

  it("keeps new-install package defaults until the meter config is imported", async () => {
    let setupCallback: ((snapshot: unknown) => void) | undefined;
    let adopted = false;
    const newDevice = {
      ...device,
      project_name: "circuitsetup.6c-energy-meter-1-addon",
    };
    const newTopology: MeterTopology = {
      addon_count: 1,
      board_count: 2,
      ct_count: 12,
      group_count: 4,
      connection_type: "wifi",
      voltage_layout: "two_groups",
      project_name: newDevice.project_name,
      evidence: [{ source: "config_project", addon_count: 1, detail: newDevice.project_name }],
    };
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1);
        if (operation === "setup_status") return (adopted
          ? { state: "device_discovered", devices: [{ ...newDevice, configuration: "meter.yaml" }], bound_device_id: newDevice.entry_id }
          : { state: "no_device", devices: [] }) as T;
        if (operation === "adopt_device") { adopted = true; return { device_id: newDevice.entry_id, configuration: "meter.yaml" } as T; }
        if (operation === "get_topology") return {
          topology: newTopology,
          package_options: { power_quality: [false, false], status_fields: [true, false] },
        } as T;
        return { state: "installer_guide", devices: [] } as T;
      },
      connection: { subscribeMessage: async (callback) => {
        setupCallback = callback as (snapshot: unknown) => void;
        return () => undefined;
      } },
    };
    const panel = await mount(hass);
    panel.shadowRoot?.querySelector<HTMLInputElement>('[name="addon-count"][value="1"]')?.click();
    await panel.updateComplete;
    setupCallback?.({ state: "device_discovered", devices: [newDevice] });
    await tick();
    await tick();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector('[data-feature="power_quality"]')).toBeNull();
    expect((panel as unknown as { packageOptions: import("../src/types").BoardPackageOptions }).packageOptions).toEqual({
      power_quality: [false, false], status_fields: [true, false],
    });
  });

  it("keeps package review state synchronized across apply and rollback", async () => {
    const messages: Record<string, unknown>[] = [];
    const inventory: CtInventory = {
      plan_id: "plan-1",
      source_sha256: "a".repeat(64),
      channels: Array.from({ length: 6 }, (_, index) => ({
        channel: index + 1,
        name: `CT${index + 1}`,
        raw_gain_ct: 5500,
        reporting_multiplier: 1,
        selected_model_id: "model",
        selection_verified_against_config: true,
        display_label: null,
        stored_selection_present: false,
        address: { channel: index + 1, board_index: 0, group_index: Math.floor(index / 3),
          phase: (["A", "B", "C"] as const)[index % 3]! },
      })),
      catalog: { presets: [{ model_id: "model", label: "Model", rated_current_a: 100,
        secondary: "50 mA", default_gain_ct: 5500, requires_burden_jumper_cut: false, notes: "Approved" }],
        source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 },
    };
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        messages.push(message);
        const operation = String(message.type).split("/").at(-1);
        if (operation === "setup_status") return { state: "device_discovered", devices: [{ ...device, configuration: "meter.yaml" }] } as T;
        if (operation === "get_ct_inventory") return inventory as T;
        if (["preview_ct_config", "apply_ct_config", "rollback_ct_config"].includes(operation ?? "")) return { transaction_id: "tx",
          state: operation === "preview_ct_config" ? "previewed" : operation === "apply_ct_config" ? "validated" : "rolled_back",
          source_sha256: inventory.source_sha256,
          changes: [
            { key: "package.main.power_quality", old_value: "disabled", new_value: "enabled" },
            { key: "package.addon7.power_quality", old_value: "enabled", new_value: "disabled" },
          ],
          redacted_diff: "+ power quality", rollback_available: true, evidence: [],
          progress: operation === "apply_ct_config" ? ["config_validated"] : [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false } as T;
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    panel.showInventory(inventory);
    const state = panel as unknown as {
      packageOptions: { power_quality: boolean[]; status_fields: boolean[] };
      sourcePackageOptions: { power_quality: boolean[]; status_fields: boolean[] };
      labelOnly: boolean;
      reviewChanges(): Promise<void>;
      transactionAction(action: "apply" | "rollback"): Promise<void>;
    };
    state.sourcePackageOptions = { power_quality: [false], status_fields: [true] };
    state.packageOptions = { power_quality: [true], status_fields: [true] };
    state.labelOnly = true;

    await state.reviewChanges();
    await state.transactionAction("apply");
    await state.reviewChanges();

    expect(messages.filter((message) => String(message.type).endsWith("preview_ct_config"))).toHaveLength(1);
    expect(messages.find((message) => String(message.type).endsWith("preview_ct_config"))).toMatchObject({
      changes: [],
      package_options: { power_quality: [true], status_fields: [true] },
    });
    await state.transactionAction("rollback");
    expect(state.sourcePackageOptions).toEqual({ power_quality: [false], status_fields: [true] });
    await state.reviewChanges();
    expect(messages.filter((message) => String(message.type).endsWith("preview_ct_config"))).toHaveLength(2);
  });

  it("keeps Rescan on Setup Device and reports no compatible meter without claiming completion", async () => {
    const panel = await mount(makeHass({
      setup_status: { state: "no_device", devices: [] },
      set_installer_intent: { state: "installer_guide", devices: [] },
      rescan: { state: "no_device", devices: [] },
    }));
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=rescan]")?.click();
    await tick();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Setup Device");
    expect(panel.shadowRoot?.querySelector(".sr-status")?.textContent).toContain("No compatible meter found");
    expect(text(panel)).not.toMatch(/(?:USB flash|installation|provisioning) complete/i);
  });

  it("keeps an active topology review when a Rescan result arrives later", async () => {
    let setupCallback: ((message: unknown) => void) | undefined;
    let resolveRescan: ((value: unknown) => void) | undefined;
    const snapshot = { state: "device_discovered", devices: [device] };
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return { state: "no_device", devices: [] } as T;
        if (operation === "set_installer_intent") return { state: "installer_guide", devices: [] } as T;
        if (operation === "rescan") return await new Promise<T>((resolve) => { resolveRescan = resolve as (value: unknown) => void; });
        return {} as T;
      },
      connection: { subscribeMessage: async (callback) => {
        setupCallback = callback as (message: unknown) => void;
        return () => undefined;
      } },
    };
    const panel = await mount(hass);
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=rescan]")?.click();
    await tick();
    setupCallback?.(snapshot);
    await panel.updateComplete;
    const state = panel as unknown as { selectedDeviceId: string | null; topology: unknown; announcement: string };
    const preservedTopology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] };
    state.topology = preservedTopology;

    resolveRescan?.(snapshot);
    await tick();
    await panel.updateComplete;

    expect(state.selectedDeviceId).toBeNull();
    expect(state.topology).toBe(preservedTopology);
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Setup Device");
  });

  it("does not replace an active inline topology review when another meter is discovered", async () => {
    let setupCallback: ((message: unknown) => void) | undefined;
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        if (String(message.type).endsWith("/setup_status")) return { state: "device_discovered", devices: [device] } as T;
        return {} as T;
      },
      connection: { subscribeMessage: async (callback) => {
        setupCallback = callback as (message: unknown) => void;
        return () => undefined;
      } },
    };
    const panel = await mount(hass);
    const topology: MeterTopology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] };
    panel.showTopology(topology);
    const meter2 = { ...device, entry_id: "meter-2", title: "Garage meter" };

    setupCallback?.({ state: "device_discovered", devices: [device, meter2] });
    await panel.updateComplete;

    const state = panel as unknown as { selectedDeviceId: string | null; topology: unknown };
    expect(state.selectedDeviceId).toBe("meter-1");
    expect(state.topology).toBe(topology);
    expect(text(panel)).toContain("Topology evidence");
  });

  it("keeps the current Setup Device selection when Rescan returns the same compatible device", async () => {
    const snapshot = { state: "device_discovered", devices: [device] };
    const panel = await mount(makeHass({
      setup_status: snapshot,
      set_installer_intent: { state: "installer_guide", devices: [] },
      rescan: snapshot,
    }));
    const state = panel as unknown as { topology: unknown; announcement: string };
    const preservedTopology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] };
    state.topology = preservedTopology;
    state.announcement = "CircuitSetup energy meter discovered.";
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=rescan]")?.click();
    await tick();
    await panel.updateComplete;

    expect(state.topology).toBe(preservedTopology);
    expect(state.announcement).toBe("CircuitSetup energy meter discovered.");
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Setup Device");
  });

  it("records the firmware selected at Rescan click time", async () => {
    const messages: Record<string, unknown>[] = [];
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        messages.push(message);
        const operation = String(message.type).split("/").at(-1);
        if (operation === "setup_status") return { state: "no_device", devices: [] } as T;
        if (operation === "set_installer_intent") return { state: "installer_guide", devices: [] } as T;
        if (operation === "rescan") return { state: "device_discovered", devices: [device] } as T;
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    await tick();
    const select = panel.shadowRoot?.querySelector<HTMLSelectElement>("[data-action=firmware-version]");
    select!.value = "2026.7.0";
    select!.dispatchEvent(new Event("change"));
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=rescan]")?.click();
    await tick();

    expect(messages.find((message) => String(message.type).endsWith("/set_installer_intent"))).toMatchObject({
      firmware_product_id: "6chan_energy_meter_main_board",
      esphome_version: "2026.7.0",
    });
  });

  it("blocks topology mismatch and announces a focused live error", async () => {
    const panel = await mount(
      makeHass({ setup_status: { state: "device_discovered", devices: [device] } }),
    );
    panel.showTopology({
      addon_count: 1,
      board_count: 2,
      ct_count: 11,
      group_count: 4,
      connection_type: "wifi",
      voltage_layout: "single",
      project_name: device.project_name,
      evidence: [
        { source: "config_project", addon_count: 1, detail: "project" },
        { source: "native_entity_counts", addon_count: 0, detail: "entities" },
      ],
    });
    await panel.updateComplete;

    const alert = panel.shadowRoot?.querySelector<HTMLElement>("[role=alert]");
    expect(alert?.textContent).toContain("Topology mismatch");
    expect(panel.shadowRoot?.querySelector("[data-action=continue]")).toBeNull();
    expect(panel.shadowRoot?.activeElement).toBe(alert);
  });

  it("blocks Continue when topology evidence is empty or non-authoritative", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    for (const evidence of [[], [{ source: "dashboard_import", addon_count: 0, detail: "Import hint" }]]) {
      panel.showTopology({ addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
        connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
        evidence: evidence as never });
      await panel.updateComplete;
      expect(panel.shadowRoot?.querySelector("[data-action=continue]")).toBeNull();
      expect(panel.shadowRoot?.querySelector("[role=alert]")).not.toBeNull();
    }
  });

  it("starts runtime-only calibration directly from authoritative native topology", async () => {
    const operations: string[] = [];
    const setup = { state: "device_discovered", devices: [device], configuration_authoritative: false };
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        operations.push(operation);
        if (operation === "setup_status") return setup as T;
        if (operation === "get_active_work") return { session: null, transaction: null, verified_calibration: null } as T;
        if (operation === "start_session") return { session_id: "native-session", device_id: "meter-1",
          state: "safety_required", safety_acknowledged: false, preflight: { issues: [], zeroed_roles: [] } } as T;
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    panel.showTopology({ addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime project metadata" }] });
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=continue]")?.click();
    await tick(); await panel.updateComplete;
    expect(operations).toContain("start_session");
    expect(operations).not.toContain("get_ct_inventory");
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Safety");
  });

  it("uses the full meter response for CT verification when setup is runtime-only", async () => {
    const operations: string[] = [];
    const configured = { ...device, importable: false, configuration: "meter.yaml" };
    const inventory: CtInventory = {
      plan_id: "plan-1", source_sha256: "a".repeat(64),
      channels: Array.from({ length: 6 }, (_, index) => ({ channel: index + 1,
        name: index === 0 ? "Main A" : `CT${index + 1}`, raw_gain_ct: 5500, reporting_multiplier: 1,
        selected_model_id: "model", selection_verified_against_config: true, display_label: null, stored_selection_present: false,
        address: { channel: index + 1, board_index: 0, group_index: Math.floor(index / 3),
          phase: (["A", "B", "C"] as const)[index % 3]! } })),
      catalog: { presets: [{ model_id: "model", label: "Model", rated_current_a: 100,
        secondary: "50 mA", default_gain_ct: 5500, requires_burden_jumper_cut: false, notes: "Approved" }],
        source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 },
    };
    const hass = makeHass({
      setup_status: { state: "device_discovered", devices: [configured], configuration_authoritative: false },
      get_meter_configuration: meterResponse(),
      get_ct_inventory: inventory,
    });
    const callWS = hass.callWS;
    hass.callWS = async <T>(message: Record<string, unknown>) => {
      operations.push(String(message.type).split("/").at(-1) ?? "");
      return callWS<T>(message);
    };
    const panel = await mount(hass);
    panel.showTopology({ addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: configured.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime project metadata" }] });
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=continue]")?.click();
    await tick(); await tick(); await panel.updateComplete;

    expect(operations).toContain("get_meter_configuration");
    expect(operations).not.toContain("start_session");
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Meter Settings");
    panel.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="continue-meter-settings"]')?.click();
    await tick(); await tick(); await panel.updateComplete;
    expect(operations).not.toContain("get_ct_inventory");
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Circuits & CTs");
    expect(panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT1 name"]')?.value).toBe("CT1");
    expect(text(panel)).toContain("If you expect to measure more than 65.535 A");
    expect(text(panel)).toContain("divides the gain and multiplies current and power output");
  });

  it("never substitutes restart verification for missing CT inventory", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    panel.showState("ct"); await panel.updateComplete;

    expect(text(panel)).toContain("Circuits & CTs are not loaded");
    expect(text(panel)).not.toContain("Restart verification is not complete");
  });

  it("does not call the redundant CT inventory route after a full meter response", async () => {
    const configured = { ...device, importable: false, configuration: "meter.yaml" };
    const panel = await mount(makeHass({
      setup_status: { state: "device_discovered", devices: [configured] },
      get_meter_configuration: meterResponse(), get_ct_inventory: new Error("blocking catalog load"),
    }));
    panel.showTopology({ addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: configured.project_name,
      evidence: [{ source: "config_project", addon_count: 0, detail: "Configured meter" }] });
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=continue]")?.click();
    await tick(); await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="continue-meter-settings"]')?.click();
    await tick(); await panel.updateComplete;

    expect(text(panel)).not.toContain("CT inventory could not be loaded");
    expect(text(panel)).not.toContain("Configuration and runtime evidence disagree");
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Circuits & CTs");
  });

  it("starts only one calibration session when Continue is clicked repeatedly", async () => {
    let starts = 0;
    let resolveStart!: (value: unknown) => void;
    const start = new Promise<unknown>((resolve) => { resolveStart = resolve; });
    const setup = { state: "device_discovered", devices: [device], configuration_authoritative: false };
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return setup as T;
        if (operation === "get_active_work") return { session: null, transaction: null, verified_calibration: null } as T;
        if (operation === "start_session") { starts += 1; return await start as T; }
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    panel.showTopology({ addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime project metadata" }] });
    await panel.updateComplete;
    const continueButton = panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=continue]");
    continueButton?.click();
    continueButton?.click();
    await tick();

    expect(starts).toBe(1);

    resolveStart({ session_id: "native-session", device_id: "meter-1", state: "safety_required",
      safety_acknowledged: false, preflight: { issues: [], zeroed_roles: [] } });
    await tick(); await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Safety");
  });

  it("requires an explicit bounded multiplier for runtime-only current calibration", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] };
    state.inventory = null;
    state.currentReferences = new Map([[1, 5]]);
    state.stabilityByTarget = new Map([["current:1", { target: "current", target_id: "1", stable: true,
      windows: [{ samples: [5, 5, 5], mean: 5, standard_deviation: 0, range_percent: 0 }] }]]);
    panel.showState("current"); await panel.updateComplete;
    const input = panel.shadowRoot?.querySelector<HTMLSelectElement>("[data-role=reporting-multiplier]");
    const calibrate = Array.from(panel.shadowRoot?.querySelectorAll<HTMLButtonElement>("button.primary") ?? [])
      .find((button) => button.textContent?.includes("Calibrate current"));
    expect(input).not.toBeNull();
    expect(calibrate?.disabled).toBe(true);
    input!.value = "2";
    input!.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await panel.updateComplete;
    const enabled = Array.from(panel.shadowRoot?.querySelectorAll<HTMLButtonElement>("button.primary") ?? [])
      .find((button) => button.textContent?.includes("Calibrate current"));
    expect(enabled?.disabled).toBe(false);
  });

  it("shows six visibly numbered CT rows and the exact board range", async () => {
    const panel = await mount(
      makeHass({ setup_status: { state: "device_discovered", devices: [device] } }),
    );
    panel.showInventory({
      plan_id: "plan-1",
      source_sha256: "a".repeat(64),
      channels: Array.from({ length: 42 }, (_, index) => ({
        channel: index + 1,
        name: `CT${index + 1}`,
        raw_gain_ct: index === 3 ? 27518 : 5500,
        reporting_multiplier: 1,
        selected_model_id: index === 3 ? null : "cs-ct-200a",
        selection_verified_against_config: false,
        display_label: null,
        stored_selection_present: false,
        address: {
          channel: index + 1,
          board_index: Math.floor(index / 6),
          group_index: Math.floor((index % 6) / 3),
          phase: (["A", "B", "C"] as const)[index % 3]!,
        },
      })),
      catalog: {
        presets: [
          {
            model_id: "cs-ct-200a",
            label: "CS-CT-200A-333mV",
            rated_current_a: 200,
            secondary: "333 mV @ 200 A",
            default_gain_ct: 5500,
            requires_burden_jumper_cut: false,
            notes: "Use burden at least 1 VA.",
          },
        ],
        source_repository: "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter",
        source_ref: "approved",
        schema_version: 1,
      },
    });
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelectorAll("[data-board-tab]")).toHaveLength(7);
    const tabs = panel.shadowRoot?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    expect(tabs?.[0]?.getAttribute("aria-controls")).toBe("board-panel");
    expect(tabs?.[0]?.getAttribute("tabindex")).toBe("0");
    expect(tabs?.[1]?.getAttribute("tabindex")).toBe("-1");
    expect(panel.shadowRoot?.querySelector('[role="tabpanel"]')?.getAttribute("aria-labelledby")).toBe("board-tab-0");
    expect(panel.shadowRoot?.querySelectorAll("[data-ct-row]")).toHaveLength(6);
    expect(panel.shadowRoot?.querySelectorAll("[data-group-nav]")).toHaveLength(0);
    expect(Array.from(panel.shadowRoot?.querySelectorAll(".ct-index") ?? [], (item) => item.textContent))
      .toEqual(["CT1", "CT2", "CT3", "CT4", "CT5", "CT6"]);
    expect(panel.shadowRoot?.querySelector(".row-count")?.textContent).toBe("Showing 1–6 of 42 CTs");
    expect(text(panel)).toContain("Choose model");
    expect(panel.shadowRoot?.querySelector<HTMLSelectElement>('select[aria-label="CT2 model"]')?.value).toBe("cs-ct-200a");

    tabs?.[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await panel.updateComplete;
    expect(tabs?.[1]?.getAttribute("aria-selected")).toBe("true");
    expect(panel.shadowRoot?.activeElement).toBe(tabs?.[1]);

    panel.shadowRoot?.querySelector<HTMLButtonElement>('[data-board-tab="6"]')?.click();
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelectorAll("[data-ct-row]")).toHaveLength(6);
    expect(Array.from(panel.shadowRoot?.querySelectorAll(".ct-index") ?? [], (item) => item.textContent))
      .toEqual(["CT37", "CT38", "CT39", "CT40", "CT41", "CT42"]);
    expect(panel.shadowRoot?.querySelector(".row-count")?.textContent).toBe("Showing 37–42 of 42 CTs");
  });

  it("reloads a stale CT preview while preserving the reviewed draft", async () => {
    const stale = Object.assign(new Error("expired"), { code: "stale_confirmation" });
    const fresh = {
      plan_id: "fresh-plan",
      source_sha256: "b".repeat(64),
      channels: Array.from({ length: 6 }, (_, index) => ({
        channel: index + 1,
        name: `CT${index + 1}`,
        raw_gain_ct: 27518,
        reporting_multiplier: 1,
        selected_model_id: null,
        selection_verified_against_config: false,
        display_label: null,
        stored_selection_present: false,
        address: { channel: index + 1, board_index: 0, group_index: index < 3 ? 0 : 1,
          phase: (["A", "B", "C"] as const)[index % 3] },
      })),
      catalog: {
        presets: [{
          model_id: "cs-ct-200a", label: "CS-CT-200A-333mV", rated_current_a: 200,
          secondary: "333 mV @ 200 A", default_gain_ct: 5500,
          requires_burden_jumper_cut: false, notes: "Use burden at least 1 VA.",
        }],
        source_repository: "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter",
        source_ref: "approved", schema_version: 1,
      },
    };
    const hass = makeHass({
      setup_status: { state: "device_discovered", devices: [device] },
      preview_ct_config: stale,
      get_ct_inventory: fresh,
    });
    const panel = await mount(hass);
    panel.showInventory({
      plan_id: "expired-plan",
      source_sha256: "a".repeat(64),
      channels: [{
        channel: 1,
        name: "CT1",
        raw_gain_ct: 27518,
        reporting_multiplier: 1,
        selected_model_id: null,
        selection_verified_against_config: false,
        display_label: null,
        stored_selection_present: false,
        address: { channel: 1, board_index: 0, group_index: 0, phase: "A" },
      }],
      catalog: {
        presets: [{
          model_id: "cs-ct-200a",
          label: "CS-CT-200A-333mV",
          rated_current_a: 200,
          secondary: "333 mV @ 200 A",
          default_gain_ct: 5500,
          requires_burden_jumper_cut: false,
          notes: "Use burden at least 1 VA.",
        }],
        source_repository: "CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter",
        source_ref: "approved",
        schema_version: 1,
      },
    });
    await panel.updateComplete;
    const model = panel.shadowRoot?.querySelector<HTMLSelectElement>('select[aria-label="CT1 model"]');
    if (model) {
      model.value = "cs-ct-200a";
      model.dispatchEvent(new Event("change"));
    }
    await panel.updateComplete;
    const state = panel as unknown as { reviewChanges(): Promise<void> };
    await state.reviewChanges();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector("[role=alert]")).toBeNull();
    expect(text(panel)).toContain("Circuits & CTs");
    expect(text(panel)).toContain("Live CT data reloaded");
    expect(panel.shadowRoot?.querySelector<HTMLSelectElement>('select[aria-label="CT1 model"]')?.value)
      .toBe("cs-ct-200a");
  });

  it("calibrates selected voltage references with schema-valid one-reference requests", async () => {
    const targets: string[] = [];
    const calibrated: string[] = [];
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return { state: "device_discovered", devices: [device] } as T;
        if (operation === "check_stability") {
          const targetId = message.target_id as string;
          targets.push(targetId);
          return { target: "voltage", target_id: targetId, stable: true,
            windows: Array.from({ length: 3 }, () => ({ samples: [120], mean: 120,
              standard_deviation: 0, range_percent: 0 })) } as T;
        }
        if (operation === "calibrate_voltage") {
          const referenceId = message.reference_id as string;
          calibrated.push(referenceId);
          const groups = referenceId === "main" ? ["main_1", "main_2"] : ["addon1_1", "addon1_2"];
          return groups.map((group_key, index) => ({ state: "indeterminate", group_key, phase: null,
            changed_channels: [index * 3 + 1, index * 3 + 2, index * 3 + 3], iteration: 1,
            before_values: [120, 120, 120], after_values: [], error_percent_values: [], gain_evidence: null,
            restore_evidence: null, retry_allowed: false })) as T;
        }
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & {
      voltageGroupKeys(): string[];
    };
    state.session = { session_id: "session", device_id: "meter-1", state: "ready",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] },
      calibration_sources: { meter_main1: "flash", meter_main2: "configuration",
        addon1_1: "flash", addon1_2: "configuration" } };
    state.voltageReferences = [120, 121];
    state.topology = { addon_count: 1, board_count: 2, ct_count: 12, group_count: 4,
      connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 1, detail: "Runtime identity" }] };
    panel.showState("voltage");
    await panel.updateComplete;

    expect(text(panel)).toContain("Calibrate Voltage");
    expect(text(panel)).not.toContain("Calibrate shared voltage");
    state.meterSettingsDraft = { electrical_system: "split_phase_120_240", line_frequency_hz: 60, authoritative: true,
      voltage_references: [{ reference_id: "main", group_keys: ["main_1", "main_2"] }], warnings: [] };
    expect(state.voltageGroupKeys()).toEqual(["main_1", "main_2"]);
    expect(panel.shadowRoot?.querySelectorAll('[data-voltage-board]')).toHaveLength(2);
    const progress = panel.shadowRoot?.querySelector(".progress-steps");
    const progressItems = [...panel.shadowRoot?.querySelectorAll(".progress-steps li") ?? []];
    expect(progressItems.map((item) => item.textContent?.trim())).toEqual([
      "1Set reference", "2Check stability", "3Run calibration", "4Verify gain", "5Zero reference",
    ]);
    expect(progressItems.filter((item) => item.classList.contains("active"))
      .map((item) => item.textContent?.trim())).toEqual(["2Check stability"]);
    expect(progressItems[2]?.classList.contains("pending")).toBe(true);
    const reference = panel.shadowRoot?.querySelector(".reference-block input");
    expect(Boolean(progress && reference
      && (progress.compareDocumentPosition(reference) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    expect(reference?.closest(".reference-block")?.querySelector("button.primary")).toBeNull();
    const actions = panel.shadowRoot?.querySelector(".calibration-actions");
    const check = actions?.querySelector<HTMLButtonElement>("button.secondary");
    expect([...actions?.querySelectorAll("button") ?? []].map((button) => button.textContent?.trim()))
      .toEqual(["Check stability", "Calibrate voltage"]);
    check?.click();
    check?.click();
    await tick(); await panel.updateComplete;
    expect(targets).toEqual(["main"]);
    expect(text(panel)).toContain("Loaded voltage data for the selected reference.");
    panel.shadowRoot?.querySelector<HTMLButtonElement>(".calibration-step button.primary")?.click();
    await expect.poll(() => calibrated).toEqual(["main"]);
    await panel.updateComplete;

    state.board = 1;
    state.topology = { ...(state.topology as object), voltage_layout: "two_voltages" };
    panel.requestUpdate();
    await panel.updateComplete;
    expect(state.voltageGroupKeys()).toEqual(["addon1_1", "addon1_2"]);
    expect(panel.shadowRoot?.querySelectorAll(".reference-block input")).toHaveLength(2);
    expect(text(panel)).toContain("Saved flash");
    expect(text(panel)).toContain("Configuration");
  });

  it("shows both voltage-chip results once and confirms board completion", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const result = (groupKey: string, instanceId: string, firstChannel: number) => ({
      state: "applied_pending_restart_verification", group_key: groupKey, phase: null,
      changed_channels: [firstChannel, firstChannel + 1, firstChannel + 2], iteration: 1,
      before_values: [120, 120, 120], after_values: [122.4, 122.4, 122.4], error_percent_values: [0, 0, 0],
      gain_evidence: { outcome: "success", instance_id: instanceId, operation_sequence: 1,
        phases: ["A", "B", "C"].map((phase, index) => ({ phase, measured_voltage: 122.3 + index / 100,
          measured_current: 0, reference_voltage: 122.4, reference_current: 0,
          old_voltage_gain: 7585 + index, new_voltage_gain: 7591 + index,
          old_current_gain: 11143, new_current_gain: 11143 })), flash_saved: true },
      restore_evidence: { reference: "zeroed" }, retry_allowed: false,
    });
    const state = panel as unknown as Record<string, unknown>;
    state.session = { session_id: "session", device_id: "meter-1", state: "applied_pending_restart_verification",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] },
      calibration_sources: { meter_main1: "flash", meter_main2: "flash" }, has_pending_calibration: true };
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name, evidence: [] };
    state.voltageReferences = [122.4, 0];
    state.calibrationByTarget = new Map([
      ["voltage:main_1", result("main_1", "meter_main1", 1)],
      ["voltage:main_2", result("main_2", "meter_main2", 4)],
    ]);

    panel.showState("voltage");
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelectorAll('[aria-label="Calibration evidence"]')).toHaveLength(2);
    expect(text(panel)).toContain("Gain evidence · meter_main1");
    expect(text(panel)).toContain("Gain evidence · meter_main2");
    expect(text(panel)).toContain("Voltage calibration complete for Main Board");
    expect(text(panel)).toContain("Voltage calibrated this session");
    expect(panel.shadowRoot?.querySelector("details")).toBeNull();
  });

  it("keeps the installed slow-interval calibration warning visible after CT inventory loads", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.meterSettingsDraft = { electrical_system: "split_phase_120_240", line_frequency_hz: 60, authoritative: true,
      update_interval_s: 30, voltage_references: [{ reference_id: "main", group_keys: ["main_1", "main_2"] }],
      warnings: ["slow_interval_extends_calibration"] };
    state.inventory = { plan_id: "plan-1", source_sha256: "a".repeat(64), channels: [], catalog: { presets: [], source_repository: "repo", source_ref: "ref", schema_version: 1 } };
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2, connection_type: "wifi",
      voltage_layout: "two_groups", project_name: device.project_name, evidence: [] };
    panel.showState("voltage");
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector('[role="status"]')?.textContent).toContain("30-second update interval");
  });

  it("separates active flash source from current calibration completion", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.session = { session_id: "session", device_id: "meter-1", state: "applied_pending_restart_verification",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] },
      calibration_sources: { meter_main1: "flash", meter_main2: "flash" }, has_pending_calibration: true };
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name, evidence: [] };
    state.inventory = { channels: Array.from({ length: 6 }, (_, index) => ({ channel: index + 1,
      reporting_multiplier: 1 })) };
    state.calibrationByTarget = new Map([["voltage:main_1", { state: "applied_pending_restart_verification",
      group_key: "main_1", phase: null, changed_channels: [1, 2, 3], iteration: 1,
      before_values: [], after_values: [], error_percent_values: [],
      gain_evidence: { instance_id: "meter_main1", flash_saved: true }, restore_evidence: null, retry_allowed: false }]]);

    panel.showState("current");
    await panel.updateComplete;

    const sourceRows = [...panel.shadowRoot?.querySelectorAll(".calibration-source tbody tr") ?? []]
      .map((row) => [...row.querySelectorAll("td")].map((cell) => cell.textContent?.trim()).join(" "));
    expect(sourceRows).toEqual([
      "meter_main1 Saved flash No",
      "meter_main2 Saved flash No",
    ]);
    expect(text(panel)).toContain("Current calibrated this session");
    expect(text(panel)).not.toContain("Current calibration complete");
    expect(panel.shadowRoot?.querySelector("details")).toBeNull();
  });

  it("requires both voltage chips or explicit skip without discarding completed gains", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    const completed = new Map([
      ["voltage:main_1", { state: "applied_pending_restart_verification",
        group_key: "main_1", phase: null, changed_channels: [1, 2, 3], iteration: 1,
        before_values: [], after_values: [], error_percent_values: [], gain_evidence: null,
        restore_evidence: null, retry_allowed: false }],
      ["voltage:main_2", { state: "result_outside_tolerance",
        group_key: "main_2", phase: null, changed_channels: [], iteration: 1,
        before_values: [], after_values: [], error_percent_values: [], gain_evidence: null,
        restore_evidence: null, retry_allowed: true }],
    ]);
    state.session = { session_id: "session", device_id: "meter-1", state: "applied_pending_restart_verification",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] }, calibration_sources: {},
      has_pending_calibration: true };
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name, evidence: [] };
    state.inventory = { channels: Array.from({ length: 6 }, (_, index) => ({ channel: index + 1,
      reporting_multiplier: 1 })) };
    state.calibrationByTarget = completed;

    panel.showState("voltage"); await panel.updateComplete;
    let footer = [...panel.shadowRoot?.querySelectorAll<HTMLButtonElement>(".action-footer button") ?? []];
    expect(footer.map((button) => button.textContent?.trim())).toEqual(["Back", "Skip voltage calibration", "Continue"]);
    expect(footer[2]?.disabled).toBe(true);
    footer[1]?.click(); await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Voltage");
    expect(state.calibrationByTarget).toBe(completed);
    footer = [...panel.shadowRoot?.querySelectorAll<HTMLButtonElement>(".action-footer button") ?? []];
    expect(footer[2]?.disabled).toBe(false);
    footer[2]?.click(); await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Current");
    footer = [...panel.shadowRoot?.querySelectorAll<HTMLButtonElement>(".action-footer button") ?? []];
    expect(footer.map((button) => button.textContent?.trim())).toEqual(["Back", "Skip current calibration", "Continue"]);
    footer[1]?.click(); await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Current");
    expect(state.calibrationByTarget).toBe(completed);
    footer = [...panel.shadowRoot?.querySelectorAll<HTMLButtonElement>(".action-footer button") ?? []];
    footer[2]?.click(); await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Restart");
  });

  it("keeps topology review inline on Setup Device", async () => {
    let resolveTopology!: (value: unknown) => void;
    const pending = new Promise<unknown>((resolve) => { resolveTopology = resolve; });
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return { state: "device_discovered", devices: [device] } as T;
        if (operation === "get_topology") return await pending as T;
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    const configure = panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=configure-device]");
    configure?.click();
    await tick(); await panel.updateComplete;

    expect(configure?.disabled).toBe(true);
    expect(configure?.textContent).toContain("Loading topology");

    resolveTopology({ addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] });
    await tick(); await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Setup Device");
    expect(text(panel)).toContain("Topology evidence");
    expect(panel.shadowRoot?.querySelector("[data-action=continue]")).not.toBeNull();
  });

  it("clears inline topology and mismatch errors when Back is clicked", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    panel.showTopology({ addon_count: 0, board_count: 1, ct_count: 5, group_count: 2,
      connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] });
    await panel.updateComplete;

    [...panel.shadowRoot?.querySelectorAll<HTMLButtonElement>("button") ?? []]
      .find((button) => button.textContent?.trim() === "Back")?.click();
    await panel.updateComplete;

    expect(text(panel)).not.toContain("Topology evidence");
    expect(panel.shadowRoot?.querySelector("[role=alert]")).toBeNull();
  });

  it("shows stale handle guidance when configuring a changed device", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return { state: "device_discovered", devices: [device] } as T;
        if (operation === "get_topology") throw Object.assign(new Error("stale"), { code: "stale_handle" });
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=configure-device]")?.click();
    await tick(); await panel.updateComplete;

    expect(text(panel)).toContain("The selected device changed or is no longer available. Rescan and try again.");
    expect(text(panel)).not.toContain("This confirmation expired");
  });

  it("skips gain calibration and completes the unchanged session without a restart", async () => {
    const sent: Array<Record<string, unknown>> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        sent.push(message);
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return { state: "device_discovered", devices: [device] } as T;
        if (operation === "complete_calibration_without_changes") return { session_id: "session", device_id: "meter-1", state: "verified",
          safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] }, entity_role_counts: {}, calibration_sources: {},
          offset_capability: { status: "unavailable", repair_reason: null }, offset_disposition: "skipped",
          offset_boards: [{ board_index: 0, stages: [{ stage: 1, state: "skipped" }, { stage: 2, state: "skipped" }] }],
          has_pending_calibration: false } as T;
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown>;
    state.session = { session_id: "session", device_id: "meter-1", state: "ready",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] }, calibration_sources: {},
      has_pending_calibration: false };
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name, evidence: [] };
    state.inventory = { plan_id: "plan", source_sha256: "a".repeat(64), channels: [],
      catalog: { presets: [], source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 } };

    panel.showState("voltage");
    await panel.updateComplete;
    const voltageSkip = [...panel.shadowRoot?.querySelectorAll<HTMLButtonElement>(".action-footer button") ?? []]
      .find((button) => button.textContent?.includes("Skip voltage calibration"));
    expect(voltageSkip).toBeDefined();
    voltageSkip?.click();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Voltage");
    [...panel.shadowRoot?.querySelectorAll<HTMLButtonElement>(".action-footer button") ?? []]
      .find((button) => button.textContent?.trim() === "Continue")?.click();
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Current");
    const currentSkip = [...panel.shadowRoot?.querySelectorAll<HTMLButtonElement>(".action-footer button") ?? []]
      .find((button) => button.textContent?.includes("Skip current calibration"));
    expect(currentSkip).toBeDefined();
    currentSkip?.click();
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Current");
    [...panel.shadowRoot?.querySelectorAll<HTMLButtonElement>(".action-footer button") ?? []]
      .find((button) => button.textContent?.trim() === "Continue")?.click();
    await tick();
    await panel.updateComplete;

    expect(sent.filter((message) => String(message.type).endsWith("complete_calibration_without_changes"))).toHaveLength(1);
    expect(sent.filter((message) => String(message.type).endsWith("cancel_session"))).toHaveLength(0);
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Summary");
    expect(text(panel)).toContain("Completed without calibration changes");
  });

  it("shows one three-CT group and skips blank current references", async () => {
    const sent: Array<Record<string, unknown>> = [];
    const panel = await mount({
      callWS: async <T>(message: Record<string, unknown>) => { sent.push(message); return {} as T; },
      connection: { subscribeMessage: async () => () => undefined },
    });
    const state = panel as unknown as Record<string, unknown>;
    state.session = { session_id: "session", device_id: "meter-1", state: "ready",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] }, calibration_sources: {} };
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name, evidence: [] };
    state.inventory = { channels: Array.from({ length: 6 }, (_, index) => ({ channel: index + 1,
      reporting_multiplier: 1 })) };
    state.currentReferences = new Map([[1, 5], [3, 7]]);
    const live = (targetId: string) => ({ target: "current", target_id: targetId, stable: true,
      windows: [{ samples: [5], mean: 5, standard_deviation: 0, range_percent: 0 }] });
    state.stabilityByTarget = new Map([["current:1", live("1")], ["current:3", live("3")]]);
    panel.showState("current");
    await panel.updateComplete;

    expect(panel.shadowRoot?.querySelectorAll('[data-current-reference]')).toHaveLength(3);
    expect(text(panel)).toContain("CT1");
    expect(text(panel)).toContain("CT3");
    expect(text(panel)).not.toContain("CT4 reference");
    panel.shadowRoot?.querySelector<HTMLButtonElement>("button.primary")?.click();
    await tick();
    expect(sent.find((message) => String(message.type).endsWith("calibrate_current"))?.references)
      .toEqual([{ channel: 1, reference: 5, reporting_multiplier: 1 },
        { channel: 3, reference: 7, reporting_multiplier: 1 }]);
  });

  it("renders review, safety, voltage, current, restart, summary, recovery, and technical states", async () => {
    const panel = await mount(
      makeHass({ setup_status: { state: "device_discovered", devices: [device] } }),
    );
    for (const [step, required] of [
      ["build", ["Flash & Verify", "Apply", "Install", "rename/entity-key"]],
      ["safety", ["Safety", "acknowledge", "Cancel session"]],
      ["voltage", ["Voltage", "reference", "check stability"]],
      ["current", ["Current", "calibration"]],
      ["restart", ["Restart", "restart verification"]],
      ["summary", ["Summary", "authority source", "Technical details"]],
    ] as const) {
      panel.showState(step);
      await panel.updateComplete;
      for (const copy of required) expect(text(panel).toLowerCase()).toContain(copy.toLowerCase());
    }
    panel.showRecovery("calibration_outcome_indeterminate");
    await panel.updateComplete;
    expect(text(panel)).toContain("Reconnect and inspect");
    panel.showRecovery("restart_failed");
    await panel.updateComplete;
    expect(text(panel).toLowerCase()).toContain("rollback");
    expect(panel.shadowRoot?.querySelector("details")).not.toBeNull();
  });

  it("exposes mobile and reduced-motion contracts without horizontal page scrolling", async () => {
    const panel = await mount(
      makeHass({ setup_status: { state: "no_device", devices: [] } }),
    );
    const style = panel.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(style).toContain("prefers-reduced-motion: reduce");
    expect(style).toContain("min-height: 44px");
    expect(style).toContain("overflow-x: hidden");
    expect(style).toContain("@media (max-width: 720px)");
  });

  it("inherits Home Assistant typography and theme colors", () => {
    const cssText = panelStyles.cssText;
    expect(cssText).toContain("font-family: var(--ha-font-family-body, Roboto, Noto, sans-serif)");
    expect(cssText).toContain("font-size: var(--ha-font-size-m, 14px)");
    expect(cssText).toContain("--accent: var(--primary-color, #00639b)");
    expect(cssText).toContain("--surface: var(--ha-card-background, var(--card-background-color, #fff))");
    expect(cssText).toContain("--border: var(--divider-color, #e0e0e0)");
    expect(cssText).toContain("background: var(--primary-background-color, #fafafa)");
    expect(cssText).not.toContain("--navy:");
    expect(cssText).not.toContain("--orange:");
    expect(contrastRatio("#ffffff", "#00639b")).toBeGreaterThanOrEqual(4.5);
  });

  it("requires exact Custom CT fields and burden acknowledgement before review", async () => {
    const inventory: CtInventory = {
      plan_id: "plan-1", source_sha256: "a".repeat(64),
      channels: [{ channel: 1, name: "CT1", raw_gain_ct: 5500, reporting_multiplier: 1,
        selected_model_id: "preset-burden", selection_verified_against_config: true,
        display_label: null, stored_selection_present: false,
        address: { channel: 1, board_index: 0, group_index: 0, phase: "A" } }],
      catalog: { presets: [{ model_id: "preset-burden", label: "Burden model", rated_current_a: 100,
        secondary: "50 mA", default_gain_ct: 5500, requires_burden_jumper_cut: true, notes: "Cut jumper" }],
        source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 },
    };
    const custom = new Map<number, CtDraft>([[1, { name: "Workshop", modelId: "custom", multiplier: 2,
      customGainCt: 32000, customLabel: "Clamp", burdenAcknowledged: true, expanded: true }]]);
    expect(changesFromDrafts(inventory, custom)).toEqual([{ channel: 1, name: "Workshop", model_id: "custom",
      reporting_multiplier: 2, custom_gain_ct: 32000, custom_label: "Clamp", burden_output_acknowledged: true }]);
    custom.set(1, { ...custom.get(1)!, modelId: "preset-burden", burdenAcknowledged: false });
    expect(changesFromDrafts(inventory, custom)).toEqual([{ channel: 1, name: "Workshop", model_id: "preset-burden",
      reporting_multiplier: 2, burden_output_acknowledged: false }]);
    custom.set(1, { ...custom.get(1)!, burdenAcknowledged: true });
    expect(changesFromDrafts(inventory, custom)[0]?.burden_output_acknowledged).toBe(true);

    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    panel.showInventory(inventory);
    await panel.updateComplete;
    const model = panel.shadowRoot?.querySelector<HTMLSelectElement>('[aria-label="CT1 model"]');
    if (model) { model.value = "custom"; model.dispatchEvent(new Event("change")); }
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector('[aria-label="CT1 custom gain"]')).not.toBeNull();
    expect(panel.shadowRoot?.querySelector('[aria-label="CT1 custom label"]')).not.toBeNull();
    expect(panel.shadowRoot?.querySelector('[aria-label="CT1 burden output acknowledgement"]')).not.toBeNull();
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.disabled).toBe(true);
    const gain = panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT1 custom gain"]');
    const label = panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT1 custom label"]');
    const burden = panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT1 burden output acknowledgement"]');
    if (gain) { gain.value = "32000"; gain.dispatchEvent(new Event("input")); }
    if (label) { label.value = "Clamp"; label.dispatchEvent(new Event("input")); }
    burden?.click(); await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.disabled).toBe(false);
  });

  it("offers only the supported CT reporting multipliers", async () => {
    const inventory: CtInventory = {
      plan_id: "plan-1", source_sha256: "a".repeat(64),
      channels: [{ channel: 1, name: "CT1", raw_gain_ct: 5500, reporting_multiplier: 1,
        selected_model_id: "model", selection_verified_against_config: true,
        display_label: null, stored_selection_present: false,
        address: { channel: 1, board_index: 0, group_index: 0, phase: "A" } }],
      catalog: { presets: [{ model_id: "model", label: "Model", rated_current_a: 100,
        secondary: "50 mA", default_gain_ct: 5500, requires_burden_jumper_cut: false, notes: "" }],
        source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 },
    };
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    panel.showInventory(inventory); await panel.updateComplete;

    const multiplier = panel.shadowRoot?.querySelector('[aria-label="CT1 multiplier"]');
    expect(multiplier).toBeInstanceOf(HTMLSelectElement);
    expect([...((multiplier as HTMLSelectElement).options)].map((option) => Number(option.value))).toEqual([1, 2, 4, 8]);
  });

  it("formats config changes as preserved diff lines", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.transaction = { transaction_id: "tx", state: "previewed", source_sha256: "a".repeat(64),
      changes: [], redacted_diff: "- current_cal_ct1: 27518\n+ current_cal_ct1: 13759\n+     phase_a:",
      rollback_available: false, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };

    panel.showState("build"); await panel.updateComplete;

    const lines = [...(panel.shadowRoot?.querySelectorAll(".config-diff .diff-line") ?? [])];
    expect(lines.map((line) => line.textContent)).toEqual([
      "- current_cal_ct1: 27518", "+ current_cal_ct1: 13759", "+     phase_a:",
    ]);
    expect(lines.map((line) => line.className)).toEqual(expect.arrayContaining([expect.stringContaining("removed"), expect.stringContaining("added")]));
    expect(panel.shadowRoot?.querySelector("style")?.textContent).toContain("white-space: pre");
  });

  it("keeps a persisted verified Custom selection clean during an unrelated edit", async () => {
    const inventory: CtInventory = {
      plan_id: "plan-1", source_sha256: "a".repeat(64),
      channels: Array.from({ length: 6 }, (_, index) => ({
        channel: index + 1, name: `CT${index + 1}`, raw_gain_ct: index === 0 ? 16000 : 5500,
        reporting_multiplier: index === 0 ? 2 : 1, selected_model_id: index === 0 ? "custom" : "model",
        selection_verified_against_config: true, display_label: index === 0 ? "Existing clamp" : null, stored_selection_present: true,
        address: { channel: index + 1, board_index: 0, group_index: Math.floor(index / 3),
          phase: (["A", "B", "C"] as const)[index % 3]! },
      })),
      catalog: { presets: [{ model_id: "model", label: "Model", rated_current_a: 100,
        secondary: "50 mA", default_gain_ct: 5500, requires_burden_jumper_cut: false, notes: "Approved" }],
        source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 },
    };
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    panel.showInventory(inventory);
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT1 custom gain"]')?.value).toBe("32000");
    expect(panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT1 custom label"]')?.value).toBe("Existing clamp");
    expect(panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT1 burden output acknowledgement"]')?.checked).toBe(true);
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.disabled).toBe(false);

    const name = panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT2 name"]');
    if (name) { name.value = "Unrelated rename"; name.dispatchEvent(new Event("input")); }
    await panel.updateComplete;
    const state = panel as unknown as { drafts: Map<number, CtDraft> };
    expect(changesFromDrafts(inventory, state.drafts)).toEqual([{
      channel: 2, name: "Unrelated rename", model_id: "model", reporting_multiplier: 1,
    }]);
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.disabled).toBe(false);
  });

  it("keeps label-only edits out of every firmware control and preview route", async () => {
    const messages: Record<string, unknown>[] = [];
    const hass = makeHass({ setup_status: { state: "device_discovered", devices: [device] },
      set_ha_labels: { mode: "home_assistant_labels", results: [{ channel: 1, state: "updated" }] },
      get_active_work: { session: null, transaction: null, verified_calibration: null },
      start_session: { session_id: "session", device_id: "meter-1", state: "safety_required",
        safety_acknowledged: false, preflight: { issues: [], zeroed_roles: [] } } });
    const callWS = hass.callWS;
    hass.callWS = async <T>(message: Record<string, unknown>) => {
      messages.push(message);
      return callWS<T>(message);
    };
    const inventory: CtInventory = {
      plan_id: "plan-1", source_sha256: "a".repeat(64),
      channels: [{ channel: 1, name: "CT1", raw_gain_ct: 32000, reporting_multiplier: 2,
        selected_model_id: "custom", selection_verified_against_config: true, display_label: "Existing clamp", stored_selection_present: true,
        address: { channel: 1, board_index: 0, group_index: 0, phase: "A" } }],
      catalog: { presets: [], source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 },
    };
    const panel = await mount(hass);
    (panel as unknown as Record<string, unknown>).topology = { addon_count: 0, board_count: 1, ct_count: 6,
      group_count: 2, connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] };
    panel.showInventory(inventory);
    await panel.updateComplete;
    panel.shadowRoot?.querySelectorAll<HTMLInputElement>('[name="name-mode"]')[1]?.click();
    await panel.updateComplete;

    for (const selector of ['[aria-label="CT1 model"]', '[aria-label="CT1 multiplier"]',
      '[aria-label="CT1 custom gain"]', '[aria-label="CT1 custom label"]',
      '[aria-label="CT1 burden output acknowledgement"]']) {
      expect(panel.shadowRoot?.querySelector<HTMLInputElement>(selector)?.disabled).toBe(true);
    }
    const name = panel.shadowRoot?.querySelector<HTMLInputElement>('[aria-label="CT1 name"]');
    if (name) { name.value = "Kitchen mains"; name.dispatchEvent(new Event("input")); }
    await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.click();
    await tick();

    expect(messages.map((message) => String(message.type).split("/").at(-1))).toContain("set_ha_labels");
    expect(messages.map((message) => String(message.type).split("/").at(-1))).not.toContain("preview_ct_config");
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Safety");
  });

  it("owns late subscriptions by connection generation and resubscribes live handles", async () => {
    let resolveFirst: ((unsubscribe: () => void) => void) | undefined;
    let unsubscribed = 0;
    let subscriptions = 0;
    const hass: HomeAssistant = {
      callWS: async <T>() => ({ state: "no_device", devices: [] } as T),
      connection: { subscribeMessage: async () => {
        subscriptions += 1;
        if (subscriptions === 1) return await new Promise<() => void>((resolve) => { resolveFirst = resolve; });
        return () => { unsubscribed += 1; };
      } },
    };
    const panel = document.createElement("circuitsetup-energy-meter-helper-panel") as CircuitSetupPanel;
    panel.panel = { config: { entry_id: "entry-1" } }; panel.hass = hass; document.body.append(panel);
    await tick(); panel.remove(); resolveFirst?.(() => { unsubscribed += 1; }); await tick();
    document.body.append(panel); await tick(); await panel.updateComplete;
    expect(subscriptions).toBe(2);
    expect(unsubscribed).toBe(1);
    panel.remove();
    expect(unsubscribed).toBe(2);
  });

  it("ignores a stale setup event after reconnect while the current subscription can advance discovery", async () => {
    const callbacks: Array<(message: unknown) => void> = [];
    const hass: HomeAssistant = {
      callWS: async <T>() => ({ state: "no_device", devices: [] } as T),
      connection: { subscribeMessage: async (callback) => {
        callbacks.push(callback as (message: unknown) => void);
        return () => undefined;
      } },
    };
    const panel = await mount(hass);
    panel.remove();
    document.body.append(panel);
    await tick();
    await panel.updateComplete;

    callbacks[0]?.({ state: "device_discovered", devices: [device] });
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Setup Device");

    callbacks[1]?.({ state: "device_discovered", devices: [device] });
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Setup Device");
  });

  it("reattaches setup, transaction, and session subscriptions for retained live handles", async () => {
    const operations: string[] = [];
    const hass = makeHass({ setup_status: { state: "device_discovered", devices: [device] } });
    hass.connection.subscribeMessage = async (_callback, message) => {
      operations.push(String(message.type).split("/").at(-1) ?? "");
      return () => undefined;
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown>;
    state.selectedDeviceId = "meter-1";
    state.transaction = { transaction_id: "tx", state: "previewed", source_sha256: "a".repeat(64), changes: [], redacted_diff: "", rollback_available: false, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };
    state.session = { session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] } };
    panel.remove(); document.body.append(panel); await tick(); await panel.updateComplete;
    expect(operations).toEqual(["subscribe_setup", "subscribe_setup", "subscribe_config_transaction", "subscribe_session"]);
  });

  it("restores authoritative active work instead of creating a second session after reload", async () => {
    const operations: string[] = [];
    const topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] };
    const session = { session_id: "session-active", device_id: "meter-1", state: "ready",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] } };
    const transaction = { transaction_id: "1".repeat(32), state: "previewed", source_sha256: "a".repeat(64),
      changes: [], redacted_diff: "- old\n+ new", rollback_available: false, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>) => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        operations.push(operation);
        if (operation === "setup_status") return { state: "device_discovered", devices: [device] } as T;
        if (operation === "get_active_work") return { session, transaction, verified_calibration: null } as T;
        return {} as T;
      },
      connection: { subscribeMessage: async (_callback, message) => {
        operations.push(String(message.type).split("/").at(-1) ?? "");
        return () => undefined;
      } },
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & { startSession(): Promise<void> };
    state.topology = topology;

    await state.startSession();
    await panel.updateComplete;

    expect(operations).toContain("get_active_work");
    expect(operations).not.toContain("start_session");
    expect(operations).toContain("subscribe_config_transaction");
    expect(operations).toContain("subscribe_session");
    expect(state.session).toEqual(session);
    expect(state.transaction).toEqual(transaction);
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Flash & Verify");
  });

  it("revokes replaced transaction and session subscriptions and ignores captured old callbacks", async () => {
    const callbacks: Array<(message: unknown) => void> = [];
    const unsubscriptions: number[] = [];
    const hass = makeHass({ setup_status: { state: "device_discovered", devices: [device] } });
    hass.connection.subscribeMessage = async (callback, message) => {
      callbacks.push(callback as (message: unknown) => void);
      const index = callbacks.length - 1;
      return () => { unsubscriptions.push(index); };
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & {
      subscribeTransaction(generation: number): Promise<void>;
      subscribeSession(generation: number): Promise<void>;
    };
    const generation = state.connectionGeneration as number;
    state.selectedDeviceId = "meter-1";
    state.transaction = { transaction_id: "tx-old", state: "previewed", source_sha256: "a".repeat(64),
      changes: [], redacted_diff: "", rollback_available: false, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };
    await state.subscribeTransaction(generation);
    state.transaction = { transaction_id: "tx-new", state: "previewed", source_sha256: "b".repeat(64),
      changes: [], redacted_diff: "", rollback_available: false, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };
    await state.subscribeTransaction(generation);
    callbacks[1]?.({ transaction_id: "tx-old", state: "failed", source_sha256: "a".repeat(64),
      changes: [], redacted_diff: "- old\n+ new", rollback_available: false, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false });
    expect((state.transaction as { transaction_id: string }).transaction_id).toBe("tx-new");
    expect(unsubscriptions).toContain(1);

    state.session = { session_id: "session-old", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] } };
    await state.subscribeSession(generation);
    state.session = { session_id: "session-new", device_id: "meter-1", state: "ready", safety_acknowledged: false,
      preflight: { issues: [], zeroed_roles: [] } };
    await state.subscribeSession(generation);
    callbacks[3]?.({ session_id: "session-old", device_id: "meter-1", state: "cancelled", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] } });
    expect((state.session as { session_id: string }).session_id).toBe("session-new");
    expect(unsubscriptions).toContain(3);
  });

  it("requires fresh calibration safety and restart evidence for a replacement session or device", async () => {
    const freshSession = { session_id: "session-new", device_id: "meter-1", state: "safety_required",
      safety_acknowledged: false, preflight: { issues: [], zeroed_roles: [] } };
    const panel = await mount(makeHass({
      setup_status: { state: "device_discovered", devices: [device] },
      get_active_work: { session: null, transaction: null, verified_calibration: null },
      start_session: freshSession,
    }));
    const state = panel as unknown as Record<string, unknown> & {
      startSession(): Promise<void>;
      selectDevice(deviceId: string): void;
    };
    state.safetyAcknowledged = true;
    state.voltageReferences = [25, 0];
    state.currentReferences = new Map([[1, 5]]);
    state.stabilityByTarget = new Map([["current:1", { target: "current", target_id: "1", stable: true,
      windows: [{ samples: [1, 1, 1], mean: 1, standard_deviation: 0, range_percent: 0 }] }]]);
    state.calibrationByTarget = new Map([["current:1", { state: "applied_pending_restart_verification",
      group_key: "meter_main1", phase: null, changed_channels: [1], iteration: 1, before_values: [5500],
      after_values: [5501], error_percent_values: [0.1], retry_allowed: false }]]);
    state.restartResult = { verification_id: "stale" };
    await state.startSession();
    expect(state.safetyAcknowledged).toBe(false);
    expect(state.voltageReferences).toEqual(new Map());
    expect((state.currentReferences as Map<number, number>).size).toBe(0);
    expect((state.stabilityByTarget as Map<string, unknown>).size).toBe(0);
    expect((state.calibrationByTarget as Map<string, unknown>).size).toBe(0);
    expect(state.restartResult).toBeNull();

    state.safetyAcknowledged = true;
    state.voltageReferences = [120, 0];
    state.currentReferences = new Map([[1, 5]]);
    state.restartResult = { verification_id: "also-stale" };
    state.selectDevice("meter-2");
    expect(state.selectedDeviceId).toBe("meter-2");
    expect(state.session).toBeNull();
    expect(state.transaction).toBeNull();
    expect(state.safetyAcknowledged).toBe(false);
    expect(state.voltageReferences).toEqual(new Map());
    expect((state.currentReferences as Map<number, number>).size).toBe(0);
    expect(state.restartResult).toBeNull();
  });

  it("drops every pending device response when another meter is selected", async () => {
    const pending = new Map<string, (value: unknown) => void>();
    const subscribed: string[] = [];
    const meter2 = { ...device, entry_id: "meter-2", title: "Garage meter" };
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>) => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return { state: "device_discovered", devices: [device, meter2] } as T;
        if (operation === "get_meter_configuration") return meterResponse() as T;
        return await new Promise<T>((resolve) => pending.set(operation, resolve as (value: unknown) => void));
      },
      connection: { subscribeMessage: async (_callback, message) => {
        subscribed.push(String(message.type).split("/").at(-1) ?? "");
        return () => undefined;
      } },
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & {
      loadTopology(): Promise<void>;
      loadInventory(): Promise<void>;
      reviewChanges(): Promise<void>;
      startSession(): Promise<void>;
      selectDevice(deviceId: string): void;
    };
    const topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] };
    const inventory: CtInventory = {
      plan_id: "plan-1", source_sha256: "a".repeat(64),
      channels: Array.from({ length: 6 }, (_, index) => ({ channel: index + 1, name: `CT${index + 1}`,
        raw_gain_ct: 5500, reporting_multiplier: 1, selected_model_id: "model", selection_verified_against_config: true, display_label: null, stored_selection_present: false,
        address: { channel: index + 1, board_index: 0, group_index: Math.floor(index / 3),
          phase: (["A", "B", "C"] as const)[index % 3]! } })),
      catalog: { presets: [{ model_id: "model", label: "Model", rated_current_a: 100, secondary: "50 mA",
        default_gain_ct: 5500, requires_burden_jumper_cut: false, notes: "Approved" }],
        source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 },
    };

    const topologyCall = state.loadTopology();
    state.selectDevice("meter-2");
    pending.get("get_topology")?.(topology);
    await topologyCall;
    expect(state.topology).toBeNull();

    state.selectDevice("meter-1");
    const inventoryCall = state.loadInventory();
    state.selectDevice("meter-2");
    pending.get("get_ct_inventory")?.(inventory);
    await inventoryCall;
    expect(state.inventory).toBeNull();

    state.selectDevice("meter-1");
    state.inventory = inventory;
    state.drafts = new Map([[1, { name: "Changed", modelId: "model", multiplier: 1,
      burdenAcknowledged: false, expanded: false }]]);
    const previewCall = state.reviewChanges();
    state.selectDevice("meter-2");
    pending.get("get_ct_inventory")?.(inventory);
    await previewCall;
    expect(state.transaction).toBeNull();
    expect(subscribed).not.toContain("subscribe_config_transaction");

    state.selectDevice("meter-1");
    const sessionCall = state.startSession();
    state.selectDevice("meter-2");
    pending.get("get_active_work")?.({ session: null, transaction: null, verified_calibration: null });
    pending.get("start_session")?.({ session_id: "session-a", device_id: "meter-1", state: "safety_required",
      safety_acknowledged: false, preflight: { issues: [], zeroed_roles: [] } });
    await sessionCall;
    expect(state.session).toBeNull();
    expect(subscribed).not.toContain("subscribe_session");
  });

  it("never renders verified success for an impossible restart group collection", async () => {
    const invalidRestart = { mac: "aabbccddeeff", config_filename: "meter.yaml", config_sha256: "a".repeat(64),
      topology_addon_count: 6, topology_project_name: device.project_name, topology_connection_type: "wifi",
      topology_voltage_layout: "two_groups", connection_generation: 4,
      groups: Array.from({ length: 15 }, (_, index) => ({ instance_id: `group-${index}`,
        phase_gains: [[7305, 5500], [7305, 5500], [7305, 5500]] })), verification_id: "invalid",
      source_authority: "saved_flash", source_handoff_available: true, source_handoff_transaction_id: null };
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] },
      restart_and_verify: invalidRestart }));
    const state = panel as unknown as Record<string, unknown> & { restart(): Promise<void> };
    state.session = { session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] } };
    state.topology = { addon_count: 6, board_count: 7, ct_count: 42, group_count: 14,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 6, detail: "Runtime identity" }] };
    panel.showState("restart");
    await state.restart();
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Restart");
    expect(state.restartResult).toBeNull();
    expect(text(panel)).not.toContain("invalid");
  });

  it("enters recovery after a rejected restart and only offers an available rollback", async () => {
    let rollbackCalls = 0;
    const failedTransaction = { transaction_id: "tx", state: "failed", source_sha256: "a".repeat(64),
      changes: [], redacted_diff: "", rollback_available: false, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };
    const rolledBack = { ...failedTransaction, state: "rolled_back", rollback_available: false };
    const hass = makeHass({ setup_status: { state: "device_discovered", devices: [device] },
      restart_and_verify: new Error("private backend detail"), rollback_ct_config: rolledBack });
    const callWS = hass.callWS;
    hass.callWS = async <T>(message: Record<string, unknown>) => {
      if (String(message.type).endsWith("/rollback_ct_config")) rollbackCalls += 1;
      return callWS<T>(message);
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & { restart(): Promise<void> };
    state.session = { session_id: "session", device_id: "meter-1", state: "ready", safety_acknowledged: true,
      preflight: { issues: [], zeroed_roles: [] } };
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] };
    panel.showState("restart");
    await state.restart(); await panel.updateComplete;

    expect((state.session as { state: string }).state).toBe("restart_failed");
    expect(text(panel)).toContain("Reconnect to the meter");
    expect(text(panel)).not.toContain("private backend detail");
    expect(panel.shadowRoot?.querySelector("[data-action=rollback]")).toBeNull();

    state.transaction = failedTransaction; panel.requestUpdate(); await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("[data-action=rollback]")).toBeNull();

    state.transaction = { ...failedTransaction, rollback_available: true }; panel.requestUpdate(); await panel.updateComplete;
    const rollback = panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=rollback]");
    expect(rollback?.disabled).toBe(false);
    rollback?.click(); await tick(); await panel.updateComplete;
    expect(rollbackCalls).toBe(1);
  });

  it("shows restart progress and suppresses duplicate verification requests", async () => {
    let resolveRestart!: (value: unknown) => void;
    const pendingRestart = new Promise<unknown>((resolve) => { resolveRestart = resolve; });
    let restartCalls = 0;
    const restartResult = { mac: "aabbccddeeff", config_filename: null, config_sha256: null,
      topology_addon_count: 0, topology_project_name: device.project_name, topology_connection_type: "wifi",
      topology_voltage_layout: "standard", connection_generation: 4,
      groups: [{ instance_id: "meter_main1", phase_gains: [[7305, 5500], [7305, 5500], [7305, 5500]] }],
      verification_id: "4".repeat(32),
      source_authority: "saved_flash", source_handoff_available: false, source_handoff_transaction_id: null,
      source_handoff_firmware_installed: false, offset_groups: [], power_offset_groups: [] };
    const panel = await mount({
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        if (operation === "setup_status") return { state: "device_discovered", devices: [device] } as T;
        if (operation === "restart_and_verify") { restartCalls += 1; return await pendingRestart as T; }
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    });
    const state = panel as unknown as Record<string, unknown>;
    state.session = { session_id: "session", device_id: "meter-1", state: "applied_pending_restart_verification",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] }, has_pending_calibration: true };
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "standard", project_name: device.project_name, evidence: [] };
    panel.showState("restart"); await panel.updateComplete;

    panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.click();
    await panel.updateComplete;
    const busy = panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary");
    expect(busy?.disabled).toBe(true);
    expect(busy?.textContent).toContain("Restarting and verifying");
    expect(panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .secondary")?.disabled).toBe(true);
    busy?.click(); await tick();
    expect(restartCalls).toBe(1);

    resolveRestart(restartResult);
    await vi.waitFor(() => expect((state.restartResult as { verification_id?: string } | null)?.verification_id)
      .toBe("4".repeat(32)));
  });

  it("returns from Safety to CT Settings and cleans up the active session", async () => {
    const cancelled = { session_id: "session", device_id: "meter-1", state: "cancelled",
      safety_acknowledged: false, preflight: { issues: [], zeroed_roles: [] } };
    const fresh = { ...cancelled, session_id: "fresh-session", state: "safety_required" };
    const operations: string[] = [];
    const hass = makeHass({ setup_status: { state: "device_discovered", devices: [device] }, cancel_session: cancelled,
      get_active_work: { session: null, transaction: null, verified_calibration: null }, start_session: fresh });
    const callWS = hass.callWS;
    hass.callWS = async <T>(message: Record<string, unknown>) => {
      operations.push(String(message.type).split("/").at(-1) ?? "");
      return callWS<T>(message);
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown>;
    state.session = { ...cancelled, state: "safety_required" };
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] };
    state.inventory = { plan_id: "plan", source_sha256: "a".repeat(64), channels: [],
      catalog: { presets: [], source_repository: "CircuitSetup/repo", source_ref: "approved", schema_version: 1 } };
    panel.showState("safety"); await panel.updateComplete;
    panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .secondary")?.click();
    await tick(); await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Circuits & CTs");
    expect(panel.shadowRoot?.activeElement).toBe(panel.shadowRoot?.querySelector("h1"));
    panel.shadowRoot?.querySelector<HTMLButtonElement>(".mobile-progress button")?.click();
    await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("aside.workflow")?.classList.contains("mobile-open")).toBe(true);
    expect(panel.shadowRoot?.querySelector("style")?.textContent).toContain("focus-within");
    panel.shadowRoot?.querySelector<HTMLButtonElement>(".action-footer .primary")?.click();
    await tick(); await panel.updateComplete;
    expect(operations).toEqual(expect.arrayContaining(["cancel_session", "get_active_work", "start_session"]));
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Safety");
    expect(text(panel)).not.toContain("Calibration session could not be started");
  });

  it("renders unavailable validation counts without contradictory wording", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.transaction = { transaction_id: "tx", state: "rolled_back", source_sha256: "a".repeat(64),
      changes: [], redacted_diff: "", rollback_available: false, evidence: ["validation_failed"], progress: [],
      validation_detail: { code: 2, reported_error_count: null, reported_warning_count: null,
        error_record_count: 0, warning_record_count: 0 }, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };

    panel.showState("build"); await panel.updateComplete;

    expect(text(panel)).toContain("0 records (unreported)");
    expect(text(panel)).not.toContain("unreported reported");
    expect(text(panel)).toContain("ESPHome rejected the config (code 2)");
    expect(text(panel)).toContain("original config was restored");
  });

  it("renders scoped samples, calibration, build, and restart authority without fabricating Summary", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    panel.showState("summary"); await panel.updateComplete;
    expect(text(panel)).not.toContain("exact restart verification are complete");

    const state = panel as unknown as Record<string, unknown>;
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] };
    state.transaction = { transaction_id: "tx", state: "installing", source_sha256: "a".repeat(64), changes: [],
      redacted_diff: "", rollback_available: true, evidence: ["write_verified"], progress: ["firmware_compiled"],
      validation_detail: { code: 0, reported_error_count: 0, reported_warning_count: 1, error_record_count: 0, warning_record_count: 1 },
      upload_progress: [{ stage: "uploading", percentage: 65 }], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };
    state.stabilityByTarget = new Map([["current:1", { target: "current", target_id: "1", stable: true,
      windows: [{ samples: [9.9, 10, 10.1], mean: 10, standard_deviation: 0.08, range_percent: 2 }] }]]);
    state.calibrationByTarget = new Map([["current:1", { state: "applied_pending_restart_verification", group_key: "meter_main1", phase: null,
      changed_channels: [1], iteration: 2, before_values: [5500], after_values: [5600], error_percent_values: [0.4],
      gain_evidence: { outcome: "success" }, restore_evidence: { reference: "zeroed" }, retry_allowed: true }]]);
    state.restartResult = { mac: "aabbccddeeff", config_filename: "meter.yaml", config_sha256: "a".repeat(64),
      topology_addon_count: 0, topology_project_name: device.project_name, topology_connection_type: "wifi",
      topology_voltage_layout: "two_groups", connection_generation: 3, groups: [], verification_id: "verify-1",
      source_authority: "saved_flash", source_handoff_available: true, source_handoff_transaction_id: null };
    panel.showState("summary"); await panel.updateComplete;
    for (const expected of ["saved flash", "9.9", "5500", "5600", "0.4", "65%", "warning"])
      expect(text(panel).toLowerCase()).toContain(expected.toLowerCase());
    expect(text(panel)).not.toMatch(/Mean|Standard deviation|Range/);
  });

  it("keeps cancellation distinct and preserves the authoritative restart result", async () => {
    const restartResult = { mac: "aabbccddeeff", config_filename: "meter.yaml", config_sha256: "a".repeat(64),
      topology_addon_count: 0, topology_project_name: device.project_name, topology_connection_type: "wifi",
      topology_voltage_layout: "two_groups", connection_generation: 4,
      groups: ["meter_main1", "meter_main2"].map((instance_id) => ({ instance_id,
        phase_gains: [[7305, 5500], [7305, 5500], [7305, 5500]] })), verification_id: "4".repeat(32),
      source_authority: "saved_flash", source_handoff_available: true, source_handoff_transaction_id: null,
      source_handoff_firmware_installed: false };
    const cancelled = { session_id: "session", device_id: "meter-1", state: "cancelled", safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] } };
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] }, cancel_session: cancelled,
      restart_and_verify: restartResult, preview_calibrated_gains: { transaction_id: "5".repeat(32), state: "previewed",
      source_sha256: "a".repeat(64), changes: [], redacted_diff: "- old\n+ new", rollback_available: false,
        evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false } }));
    const state = panel as unknown as Record<string, unknown> & { cancelSession(): Promise<void>; restart(): Promise<void> };
    state.session = { ...cancelled, state: "ready" };
    await state.cancelSession(); await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Safety");
    expect(text(panel)).toContain("session cancelled");
    expect(text(panel)).not.toContain("exact restart verification are complete");

    state.session = { ...cancelled, state: "ready" };
    state.topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] };
    panel.showState("restart");
    await state.restart(); await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("[role=alert]")?.textContent).toBeUndefined();
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Flash & Verify");
    expect(text(panel)).toContain("4".repeat(32));
    expect(text(panel)).toContain("saved flash");
  });

  it("renders runtime-only restart verification without a source identity", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.restartResult = {
      mac: "aabbccddeeff", config_filename: null, config_sha256: null,
      topology_addon_count: 0, topology_project_name: device.project_name,
      topology_connection_type: "wifi", topology_voltage_layout: "two_groups",
      connection_generation: 2, groups: [], verification_id: "2".repeat(32),
      source_authority: "saved_flash", source_handoff_available: false,
      source_handoff_transaction_id: null,
    };
    state.session = { session_id: "session", device_id: "meter-1", state: "verified",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] } };
    panel.showState("restart"); await panel.updateComplete;
    expect(text(panel)).toContain("Source handoff");
    expect(text(panel)).toContain("Unavailable in runtime-only mode");
  });

  it("keeps mixed gain and offset calibration flash-backed in Summary", async () => {
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] } }));
    const state = panel as unknown as Record<string, unknown>;
    state.restartResult = {
      mac: "aabbccddeeff", config_filename: "meter.yaml", config_sha256: "a".repeat(64),
      topology_addon_count: 0, topology_project_name: device.project_name,
      topology_connection_type: "wifi", topology_voltage_layout: "two_groups",
      connection_generation: 2,
      groups: [{ instance_id: "meter_main1", phase_gains: [[7305, 5500], [7305, 5500], [7305, 5500]] }],
      offset_groups: [{ instance_id: "meter_main1", phase_offsets: [[-12, 31], [-13, 32], [-14, 33]] }],
      power_offset_groups: [], verification_id: "2".repeat(32),
      source_authority: "saved_flash", source_handoff_available: false,
      source_handoff_transaction_id: null, source_handoff_firmware_installed: false,
    };
    state.session = { session_id: "session", device_id: "meter-1", state: "verified",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] } };

    panel.showState("summary"); await panel.updateComplete;

    expect(text(panel)).toContain("Offset calibration remains saved in flash");
    expect(text(panel)).not.toContain("flash values cleared");
    expect(panel.shadowRoot?.querySelector("[data-action=save-calibration]")).toBeNull();
  });

  it("saves verified calibration through review and clears flash only after install", async () => {
    const operations: string[] = [];
    const topology = { addon_count: 0, board_count: 1, ct_count: 6, group_count: 2,
      connection_type: "wifi", voltage_layout: "two_groups", project_name: device.project_name,
      evidence: [{ source: "native_project", addon_count: 0, detail: "Runtime identity" }] } as const;
    const transactionId = "2".repeat(32);
    const preview = { transaction_id: transactionId, state: "previewed", source_sha256: "a".repeat(64),
      changes: [], redacted_diff: "- old\n+ new", rollback_available: false, evidence: [], progress: [], validation_detail: null, upload_progress: [], aggregate_entity_mismatch: false, full_meter_configuration_verified: false };
    const restartResult = { mac: "aabbccddeeff", config_filename: "meter.yaml", config_sha256: "a".repeat(64),
      topology_addon_count: 0, topology_project_name: device.project_name, topology_connection_type: "wifi",
      topology_voltage_layout: "two_groups", connection_generation: 4,
      groups: [{ instance_id: "meter_main1", phase_gains: [[7305, 5500], [7305, 5500], [7305, 5500]] }],
      verification_id: "1".repeat(32), source_authority: "saved_flash", source_handoff_available: true,
      source_handoff_transaction_id: null, source_handoff_firmware_installed: false };
    const completed = { ...restartResult, source_authority: "configuration", source_handoff_available: false,
      source_handoff_transaction_id: transactionId, source_handoff_firmware_installed: true };
    let clearResponse: unknown = new Error("disconnect");
    const hass: HomeAssistant = {
      callWS: async <T>(message: Record<string, unknown>): Promise<T> => {
        const operation = String(message.type).split("/").at(-1) ?? "";
        operations.push(operation);
        if (operation === "setup_status") return { state: "device_discovered", devices: [device] } as T;
        if (operation === "preview_calibrated_gains") return preview as T;
        if (operation === "install_ct_config") return { ...preview, state: "verified" } as T;
        if (operation === "clear_calibration_flash") {
          if (clearResponse instanceof Error) throw clearResponse;
          return clearResponse as T;
        }
        return {} as T;
      },
      connection: { subscribeMessage: async () => () => undefined },
    };
    const panel = await mount(hass);
    const state = panel as unknown as Record<string, unknown> & {
      transactionAction(action: "install"): Promise<void>;
    };
    state.topology = topology;
    state.session = { session_id: "3".repeat(32), device_id: "meter-1", state: "verified",
      safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] } };
    state.restartResult = restartResult;
    panel.showState("summary"); await panel.updateComplete;

    const save = panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=save-calibration]");
    expect(save?.textContent).toContain("Save calibration to YAML");
    save?.click(); await tick(); await panel.updateComplete;
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Flash & Verify");

    state.transaction = { ...preview, state: "install_confirmation_required" };
    await state.transactionAction("install"); await panel.updateComplete;
    expect(operations.slice(-2)).toEqual(["install_ct_config", "clear_calibration_flash"]);
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Summary");
    const retry = panel.shadowRoot?.querySelector<HTMLButtonElement>("[data-action=save-calibration]");
    expect(retry?.textContent).toContain("Retry clearing saved flash values");
    clearResponse = completed;
    retry?.click(); await tick(); await panel.updateComplete;
    expect(operations.filter((operation) => operation === "install_ct_config")).toHaveLength(1);
    expect(operations.filter((operation) => operation === "clear_calibration_flash")).toHaveLength(2);
    expect(panel.shadowRoot?.querySelector("h1")?.textContent).toBe("Setup Device");
    expect(text(panel)).toContain("Calibration was saved to YAML");
  });

  it("reconnect assigns the returned live session instead of discarding it", async () => {
    const live = { session_id: "session", device_id: "meter-1", state: "unstable", safety_acknowledged: true, preflight: { issues: [], zeroed_roles: [] } };
    const panel = await mount(makeHass({ setup_status: { state: "device_discovered", devices: [device] }, get_session: live }));
    const state = panel as unknown as Record<string, unknown> & { reconnectSession(): Promise<void> };
    state.session = { ...live, state: "indeterminate" };
    await state.reconnectSession();
    expect((state.session as { state: string }).state).toBe("unstable");
  });
});
