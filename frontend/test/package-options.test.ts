import { html, render } from "lit";
import { afterEach, expect, it, vi } from "vitest";

import { setupDeviceStep } from "../src/components/setup-device-step";

afterEach(() => document.body.replaceChildren());

it("shows mixed per-board package state and applies each all-boards choice", () => {
  const container = document.createElement("div");
  document.body.append(container);
  const changed = vi.fn();
  render(setupDeviceStep(
    null,
    1,
    "wifi",
    () => undefined,
    () => undefined,
    () => undefined,
    () => undefined,
    () => undefined,
    "",
    false,
    html``,
    null,
    { power_quality: [false, false], status_fields: [true, false] },
    changed,
  ), container);

  const mainStatus = container.querySelector<HTMLInputElement>(
    '[data-feature="status_fields"][data-board="0"]',
  );
  const addonStatus = container.querySelector<HTMLInputElement>(
    '[data-feature="status_fields"][data-board="1"]',
  );
  const allStatus = container.querySelector<HTMLInputElement>(
    '[data-all-feature="status_fields"]',
  );
  const allPowerQuality = container.querySelector<HTMLInputElement>(
    '[data-all-feature="power_quality"]',
  );

  expect(mainStatus?.checked).toBe(true);
  expect(addonStatus?.checked).toBe(false);
  expect(allStatus?.indeterminate).toBe(true);
  expect(allPowerQuality?.checked).toBe(false);
  expect(allPowerQuality?.indeterminate).toBe(false);

  allPowerQuality?.click();
  expect(changed).toHaveBeenLastCalledWith({
    power_quality: [true, true],
    status_fields: [true, false],
  });
});

it("uses disabled power quality and main-only status defaults for new boards", () => {
  const container = document.createElement("div");
  document.body.append(container);
  render(setupDeviceStep(
    null,
    2,
    "wifi",
    () => undefined,
    () => undefined,
    () => undefined,
    () => undefined,
    () => undefined,
  ), container);

  expect([...container.querySelectorAll<HTMLInputElement>('[data-feature="power_quality"]')]
    .map((input) => input.checked)).toEqual([false, false, false]);
  expect([...container.querySelectorAll<HTMLInputElement>('[data-feature="status_fields"]')]
    .map((input) => input.checked)).toEqual([true, false, false]);
});
