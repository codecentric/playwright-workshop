interface Filterbar {
  name: string;
  alkoholfrei: boolean;
  zutaten?: string[];
}

/**
 * Filtert Cocktails nach einem Namens-Teilstring (case-insensitive), optional
 * nach „alkoholfrei" und optional nach einer Zutat. Reine Funktion — der
 * künstliche Such-Delay sitzt bewusst in der UI, nicht hier.
 */
const normalisiere = (eingabe: string): string => eingabe.trim().toLowerCase();

export function alleZutaten<T extends { zutaten?: string[] }>(
  cocktails: T[],
): string[] {
  const alleMitDuplikaten = cocktails.flatMap((cocktail) => cocktail.zutaten ?? []);
  const eindeutig = [...new Set(alleMitDuplikaten)];
  return eindeutig.sort((a, b) => a.localeCompare(b));
}

export function filtereCocktails<T extends Filterbar>(
  cocktails: T[],
  begriff: string,
  nurAlkoholfrei = false,
  zutat = "",
): T[] {
  const gesucht = normalisiere(begriff);
  const gesuchteZutat = normalisiere(zutat);
  return cocktails.filter((cocktail) => {
    const passtName = cocktail.name.toLowerCase().includes(gesucht);
    const passtAlkohol = !nurAlkoholfrei || cocktail.alkoholfrei;
    const passtZutat =
      gesuchteZutat === "" ||
      (cocktail.zutaten ?? []).some(
        (z) => z.toLowerCase() === gesuchteZutat,
      );
    return passtName && passtAlkohol && passtZutat;
  });
}
