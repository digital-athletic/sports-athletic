import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Vite rejects unknown Host headers to guard against DNS rebinding. The e2e
    // browser reaches the dev server under its compose service name, so that
    // name has to be allowed explicitly.
    allowedHosts: ["trainer-web"],
  },
  test: {
    // Unit tests live next to their source; e2e/ holds the Playwright specs.
    include: ["src/**/*.spec.ts"],
    // The CI job runs before the first unit test lands.
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      // Single source of truth for brand logos; shared with the mobile app.
      // Requires the full monorepo to be present at build time.
      "@logos": fileURLToPath(
        new URL("../athlete-mobile/assets/img/logos", import.meta.url),
      ),
    },
  },
});
