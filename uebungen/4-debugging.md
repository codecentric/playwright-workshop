## Teil 4 — Debugging mit dem Trace-Viewer

Ziel dieser Übungen ist **nicht** das Fixen des Testcodes, sondern **das Finden
der Ursache im Trace-Viewer**. Fünf bewusst rot gebaute Tests, jeder mit einem
anderen Fehlerbild — und jeder braucht ein anderes Werkzeug im Trace-Viewer.

**Setup:** Tests scheitern lassen, dann Report öffnen:

```bash
npx playwright test e2e/4-debugging.spec.ts
npx playwright show-report
```

Im Report auf den roten Test klicken → Trace-Viewer öffnet sich. Nützliche
Bereiche:

- **Aktions-Zeitleiste + Vorher/Nachher-Snapshots** — was hat der Klick
  tatsächlich verändert?
- **DOM-Inspector** — Zustand zum Zeitpunkt der Assertion, inkl. berechneter
  Stile und ARIA-Attribute
- **Netzwerk-Tab** — Requests, Status-Codes, Response-Bodies
- **Konsole** — unbehandelte JavaScript-Fehler
- **Source-Tab** — die auslösende Codezeile finden


### 4.1. Falsche Zeile getroffen

Der Test legt **Mojito** und **Cuba Libre** in den Warenkorb, öffnet den Drawer
und will die **Menge von Cuba Libre** erhöhen. Am Ende prüft er „Menge: 2" in
der Cuba-Libre-Zeile — die Assertion schlägt fehl.

Vergleiche im Trace-Viewer die **Vorher-/Nachher-Snapshots**
des „+"-Klicks. Welche Zeile hat sich tatsächlich verändert? Was ist am
Selektor mehrdeutig, obwohl er auf den ersten Blick eindeutig aussieht? Wo im
DOM steht die zeilenspezifische Information, die den Selektor hätte disambiguieren
können?


### 4.2. Element im DOM, aber nicht sichtbar

Der Test navigiert auf die Startseite und prüft mit `toBeVisible()` einen Text
aus dem Warenkorb-Drawer (**„Dein Warenkorb"**). Die Assertion schlägt fehl —
obwohl der Text im DOM existiert.

Öffne den **DOM-Inspector** zum Zeitpunkt der fehlgeschlagenen
Assertion. Suche das `<aside class="drawer">`. Welche ARIA-Attribute trägt es?
Welche berechneten Stile (Reiter „Styles" / „Computed") sind gesetzt? Warum
sagt Playwright „nicht sichtbar", obwohl das Element im DOM steht — und welcher
Schritt fehlt schlicht im Test?


### 4.3. Fehlgeschlagener API-Call als Ursache

Der Test legt einen Cocktail in den Warenkorb, öffnet die Bestellung und löst
den Gutschein-Code **`SOMMER`** ein. Erwartet wird eine Rabatt-Anzeige (**„Rabatt:
… %"**) — die Assertion schlägt fehl.

Öffne den **Netzwerk-Tab** und finde die Anfrage
`POST /api/validate-coupon`. Welchen Status hat die Antwort? Was steht im
Response-Body? Was macht die App als Reaktion darauf? Wirf zusätzlich einen Blick
auf `src/domain/coupon.ts`: welche Codes kennt die **lokale Fallback-Prüfung**?


### 4.4. Stiller JavaScript-Fehler

Der Test füllt die Bestellung vollständig aus, klickt **„Jetzt bestellen"** und
erwartet den Erfolgs-Toast **„Bestellung aufgegeben — viel Spaß!"**. Stattdessen
bleibt die UI im **„Mixing…"**-Zustand hängen. Im DOM- und Netzwerk-Tab findest
du nichts Auffälliges.

Öffne die **Konsole** im Trace-Viewer. Welche Fehlermeldung
findest du?


### 4.5. Race Condition mit kurzzeitig korrektem Zustand

Der Test schickt eine Bestellung ab — durch **zwei schnelle Klicks** auf
**„Jetzt bestellen"** hintereinander. Danach erwartet er im Header „Bestellungen
heute: **1**". Angezeigt wird aber **2**.

Nutze die **Zeitreise**: springe durch die Snapshots direkt
nach dem Klick. Findest du den Moment, in dem der Zähler **kurzzeitig** auf
`1` stand, bevor er auf `2` gesprungen ist? Öffne dann den **Source-Tab** und
suche den Callback, der die Bestellung abschickt (`bestellungAbschicken` in
`src/App.tsx`). Was fehlt an dieser Stelle, um Doppelklicks harmlos zu machen?
