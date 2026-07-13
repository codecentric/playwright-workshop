import { test, expect, type Page } from "@playwright/test";

/**
 * Musterlösung zu Übung 3 — Testing Good Practices.
 *
 * Jeder Abschnitt löst genau das Problem aus der gleichnamigen Aufgabe.
 */

// ---------------------------------------------------------------------------
// Problem 1 — Hartes Warten
//
// Der `waitForTimeout` war das Pflaster auf einer echten Wunde. `count()` und
// `textContent()` sind Queries: sie lesen den DOM genau einmal und warten nicht.
// Direkt nach dem Tippen steht noch die ungefilterte Liste da (Such-Delay 1000 ms),
// die Query liest 5 statt 1 — der Sleep hat das kaschiert.
//
// Nur den Sleep zu löschen reicht deshalb nicht: der Test wird dann rot
// („Expected: 1, Received: 5"). Erst die Umstellung auf `await expect(locator)`
// löst beides. Diese Assertions pollen bis zum Timeout und brechen ab, sobald die
// Erwartung erfüllt ist — hier also nach ~1000 ms statt nach abgesessenen 2000.
//
// Genau so entstehen Sleeps in echten Suiten: jemand hatte eine nicht wartende
// Prüfung, sie war flaky, und der Sleep hat sie beruhigt. Die Ursache blieb.
//
// Faustregel: alles, was `await expect(locator)` ist, retried. Alles, was
// `expect(await …)` ist, nicht.
// ---------------------------------------------------------------------------

test("Suche filtert die Liste auf einen Treffer", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Cocktail suchen").fill("caipi");

  const karten = page.getByRole("article");
  await expect(karten).toHaveCount(1);
  await expect(karten.getByRole("heading")).toHaveText("Caipirinha");
});

// ---------------------------------------------------------------------------
// Problem 2 — XPath und CSS statt semantischer Locators
//
// `//ul[@class='cocktail-liste']/li[1]//button[1]` bricht, sobald jemand die
// Reihenfolge der Cocktails ändert, eine CSS-Klasse umbenennt oder einen
// zweiten Button in die Karte legt. Rollen-Locators beschreiben, was der Nutzer
// sieht, statt wie das Markup zufällig gerade aufgebaut ist.
// ---------------------------------------------------------------------------

test("Mojito landet im Warenkorb", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("article", { name: "Mojito" })
    .getByRole("button", { name: "In den Warenkorb" })
    .click();
  await page.getByRole("button", { name: "Warenkorb öffnen" }).click();

  const zeile = page
    .getByRole("dialog", { name: "Warenkorb" })
    .getByRole("listitem", { name: "Mojito" });
  await expect(zeile).toContainText("Menge: 1");
});

// ---------------------------------------------------------------------------
// Problem 3 — Assertion ohne await
//
// Ohne `await` startet die Assertion zwar, aber niemand wartet auf ihr Ergebnis:
// der Kontrollfluss läuft sofort weiter. Beide Zeilen der Aufgabe waren davon
// betroffen, mit unterschiedlichem Ausgang:
//
//   1. `expect(alert).toBeVisible()` lief *vor* dem Klick, als es noch gar keinen
//      Alert gab. Sie wurde erst grün, als die App den Alert später einblendete —
//      der Test hat also nie geprüft, was er zu prüfen vorgab, und blieb still.
//   2. `expect(alert).toHaveText("Bitte gib deinen Namen ein.")` erwartete einen
//      Text, den die App nie zeigt. Playwright fängt die unbehandelte Rejection
//      auf und färbt den Test rot — aber losgelöst vom Kontrollfluss, ohne dass
//      der Test an der Stelle angehalten hätte. Bei der Playwright-Library ohne
//      Test-Runner (etwa unter Jest) fehlt dieses Netz komplett.
//
// Absicherung: die ESLint-Regel `playwright/missing-playwright-await` aus
// `eslint-plugin-playwright`.
// ---------------------------------------------------------------------------

test("Bestellung ohne Namen zeigt eine Fehlermeldung", async ({ page }) => {
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
  const fehler = bestellung.getByRole("alert");

  // Vor dem Klick gibt es keine Fehlermeldung — das gehört zur Erwartung dazu.
  await expect(fehler).toHaveCount(0);

  await bestellung.getByRole("button", { name: "Jetzt bestellen" }).click();

  await expect(fehler).toBeVisible();
  await expect(fehler).toHaveText("Bitte gib einen Namen an.");
});

