## Teil 3 — Testing Good Practices

In `e2e/3-good-practices.spec.ts` liegen sieben Tests, von denen jeder genau ein
Problem enthält. Sechs davon sind **grün** und trotzdem falsch, einer schlägt
fehl. Aufgabe 8 kombiniert am Ende alle sieben in einem längeren Beispiel.

Die Anwendung ist in Ordnung — schuld ist immer der Test. Ändere nichts an
`src/`. Wenn ein Test das Verhalten der App beschreibt, dann beschreibt er es
korrekt; nur die Art, wie er es prüft, ist es nicht.

Arbeite dich der Reihe nach durch. Für jedes Problem: **benenne** zuerst, was
hier schiefläuft, und **repariere** dann den Test. Lass ihn danach laufen.

> „Good Practices", nicht „Best Practices": „best" behauptet, es gebe eine
> kontextfreie Bestlösung. Zu jeder Regel hier existiert eine Situation, in der
> sie nicht gilt — `waitForTimeout` beim Debuggen, ein `data-testid`, wo keine
> Rolle trägt. Die Regel zu kennen heißt, ihre Ausnahme begründen zu können.

### 3.1. Hartes Warten

Der Test tippt „caipi" ins Suchfeld, wartet zwei Sekunden und prüft dann, dass
genau eine Karte übrig ist. Er ist grün.

Geh in zwei Schritten vor, und lass den Test nach jedem laufen:

**Schritt 1:** Lösche das `waitForTimeout`. Der Test wird rot — notiere, was in
der Fehlermeldung steht.

**Schritt 2:** Repariere ihn, ohne das Warten wieder einzubauen.

Überlege — drei Fragen:

Was hat `count()` in Schritt 1 gelesen, und warum? Der Such-Delay der App liegt
bei einer Sekunde.

Beide Zeilen benutzen `expect`. Warum wartet die eine und die andere nicht?
Formuliere die Faustregel selbst, bevor du weiterliest —
`await expect(locator)` gegen `expect(await …)`.

Der Sleep hat den Test grün gehalten, obwohl die Prüfung darunter kaputt war. So
entstehen Sleeps in echten Suiten: jemand hatte eine nicht wartende Prüfung, sie
war flaky, und der Sleep hat sie beruhigt. Was war nie behoben worden? Und was
kosten zwei Sekunden, mal 500 Tests, mal jeder Push?

> Für die Selenium-Umsteiger: das ist `Thread.sleep`. In Playwright gibt es
> keinen Grund mehr dafür — die Assertion wartet selbst.

### 3.2. XPath und CSS statt semantischer Locators

Der Test klickt sich per `//ul[@class='cocktail-liste']/li[1]//button[1]` und
`header > section > button` durch die App. Grün — heute. Schreibe ihn auf
Rollen-Locators um.

Danach der Beweis, warum sich das gelohnt hat: Benenne in `src/App.tsx` die
CSS-Klasse `cocktail-liste` in etwas anderes um (in `src/index.css` gleich mit)
und lass beide Fassungen des Tests laufen. Mach die Änderung anschließend
rückgängig.

Überlege: Welche der drei Achsen — Reihenfolge der Cocktails, CSS-Klassen,
Anzahl der Buttons pro Karte — bricht welchen Selektor? Und welche davon ändert
ein Entwickler im Alltag, ohne auch nur an die Tests zu denken?

### 3.3. Assertion ohne `await`

Zwei Assertions in diesem Test haben kein `await`. Finde beide.

Die erste läuft, **bevor** überhaupt auf „Jetzt bestellen" geklickt wurde — zu
diesem Zeitpunkt existiert die Fehlermeldung noch gar nicht. Der Test meldet
nichts. Die zweite erwartet den Text „Bitte gib deinen Namen ein.", während die
App „Bitte gib einen Namen an." zeigt.

Lass den Test zuerst laufen, **bevor** du ihn reparierst, und lies die Ausgabe
genau.

Überlege — drei Fragen:

Der Test schlägt fehl. An welcher Stelle im Ablauf hat er angehalten? (Antwort:
an keiner. Warum wird der Fehler trotzdem gemeldet?)

