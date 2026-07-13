export interface Konfiguration {
  zutaten: string[];
  basisSpirituose: string;
  staerke: number;
  notiz: string;
}

// Die Stärke ist ein Preis-Faktor. Werte unter 1 (0 oder negativ) werden
// defensiv auf diese Untergrenze angehoben, damit der Preis nie schrumpft.
const MINDEST_STAERKE = 1;

/**
 * Einzelpreis einer Cocktail-Position: Basispreis multipliziert mit der
 * wirksamen Stärke. Reine Funktion.
 */
export function berechneEinzelpreis(basispreis: number, staerke: number): number {
  const wirksameStaerke = Math.max(staerke, MINDEST_STAERKE);
  return basispreis * wirksameStaerke;
}

/**
 * Liefert die Default-Konfiguration eines Cocktails: alle Zutaten
 * vorausgewählt (als Kopie), erste Basis-Spirituose als Vorauswahl (bzw. „"
 * bei alkoholfrei), Stärke 1 und leere Notiz. Reine Funktion.
 */
export function standardKonfiguration(cocktail: {
  zutaten: string[];
  basisSpirituosen: string[];
}): Konfiguration {
  return {
    zutaten: [...cocktail.zutaten],
    basisSpirituose: cocktail.basisSpirituosen[0] ?? "",
    staerke: 1,
    notiz: "",
  };
}
