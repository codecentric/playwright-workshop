export interface Position {
  einzelpreis: number;
  menge: number;
}

// Happy Hour: 20% Rabatt auf die Cocktail-Summe zwischen 17:00 und 18:59 Uhr.
const HAPPY_HOUR_BEGINN = 17; // erste volle Stunde mit Rabatt
const HAPPY_HOUR_ENDE = 18; // letzte volle Stunde mit Rabatt
export const HAPPY_HOUR_RABATT_PROZENT = 20;

export function istHappyHour(zeitpunkt: Date): boolean {
  const stunde = zeitpunkt.getHours();
  return stunde >= HAPPY_HOUR_BEGINN && stunde <= HAPPY_HOUR_ENDE;
}

export function cocktailSumme(warenkorb: Position[]): number {
  return warenkorb.reduce(
    (summe, position) => summe + position.einzelpreis * position.menge,
    0,
  );
}

export function berechneGesamtpreis(
  warenkorb: Position[],
  trinkgeld: number,
  zeitpunkt: Date,
  couponProzent = 0,
): number {
  const summe = cocktailSumme(warenkorb);

  const nachHappyHour = istHappyHour(zeitpunkt)
    ? summe * (1 - HAPPY_HOUR_RABATT_PROZENT / 100)
    : summe;

  const nachCoupon = nachHappyHour * (1 - couponProzent / 100);

  return nachCoupon + trinkgeld;
}
