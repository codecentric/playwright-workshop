import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * Übung 3.9 — Page Object Pattern (Lösung).
 *
 * Ein Page Object pro Seite, nicht pro Test. Die Klasse kennt die Seite, die
 * Tests kennen nur die Fachsprache. Drei Regeln haben den Schnitt bestimmt:
 *
 *   1. Ein Schritt = eine Methode. Was ein Test einzeln braucht, darf nicht in
 *      einer größeren Methode eingesperrt sein.
 *   2. Assertions gehören in den Test, nicht ins Page Object. Die Klasse stellt
 *      Locators bereit; was daran geprüft wird, entscheidet der Test.
 *   3. Kein `page.getByRole(...)` in einem Test. Taucht dort doch einer auf,
 *      fehlt eine Methode.
 *
 * In einem echten Projekt liegt die Klasse in einer eigenen Datei
 * (`e2e/pages/happy-hour-seite.ts`) und wird importiert. Hier steht sie im
 * selben File — kürzer zu lesen, gleicher Effekt.
 */

interface Sonderwunsch {
  staerke?: string;
  ohneZutat?: string;
  basisSpirituose?: string;
  notiz?: string;
}

interface Bestelldaten {
  name: string;
  tischnummer?: string;
  trinkgeld?: string;
  notiz?: string;
}

