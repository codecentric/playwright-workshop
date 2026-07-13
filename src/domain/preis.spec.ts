import { describe, it, expect } from "vitest";
import { berechneGesamtpreis, istHappyHour } from "./preis.js";

describe("berechneGesamtpreis (Happy-Hour-Preislogik)", () => {
  // Referenzzeitpunkte (lokale Zeit) — außerhalb bzw. innerhalb der Happy Hour.
  // Werden in den Red-Phasen konkretisiert.

  // 1. Basisfälle: leerer Warenkorb
  const mittags = new Date(2026, 6, 8, 12, 0); // 12:00 Uhr, außerhalb Happy Hour

  it("leerer Warenkorb ohne Trinkgeld → 0", () => {
    expect(berechneGesamtpreis([], 0, mittags)).toBe(0);
  });
  it("leerer Warenkorb mit Trinkgeld 2 → 2 (nur Trinkgeld)", () => {
    expect(berechneGesamtpreis([], 2, mittags)).toBe(2);
  });

  // 2. Cocktail-Summe (außerhalb Happy Hour, kein Trinkgeld)
  it("eine Position 8€ × 1 außerhalb Happy Hour → 8", () => {
    expect(berechneGesamtpreis([{ einzelpreis: 8, menge: 1 }], 0, mittags)).toBe(
      8,
    );
  });

  it("eine Position 5€ × 2 (Menge) außerhalb Happy Hour → 10", () => {
    expect(berechneGesamtpreis([{ einzelpreis: 5, menge: 2 }], 0, mittags)).toBe(
      10,
    );
  });

  it("mehrere Positionen 8€×1 + 5€×2 außerhalb Happy Hour → 18", () => {
    expect(
      berechneGesamtpreis(
        [
          { einzelpreis: 8, menge: 1 },
          { einzelpreis: 5, menge: 2 },
        ],
        0,
        mittags,
      ),
    ).toBe(18);
  });

  // 3. Trinkgeld wird zur Summe addiert (außerhalb Happy Hour)
  it("Summe 18 + Trinkgeld 2 außerhalb Happy Hour → 20", () => {
    expect(
      berechneGesamtpreis(
        [
          { einzelpreis: 8, menge: 1 },
          { einzelpreis: 5, menge: 2 },
        ],
        2,
        mittags,
      ),
    ).toBe(20);
  });

  // 4. Happy-Hour-Rabatt (20% auf die Cocktail-Summe)
  const einCocktail10 = [{ einzelpreis: 10, menge: 1 }];

  it("Position 10€ um 17:00 Uhr → 8 (20% Rabatt)", () => {
    const um17 = new Date(2026, 6, 8, 17, 0);
    expect(berechneGesamtpreis(einCocktail10, 0, um17)).toBe(8);
  });

  it("Position 10€ um 18:30 Uhr → 8 (Happy Hour gilt bis 18:59)", () => {
    const um1830 = new Date(2026, 6, 8, 18, 30);
    expect(berechneGesamtpreis(einCocktail10, 0, um1830)).toBe(8);
  });

  // 5. Happy-Hour-Grenzen
  it("Position 10€ um 16:59 Uhr → 10 (vor Happy Hour, kein Rabatt)", () => {
    const um1659 = new Date(2026, 6, 8, 16, 59);
    expect(berechneGesamtpreis(einCocktail10, 0, um1659)).toBe(10);
  });

  it("Position 10€ um 19:00 Uhr → 10 (nach Happy Hour, kein Rabatt)", () => {
    const um19 = new Date(2026, 6, 8, 19, 0);
    expect(berechneGesamtpreis(einCocktail10, 0, um19)).toBe(10);
  });

  // 6. Trinkgeld wird NICHT rabattiert
  it("Summe 10 + Trinkgeld 3 um 17:00 Uhr → 11 (10×0.8 + 3, Rabatt nur auf Cocktails)", () => {
    const um17 = new Date(2026, 6, 8, 17, 0);
    expect(berechneGesamtpreis(einCocktail10, 3, um17)).toBe(11);
  });

  // 7. Kombination aller Regeln
  it("8€×1 + 5€×2 = 18, Trinkgeld 2, um 17:30 Uhr → 16.4 (18×0.8 + 2)", () => {
    const um1730 = new Date(2026, 6, 8, 17, 30);
    expect(
      berechneGesamtpreis(
        [
          { einzelpreis: 8, menge: 1 },
          { einzelpreis: 5, menge: 2 },
        ],
        2,
        um1730,
      ),
    ).toBe(16.4);
  });

  // 8. Coupon-Rabatt (Prozent auf die Cocktail-Summe, nach Happy Hour)
  it("Coupon 50% auf 10€ außerhalb Happy Hour → 5", () => {
    expect(berechneGesamtpreis(einCocktail10, 0, mittags, 50)).toBe(5);
  });

  it("Coupon rabattiert das Trinkgeld nicht: 10€ + Trinkgeld 4, Coupon 50% → 9", () => {
    expect(berechneGesamtpreis(einCocktail10, 4, mittags, 50)).toBe(9);
  });

  it("Coupon kombiniert mit Happy Hour: 10€ um 17:00 (→8), Coupon 50% → 4", () => {
    const um17 = new Date(2026, 6, 8, 17, 0);
    expect(berechneGesamtpreis(einCocktail10, 0, um17, 50)).toBe(4);
  });
});

describe("istHappyHour (Prädikat für Rabatt-Anzeige)", () => {
  it("17:00 Uhr (Beginn der Happy Hour) → true", () => {
    const um17 = new Date(2026, 6, 8, 17, 0);
    expect(istHappyHour(um17)).toBe(true);
  });
  it("12:00 Uhr (weit außerhalb der Happy Hour) → false", () => {
    const um12 = new Date(2026, 6, 8, 12, 0);
    expect(istHappyHour(um12)).toBe(false);
  });
  it("18:30 Uhr (mittendrin) → true", () => {
    const um1830 = new Date(2026, 6, 8, 18, 30);
    expect(istHappyHour(um1830)).toBe(true);
  });
  it("16:59 Uhr (eine Minute vor Beginn) → false", () => {
    const um1659 = new Date(2026, 6, 8, 16, 59);
    expect(istHappyHour(um1659)).toBe(false);
  });
  it("19:00 Uhr (direkt nach Ende) → false", () => {
    const um19 = new Date(2026, 6, 8, 19, 0);
    expect(istHappyHour(um19)).toBe(false);
  });
});
