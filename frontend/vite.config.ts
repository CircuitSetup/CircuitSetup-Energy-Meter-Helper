import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

const bundleName = "circuitsetup-energy-meter-helper-panel.js";
const componentDir = resolve(import.meta.dirname, "../custom_components/circuitsetup_energy_meter_helper/frontend");

function copyStableBundle(): Plugin {
  return {
    name: "copy-stable-home-assistant-bundle",
    async closeBundle() {
      const builtPath = resolve(import.meta.dirname, "dist", bundleName);
      const bundle = await readFile(builtPath, "utf8");
      const diffSafeBundle = bundle.replace(/[ \t]+(?=\r?\n)/g, (whitespace) =>
        whitespace.replaceAll(" ", "\\x20").replaceAll("\t", "\\t"));
      await writeFile(builtPath, diffSafeBundle);
      await mkdir(componentDir, { recursive: true });
      await rm(componentDir, { recursive: true, force: true });
      await mkdir(componentDir, { recursive: true });
      await writeFile(resolve(componentDir, bundleName), diffSafeBundle);
    },
  };
}

export default defineConfig({
  plugins: [copyStableBundle()],
  test: {
    environment: "jsdom",
  },
  build: {
    target: "es2022",
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      formats: ["es"],
      fileName: () => bundleName,
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
