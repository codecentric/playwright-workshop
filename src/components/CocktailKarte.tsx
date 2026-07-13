import type { CocktailInfo } from "../data/cocktails.js";
import { formatiereEuro } from "../domain/format.js";

interface CocktailKarteProps {
  cocktail: CocktailInfo;
  onHinzufuegen: (cocktail: CocktailInfo) => void;
  onKonfigurieren?: (cocktail: CocktailInfo) => void;
  rabattProzent?: number;
}

export function CocktailKarte({
  cocktail,
  onHinzufuegen,
  onKonfigurieren,
  rabattProzent = 0,
}: CocktailKarteProps) {
  const { name, bild, beschreibung, einzelpreis } = cocktail;
  const hatRabatt = rabattProzent > 0;
  const reduzierterPreis = einzelpreis * (1 - rabattProzent / 100);
  return (
    <article className="cocktail-karte" aria-label={name}>
      <span className="bild" role="img" aria-label={name}>
        {bild}
      </span>
      <h3>{name}</h3>
      <p className="beschreibung">{beschreibung}</p>
      <p className="preis" data-testid="cocktail-preis">
        {hatRabatt ? (
          <>
            {formatiereEuro(reduzierterPreis)}{" "}
            <s>{formatiereEuro(einzelpreis)}</s>
          </>
        ) : (
          formatiereEuro(einzelpreis)
        )}
      </p>
      <button type="button" onClick={() => onHinzufuegen(cocktail)}>
        In den Warenkorb
      </button>
      {onKonfigurieren && (
        <button type="button" onClick={() => onKonfigurieren(cocktail)}>
          Konfigurieren
        </button>
      )}
    </article>
  );
}
