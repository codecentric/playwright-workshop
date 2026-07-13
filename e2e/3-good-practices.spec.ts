import { test, expect, type Page } from "@playwright/test";

/**
 * Übung 3 — Testing Good Practices.
 *
 * Jeder Abschnitt enthält genau ein Problem. Manche Tests sind grün und trotzdem
 * falsch, andere schlagen fehl. Aufgabe: Problem benennen, Test reparieren.
 * Das erwartete Verhalten der App ist in jedem Test korrekt beschrieben — es ist
 * immer der Test, der schuld ist, nie die Anwendung.
 */

// ---------------------------------------------------------------------------
// Problem 1 — Hartes Warten
// ---------------------------------------------------------------------------

test("Übung 3.1: Suche filtert die Liste auf einen Treffer", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByLabel("Cocktail suchen").fill("caipi");
  await page.waitForTimeout(2000);

  const anzahl = await page.getByRole("article").count();
  expect(anzahl).toBe(1);

  const name = await page
    .getByRole("article")
    .getByRole("heading")
    .textContent();
  expect(name).toBe("Caipirinha");
});

// ---------------------------------------------------------------------------
// Problem 2 — XPath und CSS statt semantischer Locators
// ---------------------------------------------------------------------------

test("Übung 3.2: Mojito landet im Warenkorb", async ({ page }) => {
  await page.goto("/");

  await page.locator("//ul[@class='cocktail-liste']/li[1]//button[1]").click();
  await page.locator("header > section > button").click();

  const zeile = page.locator(".drawer .drawer-positionen > li:nth-child(1)");
  await expect(zeile.locator(".pos-name")).toHaveText("Mojito");
  await expect(zeile.locator(".pos-menge")).toHaveText("Menge: 1");
});

// ---------------------------------------------------------------------------
// Problem 3 — Assertion ohne await
// ---------------------------------------------------------------------------

test("Übung 3.3: Bestellung ohne Namen zeigt eine Fehlermeldung", async ({
  page,
}) => {
  await page.goto("/");

  await page
    .getByRole("article", { name: "Mojito" })
    .getByRole("button", { name: "In den Warenkorb" })
    .click();
  await page.getByRole("button", { name: "Warenkorb öffnen" }).click();
  await page
    .getByRole("dialog", { name: "Warenkorb" })
    .getByRole("button", { name: "Bestellen" })
    .click();

  const bestellung = page.getByRole("dialog", { name: "Bestellung" });

  // Diese Assertion läuft, bevor überhaupt geklickt wurde — und meldet nichts.
  expect(bestellung.getByRole("alert")).toBeVisible();

  await bestellung.getByRole("button", { name: "Jetzt bestellen" }).click();

  // Die App zeigt „Bitte gib einen Namen an." — der erwartete Text ist falsch.
  // Trotzdem läuft der Test an dieser Zeile ungebremst durch. Wo taucht der
  // Fehlschlag am Ende auf, und warum erst dort?
  expect(bestellung.getByRole("alert")).toHaveText(
    "Bitte gib deinen Namen ein.",
  );
});

// ---------------------------------------------------------------------------
// Problem 4 — Query statt Web-First-Assertion
// ---------------------------------------------------------------------------

test("Übung 3.4: Die Suche zeigt den Mojito an", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Cocktail suchen").fill("mojito");

  const namen = await page
    .getByRole("article")
    .getByRole("heading")
    .allTextContents();

  expect(namen).toContain("Mojito");
});

// ---------------------------------------------------------------------------
// Problem 5 — Keine Struktur, kein AAA, nichtssagende Namen
// ---------------------------------------------------------------------------

test("Übung 3.5: Bestellvorgang", async ({ page }) => {
  await page.goto("/");
  const el1 = page.getByLabel("Cocktail suchen");
  await el1.fill("mojito");
  await expect(page.getByRole("article")).toHaveCount(1);
  const btn = page.getByRole("button", { name: "In den Warenkorb" });
  await btn.click();
  await expect(
    page.getByRole("region", { name: "Warenkorb-Übersicht" }),
  ).toContainText("1 Artikel");
  await page.getByRole("button", { name: "Warenkorb öffnen" }).click();
  const d = page.getByRole("dialog", { name: "Warenkorb" });
  await d.getByRole("button", { name: "Menge erhöhen für Mojito" }).click();
  await expect(d.getByRole("listitem", { name: "Mojito" })).toContainText(
    "Menge: 2",
  );
  await expect(d.getByRole("listitem", { name: "Mojito" })).toContainText(
    "17,00 €",
  );
  await d.getByRole("button", { name: "Bestellen" }).click();
  const x = page.getByRole("dialog", { name: "Bestellung" });
  await x.getByRole("textbox", { name: "Auf welchen Namen?" }).fill("Anna");
  await x.getByRole("spinbutton", { name: "Tischnummer" }).fill("7");
  await x.getByRole("button", { name: "Jetzt bestellen" }).click();
  await expect(page.getByTestId("bestell-zaehler")).toHaveText(
    "Bestellungen heute: 1",
  );
  await expect(
    page.getByText("Bestellung aufgegeben — viel Spaß! 🍹"),
  ).toBeVisible();
});

