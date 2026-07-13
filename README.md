# Happy Hour 🍹 — Cocktail-Bar (Playwright-Workshop-Übungsapp)

Frontend-lastige Übungsanwendung für den Playwright-Workshop. Läuft **rein
clientseitig** (kein Backend nötig); der **einzige** Netzwerk-Call ist der
Coupon-Check und hat einen lokalen Fallback.

Fachliche Spezifikation & Didaktik: [`context-infos/09-uebungsbeispiel-cocktailbar.md`](context-infos/09-uebungsbeispiel-cocktailbar.md).

## Stack

React 19 · Vite 6 · TypeScript · Vitest + React Testing Library (Unit/Component,
per TDD gebaut). Playwright kommt als eigener Workshop-Schritt dazu.

## Befehle

```bash
npm install      # Abhängigkeiten
npm run dev      # Dev-Server (http://localhost:5173)
npm test         # Unit-/Component-Tests (Vitest, einmalig)
npm run test:watch
npm run build    # Typecheck + Production-Build
npm run preview  # gebautes Bundle lokal servieren
```

## Aufbau

```
src/
  domain/        reine Logik (TDD): preis, warenkorb, suche, coupon, format
  components/    isolierte React-Komponenten: CocktailKarte, WarenkorbDrawer,
                 Bestellformular, CouponFeld
  data/          eingebaute Cocktail-Karte
  App.tsx        Komposition + State
```

## Eingebaute Flakiness-Quellen (für die Übungen)

| Quelle | Wo | Mechanismus |
|---|---|---|
| Sidebar-Button | Warenkorb-Drawer | „Bestellen" erst nach CSS-Transition aktiv (`onTransitionEnd`) |
| Langsamer „Server" | Suche | künstlicher clientseitiger `setTimeout`-Delay |
| Global State | Happy-Hour-Preis | Rabatt hängt an `new Date()` (17–18 Uhr) |
| Race Condition | „Jetzt bestellen" | Doppelklick → Doppelbestellung (bewusst nicht entkoppelt) |

Für deterministische Tests sind die relevanten Abhängigkeiten in `App`
injizierbar: `jetzt`, `mixDauerMs`, `suchDelayMs`, `couponPruefer`. Die
Default-Werte erhalten die Flakiness fürs Playwright-Üben.
