import { cp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { configDefaults } from "vitest/config";

const bundleName = "circuitsetup-energy-meter-helper-panel.js";
const distDir = resolve(import.meta.dirname, "dist");
const componentDir = resolve(import.meta.dirname, "../custom_components/circuitsetup_energy_meter_helper/frontend");
const isEspWebToolsModule = (id: string) => id.replaceAll("\\", "/").includes("/esp-web-tools/dist/web/");
const isInstallerModule = (id: string) => id.replaceAll("\\", "/").endsWith("/esp-web-tools/dist/web/install-button.js");
const namespaceEspWebToolsElements = (code: string) => code.replaceAll(
  /(?<!-)md-(divider|elevation|filled-field|focus-ring|item|menu|ripple)(?!-)/g,
  "ewt-$1",
);
const normalizeWhitespace = (code: string) => code.replace(/[ \t]+(?=\r?\n)/g, (whitespace) =>
  whitespace.replaceAll(" ", "\\x20").replaceAll("\t", "\\t"));

function copyStableBundle(): Plugin {
  return {
    name: "copy-stable-home-assistant-bundle",
    transform(code, id) {
      if (isEspWebToolsModule(id)) return { code: namespaceEspWebToolsElements(code), map: null };
    },
    generateBundle(_options, bundle) {
      const chunks = Object.values(bundle).filter((output) => output.type === "chunk");
      const entry = chunks.find((chunk) => chunk.fileName === bundleName);
      if (!entry || entry.moduleIds.some(isInstallerModule)) {
        this.error("ESP Web Tools must not be embedded in the panel entry bundle");
      }
      if (!chunks.some((chunk) => chunk !== entry && chunk.moduleIds.some(isInstallerModule))) {
        this.error("ESP Web Tools must be emitted as a separate local chunk");
      }
      if (chunks.some((chunk) => chunk.moduleIds.some(isEspWebToolsModule)
        && /(?<!-)md-(?:divider|elevation|filled-field|focus-ring|item|menu|ripple)(?!-)/.test(chunk.code))) {
        this.error("ESP Web Tools Material elements must be namespaced for Home Assistant");
      }
    },
    renderChunk: {
      order: "post",
      handler: (code) => ({ code: normalizeWhitespace(code), map: null }),
    },
    async closeBundle() {
      await rm(componentDir, { recursive: true, force: true });
      await cp(distDir, componentDir, { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [copyStableBundle()],
  optimizeDeps: {
    exclude: ["esp-web-tools"],
  },
  test: {
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "test/e2e/**"],
  },
  build: {
    target: "es2022",
    minify: false,
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
        chunkFileNames: "circuitsetup-energy-meter-helper-[name]-[hash].js",
        inlineDynamicImports: false,
      },
    },
  },
});
