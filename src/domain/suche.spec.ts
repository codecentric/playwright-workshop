import { describe, it, expect } from "vitest";
import { filtereCocktails, alleZutaten } from "./suche.js";

const cocktails = [
  { name: "Mojito", alkoholfrei: false },
  { name: "Virgin Colada", alkoholfrei: true },
  { name: "Caipirinha", alkoholfrei: false },
  { name: "Ipanema", alkoholfrei: true },
];

describe("filtereCocktails", () => {
  it("leerer Begriff → alle Cocktails", () => {
    expect(filtereCocktails(cocktails, "")).toHaveLength(4);
  });

  it("filtert per Namens-Teilstring (case-insensitive)", () => {
    expect(filtereCocktails(cocktails, "moj").map((c) => c.name)).toEqual([
      "Mojito",
    ]);
    expect(filtereCocktails(cocktails, "MOJITO").map((c) => c.name)).toEqual([
      "Mojito",
    ]);
  });

  it("ignoriert umgebende Leerzeichen", () => {
    expect(filtereCocktails(cocktails, "  ipanema ").map((c) => c.name)).toEqual([
      "Ipanema",
    ]);
  });

  it("kein Treffer → leeres Array", () => {
    expect(filtereCocktails(cocktails, "xyz")).toEqual([]);
  });

  it("nurAlkoholfrei → nur alkoholfreie Cocktails", () => {
    expect(filtereCocktails(cocktails, "", true).map((c) => c.name)).toEqual([
      "Virgin Colada",
      "Ipanema",
    ]);
  });

  it("kombiniert Begriff und nurAlkoholfrei", () => {
    expect(filtereCocktails(cocktails, "colada", true).map((c) => c.name)).toEqual(
      ["Virgin Colada"],
    );
  });
});

describe("filtereCocktails — Filter nach Zutat", () => {
  const cocktails = [
    { name: "Mojito", alkoholfrei: false, zutaten: ["Rum", "Limette", "Minze"] },
    { name: "Cuba Libre", alkoholfrei: false, zutaten: ["Rum", "Cola", "Limette"] },
    { name: "Virgin Colada", alkoholfrei: true, zutaten: ["Ananas", "Kokos"] },
    { name: "Ipanema", alkoholfrei: true, zutaten: ["Limette", "Ingwerale"] },
  ];

  it("keine Zutat (undefined) → kein Zutat-Filter, alle Cocktails", () => {
    expect(filtereCocktails(cocktails, "")).toHaveLength(4);
  });
  it("leere Zutat \"\" → kein Zutat-Filter, alle Cocktails", () => {
    expect(filtereCocktails(cocktails, "", false, "")).toHaveLength(4);
  });
  it("Zutat \"Rum\" → nur Mojito und Cuba Libre", () => {
    expect(filtereCocktails(cocktails, "", false, "Rum").map((c) => c.name)).toEqual([
      "Mojito",
      "Cuba Libre",
    ]);
  });
  it("Zutat \"Limette\" → Mojito, Cuba Libre, Ipanema", () => {
    expect(
      filtereCocktails(cocktails, "", false, "Limette").map((c) => c.name),
    ).toEqual(["Mojito", "Cuba Libre", "Ipanema"]);
  });

  it("case-insensitive: Zutat \"rum\" matcht \"Rum\"", () => {
    expect(
      filtereCocktails(cocktails, "", false, "rum").map((c) => c.name),
    ).toEqual(["Mojito", "Cuba Libre"]);
  });

  it("exakter Zutatname: \"Lim\" matcht NICHT \"Limette\" → leeres Array", () => {
    expect(filtereCocktails(cocktails, "", false, "Lim")).toEqual([]);
  });

  it("Zutat, die keiner hat (\"Absinth\") → leeres Array", () => {
    expect(filtereCocktails(cocktails, "", false, "Absinth")).toEqual([]);
  });

  it("kombiniert Begriff und Zutat: Begriff \"cuba\" + Zutat \"Rum\" → nur Cuba Libre", () => {
    expect(
      filtereCocktails(cocktails, "cuba", false, "Rum").map((c) => c.name),
    ).toEqual(["Cuba Libre"]);
  });

  it("kombiniert nurAlkoholfrei und Zutat: nurAlkoholfrei + \"Limette\" → nur Ipanema", () => {
    expect(
      filtereCocktails(cocktails, "", true, "Limette").map((c) => c.name),
    ).toEqual(["Ipanema"]);
  });

  it("kombiniert alle drei: Begriff \"ipa\" + nurAlkoholfrei + Zutat \"Limette\" → Ipanema", () => {
    expect(
      filtereCocktails(cocktails, "ipa", true, "Limette").map((c) => c.name),
    ).toEqual(["Ipanema"]);
  });
});

describe("alleZutaten — eindeutige, sortierte Zutatenliste", () => {
  it("leere Cocktail-Liste → []", () => {
    expect(alleZutaten([])).toEqual([]);
  });
  it("ein Cocktail → seine Zutaten alphabetisch sortiert: [\"Rum\",\"Limette\"] → [\"Limette\",\"Rum\"]", () => {
    expect(alleZutaten([{ zutaten: ["Rum", "Limette"] }])).toEqual([
      "Limette",
      "Rum",
    ]);
  });
  it("dedupliziert gemeinsame Zutaten über Cocktails: Rum/Limette + Rum/Cola → [\"Cola\",\"Limette\",\"Rum\"]", () => {
    expect(
      alleZutaten([
        { zutaten: ["Rum", "Limette"] },
        { zutaten: ["Rum", "Cola"] },
      ]),
    ).toEqual(["Cola", "Limette", "Rum"]);
  });
  it("Cocktail ohne zutaten-Feld wird wie leere Zutaten behandelt → nur die vorhandenen", () => {
    expect(
      alleZutaten([{ zutaten: ["Ananas"] }, { name: "x" }]),
    ).toEqual(["Ananas"]);
  });

  it("sortiert deutsche Umlaute korrekt (localeCompare)", () => {
    expect(
      alleZutaten([{ zutaten: ["Zucker", "Ähre", "Apfel"] }]),
    ).toEqual(["Ähre", "Apfel", "Zucker"]);
  });
});
