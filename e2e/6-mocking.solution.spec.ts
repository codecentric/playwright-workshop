import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * Übung 6 — Request-Mocking (Lösung).
 *
 * Der einzige Netzwerk-Call der App ist die Coupon-Prüfung:
 *
 *   POST /api/validate-coupon  →  { valid: boolean, rabattProzent: number }
 *
 * Er hat einen lokalen Fallback (`lokaleCouponPruefung` in `src/domain/coupon.ts`):
 * Antwortet der Server nicht oder mit einem Fehler, prüft die App den Code selbst
 * — dann gilt nur „HAPPY" (15 %). Genau dieser Fallback ist der interessante Teil
 * der Übung: Ohne abgefangenen Request bekommst du ihn nie zu Gesicht.
 *
 * Zur Sprache: 6.1 bis 6.4 sind **Stubs** — eine feste Antwort, sonst nichts.
 * Erst 6.5 ist ein **Mock**: dort wird der abgehende Request selbst zur Erwartung.
 * Playwright wirft beides unter „Mock APIs" zusammen.
 */

const MITTAGS = new Date("2026-07-14T14:00:00");
const COUPON_ROUTE = "**/api/validate-coupon";

const bestelldialog = (page: Page): Locator =>
  page.getByRole("dialog", { name: "Bestellung" });

async function zumBestelldialog(page: Page, cocktail = "Mojito"): Promise<void> {
  await page.clock.setFixedTime(MITTAGS);
  await page.goto("/");

  await page
    .getByRole("article", { name: cocktail })
    .getByRole("button", { name: "In den Warenkorb" })
    .click();
  await page.getByRole("button", { name: "Warenkorb öffnen" }).click();

  await expect(async () => {
    await page
      .getByRole("dialog", { name: "Warenkorb" })
      .getByRole("button", { name: "Bestellen" })
      .click();
    await expect(bestelldialog(page)).toBeVisible({ timeout: 1_000 });
  }).toPass();
}

async function loeseGutscheinEin(page: Page, code: string): Promise<void> {
  await bestelldialog(page).getByLabel("Gutschein-Code").fill(code);
  await bestelldialog(page).getByRole("button", { name: "Einlösen" }).click();
}

