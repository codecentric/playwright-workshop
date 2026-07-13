import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App.js";
import { COCKTAILS } from "./data/cocktails.js";

// Fester Zeitpunkt außerhalb der Happy Hour (12:00 Uhr) → deterministischer Preis.
const mittags = () => new Date(2026, 6, 8, 12, 0);
// Fester Zeitpunkt innerhalb der Happy Hour (17:30 Uhr).
const abends = () => new Date(2026, 6, 8, 17, 30);

function renderApp(props: Partial<React.ComponentProps<typeof App>> = {}) {
  render(<App jetzt={mittags} mixDauerMs={10} suchDelayMs={() => 10} {...props} />);
}

async function drawerOeffnen() {
  await userEvent.click(screen.getByRole("button", { name: /warenkorb öffnen/i }));
}

async function zurBestellung() {
  // Drawer öffnen und dann klicken, sobald die (zufällige) Hydration den
  // Bestellen-Button interaktiv gemacht hat. `waitFor` retryt den Klick,
  // bis der Bestellungs-Dialog erscheint.
  await drawerOeffnen();
  const bestellen = screen.getByRole("button", { name: /^bestellen$/i });
  await waitFor(
    () => {
      fireEvent.click(bestellen);
      expect(
        screen.getByRole("dialog", { name: /bestellung/i }),
      ).toBeInTheDocument();
    },
    { timeout: 1000 },
  );
}

function inWarenkorbLegen(cocktailName: string) {
  const karte = screen.getByRole("article", { name: cocktailName });
  return userEvent.click(
    within(karte).getByRole("button", { name: /in den warenkorb/i }),
  );
}

// Gesamtpreis/Artikelanzahl gezielt in der Übersichts-Region prüfen —
// sonst kollidiert die Summe mit den Preisen auf den einzelnen Karten.
function uebersicht() {
  return within(screen.getByRole("region", { name: /warenkorb-übersicht/i }));
}

