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
  reporter: "html",

  use: {
    baseURL: "http://localhost:5173",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on"
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
