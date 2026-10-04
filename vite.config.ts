import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteCompression from "vite-plugin-compression";

const copyHtaccessPlugin = () => {
  let projectRoot = process.cwd();
  let buildOutput = resolve(projectRoot, "dist");

  return {
    name: "copy-root-htaccess",
    apply: "build" as const,
    configResolved(config: { root: string; build: { outDir: string } }) {
      projectRoot = config.root;
      buildOutput = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      await copyFile(
        resolve(projectRoot, ".htaccess"),
        resolve(buildOutput, ".htaccess"),
      );
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), copyHtaccessPlugin(), viteCompression()],
  // Use absolute base so built assets are referenced from site root.
  // This avoids requests for ./assets/... under nested client routes
  // which can cause the server to return index.html (text/html).
  // base: "/",
  // build: {
  //   outDir: "dist",
  //   assetsDir: "assets",
  //   rollupOptions: {
  //     output: {
  //       manualChunks: undefined,
  //     },
  //   },
  // },
});
