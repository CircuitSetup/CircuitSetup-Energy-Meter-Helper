import { afterEach, describe, expect, it, vi } from "vitest";

import {
  chooseFirmwareVersion,
  fetchFirmwareIndex,
  manifestUrlFor,
  parseFirmwareIndex,
  resolveFirmwareOptions,
  resolveMeterProductIds,
  type FirmwareIndex,
} from "../src/firmware-installer";

const product = (productId: string, versions = ["2026.7.0"]) => ({
  productId,
  name: `Meter ${productId}`,
  versions: versions.map((version) => ({ version })),
});

const standardSelections = [
  [0, "wifi", ["6chan_energy_meter_main_board"]],
  [0, "ethernet_lilygo", ["6chan_energy_meter_main_ethernet"]],
  [0, "ethernet_waveshare", ["6chan_energy_meter_main_ethernet_waveshare", "6chan_energy_meter_main_ethernet_ws"]],
  [1, "wifi", ["6chan_energy_meter_1-addon"]],
  [1, "ethernet_lilygo", ["6chan_energy_meter_1-addon_ethernet"]],
  [1, "ethernet_waveshare", ["6chan_energy_meter_1-addon_ethernet_waveshare"]],
  [2, "wifi", ["6chan_energy_meter_2-addons"]],
  [2, "ethernet_lilygo", ["6chan_energy_meter_2-addons_ethernet"]],
  [2, "ethernet_waveshare", ["6chan_energy_meter_2-addons_ethernet_waveshare"]],
  [3, "wifi", ["6chan_energy_meter_3-addons"]],
  [3, "ethernet_lilygo", ["6chan_energy_meter_3-addons_ethernet"]],
  [3, "ethernet_waveshare", ["6chan_energy_meter_3-addons_ethernet_waveshare"]],
  [4, "wifi", ["6chan_energy_meter_4-addons"]],
  [4, "ethernet_lilygo", ["6chan_energy_meter_4-addons_ethernet"]],
  [4, "ethernet_waveshare", ["6chan_energy_meter_4-addons_ethernet_waveshare"]],
  [5, "wifi", ["6chan_energy_meter_5-addons"]],
  [5, "ethernet_lilygo", ["6chan_energy_meter_5-addons_ethernet"]],
  [5, "ethernet_waveshare", ["6chan_energy_meter_5-addons_ethernet_waveshare"]],
  [6, "wifi", ["6chan_energy_meter_6-addons"]],
  [6, "ethernet_lilygo", ["6chan_energy_meter_6-addons_ethernet"]],
  [6, "ethernet_waveshare", ["6chan_energy_meter_6-addons_ethernet_waveshare"]],
] as const;