// ---------------------------------------------------------------------------
// Problem 4 — Query statt Web-First-Assertion, diesmal falsch *positiv*
//
// In Problem 1 wurde die Query rot, sobald der Sleep fiel. Hier ist der Fehlerfall
// tückischer: `allTextContents()` liest direkt nach dem Tippen die noch
// ungefilterte Liste aus — und „Mojito" steht da natürlich drin, neben vier
// anderen. `toContain` ist erfüllt, der Test grün.
//
// Grün war er aber auch, wenn der Filter gar nicht funktioniert. Der Test hat nie
// geprüft, was er zu prüfen vorgab, und würde einen echten Bug nicht bemerken.
// Ein rot-werdender Test ist ein Geschenk; dieser hier schweigt.
//
// Zwei Lehren: Erstens die Faustregel — alles, was `await expect(locator)` ist,
// retried; alles, was `expect(await …)` ist, nicht. Zweitens: `toContain` auf
// einer Liste ist eine schwache Erwartung. `toHaveText` mit einem Array prüft
// Inhalt *und* Anzahl *und* Reihenfolge.
// ---------------------------------------------------------------------------

test("Die Suche zeigt nur den Mojito an", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Cocktail suchen").fill("mojito");

  const ueberschriften = page.getByRole("article").getByRole("heading");
  await expect(ueberschriften).toHaveText(["Mojito"]);
});

// ---------------------------------------------------------------------------
// Problem 5 — Keine Struktur, kein AAA, nichtssagende Namen
//
// Der ursprüngliche Test prüfte drei Dinge auf einmal; fiel er um, war unklar
// welches. Aufgeteilt in drei Tests mit sprechenden Namen entlang Arrange /
// Act / Assert. Der Preis wird nicht mehr hartkodiert, wo er nur Konsistenz
// belegen soll — 17,00 € bleibt aber als Rechnung 2 × 8,50 € sinnvoll.
// ---------------------------------------------------------------------------

test.describe("Bestellvorgang", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Suche findet den Mojito", async ({ page }) => {
    // Act
    await page.getByLabel("Cocktail suchen").fill("mojito");

    // Assert
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(page.getByRole("article", { name: "Mojito" })).toBeVisible();
  });

  test("Menge erhöhen verdoppelt die Positionssumme", async ({ page }) => {
    // Arrange
    await page
      .getByRole("article", { name: "Mojito" })
      .getByRole("button", { name: "In den Warenkorb" })
      .click();
    await page.getByRole("button", { name: "Warenkorb öffnen" }).click();
    const drawer = page.getByRole("dialog", { name: "Warenkorb" });

    // Act
    await drawer
      .getByRole("button", { name: "Menge erhöhen für Mojito" })
      .click();

    // Assert
    const zeile = drawer.getByRole("listitem", { name: "Mojito" });
    await expect(zeile).toContainText("Menge: 2");
    await expect(zeile).toContainText("17,00 €");
  });

  test("Abgeschickte Bestellung zählt hoch und zeigt einen Toast", async ({
    page,
  }) => {
    // Arrange
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
    await bestellung
      .getByRole("textbox", { name: "Auf welchen Namen?" })
      .fill("Anna");
    await bestellung.getByRole("spinbutton", { name: "Tischnummer" }).fill("7");

    // Act
    await bestellung.getByRole("button", { name: "Jetzt bestellen" }).click();

    // Assert
    await expect(page.getByTestId("bestell-zaehler")).toHaveText(
      "Bestellungen heute: 1",
    );
    await expect(
      page.getByText("Bestellung aufgegeben — viel Spaß! 🍹"),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Problem 6 — Geteilter Zustand zwischen Tests
//
// Die Aufgabe teilte eine einzige `page` aus `beforeAll` über alle Tests hinweg
// und erzwang mit `mode: "serial"` eine feste Reihenfolge. Beide Tests waren
// grün — der zweite aber nur, weil der Mojito aus dem ersten noch im Warenkorb
// lag. Seine Erwartung „2 Artikel" beschrieb gar nicht das, was er selbst tat.
//
// Genau daran erkennt man die Kopplung: Tausche die Reihenfolge der beiden
// Tests, und der jetzt erste wird rot — der zweite läuft gar nicht mehr, weil
// `serial` nach dem ersten Fehlschlag abbricht. Ein Test, dessen Ergebnis davon
// abhängt, wer vor ihm lief, prüft nicht die Anwendung, sondern die Suite.
//
// Solche Suiten sind zusätzlich nicht parallelisierbar und lassen sich einzeln
// nicht ausführen. Die `page`-Fixture von Playwright liefert pro Test einen
// frischen Browser-Context: eigene Cookies, eigener Storage, eigener
// React-State. `serial` entfällt damit ebenfalls.
//
// Jeder Test legt jetzt selbst an, was er zum Prüfen braucht. Der Zähler steht
// im zweiten Test auf 2, weil dieser Test zwei Cocktails hinzugefügt hat —
// nicht, weil ein anderer Test vorher etwas liegen ließ.
// ---------------------------------------------------------------------------

test.describe("Warenkorb-Zähler", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Ein Cocktail ergibt einen Artikel", async ({ page }) => {
    await page
      .getByRole("article", { name: "Mojito" })
      .getByRole("button", { name: "In den Warenkorb" })
      .click();

    await expect(
      page.getByRole("region", { name: "Warenkorb-Übersicht" }),
    ).toContainText("1 Artikel");
  });

  test("Zwei verschiedene Cocktails ergeben zwei Artikel", async ({ page }) => {
    await page
      .getByRole("article", { name: "Mojito" })
      .getByRole("button", { name: "In den Warenkorb" })
      .click();
    await page
      .getByRole("article", { name: "Cuba Libre" })
      .getByRole("button", { name: "In den Warenkorb" })
      .click();

    await expect(
      page.getByRole("region", { name: "Warenkorb-Übersicht" }),
    ).toContainText("2 Artikel");
  });
});

