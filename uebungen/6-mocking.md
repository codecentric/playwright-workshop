## Teil 6 — Netzwerk stubben & mocken (optional)

Die Cocktail-Bar läuft komplett im Browser — ohne Backend, ohne Datenbank. Mit
genau einer Ausnahme: dem Gutschein-Feld im Bestelldialog. Es schickt den einzigen
Netzwerk-Call der ganzen App:

```
POST /api/validate-coupon   { code: "HAPPY" }
  →  { valid: true, rabattProzent: 15 }
```

Ein Backend, das darauf antwortet, gibt es im Workshop nicht. Die App weiß das und
hat einen **lokalen Fallback** eingebaut (`lokaleCouponPruefung` in
`src/domain/coupon.ts`): Schlägt der Call fehl, prüft sie den Code selbst — dann
gilt nur „HAPPY" (15 %). Deshalb funktioniert die Demo trotzdem.

Für Tests ist dieser Call trotzdem der interessanteste Punkt der App. Mit
`page.route()` fängst du ihn ab und **diktierst die Antwort** — und plötzlich sind
Fälle testbar, an die du sonst gar nicht herankommst: ein abgelehnter Code, ein
500er, eine Antwort, die zwei Sekunden braucht, ein Netzwerk, das gar nicht erst
antwortet.

**Setup:**

```bash
npx playwright test e2e/6-mocking.spec.ts --ui
```

In der Spec-Datei sind der Weg zum Bestelldialog (`zumBestelldialog`) und das
Einlösen (`loeseGutscheinEin`) schon fertig — du kümmerst dich nur ums Netzwerk.
Die Übungen 6.2 bis 6.5 stehen als `test.fixme`-Rümpfe da; nimm das `fixme` weg,
sobald du sie schreibst.

### Das Werkzeug

```ts
await page.route("**/api/validate-coupon", (route) =>
  route.fulfill({ json: { valid: true, rabattProzent: 20 } }),
);
```

- `route.fulfill({ json })` — Antwort erfinden (`status`, `headers`, `body` gehen auch)
- `route.abort("failed")` — Request gar nicht erst durchlassen
- `route.fallback()` / `route.continue()` — durchreichen, ggf. mit geändertem Request
- `route.request()` — den **abgehenden** Request lesen (`postDataJSON()`, Header, URL)

Die Route muss registriert sein, **bevor** der Call losgeht — in der Praxis also am
Anfang des Tests oder in einem `beforeEach`.

### Stub oder Mock?

Playwright nennt das Kapitel in seiner Doku „Mock APIs", und im Alltag sagt jeder
„mocken". Genau genommen sind das zwei verschiedene Dinge — die Unterscheidung geht
auf Meszaros zurück und lohnt sich, weil sie erklärt, *was ein Test eigentlich
behauptet*:

- Ein **Stub** liefert eine vorbereitete Antwort und sonst nichts. Er steht auf der
  **Eingabe**-Seite: Er füttert die App mit einem Zustand, den du sonst nicht
  herstellen könntest. Geprüft wird danach das Verhalten der App — nicht der Stub.
- Ein **Mock** prüft zusätzlich, **wie** er aufgerufen wurde. Der Aufruf selbst wird
  zur Erwartung: „Die App muss `{ code: 'SOMMER26' }` als JSON geschickt haben."
  Damit ist er Teil der Assertion und steht auf der **Ausgabe**-Seite.

Die Übungen 6.1 bis 6.4 sind also **Stubs**: Antwort setzen, dann die UI prüfen.
Nur 6.5 ist ein echter **Mock** — dort ist der abgehende Request das, was geprüft
wird. Dasselbe `page.route()` trägt beide Rollen; der Unterschied liegt nicht im
Werkzeug, sondern in der Assertion.

