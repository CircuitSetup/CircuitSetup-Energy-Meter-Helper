import { render } from "lit";
import { afterEach, expect, it, vi } from "vitest";

import { newInstallPackageOptions, packageOptions } from "../src/components/package-options";

afterEach(() => document.body.replaceChildren());

it("lays out mixed package state by board and applies each all-boards choice", () => {
  const container = document.createElement("div");
  document.body.append(container);
  const changed = vi.fn();
  render(packageOptions({ power_quality: [false, false], status_fields: [true, false] }, changed), container);

  expect(Array.from(container.querySelectorAll("th"), (header) => header.textContent?.trim())).toEqual([
    "Board", "Power quality sensors", "Status fields", "All boards", "Main board", "Add-on 1",
  ]);
  expect(container.querySelectorAll("fieldset")).toHaveLength(0);

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
  expect(newInstallPackageOptions(2)).toEqual({
    power_quality: [false, false, false],
    status_fields: [true, false, false],
  });
});