// ---------------------------------------------------------------------------
// Problem 6 — Geteilter Zustand zwischen Tests
// ---------------------------------------------------------------------------

test.describe("übung 3.6: Warenkorb-Zähler", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto("/");
  });

  test.afterAll(async () => {
    await page.close();
  });

  const uebersicht = () =>
    page.getByRole("region", { name: "Warenkorb-Übersicht" });

  test("Mojito hinzufügen ergibt einen Artikel", async () => {
    await page
      .getByRole("article", { name: "Mojito" })
      .getByRole("button", { name: "In den Warenkorb" })
      .click();
    await expect(uebersicht()).toContainText("1 Artikel");
  });

  test("Cuba Libre hinzufügen ergibt zwei Artikel", async () => {
    await page
      .getByRole("article", { name: "Cuba Libre" })
      .getByRole("button", { name: "In den Warenkorb" })
      .click();
    await expect(uebersicht()).toContainText("2 Artikel");
  });
});

// ---------------------------------------------------------------------------
// Problem 7 — Timeouts als Pflaster
// ---------------------------------------------------------------------------

test("Übung 3.7: Bestellung erzeugt einen Erfolgs-Toast", async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto("/", { timeout: 60_000 });

  await page
    .getByRole("article", { name: "Mojito" })
    .getByRole("button", { name: "In den Warenkorb" })
    .click({ timeout: 30_000 });
  await page
    .getByRole("button", { name: "Warenkorb öffnen" })
    .click({ timeout: 30_000 });
  await page
    .getByRole("dialog", { name: "Warenkorb" })
    .getByRole("button", { name: "Bestellen" })
    .click({ timeout: 30_000 });

  const bestellung = page.getByRole("dialog", { name: "Bestellung" });
  await bestellung
    .getByRole("textbox", { name: "Auf welchen Namen?" })
    .fill("Anna", { timeout: 30_000 });
  await bestellung
    .getByRole("button", { name: "Jetzt bestellen" })
    .click({ timeout: 30_000 });

  await expect(
    page.getByText("Bestellung aufgegeben — viel Spaß! 🍹"),
  ).toBeVisible({ timeout: 30_000 });
});

// ---------------------------------------------------------------------------
// Problem 8 — Alles auf einmal
//
// Zwei Tests, grün, und jede einzelne Sünde aus den Problemen 1 bis 7 steckt
// irgendwo darin. Beschreibe dir vor dem Reparieren, was hier eigentlich
// geprüft werden *soll*.
// ---------------------------------------------------------------------------

test.describe("Übung 3.8: Konfigurierter Mojito mit Gutschein", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto("/", { timeout: 60_000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("test 1", async () => {
    const s = page.getByLabel("Cocktail suchen");
    await s.fill("mo");
    await page.waitForTimeout(1500);
    const n = await page.getByRole("article").count();
    expect(n).toBe(1);
    const namen = await page
      .getByRole("article")
      .getByRole("heading")
      .allTextContents();
    expect(namen).toContain("Mojito");
    await page
      .locator("//ul[@class='cocktail-liste']/li[1]//button[2]")
      .click();
    const k = page.locator(".konfigurator");
    await k.locator("input[type=number]").fill("2");
    // Der doppelte Einzelpreis steht sofort da — oder eben nicht.
    expect(k.locator(".preis")).toHaveText("17,00 €");
    await k.locator("> button").click({ timeout: 30_000 });
    await expect(
      page.getByRole("region", { name: "Warenkorb-Übersicht" }),
    ).toContainText("1 Artikel", { timeout: 30_000 });
  });

  test("test 2", async () => {
    test.setTimeout(120_000);

    await page.locator("header > section > button").click();
    const d = page.locator(".drawer");
    await d.getByRole("button", { name: "Menge erhöhen für Mojito" }).click();
    const li = d.locator(".drawer-positionen > li:nth-child(1)");
    await expect(li.locator(".pos-menge")).toHaveText("Menge: 2");
    await expect(li.locator(".pos-summe")).toHaveText("34,00 €");

    await d.getByRole("button", { name: "Bestellen" }).click({
      timeout: 30_000,
    });
    const x = page.getByRole("dialog", { name: "Bestellung" });
    await x.getByLabel("Gutschein-Code").fill("HAPPY");
    await x.getByRole("button", { name: "Einlösen" }).click();
    expect(x.locator(".coupon-erfolg")).toHaveText("Rabatt: 15 %");

    await x.getByRole("textbox", { name: "Auf welchen Namen?" }).fill("Anna");
    await x.getByLabel("Trinkgeld (€)").fill("5");
    await x.getByRole("button", { name: "Jetzt bestellen" }).click({
      timeout: 30_000,
    });
    await page.waitForTimeout(2000);

    const t = await page.getByRole("status").textContent();
    expect(t).toContain("Bestellung aufgegeben");
    const z = await page.getByTestId("bestell-zaehler").textContent();
    expect(z).toBe("Bestellungen heute: 1");
  });
});
