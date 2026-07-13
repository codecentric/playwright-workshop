export interface Cocktail {
  id: string;
  name: string;
  einzelpreis: number;
}

export interface WarenkorbPosition {
  id: string;
  name: string;
  einzelpreis: number;
  menge: number;
}

export type Warenkorb = WarenkorbPosition[];

function aktualisierePosition(
  warenkorb: Warenkorb,
  id: string,
  aendern: (position: WarenkorbPosition) => WarenkorbPosition,
): Warenkorb {
  return warenkorb.map((position) =>
    position.id === id ? aendern(position) : position,
  );
}

export function fuegeHinzu(warenkorb: Warenkorb, cocktail: Cocktail): Warenkorb {
  const bereitsImKorb = warenkorb.some((position) => position.id === cocktail.id);
  if (bereitsImKorb) {
    return aktualisierePosition(warenkorb, cocktail.id, (position) => ({
      ...position,
      menge: position.menge + 1,
    }));
  }
  return [...warenkorb, { ...cocktail, menge: 1 }];
}

export function entferne(warenkorb: Warenkorb, id: string): Warenkorb {
  return warenkorb.filter((position) => position.id !== id);
}

export function aendereMenge(
  warenkorb: Warenkorb,
  id: string,
  menge: number,
): Warenkorb {
  if (menge <= 0) {
    return entferne(warenkorb, id);
  }
  return aktualisierePosition(warenkorb, id, (position) => ({ ...position, menge }));
}

export function anzahlArtikel(warenkorb: Warenkorb): number {
  return warenkorb.reduce((summe, position) => summe + position.menge, 0);
}
