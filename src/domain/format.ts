/**
 * Formatiert einen Euro-Betrag als deutschen String, z.B. 8.5 → "8,50 €".
 * Bewusst ohne Intl.NumberFormat, damit die Ausgabe (und damit Test-/Playwright-
 * Assertions) deterministisch und ohne versteckte Sonderzeichen bleibt.
 */
export function formatiereEuro(betrag: number): string {
  return `${betrag.toFixed(2).replace(".", ",")} €`;
}
