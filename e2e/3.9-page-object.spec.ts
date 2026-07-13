import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * Übung 3.9 — Page Object Pattern.
 *
 * Unten stehen zwei fertige, grüne Tests: Ablauf A und Ablauf B. Sie tun
 * größtenteils dasselbe — und sagen es zweimal, Locator für Locator. Lies sie
 * einmal durch und markiere dir, was doppelt dasteht.
 *
 * Deine Aufgabe: Die Duplikation in ein Page Object ziehen, A und B darauf
 * umstellen, dann die drei weiteren Abläufe C, D und E damit schreiben.
 *
 * Der Klassenrumpf ist vorbereitet; die Anforderungen der fünf Abläufe stehen
 * in `uebungen/3.9-page-object.md`. Ändere nichts an `src/`.
 */

// ---------------------------------------------------------------------------
// Das Page Object — hier entsteht deine Lösung.
// ---------------------------------------------------------------------------

class HappyHourSeite {
  readonly cocktailKarten: Locator;
  readonly warenkorbUebersicht: Locator;
  readonly drawer: Locator;
  readonly konfigurator: Locator;
  readonly bestelldialog: Locator;
  readonly bestellZaehler: Locator;
  readonly erfolgsToast: Locator;

  constructor(private readonly page: Page) {
    this.cocktailKarten = page.getByRole("article");
    this.warenkorbUebersicht = page.getByRole("region", {
      name: "Warenkorb-Übersicht",
    });
    this.drawer = page.getByRole("dialog", { name: "Warenkorb" });
    this.konfigurator = page.getByRole("dialog", {
      name: "Cocktail konfigurieren",
    });
    this.bestelldialog = page.getByRole("dialog", { name: "Bestellung" });
    this.bestellZaehler = page.getByTestId("bestell-zaehler");
    this.erfolgsToast = page.getByText("Bestellung aufgegeben — viel Spaß! 🍹");
  }

  async oeffnen(): Promise<void> {
    await this.page.goto("/");
  }

  /**
   * Eine Locator-Fabrik: gibt einen Locator zurück, statt selbst zu prüfen.
   * Was an der Karte erwartet wird, entscheidet der Test — nicht das Page Object.
   */
  karte(cocktail: string): Locator {
    return this.page.getByRole("article", { name: cocktail });
  }

  /**
   * Vorgegeben — geschenkt, aber lies den Kommentar.
   *
   * Der „Bestellen"-Button im Drawer ist sofort sichtbar und klickbar, sein
   * Handler wird aber erst 200–500 ms später registriert (simulierte, verzögerte
   * Hydration). Ein zu früher Klick ist ein No-op: nichts passiert, kein Fehler.
   * Playwrights Actionability-Check sieht das nicht — er prüft das Element, nicht
   * den Handler dahinter.
   *
   * `expect(...).toPass()` wiederholt Klick und Prüfung, bis der Dialog wirklich
   * offen ist. Warum genau das die richtige Antwort ist, kommt in Kapitel 5.
   *
   * Für heute zählt etwas anderes: Genau dieser Block steht in den Tests unten
   * zweimal wörtlich da. Nach dem Refactoring steht er einmal hier — und alle
   * fünf Abläufe sind davor sicher.
   */
  async zurBestellung(): Promise<void> {
    await expect(async () => {
      await this.drawer.getByRole("button", { name: "Bestellen" }).click();
      await expect(this.bestelldialog).toBeVisible({ timeout: 1_000 });
    }).toPass();
  }

  // TODO: Hier fehlen die Methoden für die Schritte, die deine Abläufe brauchen.
  //
  // Namensvorschläge — keine Vorschrift, aber ein Schritt = eine Methode:
  //
  //   suche(begriff)                    zeigeNurAlkoholfrei()
  //   legeInDenWarenkorb(cocktail)      oeffneWarenkorb()
  //   oeffneKonfigurator(cocktail)      konfiguriere({ staerke, ohneZutat, … })
  //   uebernehmeKonfiguration()         warenkorbPosition(cocktail)
  //   erhoeheMenge(cocktail, schritte)  entferneAusWarenkorb(cocktail)
  //   loeseGutscheinEin(code)           bestelleAuf({ name, tischnummer, … })
}

// ---------------------------------------------------------------------------
// Ablauf A und B — der Ausgangszustand. Grün, und trotzdem nicht schön.
// Stelle beide auf das Page Object um; die Assertions bleiben, wo sie sind.
// ---------------------------------------------------------------------------

