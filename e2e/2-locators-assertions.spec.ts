import { test, expect } from "@playwright/test";

test.describe("Cocktail Seite", () => {
  // Übung 1 — App erkunden
  test("Übung 2.1 - App-Startzustand: Titel, Zähler und Cocktail-Liste", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Happy Hour 🍹",
    );
    await expect(page.getByText("Bestellungen heute: 0")).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(5);
  });

  // Übung 2 — Teil 1: Cocktail in den Warenkorb legen
  test("Übung 2.2 Teil 1 - Mojito landet im Warenkorb; Header spiegelt Menge und Preis", async ({
    page,
  }) => {
    await page.goto("/");

    const mojito = page.getByRole("article", { name: "Mojito" });
    await expect(mojito.getByTestId("cocktail-preis")).toHaveText("8,50 €");

    await mojito.getByRole("button", { name: "In den Warenkorb" }).click();

    const uebersicht = page.getByRole("region", {
      name: "Warenkorb-Übersicht",
    });
    await expect(uebersicht).toContainText("1 Artikel");
    await expect(uebersicht).toContainText("8,50 €");
  });

  // Übung 2 — Teil 2: Preis aus der Kachel auslesen
  test("Übung 2.2 Teil 2 - Warenkorb-Summe entspricht dem Preis auf der Kachel", async ({
    page,
  }) => {
    await page.goto("/");

    const mojito = page.getByRole("article", { name: "Mojito" });
    const preisElement = mojito.getByTestId("cocktail-preis");

    await expect(preisElement).toBeVisible(); // textContent() wartet selbst nicht
    const kachelPreis = await preisElement.textContent();

    await mojito.getByRole("button", { name: "In den Warenkorb" }).click();

    const uebersicht = page.getByRole("region", {
      name: "Warenkorb-Übersicht",
    });
    await expect(uebersicht).toContainText("1 Artikel");
    await expect(uebersicht).toContainText(kachelPreis!.trim());
  });

  // Übung 3 — Suchen und Filtern
  test("Übung 2.3 - Suche und Filter engen die Cocktail-Liste ein", async ({ page }) => {
    await page.goto("/");

    const suche = page.getByLabel("Cocktail suchen");
    const karten = page.getByRole("article");

    await suche.fill("caipi");
    await expect(karten).toHaveCount(1); // auto-wait deckt den 1s Delay ab
    await expect(
      page.getByRole("article", { name: "Caipirinha" }),
    ).toBeVisible();

    await suche.clear();
    await expect(karten).toHaveCount(5);

    const alkoholfrei = page.getByRole("checkbox", { name: "nur alkoholfrei" });
    await expect(alkoholfrei).not.toBeChecked();
    await alkoholfrei.check();
    await expect(alkoholfrei).toBeChecked();
    await expect(karten).toHaveCount(2);
    await alkoholfrei.uncheck();

    const zutat = page.getByRole("combobox", { name: "Nach Zutat filtern" });
    await zutat.selectOption("Rum");
    await expect(zutat).toHaveValue("Rum");
    await expect(karten).toHaveCount(2);
  });

  // Übung 4 — Warenkorb-Drawer & Non-Existence
  test("Übung 2.4 - Warenkorb: Menge erhöhen, Position entfernen, Drawer schließen", async ({
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

    const mojitoZeile = drawer.getByRole("listitem", { name: "Mojito" });
    const mengePlus = drawer.getByRole("button", {
      name: "Menge erhöhen für Mojito",
    });
    await mengePlus.click();
    await mengePlus.click();
    await expect(mojitoZeile).toContainText("Menge: 3");

    await drawer.getByRole("button", { name: "Cuba Libre entfernen" }).click();
    await expect(
      drawer.getByRole("listitem", { name: "Cuba Libre" }),
    ).toHaveCount(0);
    await expect(drawer.getByRole("listitem")).toHaveCount(1);

    await drawer.getByRole("button", { name: "Schließen" }).click();
    await expect(drawer).toBeHidden();

    // Der Drawer ist weiterhin im DOM — nur eben unsichtbar.
    await expect(page.locator(".drawer")).toHaveCount(1);
    await expect(page.locator(".drawer")).toBeHidden();
  });

  // Übung 5 — Konfigurator und komplette Bestellung
  test("Übung 2.5 - Konfigurator, Validierungsfehler und erfolgreiche Bestellung", async ({
    page,
  }) => {
    await page.goto("/");

    // 1) Konfigurator öffnen
    await page
      .getByRole("article", { name: "Mojito" })
      .getByRole("button", { name: "Konfigurieren" })
      .click();
    const konfig = page.getByRole("dialog", { name: "Cocktail konfigurieren" });
    await expect(konfig).toBeVisible();

    // 2) Zutat abwählen (Checkbox uncheck)
    const minze = konfig.getByRole("checkbox", { name: "Minze" });
    await expect(minze).toBeChecked();
    await minze.uncheck();
    await expect(minze).not.toBeChecked();

    // 3) Basis-Spirituose per Radio
    const braunerRum = konfig.getByRole("radio", { name: "Brauner Rum" });
    await braunerRum.check();
    await expect(braunerRum).toBeChecked();

    // 4) Stärke über Zahlenfeld
    const staerke = konfig.getByRole("spinbutton", { name: "Stärke" });
    await staerke.fill("2");
    await expect(staerke).toHaveValue("2");

    // 5) Konfigurator bestätigen — Dialog verschwindet aus dem DOM
    await konfig.getByRole("button", { name: "In den Warenkorb" }).click();
    await expect(konfig).toBeHidden();

    // 6) Zur Bestellung (Drawer-Button wartet auf transitionend, Playwright regelt das)
    await page.getByRole("button", { name: "Warenkorb öffnen" }).click();
    await page
      .getByRole("dialog", { name: "Warenkorb" })
      .getByRole("button", { name: "Bestellen" })
      .click();

    const bestellung = page.getByRole("dialog", { name: "Bestellung" });
    await expect(bestellung).toBeVisible();

    // 7) Erst ohne Name absenden → Fehler-Alarm
    const form = bestellung.getByRole("form", { name: "Bestellung" });
    await form.getByRole("button", { name: "Jetzt bestellen" }).click();
    await expect(bestellung.getByRole("alert")).toHaveText(
      "Bitte gib einen Namen an.",
    );

    // 8) Name ausfüllen, erneut absenden
    await form
      .getByRole("textbox", { name: "Auf welchen Namen?" })
      .fill("Anna");
    await form.getByRole("button", { name: "Jetzt bestellen" }).click();

    // 9) Zähler ist inkrementiert — testid, weil der Zähler kein semantisches Label trägt
    await expect(page.getByTestId("bestell-zaehler")).toHaveText(
      "Bestellungen heute: 1",
    );
  });
});
