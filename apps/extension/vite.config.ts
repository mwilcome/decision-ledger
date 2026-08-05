import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const rootDir = dirname(fileURLToPath(import.meta.url));

/**
 * Resolves a monorepo package entry to its TypeScript source for Vite bundling.
 *
 * @param pkgPath - Path under packages/ or packages/adapters/
 */
function pkg(pkgPath: string): string {
  return resolve(rootDir, "../../", pkgPath);
}

export default defineConfig({
  // Relative URLs so the side panel works as an extension page (not a web server).
  base: "./",
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "manifest.json",
          dest: ".",
        },
      ],
    }),
  ],
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
      "@decision-ledger/storage": pkg("packages/storage/src/index.ts"),
      "@decision-ledger/shell": pkg("packages/shell/src/index.ts"),
      "@decision-ledger/ui": pkg("packages/ui/src/index.ts"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(rootDir, "src/sidepanel/index.html"),
        background: resolve(rootDir, "src/background.ts"),
        content: resolve(rootDir, "src/content.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
