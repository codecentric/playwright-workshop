import { describe, it, expect } from "vitest";
import {
  fuegeHinzu,
  entferne,
  aendereMenge,
  anzahlArtikel,
  type Cocktail,
  type Warenkorb,
} from "./warenkorb.js";

const mojito: Cocktail = { id: "mojito", name: "Mojito", einzelpreis: 8 };
const cuba: Cocktail = { id: "cuba", name: "Cuba Libre", einzelpreis: 7 };

describe("Warenkorb-Logik", () => {
  // 1. Basisfall
  it("leerer Warenkorb hat keine Positionen", () => {
    const leer: Warenkorb = [];
    expect(leer).toHaveLength(0);
  });

  // 2. Hinzufügen
  it("fuegeHinzu legt neue Position mit menge 1 an", () => {
    const ergebnis = fuegeHinzu([], mojito);
    expect(ergebnis).toHaveLength(1);
    expect(ergebnis[0].menge).toBe(1);
  });

  it("neue Position übernimmt id, name und einzelpreis des Cocktails", () => {
    const ergebnis = fuegeHinzu([], mojito);
    expect(ergebnis[0]).toEqual({
      id: "mojito",
      name: "Mojito",
      einzelpreis: 8,
      menge: 1,
    });
  });

  // 3. Gleicher Cocktail erneut → Menge erhöhen, keine zweite Position
  it("gleicher Cocktail 2× hinzugefügt → eine Position mit menge 2", () => {
    const ergebnis = fuegeHinzu(fuegeHinzu([], mojito), mojito);
    expect(ergebnis).toHaveLength(1);
    expect(ergebnis[0].menge).toBe(2);
  });

  // 4. Verschiedene Cocktails → getrennte Positionen
  it("zwei verschiedene Cocktails → zwei getrennte Positionen", () => {
    const ergebnis = fuegeHinzu(fuegeHinzu([], mojito), cuba);
    expect(ergebnis).toHaveLength(2);
    expect(ergebnis.map((p) => p.id)).toEqual(["mojito", "cuba"]);
  });

  // 5. Immutability
  it("fuegeHinzu mutiert den übergebenen Warenkorb nicht", () => {
    const original: Warenkorb = [];
    fuegeHinzu(original, mojito);
    expect(original).toHaveLength(0);
  });

  // 6. Entfernen
  it("entferne löscht die Position mit der id komplett", () => {
    const korb = fuegeHinzu(fuegeHinzu([], mojito), cuba);
    const ergebnis = entferne(korb, "mojito");
    expect(ergebnis.map((p) => p.id)).toEqual(["cuba"]);
  });

  // 7. Menge ändern
  it("aendereMenge setzt die Menge der Position", () => {
    const korb = fuegeHinzu([], mojito);
    const ergebnis = aendereMenge(korb, "mojito", 3);
    expect(ergebnis[0].menge).toBe(3);
  });

  it("aendereMenge mit menge <= 0 entfernt die Position", () => {
    const korb = fuegeHinzu(fuegeHinzu([], mojito), cuba);
    const ergebnis = aendereMenge(korb, "mojito", 0);
    expect(ergebnis.map((p) => p.id)).toEqual(["cuba"]);
  });

  // 8. Artikelanzahl (Badge)
  it("anzahlArtikel summiert die Mengen aller Positionen", () => {
    const korb = aendereMenge(fuegeHinzu(fuegeHinzu([], mojito), cuba), "mojito", 3);
    expect(anzahlArtikel(korb)).toBe(4); // 3× Mojito + 1× Cuba
  });
});
