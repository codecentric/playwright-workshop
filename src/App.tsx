import { useEffect, useState } from "react";
import { COCKTAILS, type CocktailInfo } from "./data/cocktails.js";
import { CocktailKarte } from "./components/CocktailKarte.js";
import { WarenkorbDrawer } from "./components/WarenkorbDrawer.js";
import { Bestellformular } from "./components/Bestellformular.js";
import { CouponFeld } from "./components/CouponFeld.js";
import { Konfigurator } from "./components/Konfigurator.js";
import type { CouponErgebnis } from "./domain/coupon.js";
import {
  fuegeHinzu,
  entferne,
  aendereMenge,
  anzahlArtikel,
  type Warenkorb,
} from "./domain/warenkorb.js";
import {
  berechneGesamtpreis,
  cocktailSumme,
  HAPPY_HOUR_RABATT_PROZENT,
  istHappyHour,
} from "./domain/preis.js";
import { filtereCocktails, alleZutaten } from "./domain/suche.js";
import { formatiereEuro } from "./domain/format.js";

type BestellStatus = "idle" | "mixing" | "erfolg";

// Obergrenze des zufällig gezogenen Such-Delays (halb-offenes Intervall [0, N) ms).
// Bewusst variabel → speist die Flakiness der Auto-Wait-/Debounce-Übung.
const MAX_SUCH_DELAY_MS = 1000;
const zufaelligerSuchDelayMs = (): number => Math.random() * MAX_SUCH_DELAY_MS;

interface AppProps {
  /** Liefert die aktuelle Zeit — injizierbar für deterministische Tests. */
  jetzt?: () => Date;
  /** Dauer des simulierten „Mixing" — im Test kurz gesetzt. */
  mixDauerMs?: number;
  /** Liefert den Such-Delay in ms — wird pro Sucheingabe frisch aufgerufen. */
  suchDelayMs?: () => number;
  /** Coupon-Prüfung — im Test injizierbar, sonst der echte fetch-Aufruf. */
  couponPruefer?: (code: string) => Promise<CouponErgebnis>;
}

