import { test, expect } from "@playwright/test";

test.describe("Teil 4 — Debugging mit dem Trace-Viewer", () => {
  // Übung 4.1 — Falsche Zeile getroffen
  test("Übung 4.1 — Menge von Cuba Libre erhöhen (falsche Zeile getroffen)", async ({
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

    // Mehrdeutiger Selektor — `.first()` trifft die Mojito-Zeile.
    await drawer.getByRole("button", { name: /Menge erhöhen/ }).first().click();

    const cubaLibre = drawer.getByRole("listitem", { name: "Cuba Libre" });
    await expect(cubaLibre).toContainText("Menge: 2");
  });

  // Übung 4.2 — Element im DOM, aber nicht sichtbar
  test("Übung 4.2 — Drawer-Überschrift „Dein Warenkorb“ ist sichtbar (Element im DOM, aber nicht sichtbar)", async ({
    page,
  }) => {
    await page.goto("/");

    // „Warenkorb öffnen“ wurde absichtlich vergessen.
    await expect(page.getByText("Dein Warenkorb")).toBeVisible();
  });

  // Übung 4.3 — Fehlgeschlagener API-Call als Ursache
  test("Übung 4.3 — Gutschein SOMMER liefert Rabatt (fehlgeschlagener API-Call)", async ({
    page,
  }) => {
    // Gemocktes Backend: Coupon-Endpoint antwortet mit 400.
    await page.route("**/api/validate-coupon", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unknown coupon" }),
      }),
    );

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
    const coupon = bestellung.getByRole("form", { name: "Gutschein" });
    await coupon.getByLabel("Gutschein-Code").fill("SOMMER");
    await coupon.getByRole("button", { name: "Einlösen" }).click();

    await expect(bestellung.getByText(/Rabatt:\s*\d+\s*%/)).toBeVisible();
  });

  // Übung 4.4 — Stiller JavaScript-Fehler
  test("Übung 4.4 — Erfolgs-Toast nach „Jetzt bestellen“ (stiller JavaScript-Fehler)", async ({
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
    const form = bestellung.getByRole("form", { name: "Bestellung" });
    await form.getByRole("button", { name: "Jetzt bestellen" }).click();

    await expect(
      page.getByText("Bestellung aufgegeben — viel Spaß!"),
    ).toBeVisible();
  });

  // Übung 4.5 — Race Condition mit kurzzeitig korrektem Zustand
  test("Übung 4.5 — Bestellzähler steht nach Doppelklick auf 1 (Race Condition)", async ({
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
    const form = bestellung.getByRole("form", { name: "Bestellung" });
    await form.getByRole("textbox", { name: "Auf welchen Namen?" }).fill("Anna");

    // Doppelklick — der Bestell-Callback ist nicht entkoppelt, der Zähler
    // wird zweimal hochgezählt.
    const jetztBestellen = form.getByRole("button", { name: "Jetzt bestellen" });
    await jetztBestellen.click();
    await jetztBestellen.click();

    // Warten, bis der Dialog geschlossen wurde
    await expect(page.getByRole('dialog', { name: 'Bestellung' })).toBeHidden()

    await expect(page.getByTestId("bestell-zaehler")).toHaveText(
      "Bestellungen heute: 1",
    );
  });
});
