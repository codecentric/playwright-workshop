import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright-Konfiguration für die „Happy Hour"-Cocktail-Bar.
 *
 * Die App läuft rein clientseitig; Playwright startet dafür den Vite-Dev-Server
 * automatisch (siehe `webServer`). Für den Workshop bewusst schlank gehalten:
 * nur Chromium — weitere Browser lassen sich in `projects` ergänzen.
 *
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  // Volle Parallelität pro Datei — die App hat keinen geteilten Server-State.
  fullyParallel: true,
  // In CI keine versehentlich eingecheckten `test.only` durchlassen.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",

  use: {
    baseURL: "http://localhost:5173",
    // Trace beim ersten Retry aufzeichnen — Grundlage für die Trace-Viewer-Übung.
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Startet den Vite-Dev-Server vor den Tests und fährt ihn danach herunter.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
