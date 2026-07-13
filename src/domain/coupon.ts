export interface CouponErgebnis {
  valid: boolean;
  rabattProzent: number;
}

// Bekannte Codes für die clientseitige Fallback-Prüfung — damit die Demo auch
// ganz ohne Backend funktioniert.
const BEKANNTE_CODES: Record<string, number> = {
  HAPPY: 15,
};

/**
 * Rein clientseitige Coupon-Prüfung (Fallback, wenn kein Backend erreichbar ist).
 */
export function lokaleCouponPruefung(code: string): CouponErgebnis {
  const rabattProzent = BEKANNTE_CODES[code.trim().toUpperCase()];
  return rabattProzent !== undefined
    ? { valid: true, rabattProzent }
    : { valid: false, rabattProzent: 0 };
}

/**
 * Prüft einen Coupon über den einzigen Netzwerk-Call der App
 * (POST /api/validate-coupon). Schlägt der Call fehl oder läuft kein Backend,
 * wird lokal validiert — die Demo bricht nie ab. Genau dieser Call ist der
 * Aufhänger für die Request-Mocking-Übung (`page.route`).
 */
export async function pruefeCoupon(
  code: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CouponErgebnis> {
  try {
    const antwort = await fetchImpl("/api/validate-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!antwort.ok) {
      return lokaleCouponPruefung(code);
    }
    return (await antwort.json()) as CouponErgebnis;
  } catch {
    return lokaleCouponPruefung(code);
  }
}
