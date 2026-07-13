import { describe, it, expect } from "vitest";
import { berechneEinzelpreis, standardKonfiguration } from "./konfiguration.js";

describe("berechneEinzelpreis (Stärke als Preis-Faktor)", () => {
  it("staerke 1 → Basispreis unverändert: 8.5 × 1 → 8.5", () => {
    expect(berechneEinzelpreis(8.5, 1)).toBe(8.5);
  });
  it("staerke 2 (doppelt) → 8.5 × 2 → 17", () => {
    expect(berechneEinzelpreis(8.5, 2)).toBe(17);
  });
  it("staerke 3 (dreifach) → 9 × 3 → 27", () => {
    expect(berechneEinzelpreis(9, 3)).toBe(27);
  });
  it("defensiv: staerke 0 → wie 1, Ergebnis 8.5", () => {
    expect(berechneEinzelpreis(8.5, 0)).toBe(8.5);
  });
  it("defensiv: staerke negativ (-2) → wie 1, Ergebnis 8.5", () => {
    expect(berechneEinzelpreis(8.5, -2)).toBe(8.5);
  });
});

describe("standardKonfiguration (Default-Auswahl aus Cocktail)", () => {
  const mojito = {
    zutaten: ["Rum", "Limette", "Minze"],
    basisSpirituosen: ["Weißer Rum", "Brauner Rum"],
  };

  it("staerke ist 1", () => {
    expect(standardKonfiguration(mojito).staerke).toBe(1);
  });

  it("notiz ist leer", () => {
    expect(standardKonfiguration(mojito).notiz).toBe("");
  });
  it("alle Zutaten des Cocktails sind vorausgewählt", () => {
    expect(standardKonfiguration(mojito).zutaten).toEqual([
      "Rum",
      "Limette",
      "Minze",
    ]);
  });
  it("zutaten ist eine Kopie, nicht dieselbe Referenz wie cocktail.zutaten", () => {
    expect(standardKonfiguration(mojito).zutaten).not.toBe(mojito.zutaten);
  });

  it("basisSpirituose ist die erste Basis-Spirituose (basisSpirituosen[0])", () => {
    expect(standardKonfiguration(mojito).basisSpirituose).toBe("Weißer Rum");
  });

  it("basisSpirituose ist \"\" wenn keine Basis-Spirituose vorhanden (alkoholfrei)", () => {
    const virginColada = { zutaten: ["Ananas", "Kokos"], basisSpirituosen: [] };
    expect(standardKonfiguration(virginColada).basisSpirituose).toBe("");
  });
});
