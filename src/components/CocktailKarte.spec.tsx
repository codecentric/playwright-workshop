import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CocktailKarte } from "./CocktailKarte.js";
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

describe("CocktailKarte", () => {
  it("zeigt den Namen des Cocktails als Überschrift", () => {
    render(<CocktailKarte cocktail={mojito} onHinzufuegen={() => {}} />);
    expect(screen.getByRole("heading", { name: "Mojito" })).toBeInTheDocument();
  });

  it("zeigt den formatierten Preis", () => {
    render(<CocktailKarte cocktail={mojito} onHinzufuegen={() => {}} />);
    expect(screen.getByText("8,50 €")).toBeInTheDocument();
  });

  it("zeigt die Beschreibung", () => {
    render(<CocktailKarte cocktail={mojito} onHinzufuegen={() => {}} />);
    expect(screen.getByText(/rum, limette, minze/i)).toBeInTheDocument();
  });

  it("hat einen 'In den Warenkorb'-Button", () => {
    render(<CocktailKarte cocktail={mojito} onHinzufuegen={() => {}} />);
    expect(
      screen.getByRole("button", { name: /in den warenkorb/i }),
    ).toBeInTheDocument();
  });

  it("ruft onHinzufuegen mit dem Cocktail auf, wenn der Button geklickt wird", async () => {
    const onHinzufuegen = vi.fn();
    render(<CocktailKarte cocktail={mojito} onHinzufuegen={onHinzufuegen} />);

    await userEvent.click(
      screen.getByRole("button", { name: /in den warenkorb/i }),
    );

    expect(onHinzufuegen).toHaveBeenCalledTimes(1);
    expect(onHinzufuegen).toHaveBeenCalledWith(mojito);
  });

  it("zeigt keinen 'Konfigurieren'-Button ohne onKonfigurieren-Prop", () => {
    render(<CocktailKarte cocktail={mojito} onHinzufuegen={() => {}} />);
    expect(
      screen.queryByRole("button", { name: /konfigurieren/i }),
    ).not.toBeInTheDocument();
  });

  it("ruft onKonfigurieren mit dem Cocktail, wenn der 'Konfigurieren'-Button geklickt wird", async () => {
    const onKonfigurieren = vi.fn();
    render(
      <CocktailKarte
        cocktail={mojito}
        onHinzufuegen={() => {}}
        onKonfigurieren={onKonfigurieren}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /konfigurieren/i }),
    );
    expect(onKonfigurieren).toHaveBeenCalledWith(mojito);
  });

  it("zeigt das Bild-Emoji des Cocktails (🍸)", () => {
    render(<CocktailKarte cocktail={mojito} onHinzufuegen={() => {}} />);
    expect(screen.getByText("🍸")).toBeInTheDocument();
  });
  it("Bild ist ein Element mit role=img und aria-label = Cocktailname", () => {
    render(<CocktailKarte cocktail={mojito} onHinzufuegen={() => {}} />);
    expect(screen.getByRole("img", { name: "Mojito" })).toHaveTextContent("🍸");
  });
});

describe("CocktailKarte im Happy-Hour-Preis", () => {
  it("bei rabattProzent=20 (Mojito 8,50 €) → reduzierter Preis '6,80 €' sichtbar", () => {
    render(
      <CocktailKarte
        cocktail={mojito}
        onHinzufuegen={() => {}}
        rabattProzent={20}
      />,
    );
    expect(screen.getByText("6,80 €")).toBeInTheDocument();
  });
  it("bei rabattProzent=20 → Original-Preis '8,50 €' bleibt sichtbar", () => {
    render(
      <CocktailKarte
        cocktail={mojito}
        onHinzufuegen={() => {}}
        rabattProzent={20}
      />,
    );
    expect(screen.getByText("8,50 €")).toBeInTheDocument();
  });
  it("bei rabattProzent=20 → Original-Preis steht in einem <s>-Element", () => {
    render(
      <CocktailKarte
        cocktail={mojito}
        onHinzufuegen={() => {}}
        rabattProzent={20}
      />,
    );
    expect(screen.getByText("8,50 €").tagName).toBe("S");
  });
  it("ohne rabattProzent (Default 0) → kein <s>-Element im DOM", () => {
    const { container } = render(
      <CocktailKarte cocktail={mojito} onHinzufuegen={() => {}} />,
    );
    expect(container.querySelector("s")).toBeNull();
  });
});
