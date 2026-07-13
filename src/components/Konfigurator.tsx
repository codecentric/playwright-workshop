import { useState } from "react";
import type { CocktailInfo } from "../data/cocktails.js";
import {
  standardKonfiguration,
  berechneEinzelpreis,
  type Konfiguration,
} from "../domain/konfiguration.js";
import { formatiereEuro } from "../domain/format.js";

interface KonfiguratorProps {
  cocktail: CocktailInfo;
  onBestaetigen: (konfiguration: Konfiguration, einzelpreis: number) => void;
}

export function Konfigurator({ cocktail, onBestaetigen }: KonfiguratorProps) {
  const [konfiguration, setKonfiguration] = useState<Konfiguration>(() =>
    standardKonfiguration(cocktail),
  );

  const einzelpreis = berechneEinzelpreis(
    cocktail.einzelpreis,
    konfiguration.staerke,
  );

  const aktualisiere = <K extends keyof Konfiguration>(
    feld: K,
    wert: Konfiguration[K],
  ) => setKonfiguration((aktuell) => ({ ...aktuell, [feld]: wert }));

  const toggleZutat = (zutat: string) => {
    setKonfiguration((aktuell) => {
      const gewaehlt = aktuell.zutaten.includes(zutat);
      return {
        ...aktuell,
        zutaten: gewaehlt
          ? aktuell.zutaten.filter((z) => z !== zutat)
          : [...aktuell.zutaten, zutat],
      };
    });
  };

  return (
    <div className="konfigurator">
      <h3>{cocktail.name}</h3>
      <p className="preis">{formatiereEuro(einzelpreis)}</p>

      <fieldset className="zutaten">
        <legend>Zutaten</legend>
        {cocktail.zutaten.map((zutat) => (
          <label key={zutat}>
            <input
              type="checkbox"
              checked={konfiguration.zutaten.includes(zutat)}
              onChange={() => toggleZutat(zutat)}
            />
            {zutat}
          </label>
        ))}
      </fieldset>

      {cocktail.basisSpirituosen.length > 0 && (
        <fieldset className="basis-spirituose">
          <legend>Basis-Spirituose</legend>
          {cocktail.basisSpirituosen.map((spirituose) => (
            <label key={spirituose}>
              <input
                type="radio"
                name="basisSpirituose"
                value={spirituose}
                checked={konfiguration.basisSpirituose === spirituose}
                onChange={() => aktualisiere("basisSpirituose", spirituose)}
              />
              {spirituose}
            </label>
          ))}
        </fieldset>
      )}

      <label>
        Stärke
        <input
          type="number"
          min={1}
          value={konfiguration.staerke}
          onChange={(e) => aktualisiere("staerke", Number(e.target.value))}
        />
      </label>

      <label>
        Notiz an die Bar
        <textarea
          value={konfiguration.notiz}
          onChange={(e) => aktualisiere("notiz", e.target.value)}
        />
      </label>

      <button
        type="button"
        onClick={() => onBestaetigen(konfiguration, einzelpreis)}
      >
        In den Warenkorb
      </button>
    </div>
  );
}
