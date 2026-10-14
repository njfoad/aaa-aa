import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],

  // Dev server configuration
  server: {
    // Enable cross-origin isolation for iframe communication
    headers: {
      "Cross-Origin-Embedder-Policy": "credentialless",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },

  // Build configuration for library output
  build: {
    lib: {
      entry: "./src/index.ts",
      formats: ["es", "umd"],
      name: "InfinityComponent",
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
  },
});