describe("App", () => {
  it("zeigt die Überschrift der Bar", () => {
    renderApp();
    expect(
      screen.getByRole("heading", { name: /happy hour/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it("zeigt alle eingebauten Cocktails an", () => {
    renderApp();
    for (const cocktail of COCKTAILS) {
      expect(
        screen.getByRole("heading", { name: cocktail.name }),
      ).toBeInTheDocument();
    }
  });

  it("startet mit leerem Warenkorb: 0 Artikel und 0,00 € Gesamt", () => {
    renderApp();
    expect(uebersicht().getByText(/0 artikel/i)).toBeInTheDocument();
    expect(uebersicht().getByText("0,00 €")).toBeInTheDocument();
  });

  it("erhöht Artikelanzahl und Gesamtpreis beim Hinzufügen eines Cocktails", async () => {
    renderApp();
    await inWarenkorbLegen("Mojito"); // 8,50 €
    expect(uebersicht().getByText(/1 artikel/i)).toBeInTheDocument();
    expect(uebersicht().getByText("8,50 €")).toBeInTheDocument();
  });

  it("zählt denselben Cocktail zusammen (2× Mojito → 2 Artikel, 17,00 €)", async () => {
    renderApp();
    await inWarenkorbLegen("Mojito");
    await inWarenkorbLegen("Mojito");
    expect(uebersicht().getByText(/2 artikel/i)).toBeInTheDocument();
    expect(uebersicht().getByText("17,00 €")).toBeInTheDocument();
  });

  it("öffnet den Warenkorb-Drawer über den Übersichts-Button", async () => {
    renderApp();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /warenkorb öffnen/i }));
    expect(screen.getByRole("dialog", { name: /warenkorb/i })).toBeInTheDocument();
  });

  it("zeigt hinzugefügte Cocktails im geöffneten Drawer", async () => {
    renderApp();
    await inWarenkorbLegen("Mojito");
    await drawerOeffnen();
    const dialog = within(screen.getByRole("dialog", { name: /warenkorb/i }));
    expect(dialog.getByRole("listitem", { name: "Mojito" })).toBeInTheDocument();
  });

  it("Trinkgeld aus dem Formular erhöht den Gesamtpreis", async () => {
    renderApp();
    await inWarenkorbLegen("Mojito"); // 8,50 €
    await zurBestellung();
    await userEvent.type(screen.getByLabelText(/trinkgeld/i), "2");
    expect(uebersicht().getByText("10,50 €")).toBeInTheDocument();
  });

  it("filtert die Cocktail-Liste (verzögert) über die Suche", async () => {
    renderApp();
    await userEvent.type(
      screen.getByRole("searchbox", { name: /cocktail suchen/i }),
      "Virgin",
    );
    // Der Filter greift erst nach dem künstlichen Delay (Auto-Wait).
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Mojito" }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("heading", { name: "Virgin Colada" }),
    ).toBeInTheDocument();
  });

  it("zeigt mit Filter 'nur alkoholfrei' nur alkoholfreie Cocktails", async () => {
    renderApp();
    await userEvent.click(
      screen.getByRole("checkbox", { name: /nur alkoholfrei/i }),
    );
    expect(
      screen.queryByRole("heading", { name: "Mojito" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Virgin Colada" }),
    ).toBeInTheDocument();
  });

  it("filtert die Cocktail-Liste über das Zutat-Dropdown", async () => {
    renderApp();
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /nach zutat filtern/i }),
      "Kokos",
    );
    // Kokos steckt nur in der Virgin Colada.
    expect(
      screen.queryByRole("heading", { name: "Mojito" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Virgin Colada" }),
    ).toBeInTheDocument();
  });

  it("Konfigurieren öffnet den Konfigurator; konfigurierter Cocktail landet mit angepasstem Preis im Warenkorb", async () => {
    renderApp();
    const mojitoKarte = screen.getByRole("article", { name: "Mojito" });
    await userEvent.click(
      within(mojitoKarte).getByRole("button", { name: /konfigurieren/i }),
    );

    const dialog = within(screen.getByRole("dialog", { name: /konfigurieren/i }));
    const staerke = dialog.getByLabelText(/stärke/i);
    await userEvent.clear(staerke);
    await userEvent.type(staerke, "2");
    await userEvent.click(
      dialog.getByRole("button", { name: /in den warenkorb/i }),
    );

    // Dialog geschlossen, 1 Artikel zu 17,00 € (8,50 € × Stärke 2) in der Übersicht.
    expect(
      screen.queryByRole("dialog", { name: /konfigurieren/i }),
    ).not.toBeInTheDocument();
    expect(uebersicht().getByText(/1 artikel/i)).toBeInTheDocument();
    expect(uebersicht().getByText("17,00 €")).toBeInTheDocument();
  });

  it("ein eingelöster Coupon senkt den Gesamtpreis", async () => {
    const pruefe = vi.fn().mockResolvedValue({ valid: true, rabattProzent: 15 });
    renderApp({ couponPruefer: pruefe });
    await inWarenkorbLegen("Mojito"); // 8,50 €
    await zurBestellung();

    await userEvent.type(screen.getByLabelText(/gutschein-code/i), "HAPPY");
    await userEvent.click(screen.getByRole("button", { name: /einlösen/i }));

    expect(await screen.findByText(/rabatt: 15/i)).toBeInTheDocument();
    // 8,50 € war der ursprüngliche Preis — nach Rabatt nicht mehr in der Übersicht.
    expect(uebersicht().queryByText("8,50 €")).not.toBeInTheDocument();
  });

  it("Bestellablauf zeigt Mixing-Spinner und dann Erfolgs-Toast", async () => {
    renderApp();
    await inWarenkorbLegen("Mojito");
    await zurBestellung();
    await userEvent.type(screen.getByLabelText(/auf welchen namen/i), "Marco");
    await userEvent.click(screen.getByRole("button", { name: /jetzt bestellen/i }));

    // Spinner sofort sichtbar …
    expect(screen.getByText(/mixing/i)).toBeInTheDocument();
    // … danach der Erfolgs-Toast (Auto-Wait auf das Erscheinen)
    expect(await screen.findByText(/bestellung aufgegeben/i)).toBeInTheDocument();
  });

  it("zählt eine einzelne abgeschlossene Bestellung (Einzelklick → 1)", async () => {
    renderApp();
    await inWarenkorbLegen("Mojito");
    await zurBestellung();
    await userEvent.type(screen.getByLabelText(/auf welchen namen/i), "Marco");
    await userEvent.click(screen.getByRole("button", { name: /jetzt bestellen/i }));

    expect(await screen.findByText(/bestellung aufgegeben/i)).toBeInTheDocument();
    expect(screen.getByText(/bestellungen heute: 1/i)).toBeInTheDocument();
  });

  it("ruft suchDelayMs für jede Sucheingabe frisch auf (frischer Zufallswert pro Suche)", async () => {
    const delayFn = vi.fn(() => 10);
    renderApp({ suchDelayMs: delayFn });
    await userEvent.type(
      screen.getByRole("searchbox", { name: /cocktail suchen/i }),
      "Vir",
    );
    expect(delayFn).toHaveBeenCalled();
    expect(delayFn.mock.calls.length).toBeGreaterThan(1);
  });
});

describe("Happy Hour im App-Header", () => {
  it("bei HH-Zeit (17:30) und Mojito im Warenkorb → reduzierter Preis '6,80 €' in Warenkorb-Übersicht sichtbar", async () => {
    renderApp({ jetzt: abends });
    await inWarenkorbLegen("Mojito");
    expect(uebersicht().getByText("6,80 €")).toBeInTheDocument();
  });
  it("bei HH-Zeit → Original-Summe '8,50 €' in Warenkorb-Übersicht steht in einem <s>-Element", async () => {
    renderApp({ jetzt: abends });
    await inWarenkorbLegen("Mojito");
    expect(uebersicht().getByText("8,50 €").tagName).toBe("S");
  });
  it("außerhalb HH (mittags) → kein <s>-Element in der Warenkorb-Übersicht", async () => {
    renderApp(); // mittags = default
    await inWarenkorbLegen("Mojito");
    const region = screen.getByRole("region", { name: /warenkorb-übersicht/i });
    expect(region.querySelector("s")).toBeNull();
  });
  it("bei HH-Zeit → Mojito-Kachel zeigt den reduzierten Einzelpreis '6,80 €'", () => {
    renderApp({ jetzt: abends });
    const mojitoKarte = screen.getByRole("article", { name: "Mojito" });
    expect(within(mojitoKarte).getByText("6,80 €")).toBeInTheDocument();
  });
});