class HappyHourSeite {
  readonly cocktailKarten: Locator;
  readonly warenkorbUebersicht: Locator;
  readonly drawer: Locator;
  readonly konfigurator: Locator;
  readonly konfiguratorPreis: Locator;
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
    this.konfiguratorPreis = this.konfigurator.locator(".preis");
    this.bestelldialog = page.getByRole("dialog", { name: "Bestellung" });
    this.bestellZaehler = page.getByTestId("bestell-zaehler");
    this.erfolgsToast = page.getByText("Bestellung aufgegeben — viel Spaß! 🍹");
  }

  // --- Einstieg -----------------------------------------------------------

  async oeffnen(): Promise<void> {
    await this.page.goto("/");
  }

  // --- Locator-Fabriken ---------------------------------------------------
  // Liefern einen Locator, statt selbst zu prüfen: Was daran erwartet wird,
  // gehört in den Test.

  karte(cocktail: string): Locator {
    return this.page.getByRole("article", { name: cocktail });
  }

  warenkorbPosition(cocktail: string): Locator {
    return this.drawer.getByRole("listitem", { name: cocktail });
  }

  // --- Suchen & Filtern ---------------------------------------------------

  async suche(begriff: string): Promise<void> {
    await this.page.getByLabel("Cocktail suchen").fill(begriff);
  }

  async zeigeNurAlkoholfrei(): Promise<void> {
    await this.page.getByRole("checkbox", { name: "nur alkoholfrei" }).check();
  }

  async filtereNachZutat(zutat: string): Promise<void> {
    await this.page
      .getByRole("combobox", { name: "Nach Zutat filtern" })
      .selectOption(zutat);
  }

  // --- Cocktails auswählen ------------------------------------------------

  async legeInDenWarenkorb(cocktail: string): Promise<void> {
    await this.karte(cocktail)
      .getByRole("button", { name: "In den Warenkorb" })
      .click();
  }

  async oeffneKonfigurator(cocktail: string): Promise<void> {
    await this.karte(cocktail)
      .getByRole("button", { name: "Konfigurieren" })
      .click();
    await expect(this.konfigurator).toBeVisible();
  }

  /** Setzt nur die Felder, die im Sonderwunsch auch vorkommen. */
  async konfiguriere(wunsch: Sonderwunsch): Promise<void> {
    if (wunsch.ohneZutat !== undefined) {
      await this.konfigurator
        .getByRole("checkbox", { name: wunsch.ohneZutat })
        .uncheck();
    }
    if (wunsch.basisSpirituose !== undefined) {
      await this.konfigurator
        .getByRole("radio", { name: wunsch.basisSpirituose })
        .check();
    }
    if (wunsch.staerke !== undefined) {
      await this.konfigurator
        .getByRole("spinbutton", { name: "Stärke" })
        .fill(wunsch.staerke);
    }
    if (wunsch.notiz !== undefined) {
      await this.konfigurator
        .getByRole("textbox", { name: "Notiz an die Bar" })
        .fill(wunsch.notiz);
    }
  }

  async uebernehmeKonfiguration(): Promise<void> {
    await this.konfigurator
      .getByRole("button", { name: "In den Warenkorb" })
      .click();
    await expect(this.konfigurator).toBeHidden();
  }

  // --- Warenkorb ----------------------------------------------------------

  async oeffneWarenkorb(): Promise<void> {
    await this.page.getByRole("button", { name: "Warenkorb öffnen" }).click();
    await expect(this.drawer).toBeVisible();
  }

  async erhoeheMenge(cocktail: string, schritte = 1): Promise<void> {
    const plus = this.drawer.getByRole("button", {
      name: `Menge erhöhen für ${cocktail}`,
    });
    for (let schritt = 0; schritt < schritte; schritt++) {
      await plus.click();
    }
  }

  async entferneAusWarenkorb(cocktail: string): Promise<void> {
    await this.drawer
      .getByRole("button", { name: `${cocktail} entfernen` })
      .click();
  }

  /**
   * Vorgegeben — geschenkt.
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
   * Der Punkt für hier: Diese Klippe umschifft *eine* Methode — und alle fünf
   * Abläufe sind davor sicher. Ohne Page Object stünde derselbe Kniff fünfmal
   * im File, und im sechsten Test wäre er vergessen.
   */
  async zurBestellung(): Promise<void> {
    await expect(async () => {
      await this.drawer.getByRole("button", { name: "Bestellen" }).click();
      await expect(this.bestelldialog).toBeVisible({ timeout: 1_000 });
    }).toPass();
  }

  // --- Bestelldialog ------------------------------------------------------

  async loeseGutscheinEin(code: string): Promise<void> {
    await this.bestelldialog.getByLabel("Gutschein-Code").fill(code);
    await this.bestelldialog.getByRole("button", { name: "Einlösen" }).click();
  }

  rabattMeldung(rabattProzent: number): Locator {
    return this.bestelldialog.getByText(`Rabatt: ${rabattProzent} %`);
  }

  async bestelleAuf({
    name,
    tischnummer,
    trinkgeld,
    notiz,
  }: Bestelldaten): Promise<void> {
    const formular = this.bestelldialog.getByRole("form", {
      name: "Bestellung",
    });

    await formular
      .getByRole("textbox", { name: "Auf welchen Namen?" })
      .fill(name);
    if (tischnummer !== undefined) {
      await formular
        .getByRole("spinbutton", { name: "Tischnummer" })
        .fill(tischnummer);
    }
    if (trinkgeld !== undefined) {
      await formular
        .getByRole("spinbutton", { name: "Trinkgeld (€)" })
        .fill(trinkgeld);
    }
    if (notiz !== undefined) {
      await formular
        .getByRole("textbox", { name: "Notiz an die Bar" })
        .fill(notiz);
    }

    await formular.getByRole("button", { name: "Jetzt bestellen" }).click();
  }
}

// ---------------------------------------------------------------------------
// Die fünf Abläufe — jeder liest sich als Geschichte, keiner kennt einen Locator.
// ---------------------------------------------------------------------------