test.describe("Teil 6 — Request-Mocking", () => {
  // -------------------------------------------------------------------------
  // Übung 6.1 — Gültiger Coupon (Demo)
  //
  // „WORKSHOP26" kennt der lokale Fallback nicht. Wenn der Rabatt trotzdem
  // greift, ist bewiesen: Die App hat die gestubbte Antwort gesehen, nicht ihre
  // eigene Prüfung.
  // -------------------------------------------------------------------------

  test("Übung 6.1 — gestubbter Coupon senkt den Gesamtpreis", async ({ page }) => {
    await page.route(COUPON_ROUTE, (route) =>
      route.fulfill({ json: { valid: true, rabattProzent: 20 } }),
    );

    await zumBestelldialog(page);
    await expect(bestelldialog(page)).toContainText("Gesamt: 8,50 €");

    await loeseGutscheinEin(page, "WORKSHOP26");

    await expect(bestelldialog(page).getByText("Rabatt: 20 %")).toBeVisible();
    // 8,50 € − 20 % = 6,80 €
    await expect(bestelldialog(page)).toContainText("Gesamt: 6,80 €");
  });

  // -------------------------------------------------------------------------
  // Übung 6.2 — Ungültiger Coupon
  //
  // Gegenprobe zu 6.1: Der Stub lehnt ausgerechnet „HAPPY" ab — den einen Code,
  // den der lokale Fallback akzeptieren würde. Kommt die Fehlermeldung, hat die
  // gestubbte Antwort Vorrang vor der Client-Prüfung.
  // -------------------------------------------------------------------------

  test("Übung 6.2 — abgelehnter Coupon zeigt die Fehlermeldung", async ({
    page,
  }) => {
    await page.route(COUPON_ROUTE, (route) =>
      route.fulfill({ json: { valid: false, rabattProzent: 0 } }),
    );

    await zumBestelldialog(page);
    await loeseGutscheinEin(page, "HAPPY");

    await expect(bestelldialog(page).getByRole("alert")).toHaveText(
      "Gutschein-Code ungültig.",
    );
    await expect(bestelldialog(page)).toContainText("Gesamt: 8,50 €");
  });

  // -------------------------------------------------------------------------
  // Übung 6.3 — Server-Fehler (500)
  //
  // Der spannendste Fall. Bei 500 bricht die App NICHT ab — sie fällt auf die
  // lokale Prüfung zurück. „HAPPY" gibt also weiter 15 %, obwohl der Server tot
  // ist; jeder andere Code fliegt raus. Das ist Absicht (Graceful Degradation)
  // und lässt sich ohne abgefangenen Request schlicht nicht testen.
  // -------------------------------------------------------------------------

  test("Übung 6.3 — bei 500 greift der lokale Fallback", async ({ page }) => {
    await page.route(COUPON_ROUTE, (route) => route.fulfill({ status: 500 }));

    await zumBestelldialog(page);
    await loeseGutscheinEin(page, "HAPPY");

    // Fallback kennt HAPPY → 15 % (nicht die 20 % des Servers).
    await expect(bestelldialog(page).getByText("Rabatt: 15 %")).toBeVisible();
  });

  test("Übung 6.3b — bei 500 kennt der Fallback nur HAPPY", async ({ page }) => {
    await page.route(COUPON_ROUTE, (route) => route.fulfill({ status: 500 }));

    await zumBestelldialog(page);
    await loeseGutscheinEin(page, "WORKSHOP26");

    await expect(bestelldialog(page).getByRole("alert")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Übung 6.4 — Langsame Antwort
  //
  // Der Route-Handler ist normaler async-Code: warten, dann antworten. Der Test
  // bleibt trotzdem stabil, weil die Web-First-Assertion so lange retryt.
  // `expect(await …isVisible()).toBe(true)` wäre hier sofort rot — der Momentwert
  // aus Kapitel 5, nur in neuem Gewand.
  // -------------------------------------------------------------------------

  test("Übung 6.4 — langsame Antwort, Assertion wartet", async ({ page }) => {
    await page.route(COUPON_ROUTE, async (route) => {
      await new Promise((fertig) => setTimeout(fertig, 2_000));
      await route.fulfill({ json: { valid: true, rabattProzent: 20 } });
    });

    await zumBestelldialog(page);
    await loeseGutscheinEin(page, "WORKSHOP26");

    await expect(bestelldialog(page).getByText("Rabatt: 20 %")).toBeVisible();
    await expect(bestelldialog(page)).toContainText("Gesamt: 6,80 €");
  });

  // -------------------------------------------------------------------------
  // Übung 6.5 — Den Request selbst prüfen (der einzige echte Mock)
  //
  // Bis hierhin haben wir nur die Antwort diktiert — Stubbing. Der Handler sieht
  // aber auch den abgehenden Request; sobald der Aufruf selbst zur Erwartung
  // wird, ist es ein Mock. Damit lässt sich der Vertrag in die andere Richtung
  // absichern: Schickt die App überhaupt das, was das Backend erwartet?
  // -------------------------------------------------------------------------

  test("Übung 6.5 — die App schickt den eingegebenen Code als JSON", async ({
    page,
  }) => {
    let gesendet: unknown;

    await page.route(COUPON_ROUTE, async (route) => {
      gesendet = route.request().postDataJSON();
      await route.fulfill({ json: { valid: true, rabattProzent: 20 } });
    });

    await zumBestelldialog(page);
    await loeseGutscheinEin(page, "SOMMER26");

    // Erst warten, bis die Antwort verarbeitet ist — sonst ist `gesendet` evtl.
    // noch undefined.
    await expect(bestelldialog(page).getByText("Rabatt: 20 %")).toBeVisible();

    expect(gesendet).toEqual({ code: "SOMMER26" });
  });

  // -------------------------------------------------------------------------
  // Bonus A — Netzwerkausfall statt Fehlerstatus
  //
  // `route.abort()` simuliert den Fall, dass der Request gar nicht erst ankommt
  // (Offline, DNS, Timeout). Die App landet im `catch` — und damit wieder im
  // lokalen Fallback.
  // -------------------------------------------------------------------------

  test("Bonus A — abgebrochener Request landet im Fallback", async ({ page }) => {
    await page.route(COUPON_ROUTE, (route) => route.abort("failed"));

    await zumBestelldialog(page);
    await loeseGutscheinEin(page, "HAPPY");

    await expect(bestelldialog(page).getByText("Rabatt: 15 %")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Bonus B — Nur der erste Versuch scheitert
  //
  // `times: 1` lässt den Handler genau einmal greifen; danach zieht die nächste
  // passende Route. So lassen sich Retry-Szenarien bauen, ohne den Handler mit
  // Zählern vollzustopfen.
  //
  // Reihenfolge beachten: Playwright prüft Routen in **umgekehrter**
  // Registrierungsreihenfolge — die zuletzt registrierte gewinnt. Der
  // Dauer-Handler muss also zuerst stehen, der `times: 1`-Handler danach.
  // -------------------------------------------------------------------------

  test("Bonus B — zweiter Einlöse-Versuch klappt", async ({ page }) => {
    await page.route(COUPON_ROUTE, (route) =>
      route.fulfill({ json: { valid: true, rabattProzent: 20 } }),
    );
    await page.route(
      COUPON_ROUTE,
      (route) => route.fulfill({ json: { valid: false, rabattProzent: 0 } }),
      { times: 1 },
    );

    await zumBestelldialog(page);

    await loeseGutscheinEin(page, "SOMMER26");
    await expect(bestelldialog(page).getByRole("alert")).toBeVisible();

    await loeseGutscheinEin(page, "SOMMER26");
    await expect(bestelldialog(page).getByText("Rabatt: 20 %")).toBeVisible();
  });
});
