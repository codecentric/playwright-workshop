/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // Die Playwright-E2E-Tests unter e2e/ laufen im eigenen Runner —
    // Vitest darf sie nicht einsammeln.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
