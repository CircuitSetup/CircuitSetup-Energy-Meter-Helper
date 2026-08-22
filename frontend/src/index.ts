import { CircuitSetupPanel } from "./panel";

if (!customElements.get("circuitsetup-energy-meter-helper-panel")) {
  customElements.define("circuitsetup-energy-meter-helper-panel", CircuitSetupPanel);
}

export { CircuitSetupPanel };