test("Ablauf A: Gast sucht einen Mojito und bestellt ihn", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Cocktail suchen").fill("Mojito");
  await expect(page.getByRole("article")).toHaveCount(1);

  await page
    .getByRole("article", { name: "Mojito" })
    .getByRole("button", { name: "In den Warenkorb" })
    .click();
  await expect(
    page.getByRole("region", { name: "Warenkorb-Übersicht" }),
  ).toContainText("1 Artikel");

  await page.getByRole("button", { name: "Warenkorb öffnen" }).click();
  const drawer = page.getByRole("dialog", { name: "Warenkorb" });
  await expect(drawer).toBeVisible();

  // ⚠️ Derselbe Block steht in Ablauf B noch einmal. Und im nächsten Test wieder.
  const bestelldialog = page.getByRole("dialog", { name: "Bestellung" });
  await expect(async () => {
    await drawer.getByRole("button", { name: "Bestellen" }).click();
    await expect(bestelldialog).toBeVisible({ timeout: 1_000 });
  }).toPass();

  const formular = bestelldialog.getByRole("form", { name: "Bestellung" });
  await formular.getByRole("textbox", { name: "Auf welchen Namen?" }).fill("Anna");
  await formular.getByRole("spinbutton", { name: "Tischnummer" }).fill("7");
  await formular.getByRole("button", { name: "Jetzt bestellen" }).click();

  await expect(
    page.getByText("Bestellung aufgegeben — viel Spaß! 🍹"),
  ).toBeVisible();
  await expect(page.getByTestId("bestell-zaehler")).toHaveText(
    "Bestellungen heute: 1",
  );
});

test("Ablauf B: Gast korrigiert seine Runde, bevor er bestellt", async ({
  page,
}) => {
  await page.goto("/");

  await page
    .getByRole("article", { name: "Mojito" })
    .getByRole("button", { name: "In den Warenkorb" })
    .click();
  await page
    .getByRole("article", { name: "Cuba Libre" })
    .getByRole("button", { name: "In den Warenkorb" })
    .click();

  await page.getByRole("button", { name: "Warenkorb öffnen" }).click();
  const drawer = page.getByRole("dialog", { name: "Warenkorb" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("listitem")).toHaveCount(2);

  const plus = drawer.getByRole("button", { name: "Menge erhöhen für Mojito" });
  await plus.click();
  await plus.click();
  const mojitoZeile = drawer.getByRole("listitem", { name: "Mojito" });
  await expect(mojitoZeile).toContainText("Menge: 3");
  await expect(mojitoZeile).toContainText("25,50 €");

  await drawer.getByRole("button", { name: "Cuba Libre entfernen" }).click();
  await expect(drawer.getByRole("listitem", { name: "Cuba Libre" })).toHaveCount(
    0,
  );

  // ⚠️ Und da ist er wieder.
  const bestelldialog = page.getByRole("dialog", { name: "Bestellung" });
  await expect(async () => {
    await drawer.getByRole("button", { name: "Bestellen" }).click();
    await expect(bestelldialog).toBeVisible({ timeout: 1_000 });
  }).toPass();

  const formular = bestelldialog.getByRole("form", { name: "Bestellung" });
  await formular
    .getByRole("textbox", { name: "Auf welchen Namen?" })
    .fill("Bosse");
  await formular.getByRole("button", { name: "Jetzt bestellen" }).click();

  await expect(
    page.getByText("Bestellung aufgegeben — viel Spaß! 🍹"),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Warenkorb-Übersicht" }),
  ).toContainText("0 Artikel");
});

// ---------------------------------------------------------------------------
// Ablauf C, D und E — neu zu schreiben, ausschließlich über das Page Object.
// Kein `page.getByRole(...)` im Testkörper. Taucht dort doch einer auf, fehlt
// eine Methode. Entferne das `fixme`, sobald du loslegst.
// ---------------------------------------------------------------------------

test.fixme("Ablauf C: Gast bestellt eine Caipirinha mit Sonderwunsch", async ({
  page,
}) => {
  // Konfigurator der Caipirinha öffnen — der Einzelpreis steht bei 9,00 €.
  // Stärke auf 2 setzen, „Brauner Zucker" abwählen, Notiz „wenig Eis bitte"
  // hinterlassen. Der Preis im Konfigurator verdoppelt sich auf 18,00 €.
  // Übernehmen, Warenkorb öffnen: Die Position „Caipirinha" steht bei 18,00 €.
  // Auf „Carla" bestellen. Erfolgs-Toast, Zähler auf 1.
});

test.fixme("Ablauf D: Gast löst einen Gutschein ein und gibt Trinkgeld", async ({
  page,
}) => {
  // Virgin Colada in den Warenkorb, Menge im Drawer auf 2 erhöhen — die Position
  // steht dann bei 13,00 €. Zur Bestellung gehen, den Gutschein „HAPPY" einlösen:
  // Der Dialog meldet „Rabatt: 15 %". Auf „Dana" mit 2 € Trinkgeld bestellen.
  // Erfolgs-Toast, Zähler auf 1.
});

test.fixme("Ablauf E: Gast bestellt die alkoholfreie Runde", async ({ page }) => {
  // Filter „nur alkoholfrei" setzen — es bleiben genau zwei Karten übrig.
  // Beide in den Warenkorb (Virgin Colada, Ipanema), die Übersicht zeigt
  // „2 Artikel", der Drawer zwei Positionen. Auf „Elif" an Tisch 3 bestellen.
  // Erfolgs-Toast, und der Warenkorb ist danach wieder leer („0 Artikel").
});
