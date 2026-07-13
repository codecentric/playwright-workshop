import { test, expect } from "@playwright/test";

/**
 * Smoke-Test: prüft nur, dass die App überhaupt lädt und die wichtigsten
 * Landmarken da sind. Bewusst minimal — die inhaltlichen E2E-Übungen
 * (Happy Hour via page.clock, Coupon via page.route, Race, Drawer) folgen
 * in eigenen Dateien.
 */
test("die App lädt und zeigt die Cocktail-Karte", async ({ page }) => {
  await page.goto("/");

  // Überschrift der Bar ist sichtbar.
  await expect(
    page.getByRole("heading", { name: /Happy Hour/i }),
  ).toBeVisible();

  // Die eingebauten Cocktails werden gerendert.
  await expect(
    page.getByRole("heading", { name: "Mojito" }),
  ).toBeVisible();

  // Kern-Bedienelemente sind vorhanden.
  await expect(
    page.getByRole("searchbox", { name: /Cocktail suchen/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Warenkorb öffnen/i }),
  ).toBeVisible();
});
