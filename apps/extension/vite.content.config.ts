import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));

/**
 * Resolves a monorepo package entry to its TypeScript source for Vite bundling.
 *
 * @param pkgPath - Path under packages/ or packages/adapters/
 */
function pkg(pkgPath: string): string {
  return resolve(rootDir, "../../", pkgPath);
}

/**
 * Separate IIFE build for the content script so it has no shared ES chunks
 * (classic content scripts cannot import `./chunks/*.js`).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@decision-ledger/core": pkg("packages/core/src/index.ts"),
      "@decision-ledger/host-api": pkg("packages/adapters/host-api/src/index.ts"),
      "@decision-ledger/adapter-github": pkg(
        "packages/adapters/github/src/index.ts",
      ),
      "@decision-ledger/adapter-gitlab": pkg(
        "packages/adapters/gitlab/src/index.ts",
      ),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: resolve(rootDir, "src/content.ts"),
      formats: ["iife"],
      name: "DecisionLedgerContent",
      fileName: () => "content.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