Praktische Konsequenz: Stubs sind meist die bessere Wahl. Ein Mock koppelt den Test
an die Aufruf-Mechanik („welcher Request, welcher Body") und geht kaputt, sobald die
App dasselbe Ziel anders erreicht. Nimm ihn, wenn der Aufruf **selbst** das Ergebnis
ist — bei einer Zahlung, einer Mail, einem Tracking-Event, das niemand in der UI
sieht.

### 6.1. Gültiger Coupon (machen wir gemeinsam)

Stubbe eine gültige Antwort mit **20 %** Rabatt und löse den Code **„WORKSHOP26"**
ein — einen Code, den die App selbst gar nicht kennt. Prüfe die Meldung
„Rabatt: 20 %" und den neuen Gesamtpreis (8,50 € − 20 % = **6,80 €**).

Der unbekannte Code ist Absicht: Greift der Rabatt trotzdem, kann er nur aus dem
Stub stammen. Ein Test, der „HAPPY" stubbt, wäre auch dann grün, wenn `page.route`
gar nicht gegriffen hätte — er würde sich selbst belügen.

Nebenbei: Der Helper setzt `page.clock.setFixedTime` auf 14:00 Uhr. Ohne das läge
der Preis während der Happy Hour bei 6,80 € statt 8,50 € — und dein Coupon-Test
wäre nachmittags rot. Kapitel 5 lässt grüßen.

### 6.2. Ungültiger Coupon

Jetzt die Gegenprobe: Stubbe `{ valid: false, rabattProzent: 0 }` und löse
ausgerechnet **„HAPPY"** ein — den einen Code, den der lokale Fallback akzeptieren
würde.

Prüfe die Fehlermeldung („Gutschein-Code ungültig.", ausgezeichnet als
`role="alert"`) und dass der Gesamtpreis unverändert bei 8,50 € steht.

Wenn dieser Test grün ist, hast du bewiesen: Die gestubbte Antwort **schlägt** die
Client-Prüfung. Beide Richtungen sind damit abgesichert.

### 6.3. Server-Fehler (500)

Antworte mit `route.fulfill({ status: 500 })` und löse „HAPPY" ein.

Erwartungsgemäß müsste jetzt eine Fehlermeldung kommen — kommt sie aber nicht. Lies
`pruefeCoupon` in `src/domain/coupon.ts` und finde heraus, was stattdessen passiert.
Schreib den Test so, dass er das **tatsächliche** Verhalten festhält. Und schreib
einen zweiten für den Fall, dass der Code **nicht** „HAPPY" heißt.

Das ist der lehrreichste der fünf Tests: Der Fallback ist gewollt (Graceful
Degradation), aber er **verschluckt den Serverausfall**. Ein kaputtes Backend fällt
im UI schlicht nicht auf — der Gast bekommt seinen Rabatt, nur eben einen anderen.
Ohne den abgefangenen Request würdest du dieses Verhalten nie zu Gesicht bekommen,
geschweige denn absichern.

### 6.4. Langsame Antwort

Ein Route-Handler ist normaler async-Code. Also lässt sich Latenz direkt darin
simulieren:

```ts
await page.route(COUPON_ROUTE, async (route) => {
  await new Promise((fertig) => setTimeout(fertig, 2_000));
  await route.fulfill({ json: { valid: true, rabattProzent: 20 } });
});
```

Schreib den Test so, dass er **stabil** grün ist — ohne `waitForTimeout`. Probier
zum Vergleich einmal `expect(await …isVisible()).toBe(true)`: sofort rot. Die
Web-First-Assertion retryt, der Momentwert nicht — genau die Faustregel aus
Kapitel 5, nur in neuem Gewand.

### 6.5. Den Request selbst prüfen — der einzige echte Mock

Bis hierhin hast du nur die Antwort diktiert; das war Stubbing. Der Handler sieht
aber auch den **abgehenden** Request — und sobald der Aufruf selbst zur Erwartung
wird, ist es ein Mock. Damit lässt sich der Vertrag in die andere Richtung
absichern: Schickt die App überhaupt das, was das Backend erwartet?

```ts
let gesendet: unknown;
await page.route(COUPON_ROUTE, async (route) => {
  gesendet = route.request().postDataJSON();
  await route.fulfill({ json: { valid: true, rabattProzent: 20 } });
});
```

Löse „SOMMER26" ein und prüfe am Ende `expect(gesendet).toEqual({ code: "SOMMER26" })`.

Achtung, eine Falle: `gesendet` ist eine gewöhnliche Variable, keine
Web-First-Assertion — sie wartet auf nichts. Prüfst du sie zu früh, ist sie
`undefined`. Warte vorher auf ein sichtbares Ergebnis in der UI (die
Rabatt-Meldung), dann ist auch der Request durch.

### Bonus

- **Netzwerkausfall statt Fehlerstatus.** `route.abort("failed")` — der Request
  kommt gar nicht erst an. Wo landet die App? (Tipp: derselbe `catch` wie beim
  500er.)
- **Nur der erste Versuch scheitert.** `page.route(…, handler, { times: 1 })` lässt
  einen Handler genau einmal greifen. Damit baust du ein Retry-Szenario: erst
  abgelehnt, beim zweiten Klick gültig. Aufpassen bei der Reihenfolge — Playwright
  prüft Routen in **umgekehrter** Registrierungsreihenfolge, die zuletzt
  registrierte gewinnt.
- **Mock zentral registrieren.** Zieh die Route in ein `beforeEach` oder eine
  eigene Fixture, damit nicht jeder Test seinen eigenen Handler mitschleppt.

### Überlegungen

**Wie viel Mock ist zu viel?** Mit `page.route` kannst du auch die HTML-Seite, die
Bilder und jedes Asset fälschen — und testest am Ende deine Mocks statt deiner App.
Die Grenze ist unscharf, aber eine brauchbare Faustregel lautet: Mocke, was du
**nicht besitzt** (fremde Systeme, Zahlungsdienstleister, Wetter-API) oder **nicht
kontrollieren kannst** (Fehlerfälle, Latenz, Zeit). Alles andere lass echt laufen.

**Und wer testet, dass der Mock stimmt?** Niemand. Genau das ist der Preis: Dein
Test ist grün gegen ein Backend, das es so vielleicht gar nicht gibt — das Meme mit
der Küchenschublade aus Kapitel 3 ist exakt dieser Fall. Deshalb gehört zu einer
gemockten Suite mindestens ein schmaler Pfad, der wirklich end-to-end läuft, oder
ein Contract-Test, der die Mock-Form gegen das echte Schema prüft.