// ---------------------------------------------------------------------------
// Problem 7 — Timeouts als Pflaster
//
// Gestreute `{ timeout: 30_000 }` kaschieren die Ursache und verlangsamen jeden
// echten Fehlschlag: statt nach 5 Sekunden rot zu werden, hängt die Suite eine
// halbe Minute pro Assertion. Wer einen Timeout wirklich anheben muss, tut das
// zentral in `playwright.config.ts` (`use.actionTimeout`, `expect.timeout`,
// `timeout`) — und nur dann, wenn die Anwendung nachweislich langsam ist.
//
// Der Toast erscheint hier nach ~800 ms „Mixing…". Das deckt der Standard-
// Timeout von 5 Sekunden mühelos ab.
// ---------------------------------------------------------------------------

test("Bestellung erzeugt einen Erfolgs-Toast", async ({ page }) => {
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
  await bestellung
    .getByRole("textbox", { name: "Auf welchen Namen?" })
    .fill("Anna");
  await bestellung.getByRole("button", { name: "Jetzt bestellen" }).click();

  await expect(
    page.getByText("Bestellung aufgegeben — viel Spaß! 🍹"),
  ).toBeVisible();
});

// ---------------------------------------------------------------------------
// Problem 8 — Alles auf einmal
//
// Was der Test eigentlich prüfen sollte, stand nirgends: `test 1` und `test 2`
// benennen nichts, und beide vermengen mehrere Verhaltensweisen. Aufgeteilt in
// vier Tests mit sprechenden Namen entlang Arrange / Act / Assert.
//
// Die Sünden im Einzelnen:
//
//   1. `waitForTimeout(1500)` nach dem Tippen und `waitForTimeout(2000)` nach
//      dem Bestellen — beide ersatzlos weg, die Assertions warten selbst.
//   2. `//ul[@class='cocktail-liste']/li[1]//button[2]` und `header > section >
//      button`, `.drawer-positionen > li:nth-child(1)`, `.konfigurator > button`
//      — allesamt an Markup gebunden, das niemandem etwas verspricht.
//      `button[2]` heißt „der zweite Button in der Karte"; niemand hat je
//      zugesagt, dass das „Konfigurieren" ist.
//   3. `expect(k.locator(".preis")).toHaveText(…)` und
//      `expect(x.locator(".coupon-erfolg")).toHaveText(…)` ohne `await` —
//      geprüft wurde nichts.
//   4. `count()`, `allTextContents()`, `textContent()` lesen den DOM einmal.
//      `expect(namen).toContain("Mojito")` ist zusätzlich schwach: erfüllt,
//      solange Mojito irgendwo in der Liste steht — auch bei kaputtem Filter.
//   5. Namen wie `s`, `n`, `k`, `d`, `li`, `x`, `t`, `z`.
//   6. Geteilte `page` aus `beforeAll` plus `mode: "serial"`. `test 2` legt
//      nie einen Cocktail in den Warenkorb — es lebt vom Rest aus `test 1`.
//   7. `test.setTimeout(120_000)` und gestreute `{ timeout: 30_000 }`.
//
// Der Preis-Pfad ist absichtlich der einzige inhaltlich interessante: Stärke 2
// verdoppelt den Einzelpreis auf 17,00 €, Menge 2 die Positionssumme auf
// 34,00 €. Genau das prüfen jetzt zwei getrennte Tests.
//
// Auf den *Gesamtpreis* wird bewusst nirgends assertiert: er hängt über den
// Happy-Hour-Rabatt an der Uhrzeit. Ein Test, der um 17:30 rot wird, ist genau
// die Sorte Flakiness, um die es in Teil 4 geht.
//
// Die vier Tests wiederholen jetzt sichtbar dieselbe Arrange-Strecke. Das ist
// kein Versehen — hier setzt das Page-Object im nächsten Teil an. Bis dahin
// tut es eine schlichte Hilfsfunktion.
// ---------------------------------------------------------------------------