export function App({
  jetzt = () => new Date(),
  mixDauerMs = 800,
  suchDelayMs = zufaelligerSuchDelayMs,
  couponPruefer,
}: AppProps) {
  const [warenkorb, setWarenkorb] = useState<Warenkorb>([]);
  const [drawerOffen, setDrawerOffen] = useState(false);
  const [bestellungOffen, setBestellungOffen] = useState(false);
  const [trinkgeld, setTrinkgeld] = useState(0);
  const [couponProzent, setCouponProzent] = useState(0);
  const [status, setStatus] = useState<BestellStatus>("idle");
  const [bestellungenHeute, setBestellungenHeute] = useState(0);
  const [eingabe, setEingabe] = useState("");
  const [suchbegriff, setSuchbegriff] = useState("");
  const [nurAlkoholfrei, setNurAlkoholfrei] = useState(false);
  const [zutatFilter, setZutatFilter] = useState("");
  const [konfigurationsCocktail, setKonfigurationsCocktail] =
    useState<CocktailInfo | null>(null);

  // Künstlicher, clientseitiger Delay: Der Filter greift erst verzögert.
  // `suchDelayMs()` wird bei jeder Sucheingabe frisch aufgerufen — der Default
  // liefert dabei einen neuen Zufallswert. Genau hier setzt später die
  // Auto-Wait-/Flaky-Test-Übung an.
  useEffect(() => {
    const timer = setTimeout(() => setSuchbegriff(eingabe), suchDelayMs());
    return () => clearTimeout(timer);
  }, [eingabe, suchDelayMs]);

  const hinzufuegen = (cocktail: CocktailInfo) => {
    setWarenkorb((aktuell) => fuegeHinzu(aktuell, cocktail));
  };

  // Ein konfigurierter Cocktail landet mit seinem angepassten (Stärke-)Einzelpreis
  // im Warenkorb; danach schließt der Konfigurator-Dialog.
  const konfiguriertHinzufuegen = (einzelpreis: number) => {
    if (konfigurationsCocktail === null) return;
    setWarenkorb((aktuell) =>
      fuegeHinzu(aktuell, { ...konfigurationsCocktail, einzelpreis }),
    );
    setKonfigurationsCocktail(null);
  };

  const sichtbareCocktails = filtereCocktails(
    COCKTAILS,
    suchbegriff,
    nurAlkoholfrei,
    zutatFilter,
  );

  const zutatOptionen = alleZutaten(COCKTAILS);

  const jetztWert = jetzt();

  const gesamtpreis = berechneGesamtpreis(
    warenkorb,
    trinkgeld,
    jetztWert,
    couponProzent,
  );

  const happyHourAktiv = istHappyHour(jetztWert);
  const originalSumme = cocktailSumme(warenkorb);

  // ⚠️ Flakiness-Quelle #4 (Race Condition): Der Bestell-Trigger ist BEWUSST
  // nicht entkoppelt — kein Guard, der Submit-Button wird nicht deaktiviert.
  // Ein schneller Doppelklick auf „Jetzt bestellen" ruft dies zweimal auf und
  // erzeugt zwei Bestellungen. Das ist der zu findende/fixende Bug der Übung.
  const bestellungAbschicken = () => {
    setStatus("mixing");
    setBestellungenHeute((anzahl) => anzahl + 1);
    setTimeout(() => {
      setStatus("erfolg");
      setBestellungOffen(false);
      setDrawerOffen(false);
      setWarenkorb([]);
      setTrinkgeld(0);
      setCouponProzent(0);
    }, mixDauerMs);
  };

  return (
    <main>
      <header>
        <div className="marke">
          <h1>Happy Hour 🍹</h1>
          <p className="bestell-zaehler" data-testid="bestell-zaehler">
            Bestellungen heute: {bestellungenHeute}
          </p>
        </div>
        <section aria-label="Warenkorb-Übersicht">
          <span>{anzahlArtikel(warenkorb)} Artikel</span>
          <strong>{formatiereEuro(gesamtpreis)}</strong>
          {happyHourAktiv && <s>{formatiereEuro(originalSumme)}</s>}
          <button type="button" onClick={() => setDrawerOffen(true)}>
            Warenkorb öffnen
          </button>
        </section>
      </header>

      <div className="such-leiste">
        <input
          type="search"
          aria-label="Cocktail suchen"
          placeholder="Cocktail suchen…"
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
        />
        <label>
          <input
            type="checkbox"
            checked={nurAlkoholfrei}
            onChange={(e) => setNurAlkoholfrei(e.target.checked)}
          />
          nur alkoholfrei
        </label>
        <label>
          Nach Zutat filtern
          <select
            aria-label="Nach Zutat filtern"
            value={zutatFilter}
            onChange={(e) => setZutatFilter(e.target.value)}
          >
            <option value="">Alle Zutaten</option>
            {zutatOptionen.map((zutat) => (
              <option key={zutat} value={zutat}>
                {zutat}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="cocktail-liste">
        {sichtbareCocktails.map((cocktail) => (
          <li key={cocktail.id}>
            <CocktailKarte
              cocktail={cocktail}
              onHinzufuegen={hinzufuegen}
              onKonfigurieren={setKonfigurationsCocktail}
              rabattProzent={happyHourAktiv ? HAPPY_HOUR_RABATT_PROZENT : 0}
            />
          </li>
        ))}
      </ul>

      {konfigurationsCocktail !== null && (
        <div
          className="modal"
          role="dialog"
          aria-label="Cocktail konfigurieren"
        >
          <Konfigurator
            cocktail={konfigurationsCocktail}
            onBestaetigen={(_, einzelpreis) =>
              konfiguriertHinzufuegen(einzelpreis)
            }
          />
          <button type="button" onClick={() => setKonfigurationsCocktail(null)}>
            Abbrechen
          </button>
        </div>
      )}

      <WarenkorbDrawer
        warenkorb={warenkorb}
        offen={drawerOffen}
        gesamtpreis={gesamtpreis}
        onSchliessen={() => setDrawerOffen(false)}
        onMengeAendern={(id, menge) =>
          setWarenkorb((aktuell) => aendereMenge(aktuell, id, menge))
        }
        onEntfernen={(id) => setWarenkorb((aktuell) => entferne(aktuell, id))}
        onBestellen={() => {
          setStatus("idle");
          setBestellungOffen(true);
        }}
      />

      {bestellungOffen && (
        <div className="modal" role="dialog" aria-label="Bestellung">
          <h2>Bestellung abschließen</h2>
          <p>Gesamt: {formatiereEuro(gesamtpreis)}</p>
          <CouponFeld onEingeloest={setCouponProzent} pruefe={couponPruefer} />
          <Bestellformular
            trinkgeld={trinkgeld}
            onTrinkgeldChange={setTrinkgeld}
            onAbschicken={bestellungAbschicken}
          />
          {status === "mixing" && <p role="status">Mixing… 🍹</p>}
        </div>
      )}

      {status === "erfolg" && (
        <div className="toast" role="status">
          Bestellung aufgegeben — viel Spaß! 🍹
        </div>
      )}
    </main>
  );
}
