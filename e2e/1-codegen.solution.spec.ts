import { test, expect } from "@playwright/test";

test.describe("Cocktail Seite", () => {
  test("Übung 1.1 - Öffnen des Cocktail-Konfigurators, zeigt Überschrift und Preis", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Konfigurieren" }).nth(2).click();
    await expect(
      page
        .getByLabel("Cocktail konfigurieren")
        .getByRole("heading", { name: "Caipirinha" }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Cocktail konfigurieren").getByText("9,00 €"),
    ).toBeVisible();
  });

  test("Übung 1.2 - Hinzufügen eines konfigurierten Cocktails zum Warenkorb zeigt korrekte Anzahl und Preis", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Konfigurieren" }).first().click();
    await page.getByRole("checkbox", { name: "Minze" }).uncheck();
    await page.getByRole("radio", { name: "Brauner Rum" }).check();
    await page.getByRole("spinbutton", { name: "Stärke" }).fill("2");
    await page
      .getByRole("textbox", { name: "Notiz an die Bar" })
      .fill("wenig Eis");
    await page
      .getByLabel("Cocktail konfigurieren")
      .getByRole("button", { name: "In den Warenkorb" })
      .click();
    await expect(page.getByText("1 Artikel")).toBeVisible();
    await expect(
      page.getByLabel("Warenkorb-Übersicht").getByText("17,00 €"),
    ).toBeVisible();
  });

  test("Übung 1.3 - Beim Legen von 2 Cocktails in den Warenkorb kommen genau diese zwei Cocktails an", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "In den Warenkorb" }).nth(2).click();
    await page.getByRole("button", { name: "In den Warenkorb" }).nth(4).click();
    await page.getByRole("button", { name: "Warenkorb öffnen" }).click();
    await expect(
      page.getByLabel("Warenkorb", { exact: true }).getByText("Caipirinha"),
    ).toBeVisible();
    await expect(
      page.getByLabel("Warenkorb", { exact: true }).getByText("Ipanema"),
    ).toBeVisible();
  });

  test("Übung 1.4 - Menge eines Cocktails im Warenkorb erhöhen wird korrekt angezeigt", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "In den Warenkorb" }).first().click();
    await page.getByRole("button", { name: "Warenkorb öffnen" }).click();
    await page
      .getByRole("button", { name: "Menge erhöhen für Mojito" })
      .click();
    await page
      .getByRole("button", { name: "Menge erhöhen für Mojito" })
      .click();
    await expect(
      page.getByRole("listitem", { name: "Mojito" }).getByText("Menge: 3"),
    ).toBeVisible();
  });

  test('Übung 1.5 - Liste mit clientseitigem Filtern', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Cocktail suchen' }).fill('caip');
    await expect(page.getByRole('heading', { name: 'Caipirinha' })).toBeVisible();
    // TODO: prüfe, dass genau **Caipirinha** übrig bleibt

    await page.getByRole('searchbox', { name: 'Cocktail suchen' }).fill('');
    await page.getByLabel('Nach Zutat filtern').selectOption('Rum');
    // TODO: prüfe, dass **genau zwei** Karten übrig bleiben (Mojito, Cuba Libre)

    await page.getByText('nur alkoholfrei').click();
    // TODO: prüfe, dass **keine** Karte mehr passt

    await page.getByRole('checkbox', { name: 'nur alkoholfrei' }).uncheck();
    await page.getByLabel('Nach Zutat filtern').selectOption('');
    // TODO: prüfe, dass wieder **alle fünf** Cocktails sichtbar sind
  });
});
