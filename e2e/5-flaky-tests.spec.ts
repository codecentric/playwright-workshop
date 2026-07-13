import { test, expect, type Locator, type Page, type Route } from "@playwright/test";

/**
 * Übung 5 — Flaky Tests.
 *
 * Fünf bewusst instabile Szenarien. Manche schlagen deterministisch fehl (leicht
 * zu reproduzieren), andere hängen von Uhrzeit oder Aufrufreihenfolge ab. Ziel
 * ist nicht das schnelle Grün, sondern die Ursache zu benennen — und dann
 * gezielt zu fixen.
 */

test.describe("Teil 5 — Flaky Tests", () => {
  // -------------------------------------------------------------------------
  // Übung 5.1 — Fehlender Wait nach asynchronem Filtern
  //
  // Der Filter greift erst nach `suchDelayMs` (in dieser App 1000 ms). Der Test
  // liest die Karten-Anzahl aber sofort nach dem Tippen aus — noch bevor der
  // Filter überhaupt gelaufen ist.
  // -------------------------------------------------------------------------

  test("Übung 5.1 — Suche zeigt sofort nur den Mojito (fehlender Wait)", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByLabel("Cocktail suchen").fill("mojito");

    await page.waitForTimeout(500)

    const anzahl = await page.getByRole("article").count();
    expect(anzahl).toBe(1);
  });

  // -------------------------------------------------------------------------
  // Übung 5.2 — Geteilter Zustand zwischen Tests
  //
  // Drei Tests teilen sich eine `page` aus `beforeAll` und erwarten jeweils
  // „1 Artikel" nach dem eigenen Klick. Der erste Test ist grün, ab dem
  // zweiten wächst der Warenkorb aus dem vorherigen Test mit.
  // -------------------------------------------------------------------------

  test.describe("Übung 5.2 — Jeder Test legt genau einen Cocktail in den Warenkorb", () => {
    test.describe.configure({ mode: "serial" });

    let page: Page;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
      await page.goto("/");
    });

    test.afterAll(async () => {
      await page.close();
    });

    const uebersicht = (): Locator =>
      page.getByRole("region", { name: "Warenkorb-Übersicht" });

    test("Übung 5.2a — Mojito hinzufügen ergibt 1 Artikel", async () => {
      await page
        .getByRole("article", { name: "Mojito" })
        .getByRole("button", { name: "In den Warenkorb" })
        .click();
      await expect(uebersicht()).toContainText("1 Artikel");
    });

    test("Übung 5.2b — Cuba Libre hinzufügen ergibt 1 Artikel", async () => {
      await page
        .getByRole("article", { name: "Cuba Libre" })
        .getByRole("button", { name: "In den Warenkorb" })
        .click();
      await expect(uebersicht()).toContainText("1 Artikel");
    });

    test("Übung 5.2c — Ipanema hinzufügen ergibt 1 Artikel", async () => {
      await page
        .getByRole("article", { name: "Ipanema" })
        .getByRole("button", { name: "In den Warenkorb" })
        .click();
      await expect(uebersicht()).toContainText("1 Artikel");
    });
  });

  // -------------------------------------------------------------------------
  // Übung 5.3 — Verzögerte Hydration
  //
  // Der Bestellen-Button ist sofort sichtbar und **nicht** disabled — Klicks
  // werden aber erst nach einer zufälligen Verzögerung von 200–500 ms
  // verarbeitet (simuliert nachgeladene Handler-Logik nach der Hydration).
  // Der Test wartet stur `page.waitForTimeout(300)` ab. Je nach gezogener
  // Delay-Länge landet der Klick mal vor, mal nach der Hydration — der Test
  // flakt entsprechend.
  // -------------------------------------------------------------------------

  test("Übung 5.3 — Bestellen nach fester Wartezeit (Hydration flaky)", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByRole("article", { name: "Mojito" })
      .getByRole("button", { name: "In den Warenkorb" })
      .click();

    await page.getByRole("button", { name: "Warenkorb öffnen" }).click();

    // Feste Wartezeit statt Warten auf eine Bedingung: 300 ms trifft die
    // 200–500 ms Hydration-Spanne unzuverlässig — mal ist der Handler schon
    // registriert, mal noch nicht.
    await page.waitForTimeout(200);

    await page
      .getByRole("dialog", { name: "Warenkorb" })
      .getByRole("button", { name: "Bestellen" })
      .click();

    await expect(page.getByRole("dialog", { name: "Bestellung" })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Übung 5.4 — Zeitabhängiges Verhalten (Happy Hour)
  //
  // Happy Hour läuft von 17:00 bis 18:59 Uhr und drückt den Mojito-Preis von
  // 8,50 € auf 6,80 € (20 % Rabatt). Der Test setzt die Uhr NICHT — er hängt an
  // der realen Systemzeit und flakt entsprechend.
  //
  // 👉️ Ändere den Happy-Hour-Zeitraum in src/domain/preis.ts, so dass *jetzt*
  // Happy Hour ist und führe den Test erneut aus.
  // -------------------------------------------------------------------------

  test("Übung 5.4 — Mojito zeigt Happy-Hour-Preis (real-time abhängig)", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByRole("article", { name: "Mojito" })
      .getByRole("button", { name: "In den Warenkorb" })
      .click();

    // 8,50 € − 20 % Happy-Hour-Rabatt = 6,80 €
    await expect(
      page.getByRole("region", { name: "Warenkorb-Übersicht" }),
    ).toContainText("6,80 €");
  });
});