Die erste Assertion bleibt still, obwohl sie zum Zeitpunkt ihres Aufrufs
unmöglich zutreffen konnte. Was hat sie stattdessen geprüft?

Playwrights Test-Runner fängt unbehandelte Promise-Rejections ab und rettet dich
hier. Benutzt du die Playwright-**Library** unter einem fremden Runner (etwa
Jest), fehlt dieses Netz — der Test wäre schlicht grün. Wie stellst du sicher,
dass dir das nie passiert? (Stichwort: `eslint-plugin-playwright`, Regel
`missing-playwright-await`.)

### 3.4. Dieselbe Ursache, gefährlichere Wirkung

Der Test sucht nach „mojito", liest alle Karten-Überschriften mit
`allTextContents()` aus und prüft, dass „Mojito" dabei ist. Er ist grün. Kein
Sleep weit und breit.

Trotzdem ist er wertlos. Bevor du ihn reparierst: Öffne `src/App.tsx`, setze
`suchDelayMs` probeweise auf `10000` und lass den Test erneut laufen. Immer noch
grün? Dann kommentiere in `filtereCocktails` (`src/domain/suche.ts`) die Filter-
Logik aus, sodass die Suche gar nichts mehr tut. Was macht der Test?

Repariere ihn anschließend so, dass er beide Sabotagen bemerkt. Mach deine
Änderungen an `src/` danach rückgängig.

Überlege: In Aufgabe 1 wurde die Query rot, sobald der Sleep fiel — ein
ehrlicher Fehlschlag. Hier bleibt sie stumm. Woran liegt der Unterschied?

Und was ist an `toContain` auf einer Liste schwach? Welche drei Eigenschaften
prüft `toHaveText(["Mojito"])` stattdessen auf einmal?

Der Anschluss an Übung 2: Dort hast du bewusst `textContent()` verwendet, um den
Preis auszulesen — mit einer Assertion davor, die auf das Element wartet. War
das ein Widerspruch? Wann ist eine Query legitim?

### 3.5. Keine Struktur, kein AAA

`test("Problem 5: Bestellvorgang")` ist zwanzig Zeilen am Stück, mit Variablen
namens `el1`, `btn`, `d` und `x`. Er ist grün und prüft drei unabhängige Dinge:
dass die Suche den Mojito findet, dass „Menge erhöhen" die Positionssumme
verdoppelt, und dass eine abgeschickte Bestellung den Zähler hochzählt und einen
Toast zeigt.

Zerlege ihn. Gib jedem Test einen Namen, der das geprüfte **Verhalten**
beschreibt, und gliedere den Rumpf sichtbar in **Arrange / Act / Assert**. Den
gemeinsamen `goto` schiebst du in ein `beforeEach`.

Überlege: Der ursprüngliche Test wird rot. Wie lange brauchst du, um zu sagen
_was_ kaputt ist? Und was passiert mit den Assertions am Ende, wenn schon die
Suche in der Mitte fehlschlägt — welche Information über den Zustand der App
verlierst du dadurch?

> Ein Testname wie `ROLA-4711` verlagert genau diese Information in ein anderes
> System. Wenn der Test in zwei Jahren rot wird, ist das Ticket geschlossen.

### 3.6. Geteilter Zustand zwischen Tests

Zwei Tests legen je einen Cocktail in den Warenkorb. Der erste erwartet
„1 Artikel", der zweite „2 Artikel". Beide sind grün.

Bevor du irgendetwas reparierst: **Vertausche die Reihenfolge der beiden Tests**
in der Datei und lass sie erneut laufen. Was passiert, und warum?

Schau dir dann an, wie sich die Tests eine `page` teilen: sie wird in `beforeAll`
von Hand über `browser.newPage()` erzeugt, und `test.describe.configure({ mode:
"serial" })` erzwingt dazu eine feste Reihenfolge. Wirf beides weg.

Der zweite Test klickt einmal und erwartet zwei Artikel — was er beschreibt,
tut er also gar nicht selbst. Sorge dafür, dass jeder Test alles anlegt, was er
zum Prüfen braucht, und lass beide unabhängig voneinander laufen.