test.describe("Happy Hour — Bestellabläufe", () => {
  let bar: HappyHourSeite;

  test.beforeEach(async ({ page }) => {
    bar = new HappyHourSeite(page);
    await bar.oeffnen();
  });

  test("Ablauf A: Gast sucht einen Mojito und bestellt ihn", async () => {
    await bar.suche("Mojito");
    await expect(bar.cocktailKarten).toHaveCount(1);

    await bar.legeInDenWarenkorb("Mojito");
    await expect(bar.warenkorbUebersicht).toContainText("1 Artikel");

    await bar.oeffneWarenkorb();
    await bar.zurBestellung();
    await bar.bestelleAuf({ name: "Anna", tischnummer: "7" });

    await expect(bar.erfolgsToast).toBeVisible();
    await expect(bar.bestellZaehler).toHaveText("Bestellungen heute: 1");
  });

  test("Ablauf B: Gast korrigiert seine Runde, bevor er bestellt", async () => {
    await bar.legeInDenWarenkorb("Mojito");
    await bar.legeInDenWarenkorb("Cuba Libre");

    await bar.oeffneWarenkorb();
    await expect(bar.drawer.getByRole("listitem")).toHaveCount(2);

    await bar.erhoeheMenge("Mojito", 2);
    await expect(bar.warenkorbPosition("Mojito")).toContainText("Menge: 3");
    await expect(bar.warenkorbPosition("Mojito")).toContainText("25,50 €");

    await bar.entferneAusWarenkorb("Cuba Libre");
    await expect(bar.warenkorbPosition("Cuba Libre")).toHaveCount(0);

    await bar.zurBestellung();
    await bar.bestelleAuf({ name: "Bosse" });

    await expect(bar.erfolgsToast).toBeVisible();
    await expect(bar.warenkorbUebersicht).toContainText("0 Artikel");
  });

  test("Ablauf C: Gast bestellt eine Caipirinha mit Sonderwunsch", async () => {
    await bar.oeffneKonfigurator("Caipirinha");
    await expect(bar.konfiguratorPreis).toHaveText("9,00 €");

    await bar.konfiguriere({
      staerke: "2",
      ohneZutat: "Brauner Zucker",
      notiz: "wenig Eis bitte",
    });
    await expect(bar.konfiguratorPreis).toHaveText("18,00 €");

    await bar.uebernehmeKonfiguration();

    await bar.oeffneWarenkorb();
    await expect(bar.warenkorbPosition("Caipirinha")).toContainText("18,00 €");

    await bar.zurBestellung();
    await bar.bestelleAuf({ name: "Carla", notiz: "Strohhalm dazu" });

    await expect(bar.erfolgsToast).toBeVisible();
    await expect(bar.bestellZaehler).toHaveText("Bestellungen heute: 1");
  });

  test("Ablauf D: Gast löst einen Gutschein ein und gibt Trinkgeld", async () => {
    await bar.legeInDenWarenkorb("Virgin Colada");

    await bar.oeffneWarenkorb();
    await bar.erhoeheMenge("Virgin Colada");
    await expect(bar.warenkorbPosition("Virgin Colada")).toContainText(
      "13,00 €",
    );

    await bar.zurBestellung();
    await bar.loeseGutscheinEin("HAPPY");
    await expect(bar.rabattMeldung(15)).toBeVisible();

    await bar.bestelleAuf({ name: "Dana", trinkgeld: "2" });

    await expect(bar.erfolgsToast).toBeVisible();
    await expect(bar.bestellZaehler).toHaveText("Bestellungen heute: 1");
  });

  test("Ablauf E: Gast bestellt die alkoholfreie Runde", async () => {
    await bar.zeigeNurAlkoholfrei();
    await expect(bar.cocktailKarten).toHaveCount(2);

    await bar.legeInDenWarenkorb("Virgin Colada");
    await bar.legeInDenWarenkorb("Ipanema");
    await expect(bar.warenkorbUebersicht).toContainText("2 Artikel");

    await bar.oeffneWarenkorb();
    await expect(bar.drawer.getByRole("listitem")).toHaveCount(2);

    await bar.zurBestellung();
    await bar.bestelleAuf({ name: "Elif", tischnummer: "3" });

    await expect(bar.erfolgsToast).toBeVisible();
    await expect(bar.warenkorbUebersicht).toContainText("0 Artikel");
  });
});
