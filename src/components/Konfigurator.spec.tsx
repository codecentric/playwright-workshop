import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Konfigurator } from "./Konfigurator.js";
import type { CocktailInfo } from "../data/cocktails.js";

const mojito: CocktailInfo = {
  id: "mojito",
  name: "Mojito",
  einzelpreis: 8.5,
  beschreibung: "Rum, Limette, Minze, Soda.",
  alkoholfrei: false,
  zutaten: ["Rum", "Limette", "Minze"],
  basisSpirituosen: ["Weißer Rum", "Brauner Rum"],
  bild: "🍸",
};

const virginColada: CocktailInfo = {
  id: "virgin-colada",
  name: "Virgin Colada",
  einzelpreis: 6.5,
  beschreibung: "Ananas, Kokos, Sahne.",
  alkoholfrei: true,
  zutaten: ["Ananas", "Kokos", "Sahne"],
  basisSpirituosen: [],
  bild: "🥥",
};

describe("Konfigurator", () => {
  // Darstellung
  it("zeigt den Cocktailnamen als Überschrift", () => {
    render(<Konfigurator cocktail={mojito} onBestaetigen={() => {}} />);
    expect(screen.getByRole("heading", { name: "Mojito" })).toBeInTheDocument();
  });
  it("zeigt initial den Basispreis (staerke 1): 8,50 €", () => {
    render(<Konfigurator cocktail={mojito} onBestaetigen={() => {}} />);
    expect(screen.getByText("8,50 €")).toBeInTheDocument();
  });

  // Zutaten-Checkboxen
  it("rendert für jede Zutat eine Checkbox", () => {
    render(<Konfigurator cocktail={mojito} onBestaetigen={() => {}} />);
    for (const zutat of mojito.zutaten) {
      expect(screen.getByRole("checkbox", { name: zutat })).toBeInTheDocument();
    }
  });

  it("initial sind alle Zutaten-Checkboxen angehakt", () => {
    render(<Konfigurator cocktail={mojito} onBestaetigen={() => {}} />);
    for (const zutat of mojito.zutaten) {
      expect(screen.getByRole("checkbox", { name: zutat })).toBeChecked();
    }
  });

  it("Zutat abwählen entfernt den Haken (Minze → nicht mehr checked)", async () => {
    render(<Konfigurator cocktail={mojito} onBestaetigen={() => {}} />);
    const minze = screen.getByRole("checkbox", { name: "Minze" });
    await userEvent.click(minze);
    expect(minze).not.toBeChecked();
  });

  // Basis-Spirituose Radiogruppe
  it("rendert je Basis-Spirituose ein Radio", () => {
    render(<Konfigurator cocktail={mojito} onBestaetigen={() => {}} />);
    for (const spirituose of mojito.basisSpirituosen) {
      expect(
        screen.getByRole("radio", { name: spirituose }),
      ).toBeInTheDocument();
    }
  });

  it("erste Basis-Spirituose ist initial ausgewählt", () => {
    render(<Konfigurator cocktail={mojito} onBestaetigen={() => {}} />);
    expect(screen.getByRole("radio", { name: "Weißer Rum" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Brauner Rum" })).not.toBeChecked();
  });

  it("Auswahl einer anderen Basis-Spirituose wechselt die Selektion", async () => {
    render(<Konfigurator cocktail={mojito} onBestaetigen={() => {}} />);
    await userEvent.click(screen.getByRole("radio", { name: "Brauner Rum" }));
    expect(screen.getByRole("radio", { name: "Brauner Rum" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Weißer Rum" })).not.toBeChecked();
  });

  it("alkoholfreier Cocktail (keine basisSpirituosen) → kein Radio", () => {
    render(<Konfigurator cocktail={virginColada} onBestaetigen={() => {}} />);
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  // Stärke-Stepper
  it("Stärke-Stepper (spinbutton) hat initial den Wert 1", () => {
    render(<Konfigurator cocktail={mojito} onBestaetigen={() => {}} />);
    expect(screen.getByRole("spinbutton", { name: /stärke/i })).toHaveValue(1);
  });

  it("Stärke auf 2 erhöhen verdoppelt den angezeigten Einzelpreis → 17,00 €", async () => {
    render(<Konfigurator cocktail={mojito} onBestaetigen={() => {}} />);
    const staerke = screen.getByLabelText(/stärke/i);
    await userEvent.clear(staerke);
    await userEvent.type(staerke, "2");
    expect(screen.getByText("17,00 €")).toBeInTheDocument();
  });

  // Notiz
  it("Notiz-Textarea ist initial leer", () => {
    render(<Konfigurator cocktail={mojito} onBestaetigen={() => {}} />);
    expect(screen.getByLabelText(/notiz/i)).toHaveValue("");
  });

  it("Notiz-Textarea ist editierbar", async () => {
    render(<Konfigurator cocktail={mojito} onBestaetigen={() => {}} />);
    const notiz = screen.getByLabelText(/notiz/i);
    await userEvent.type(notiz, "extra Eis");
    expect(notiz).toHaveValue("extra Eis");
  });

  // Bestätigen
  it("Button „In den Warenkorb“ ruft onBestaetigen mit Standard-Konfiguration und Basispreis", async () => {
    const onBestaetigen = vi.fn();
    render(<Konfigurator cocktail={mojito} onBestaetigen={onBestaetigen} />);
    await userEvent.click(
      screen.getByRole("button", { name: /in den warenkorb/i }),
    );
    expect(onBestaetigen).toHaveBeenCalledWith(
      {
        zutaten: ["Rum", "Limette", "Minze"],
        basisSpirituose: "Weißer Rum",
        staerke: 1,
        notiz: "",
      },
      8.5,
    );
  });

  it("Bestätigen übergibt geänderte Konfiguration: staerke 2, Minze abgewählt, Notiz „extra Eis“ → Einzelpreis 17", async () => {
    const onBestaetigen = vi.fn();
    render(<Konfigurator cocktail={mojito} onBestaetigen={onBestaetigen} />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Minze" }));
    const staerke = screen.getByLabelText(/stärke/i);
    await userEvent.clear(staerke);
    await userEvent.type(staerke, "2");
    await userEvent.type(screen.getByLabelText(/notiz/i), "extra Eis");
    await userEvent.click(
      screen.getByRole("button", { name: /in den warenkorb/i }),
    );

    expect(onBestaetigen).toHaveBeenCalledWith(
      {
        zutaten: ["Rum", "Limette"],
        basisSpirituose: "Weißer Rum",
        staerke: 2,
        notiz: "extra Eis",
      },
      17,
    );
  });
});
