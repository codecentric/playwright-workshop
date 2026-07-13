## Teil 5 — Flaky Tests

Fünf bewusst instabile Tests in `e2e/5-flaky-tests.spec.ts`. Manche schlagen
sofort und zuverlässig fehl, andere nur zu bestimmten Uhrzeiten oder abhängig
von der Aufrufreihenfolge — genau das ist der Punkt. Ziel dieser Übungen ist,
die Ursache jeder Flakiness sauber zu benennen (nicht bloß den Testcode grün
zu bekommen) und den Fix an der richtigen Stelle anzubringen.

Einige der Flakiness-Quellen sind in der App **absichtlich eingebaut** (siehe
Kommentare in `src/App.tsx` und `src/components/WarenkorbDrawer.tsx`) — die
Anwendung ist hier ausnahmsweise Teil der Übung. Trotzdem: den Fix machst du
im Test, nicht in `src/`.

**Setup:** Datei laufen lassen und Report öffnen:

```bash
npx playwright test e2e/5-flaky-tests.spec.ts
npx playwright show-report
```

Bei zeit- und reihenfolgeabhängigen Übungen (5.4, 5.5) lohnt es sich, die
Suite mehrfach zu laufen (`--repeat-each=5`), um die Flakiness überhaupt zu
sehen.

### 5.1. Fehlender Wait nach asynchronem Filtern

Der Test tippt **„mojito"** ins Suchfeld und prüft **sofort**, dass genau eine
Karte übrig ist. Der Filter greift erst nach dem Such-Delay (`suchDelayMs`,
aktuell 1000 ms) — die Query liest die noch ungefilterte Liste aus.

Stelle den Test auf Playwrights auto-wartende Assertion um
(`toHaveCount(1)` bzw. `toBeVisible()`), sodass der Test bis zum Timeout
wartet, statt einmalig zu lesen. Kein `waitForTimeout`, kein manuelles Sleep.

Überlege: Warum wartet `await expect(locator).toHaveCount(1)`, aber
`expect(await locator.count()).toBe(1)` nicht? Formuliere die Faustregel selbst,
bevor du weiterliest — sie taucht in fast jedem der folgenden Szenarien
wieder auf.


### 5.2. Geteilter Zustand zwischen Tests

Drei Tests teilen sich eine `page` aus `beforeAll` und `test.describe.configure({
mode: "serial" })`. Jeder legt genau **einen** Cocktail in den Warenkorb und
erwartet danach **„1 Artikel"**. Der erste Test ist grün — ab dem zweiten
wächst der Warenkorb aus dem vorherigen Test einfach mit.

Wirf die geteilte `page`, das `beforeAll`/`afterAll` und den
`serial`-Modus weg. Nutze die `page`-Fixture (`async ({ page })`) und ein
`beforeEach` mit `await page.goto("/")`. Jeder Test startet damit in einem
frischen Browser-Context — eigener Storage, eigener React-State, eigener
Warenkorb.

Überlege: Was hat `mode: "serial"` hier eigentlich kaschiert? Ohne den
seriellen Modus hätten die drei Tests parallel laufen dürfen — und **welcher**
davon wäre dann jeweils rot geworden? („Willkürliche Tests schlagen fehl" ist
genau dieses Muster.)


### 5.3. Verzögerte Hydration

Der Bestellen-Button im Warenkorb-Drawer ist sofort sichtbar und **nicht**
disabled. Klicks werden aber erst verarbeitet, nachdem der Handler nach einer
zufälligen Verzögerung von **200–500 ms** registriert wurde
(siehe `hydriert`-State und `useEffect` in `WarenkorbDrawer.tsx`) — ein
simuliertes Hydration-Fenster, in dem UI-Elemente zwar da, aber noch nicht
interaktiv sind. Der Test wartet stur `page.waitForTimeout(300)` ab, bevor er
klickt. Trifft der zufällige Delay mal 250 ms, mal 450 ms, landet der Klick
mal nach, mal vor der Hydration — der Klick ist dann ein No-op, `onBestellen`
läuft nicht, der Bestellungs-Dialog erscheint nie.

Ersetze das feste `page.waitForTimeout(300)` durch ein
Warten auf eine tatsächliche Bedingung. Playwrights Auto-Waiting deckt diese
Art von Hydration-Flakiness **nicht** ab — der Button ist im DOM, sichtbar
und nicht `disabled`; Actionability meldet grünes Licht. Du musst dir also
ein anderes Signal suchen, das den *erwarteten Effekt* des Klicks belegt:
Klicke, warte auf den Bestellungs-Dialog — und wenn er nicht kommt, klicke
erneut. Ein knapper Retry-Loop mit `expect.toPass` oder eine Web-Assertion
auf ein direktes Klick-Ergebnis erfüllt genau das.

Überlege: Warum hilft Playwrights eingebautes Warten (`toBeVisible`,
`toBeEnabled`) hier gerade **nicht**? Und in welchem produktiven Szenario
wärst du derselben Ursache tatsächlich schon mal begegnet?


### 5.4. Zeitabhängiges Verhalten (Happy Hour)

Der Test legt einen Mojito in den Warenkorb und erwartet den Happy-Hour-Preis
**„6,80 €"** (8,50 € − 20 % Rabatt). Happy Hour läuft zwischen 17:00 und
18:59 Uhr. Läuft die Suite außerhalb dieses Fensters, zeigt die App den vollen
Preis und der Test schlägt fehl — abends grün, morgens rot.

Setze die logische Zeit der App mit `page.clock`
deterministisch auf eine Uhrzeit **innerhalb** der Happy Hour (z. B. 17:30 Uhr).
`page.clock.install` bzw. `page.clock.setFixedTime` gehören vor den `page.goto`,
damit die App die fixe Zeit von Anfang an sieht.

Überlege: Der Trace-Viewer zeigt die reale Uhrzeit, nicht die logische Zeit
deiner Anwendung. Wenn dieser Test um 16:59 rot wird — welchen Hinweis liefert
dir der Trace tatsächlich? Und warum ist ein „nur am Feierabend grün"-Test
schlimmer als ein durchweg roter?