async function legeKonfiguriertenMojitoInDenWarenkorb(
  page: Page,
  staerke: string,
) {
  await page
    .getByRole("article", { name: "Mojito" })
    .getByRole("button", { name: "Konfigurieren" })
    .click();
  const konfigurator = page.getByRole("dialog", {
    name: "Cocktail konfigurieren",
  });
  await konfigurator.getByRole("spinbutton", { name: "Stärke" }).fill(staerke);
  await konfigurator.getByRole("button", { name: "In den Warenkorb" }).click();
}

test.describe("Konfigurierter Mojito mit Gutschein", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Suche nach dem Präfix „mo“ zeigt allein den Mojito", async ({
    page,
  }) => {
    // Act
    await page.getByLabel("Cocktail suchen").fill("mo");

    // Assert
    await expect(page.getByRole("article").getByRole("heading")).toHaveText([
      "Mojito",
    ]);
  });

  test("Stärke 2 verdoppelt den Einzelpreis im Konfigurator", async ({
    page,
  }) => {
    // Arrange
    await page
      .getByRole("article", { name: "Mojito" })
      .getByRole("button", { name: "Konfigurieren" })
      .click();
    const konfigurator = page.getByRole("dialog", {
      name: "Cocktail konfigurieren",
    });
    await expect(konfigurator).toContainText("8,50 €");

    // Act
    await konfigurator.getByRole("spinbutton", { name: "Stärke" }).fill("2");

    // Assert
    await expect(konfigurator).toContainText("17,00 €");
  });

  test("Menge 2 verdoppelt die Positionssumme des konfigurierten Mojito", async ({
    page,
  }) => {
    // Arrange
    await legeKonfiguriertenMojitoInDenWarenkorb(page, "2");
    await page.getByRole("button", { name: "Warenkorb öffnen" }).click();
    const drawer = page.getByRole("dialog", { name: "Warenkorb" });

    // Act
    await drawer
      .getByRole("button", { name: "Menge erhöhen für Mojito" })
      .click();

    // Assert
    const zeile = drawer.getByRole("listitem", { name: "Mojito" });
    await expect(zeile).toContainText("Menge: 2");
    await expect(zeile).toContainText("34,00 €");
  });

  test("Eingelöster Gutschein meldet den Rabatt", async ({ page }) => {
    // Arrange
    await legeKonfiguriertenMojitoInDenWarenkorb(page, "2");
    await page.getByRole("button", { name: "Warenkorb öffnen" }).click();
    await page
      .getByRole("dialog", { name: "Warenkorb" })
      .getByRole("button", { name: "Bestellen" })
      .click();
    const bestellung = page.getByRole("dialog", { name: "Bestellung" });

    // Act
    await bestellung.getByLabel("Gutschein-Code").fill("HAPPY");
    await bestellung.getByRole("button", { name: "Einlösen" }).click();

    // Assert
    await expect(bestellung.getByText("Rabatt: 15 %")).toBeVisible();
  });

  test("Abgeschickte Bestellung zählt hoch und leert den Warenkorb", async ({
    page,
  }) => {
    // Arrange
    await legeKonfiguriertenMojitoInDenWarenkorb(page, "2");
    await page.getByRole("button", { name: "Warenkorb öffnen" }).click();
    await page
      .getByRole("dialog", { name: "Warenkorb" })
      .getByRole("button", { name: "Bestellen" })
      .click();
    const bestellung = page.getByRole("dialog", { name: "Bestellung" });
    await bestellung
      .getByRole("textbox", { name: "Auf welchen Namen?" })
      .fill("Anna");
    await bestellung
      .getByRole("spinbutton", { name: "Trinkgeld (€)" })
      .fill("5");

    // Act
    await bestellung.getByRole("button", { name: "Jetzt bestellen" }).click();

    // Assert
    await expect(
      page.getByText("Bestellung aufgegeben — viel Spaß! 🍹"),
    ).toBeVisible();
    await expect(page.getByTestId("bestell-zaehler")).toHaveText(
      "Bestellungen heute: 1",
    );
    await expect(
      page.getByRole("region", { name: "Warenkorb-Übersicht" }),
    ).toContainText("0 Artikel");
  });
});