Überlege: Was gibt dir die `page`-Fixture, die du mit `async ({ page })`
bekommst, das die selbst erzeugte Seite nicht hat? Und was hat `serial`
eigentlich kaschiert — hätte der Fehler ohne diese Zeile früher oder später
wehgetan?

### 3.7. Timeouts als Pflaster

An jeder Aktion dieses Tests klebt ein `{ timeout: 30_000 }`, dazu ein
`test.setTimeout(120_000)` obenauf. Er ist grün und läuft in unter zwei
Sekunden. Räum die Timeouts ersatzlos weg.

Der Toast erscheint nach ~800 ms simuliertem „Mixing…". Der Standard-Timeout
liegt bei 5 Sekunden.

Überlege: Der Test ist grün — was genau hat diese Zeilen also je gerechtfertigt?
(Vermutlich: er war irgendwann mal rot, und jemand hat gedreht, bis er grün
wurde.) Was kostet ein 30-Sekunden-Timeout an dem Tag, an dem der Test aus einem
echten Grund fehlschlägt?

Und wenn du eine Anwendung hast, die tatsächlich langsam ist: Wo trägst du das
ein, damit es an einer Stelle steht statt an dreißig? Sieh dir `use.actionTimeout`,
`expect.timeout` und `timeout` in `playwright.config.ts` an.

### 3.8. Alles auf einmal

Zwei Tests, `test 1` und `test 2`. Sie konfigurieren einen Mojito mit doppelter
Stärke, legen ihn in den Warenkorb, erhöhen die Menge, lösen einen Gutschein ein
und schicken die Bestellung ab. Beide sind grün.

Und jede einzelne Sünde aus den Aufgaben 1 bis 7 steckt irgendwo darin.

Arbeite in drei Schritten:

**Schritt 1 — inventarisieren.** Geh die Aufgaben 1 bis 7 durch und suche zu
jeder die Stelle im Code. Es gibt für jede mindestens eine. Schreib sie auf,
bevor du eine Zeile anfasst.

**Schritt 2 — beschreiben.** Die Testnamen sagen nichts. Formuliere in eigenen
Worten, welche Verhaltensweisen die beiden Tests _zusammen_ prüfen — es sind
mehr als zwei. Daraus werden gleich deine Testnamen.

**Schritt 3 — reparieren.** Ein Test pro Verhalten, jeder für sich lauffähig,
jeder mit sichtbarem Arrange / Act / Assert.

Drei Hinweise, damit du nicht in dieselben Fallen läufst:

Die Preise sind der interessante Teil. Stärke 2 verdoppelt den Einzelpreis auf
17,00 €, Menge 2 die Positionssumme auf 34,00 €. Prüfe beides — aber getrennt.

Auf den **Gesamtpreis** solltest du nirgends assertieren. Sieh dir
`berechneGesamtpreis` in `src/domain/preis.ts` an und überlege, warum ein Test
darauf zwischen 17:00 und 19:00 Uhr anders ausgeht als morgens. Damit
beschäftigen wir uns in Teil 4.

`//ul[@class='cocktail-liste']/li[1]//button[2]` klickt „den zweiten Button in
der ersten Karte". Schau in `src/components/CocktailKarte.tsx` nach, welcher das
ist — und was passiert, wenn jemand einen Favoriten-Stern davorsetzt.

Überlege zum Schluss: Nach der Aufteilung wiederholt sich die Arrange-Strecke
(konfigurieren, hinzufügen, Drawer öffnen) in mehreren Tests. Ist das
Duplikation, die weg muss, oder Kontext, der bleiben darf?

### 3.Abschluss

Lass am Ende die ganze Datei laufen. Alle Tests grün, in wenigen Sekunden.

Blick nach vorn: Die Tests aus den Aufgaben 5 und 8 wiederholen jetzt dieselben
Zeilen, um einen Cocktail in den Warenkorb zu legen und den Drawer zu öffnen.
Wo würdest du das hinschieben? Halte die Antwort kurz fest — im nächsten Schritt
bauen wir daraus ein Page-Object.
