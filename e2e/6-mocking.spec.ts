import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * Übung 6 — Request-Mocking (optional).
 *
 * Die „Happy Hour"-Bar läuft ohne Backend — mit genau einer Ausnahme:
 *
 *   POST /api/validate-coupon  →  { valid: boolean, rabattProzent: number }
 *
 * Diesen einen Call fängst du mit `page.route()` ab und diktierst die Antwort.
 * Damit werden Fälle testbar, die du sonst nie zu Gesicht bekommst: abgelehnte
 * Codes, Server-Fehler, langsame Antworten, Netzwerkausfälle.
 *
 * Zur Sprache: Playwright nennt das „Mock APIs", genau genommen ist es
 * **Stubbing** — wir setzen eine feste Antwort, prüfen aber nichts am Aufruf.
 * Ein echter Mock wird erst 6.5, wo der abgehende Request selbst zur Erwartung
 * wird. Details in `uebungen/6-mocking.md`.
 *
 * Aufgabenstellung: `uebungen/6-mocking.md` · Lösung: `6-mocking.solution.spec.ts`
 * Ändere nichts an `src/`.
 */

/** Fixe Zeit außerhalb der Happy Hour → die Preise im Test sind deterministisch. */
const MITTAGS = new Date("2026-07-14T14:00:00");

/** Glob-Muster für die Coupon-Route. */
const COUPON_ROUTE = "**/api/validate-coupon";

const bestelldialog = (page: Page): Locator =>
  page.getByRole("dialog", { name: "Bestellung" });

/**
 * Geschenkt: der Weg bis zum Bestelldialog — dort sitzt das Gutschein-Feld.
 * Der `toPass`-Block umschifft die verzögerte Hydration aus Kapitel 5.
 */
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

/** Geschenkt: Code eintippen und einlösen. */
async function loeseGutscheinEin(page: Page, code: string): Promise<void> {
  await bestelldialog(page).getByLabel("Gutschein-Code").fill(code);
  await bestelldialog(page).getByRole("button", { name: "Einlösen" }).click();
}

test.describe("Teil 6 — Request-Mocking", () => {
  // -------------------------------------------------------------------------
  // Übung 6.1 — Gültiger Coupon (machen wir gemeinsam)
  //
  // Den Code „WORKSHOP26" kennt die App selbst nicht — nur der Stub erklärt ihn
  // für gültig. Greift der Rabatt trotzdem, ist bewiesen: Die App hat die
  // gestubbte Antwort gesehen.
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
  // Stubbe eine ablehnende Antwort (`valid: false`) und löse ausgerechnet
  // „HAPPY" ein — den einen Code, den die App auch ohne Server akzeptieren
  // würde. Prüfe die Fehlermeldung (`role="alert"`) und dass der Gesamtpreis
  // unverändert bleibt.
  // -------------------------------------------------------------------------

  test.fixme("Übung 6.2 — abgelehnter Coupon zeigt die Fehlermeldung", async ({
    page,
  }) => {
    // await page.route(COUPON_ROUTE, (route) =>
    //   route.fulfill({ json: { valid: ?, rabattProzent: ? } }),
    // );

    await zumBestelldialog(page);
    await loeseGutscheinEin(page, "HAPPY");
    // TODO: Fehlermeldung prüfen — und den unveränderten Gesamtpreis
  });

  // -------------------------------------------------------------------------
  // Übung 6.3 — Server-Fehler (500)
  //
  // Antworte mit `status: 500`. Achtung, das Ergebnis ist überraschend: Die App
  // bricht nicht ab, sondern prüft den Code selbst weiter (siehe
  // `src/domain/coupon.ts`). Finde heraus, welcher Rabatt bei „HAPPY" jetzt
  // erscheint — und was bei jedem anderen Code passiert.
  // -------------------------------------------------------------------------

  test.fixme("Übung 6.3 — bei 500 greift der lokale Fallback", async ({ page }) => {
    // await page.route(COUPON_ROUTE, (route) => route.fulfill({ status: ? }));

    await zumBestelldialog(page);
    await loeseGutscheinEin(page, "HAPPY");
    // TODO: Was zeigt der Dialog jetzt wirklich? Und was bei einem anderen Code?
  });

  // -------------------------------------------------------------------------
  // Übung 6.4 — Langsame Antwort
  //
  // Der Route-Handler ist normaler async-Code: erst warten (~2 s), dann
  // antworten. Schreib den Test so, dass er trotzdem stabil grün ist — ohne
  // `waitForTimeout`. Probiere zum Vergleich einmal
  // `expect(await …isVisible()).toBe(true)` und schau, was passiert.
  // -------------------------------------------------------------------------

  test.fixme("Übung 6.4 — langsame Antwort, Assertion wartet", async ({ page }) => {
    // await page.route(COUPON_ROUTE, async (route) => {
    //   await new Promise((fertig) => setTimeout(fertig, 2_000));
    //   await route.fulfill({ json: { valid: true, rabattProzent: 20 } });
    // });

    await zumBestelldialog(page);
    await loeseGutscheinEin(page, "WORKSHOP26");
    // TODO: stabil prüfen — ohne waitForTimeout
  });

  // -------------------------------------------------------------------------
  // Übung 6.5 — Den Request selbst prüfen (der einzige echte Mock)
  //
  // Bis hierhin hast du nur die Antwort diktiert — das ist Stubbing. Der Handler
  // sieht aber auch den abgehenden Request: `route.request().postDataJSON()`.
  // Sobald der Aufruf selbst zur Erwartung wird, ist es ein Mock. Prüfe, dass die
  // App den eingetippten Code tatsächlich als JSON verschickt.
  // -------------------------------------------------------------------------

  test.fixme("Übung 6.5 — die App schickt den eingegebenen Code als JSON", async ({
    page,
  }) => {
    // let gesendet: unknown;
    // await page.route(COUPON_ROUTE, async (route) => {
    //   gesendet = route.request().postDataJSON();
    //   await route.fulfill({ json: { valid: true, rabattProzent: 20 } });
    // });

    await zumBestelldialog(page);
    await loeseGutscheinEin(page, "SOMMER26");
    // TODO: erst auf die Rabatt-Meldung warten (sonst ist `gesendet` noch
    // undefined — eine normale Variable wartet auf nichts), dann prüfen:
    // expect(gesendet).toEqual({ code: "SOMMER26" })
  });
});
