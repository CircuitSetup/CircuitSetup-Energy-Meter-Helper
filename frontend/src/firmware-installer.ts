export const ESP_WEB_INSTALLER_BASE_URL = "https://circuitsetup.github.io/ESPWebInstaller/";

const INDEX_URL = new URL("manifests/firmware_index.json", ESP_WEB_INSTALLER_BASE_URL).href;
const MAX_PAYLOAD_BYTES = 256 * 1024;
const MAX_PRODUCTS = 100;
const MAX_VERSIONS = 20;
const MAX_STRING_LENGTH = 160;
const FETCH_TIMEOUT_MS = 10_000;
const PRODUCT_ID = /^[a-z0-9][a-z0-9_-]{0,127}$/;
const VERSION = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/;
const CONTROL = /[\u0000-\u001F\u007F-\u009F]/;

export type FirmwareConnectionType = "wifi" | "ethernet_lilygo" | "ethernet_waveshare";
export type SuggestedElectricalSystem = "split_phase_120_240" | "single_phase_230" | "three_phase" | "custom";

export interface FirmwareVersion {
  version: string;
}

export interface FirmwareProduct {
  productId: string;
  name: string;
  versions: FirmwareVersion[];
}

export type FirmwareIndex = FirmwareProduct[];

export interface FirmwareOption {
  productId: string;
  version: string;
}

function fail(message: string): never {
  throw new Error(`Invalid firmware index: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeText(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_STRING_LENGTH && !CONTROL.test(value);
}

function assertProductId(productId: string): void {
  if (!PRODUCT_ID.test(productId)) throw new Error("Invalid firmware product ID");
}

function assertVersion(version: string): void {
  if (!VERSION.test(version) || version.length > MAX_STRING_LENGTH || CONTROL.test(version)) {
    throw new Error("Invalid firmware version");
  }
}

function encodedLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function parseFirmwareIndex(value: unknown): FirmwareIndex {
  if (!Array.isArray(value)) fail("top level must be an array");
  if (encodedLength(JSON.stringify(value)) > MAX_PAYLOAD_BYTES) fail("payload is too large");
  if (value.length > MAX_PRODUCTS) fail("too many products");

  const productIds = new Set<string>();
  return value.map((candidate) => {
    if (!isRecord(candidate) || Object.keys(candidate).length !== 3 ||
      !Object.hasOwn(candidate, "productId") || !Object.hasOwn(candidate, "name") || !Object.hasOwn(candidate, "versions")) {
      fail("invalid product");
    }
    const { productId, name, versions } = candidate;
    if (!isSafeText(productId) || !isSafeText(name) || !Array.isArray(versions)) fail("invalid product fields");
    assertProductId(productId);
    if (productIds.has(productId)) fail("duplicate product ID");
    productIds.add(productId);
    if (versions.length > MAX_VERSIONS) fail("too many versions");

    const seenVersions = new Set<string>();
    return {
      productId,
      name,
      versions: versions.map((versionEntry) => {
        if (!isRecord(versionEntry) || Object.keys(versionEntry).length !== 1 || !Object.hasOwn(versionEntry, "version") || !isSafeText(versionEntry.version)) {
          fail("invalid version");
        }
        assertVersion(versionEntry.version);
        if (seenVersions.has(versionEntry.version)) fail("duplicate version");
        seenVersions.add(versionEntry.version);
        return { version: versionEntry.version };
      }),
    };
  });
}

export async function fetchFirmwareIndex(fetchImpl: typeof fetch = globalThis.fetch, signal?: AbortSignal): Promise<FirmwareIndex> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, FETCH_TIMEOUT_MS);
  try {
    const response = await fetchImpl(INDEX_URL, { cache: "no-cache", mode: "cors", signal: controller.signal });
    if (!response.ok) throw new Error(`Firmware index request failed (${response.status})`);
    const body = await response.text();
    if (encodedLength(body) > MAX_PAYLOAD_BYTES) fail("payload is too large");
    return parseFirmwareIndex(JSON.parse(body));
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export function resolveMeterProductIds(addonCount: number, connectionType: FirmwareConnectionType): string[] {
  if (!Number.isInteger(addonCount) || addonCount < 0 || addonCount > 6) return [];
  const base = addonCount === 0 ? "6chan_energy_meter_main" :
    addonCount === 1 ? "6chan_energy_meter_1-addon" : `6chan_energy_meter_${addonCount}-addons`;
  if (connectionType === "wifi") return [addonCount === 0 ? `${base}_board` : base];
  if (connectionType === "ethernet_lilygo") return [`${base}_ethernet`];
  if (addonCount === 0) return [`${base}_ethernet_waveshare`, `${base}_ethernet_ws`];
  return [`${base}_ethernet_waveshare`];
}

export function suggestedLineFrequency(electricalSystem: SuggestedElectricalSystem): 50 | 60 | null {
  if (electricalSystem === "split_phase_120_240") return 60;
  if (electricalSystem === "single_phase_230") return 50;
  return null;
}

function compareVersions(a: string, b: string): number {
  const parse = (version: string) => version.split(/[-.]/).map((part) => Number.isNaN(Number(part)) ? part : Number.parseInt(part, 10));
  const left = parse(a);
  const right = parse(b);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const aPart = left[index];
    const bPart = right[index];
    if (aPart === undefined) return -1;
    if (bPart === undefined) return 1;
    if (aPart > bPart) return -1;
    if (aPart < bPart) return 1;
  }
  return 0;
}

export function resolveFirmwareOptions(index: FirmwareIndex, addonCount: number, connectionType: FirmwareConnectionType): FirmwareOption[] {
  const options = new Map<string, FirmwareOption>();
  for (const productId of resolveMeterProductIds(addonCount, connectionType)) {
    const product = index.find((entry) => entry.productId === productId);
    for (const entry of product?.versions ?? []) {
      if (!options.has(entry.version)) options.set(entry.version, { productId, version: entry.version });
    }
  }
  return [...options.values()].sort((a, b) => compareVersions(a.version, b.version));
}

export function chooseFirmwareVersion(options: FirmwareOption[], selectedVersion: string | null): string | null {
  return options.find((option) => option.version === selectedVersion)?.version ?? options[0]?.version ?? null;
}

export function manifestUrlFor(productId: string, version: string): string {
  assertProductId(productId);
  assertVersion(version);
  const url = new URL(`manifests/manifest_${productId}-${version}.json`, ESP_WEB_INSTALLER_BASE_URL);
  if (url.origin !== "https://circuitsetup.github.io" || !url.pathname.startsWith("/ESPWebInstaller/manifests/")) {
    throw new Error("Invalid firmware manifest URL");
  }
  return url.href;
}
