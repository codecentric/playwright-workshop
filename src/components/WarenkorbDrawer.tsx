import { useEffect, useState } from "react";
import type { Warenkorb } from "../domain/warenkorb.js";
import { formatiereEuro } from "../domain/format.js";

interface WarenkorbDrawerProps {
  warenkorb: Warenkorb;
  offen: boolean;
  gesamtpreis: number;
  onSchliessen: () => void;
  onMengeAendern: (id: string, menge: number) => void;
  onEntfernen: (id: string) => void;
  onBestellen: () => void;
}

export function WarenkorbDrawer({
  warenkorb,
  offen,
  gesamtpreis,
  onSchliessen,
  onMengeAendern,
  onEntfernen,
  onBestellen,
}: WarenkorbDrawerProps) {
  // Flakiness-Quelle #1: Der Bestellen-Button ist von Anfang an sichtbar und
  // NICHT disabled — Klicks werden aber erst nach einem zufälligen Delay von
  // 200–500 ms verarbeitet. Simuliert das reale Muster einer verzögerten
  // Hydration, bei der der Event-Handler-Code erst nachgeladen wird.
  const [hydriert, setHydriert] = useState(false);

  useEffect(() => {
    if (!offen) {
      setHydriert(false);
      return;
    }
    const delayMs = 200 + Math.random() * 300;
    const timer = setTimeout(() => setHydriert(true), delayMs);
    return () => clearTimeout(timer);
  }, [offen]);

  return (
    <aside
      className={offen ? "drawer offen" : "drawer"}
      role="dialog"
      aria-label="Warenkorb"
      aria-hidden={offen ? undefined : true}
      inert={offen ? undefined : true}
    >
      <header className="drawer-kopf">
        <h2>Dein Warenkorb</h2>
        <button type="button" onClick={onSchliessen} aria-label="Schließen">
          ✕
        </button>
      </header>

      {warenkorb.length === 0 ? (
        <p className="drawer-leer">Dein Warenkorb ist leer.</p>
      ) : (
        <ul className="drawer-positionen">
          {warenkorb.map((position) => (
            <li key={position.id} aria-label={position.name}>
              <span className="pos-name">{position.name}</span>
              <span className="pos-menge">Menge: {position.menge}</span>
              <span className="pos-summe">
                {formatiereEuro(position.einzelpreis * position.menge)}
              </span>
              <button
                type="button"
                aria-label={`Menge verringern für ${position.name}`}
                onClick={() => onMengeAendern(position.id, position.menge - 1)}
              >
                –
              </button>
              <button
                type="button"
                aria-label={`Menge erhöhen für ${position.name}`}
                onClick={() => onMengeAendern(position.id, position.menge + 1)}
              >
                +
              </button>
              <button
                type="button"
                aria-label={`${position.name} entfernen`}
                onClick={() => onEntfernen(position.id)}
              >
                Entfernen
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer className="drawer-fuss">
        <span>Gesamt</span>
        <strong>{formatiereEuro(gesamtpreis)}</strong>
        <button
          type="button"
          onClick={hydriert ? onBestellen : undefined}
        >
          Bestellen
        </button>
      </footer>
    </aside>
  );
}
