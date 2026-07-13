import type { Cocktail } from "../domain/warenkorb.js";

export interface CocktailInfo extends Cocktail {
  beschreibung: string;
  alkoholfrei: boolean;
  /** Zutaten — für den Zutat-Filter und die Konfigurator-Checkboxen. */
  zutaten: string[];
  /** Auswählbare Basis-Spirituosen (Radiogruppe); leer bei alkoholfrei. */
  basisSpirituosen: string[];
  /** Bild-Surrogat: aktuell ein Emoji (echte Fotos folgen später). */
  bild: string;
}

// Eingebaute Cocktail-Karte der „Happy Hour"-Bar — kein Server, keine Netzwerk-Last.
export const COCKTAILS: CocktailInfo[] = [
  {
    id: "mojito",
    name: "Mojito",
    einzelpreis: 8.5,
    beschreibung: "Rum, Limette, Minze, Soda — der Klassiker.",
    alkoholfrei: false,
    zutaten: ["Rum", "Limette", "Minze", "Rohrzucker", "Soda"],
    basisSpirituosen: ["Weißer Rum", "Brauner Rum"],
    bild: "🍸",
  },
  {
    id: "cuba-libre",
    name: "Cuba Libre",
    einzelpreis: 7.5,
    beschreibung: "Rum, Cola, Limette. Simpel und gut.",
    alkoholfrei: false,
    zutaten: ["Rum", "Cola", "Limette"],
    basisSpirituosen: ["Weißer Rum", "Brauner Rum"],
    bild: "🥤",
  },
  {
    id: "caipirinha",
    name: "Caipirinha",
    einzelpreis: 9,
    beschreibung: "Cachaça, Limette, brauner Zucker.",
    alkoholfrei: false,
    zutaten: ["Cachaça", "Limette", "Brauner Zucker"],
    basisSpirituosen: ["Cachaça"],
    bild: "🍹",
  },
  {
    id: "virgin-colada",
    name: "Virgin Colada",
    einzelpreis: 6.5,
    beschreibung: "Ananas, Kokos, Sahne — ganz ohne Alkohol.",
    alkoholfrei: true,
    zutaten: ["Ananas", "Kokos", "Sahne"],
    basisSpirituosen: [],
    bild: "🥥",
  },
  {
    id: "ipanema",
    name: "Ipanema",
    einzelpreis: 6,
    beschreibung: "Die alkoholfreie Schwester der Caipirinha.",
    alkoholfrei: true,
    zutaten: ["Limette", "Ingwerale", "Brauner Zucker"],
    basisSpirituosen: [],
    bild: "🍋",
  },
];