describe("firmware installer resolver", () => {
  it.each(standardSelections)("maps %i add-ons with %s to the published product IDs", (addonCount, connectionType, expected) => {
    expect(resolveMeterProductIds(addonCount, connectionType)).toEqual(expected);
  });

  it("checks the canonical zero-add-on Waveshare product before its legacy ID", () => {
    expect(resolveMeterProductIds(0, "ethernet_waveshare")).toEqual([
      "6chan_energy_meter_main_ethernet_waveshare",
      "6chan_energy_meter_main_ethernet_ws",
    ]);
  });

  it("merges candidate versions, keeping the supplying product and canonical duplicate", () => {
    const index = parseFirmwareIndex([
      product("6chan_energy_meter_main_ethernet_waveshare", ["2026.7.0", "2026.6.0"]),
      product("6chan_energy_meter_main_ethernet_ws", ["2026.7.0", "2026.5.0"]),
    ]);

    expect(resolveFirmwareOptions(index, 0, "ethernet_waveshare")).toEqual([
      { productId: "6chan_energy_meter_main_ethernet_waveshare", version: "2026.7.0" },
      { productId: "6chan_energy_meter_main_ethernet_waveshare", version: "2026.6.0" },
      { productId: "6chan_energy_meter_main_ethernet_ws", version: "2026.5.0" },
    ]);
  });

  it("sorts newest ESPHome releases before prereleases like the standalone installer", () => {
    const index = parseFirmwareIndex([product("6chan_energy_meter_main_board", [
      "2026.7.0-rc.1", "2026.6.10", "2026.7.0", "2026.7.0-rc.2", "2025.12.9",
    ])]);

    expect(resolveFirmwareOptions(index, 0, "wifi").map((option) => option.version)).toEqual([
      "2026.7.0", "2026.7.0-rc.2", "2026.7.0-rc.1", "2026.6.10", "2025.12.9",
    ]);
  });

  it("selects the newest resolved version by default", () => {
    const options = resolveFirmwareOptions(parseFirmwareIndex([
      product("6chan_energy_meter_main_board", ["2026.6.0", "2026.7.0"]),
    ]), 0, "wifi");

    expect(chooseFirmwareVersion(options, null)).toBe("2026.7.0");
  });

  it("keeps a selected version only while it remains available after hardware changes", () => {
    const options = resolveFirmwareOptions(parseFirmwareIndex([
      product("6chan_energy_meter_1-addon", ["2026.7.0", "2026.6.0"]),
    ]), 1, "wifi");

    expect(chooseFirmwareVersion(options, "2026.6.0")).toBe("2026.6.0");
    expect(chooseFirmwareVersion(options, "2026.5.0")).toBe("2026.7.0");
  });

  it("never resolves the special three-add-on two-voltage firmware", () => {
    const index = parseFirmwareIndex([
      product("6chan_energy_meter_3-addons", ["2026.7.0"]),
      product("6chan_energy_meter_3-addons_2-voltages", ["2026.8.0"]),
    ]);

    expect(resolveMeterProductIds(3, "wifi")).not.toContain("6chan_energy_meter_3-addons_2-voltages");
    expect(resolveFirmwareOptions(index, 3, "wifi")).toEqual([
      { productId: "6chan_energy_meter_3-addons", version: "2026.7.0" },
    ]);
  });

  it.each([
    ["a non-array top level", { products: [] }],
    ["more than 100 products", Array.from({ length: 101 }, (_, index) => product(`meter-${index}`))],
    ["more than 20 versions", [product("meter", Array.from({ length: 21 }, (_, index) => `2026.1.${index}`))]],
    ["duplicate product IDs", [product("meter"), product("meter")]],
    ["duplicate product versions", [product("meter", ["2026.7.0", "2026.7.0"])]],
    ["a slash in a product ID", [product("meter/name")]],
    ["a traversal sequence in a product ID", [product("meter..name")]],
    ["a scheme marker in a product ID", [product("meter:name")]],
    ["a query marker in a product ID", [product("meter?name")]],
    ["a fragment marker in a product ID", [product("meter#name")]],
    ["a path character in a version", [product("meter", ["2026.7.0/evil"])]],
    ["a URL character in a version", [product("meter", ["2026.7.0?evil"])]],
    ["an oversized product name", [{ ...product("meter"), name: "x".repeat(161) }]],
    ["an oversized version", [product("meter", [`2026.7.0-${"x".repeat(153)}`])]],
    ["a payload over 256 KiB", Array.from({ length: 100 }, (_, productIndex) => ({
      productId: `meter-${productIndex}`,
      name: "x".repeat(160),
      versions: Array.from({ length: 20 }, (_, versionIndex) => ({
        version: `2026.7.${versionIndex + 1}-${"x".repeat(149)}`,
      })),
    }))],
  ])("rejects %s", (_reason, invalid) => {
    expect(() => parseFirmwareIndex(invalid)).toThrow();
  });

  it("keeps every generated manifest URL under the exact allowlisted installer origin", () => {
    const index: FirmwareIndex = parseFirmwareIndex(standardSelections.map(([, , ids]) => product(ids[0])));
    const options = standardSelections.flatMap(([addonCount, connectionType]) =>
      resolveFirmwareOptions(index, addonCount, connectionType));

    for (const option of options) {
      const url = new URL(manifestUrlFor(option.productId, option.version));
      expect(url.href).toBe(`https://circuitsetup.github.io/ESPWebInstaller/manifests/manifest_${option.productId}-${option.version}.json`);
      expect(url.origin + url.pathname).toMatch(/^https:\/\/circuitsetup\.github\.io\/ESPWebInstaller\/manifests\//);
    }
    expect(() => manifestUrlFor("meter/evil", "2026.7.0")).toThrow();
    expect(() => manifestUrlFor("meter", "2026.7.0#evil")).toThrow();
  });

  it("aborts the catalog request after ten seconds or when its caller aborts", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    })) as unknown as typeof fetch;
    const timeout = fetchFirmwareIndex(fetcher);
    const timedOut = expect(timeout).rejects.toThrow("Aborted");
    await vi.advanceTimersByTimeAsync(10_000);
    await timedOut;

    const controller = new AbortController();
    const aborted = fetchFirmwareIndex(fetcher, controller.signal);
    const callerAborted = expect(aborted).rejects.toThrow("Aborted");
    controller.abort();
    await callerAborted;
    expect(fetcher).toHaveBeenCalledWith(
      "https://circuitsetup.github.io/ESPWebInstaller/manifests/firmware_index.json",
      expect.objectContaining({ cache: "no-cache", mode: "cors" }),
    );
  });

  it("allows one explicit retry after a failed catalog request", async () => {
    const index = [product("6chan_energy_meter_main_board")];
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(new Response(JSON.stringify(index), { status: 200 })) as unknown as typeof fetch;

    await expect(fetchFirmwareIndex(fetcher)).rejects.toThrow("offline");
    await expect(fetchFirmwareIndex(fetcher)).resolves.toEqual(parseFirmwareIndex(index));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

afterEach(() => {
  vi.useRealTimers();
});
