## Teil 2 — Locators & Assertions

### 2.1. App erkunden

Schreibe einen Test, der die frisch geladene App verifiziert: die
Hauptüberschrift **„Happy Hour 🍹"** ist sichtbar, der Bestell-Zähler startet
bei **0** (Text „Bestellungen heute: 0") und in der Karte werden **genau fünf
Cocktails** angezeigt.

Verwende `getByRole` für die Überschrift, `getByText` für den Zähler-Text und
wieder `getByRole` für die einzelnen Cocktail-Karten (Tipp: `<article>` hat
implizit die Rolle `article`).


### 2.2. Cocktail in den Warenkorb legen

**Vorbereitung:** Ergänze in `src/components/CocktailKarte.tsx` das
Preis-Element um einen Test-Hook `data-testid="cocktail-preis"`. Der Preis ist
reine Datenanzeige — es gibt weder `role` noch `aria-label`, die man ansprechen
könnte. Für nicht-semantische, aber wichtige DOM-Knoten ist `data-testid` der
richtige Fallback. Für Buttons, Überschriften, Dialoge & Co. bleibt `getByRole`
erste Wahl.

**Teil 1:** Vergewissere dich, dass die **Mojito-Karte** einen Preis von
**8,50 €** anzeigt — scope den Preis-Locator auf genau diese Karte, sonst matcht
du evtl. mehrere. Klicke innerhalb der Mojito-Karte auf **„In den Warenkorb"**.
Prüfe im Header, dass jetzt **„1 Artikel"** und **„8,50 €"** angezeigt werden;
scope dabei auf die Warenkorb-Übersicht (`<section aria-label="Warenkorb-Übersicht">`
→ Rolle `region`).

**Teil 2:** Teil 1 hat `8,50 €` zweimal fest eingebaut. Ändert sich die
Preisliste, bricht der Test — obwohl die App korrekt arbeitet. Lies den
Preis-Text der Mojito-Kachel stattdessen mit `textContent()` in eine Variable
aus und prüfe die Warenkorb-Übersicht gegen diesen Wert. Neu ist hier:
`textContent()` ist eine **Query**, keine Assertion. Sie liefert
`Promise<string | null>`, läuft genau einmal und retry-t **nicht** — stelle
darum vorher mit einer Assertion sicher, dass das Element da ist.

Überlege: Der ausgelesene Wert macht den Test robust gegen Preisänderungen,
prüft aber nur noch *Konsistenz*. Zeigte die App überall `0,00 €`, bliebe er
grün. Wo willst du Korrektheit prüfen, wo Konsistenz?


### 2.3. Suchen und Filtern

Verwende die Such- und Filterleiste, um die Karten-Liste einzuschränken, und
setze dabei bewusst unterschiedliche Locator-Strategien ein.

Tippe im Suchfeld (`getByLabel("Cocktail suchen")`) den Text **„caipi"** ein und
erwarte **genau eine** Karte, den **Caipirinha**. Leere das Suchfeld wieder und
prüfe, dass **wieder fünf Karten** zu sehen sind. Aktiviere die Checkbox **„nur
alkoholfrei"** (`getByRole("checkbox", …)`) und prüfe *vorher und nachher* mit
`toBeChecked`; danach bleiben **genau zwei** Karten übrig. Setze die Checkbox
zurück, öffne die Zutat-Auswahl (`getByRole("combobox", …)`), wähle **„Rum"**
und erwarte **zwei Karten** sowie den Select-Wert `Rum`.

Playwright wartet dank retry-fähiger Assertions automatisch auf den 1000 ms
Such-Delay der App — du brauchst kein `waitForTimeout`.

Überlege: `getByLabel("Cocktail suchen")` und `getByRole("searchbox", { name:
"Cocktail suchen" })` liefern hier dasselbe Element. Wann nimmst du was?


### 2.4. Warenkorb-Drawer & Non-Existence

Lege sowohl den **Mojito** als auch die **Cuba Libre** in den Warenkorb und
öffne den Warenkorb-Drawer über den Button im Header. Scope alle weiteren
Aktionen auf den Drawer (`role="dialog"`, `name="Warenkorb"`) und erwarte darin
**zwei Positionen** (`getByRole("listitem")`).

Erhöhe die Menge des Mojito zweimal und prüfe **„Menge: 3"** in dessen Zeile.
Entferne die **Cuba Libre** und prüfe, dass ihre Zeile **nicht mehr vorhanden**
ist (`toHaveCount(0)`) und **eine Zeile** übrig bleibt. Schließe den Drawer und
prüfe, dass er **nicht mehr sichtbar** ist (`toBeHidden`). Das `<aside>` bleibt
dabei im DOM — es bekommt lediglich `display: none` plus `aria-hidden` und
`inert`.

Überlege — zwei Fallen:

Warum `toHaveCount(0)` und nicht `not.toBeVisible()`? Letzteres matcht auch,
wenn das Element im DOM ist, aber verdeckt. `toHaveCount(0)` fordert das echte
Fehlen. Beide sind valide, drücken aber unterschiedliche Erwartungen aus.

Und was heißt „sichtbar" für Playwright? Nicht „der Nutzer sieht es", sondern:
nicht-leere Bounding-Box und kein `visibility: hidden`. Ein Element, das per
`transform: translateX(100%)` nur aus dem Viewport geschoben wurde, gilt damit
weiterhin als sichtbar. Deshalb setzt der Drawer im geschlossenen Zustand
`display: none` (`src/index.css`). Zusatzaufgabe: Prüfe den Drawer zusätzlich
über einen CSS-Locator (`page.locator(".drawer")`) auf `toHaveCount(1)` und
`toBeHidden()` — über `getByRole("dialog")` allein wäre der Test grün geworden,
weil `aria-hidden="true"` das Element aus dem Accessibility-Tree nimmt und ein
Locator ohne Treffer `toBeHidden()` automatisch erfüllt.


### 2.5. Konfigurator und komplette Bestellung

**Vorbereitung:** Ergänze in `src/App.tsx` am Bestell-Zähler ein
`data-testid="bestell-zaehler"`.

Öffne den **Konfigurator** für den Mojito („Konfigurieren" auf der Karte). Im
Dialog (`role="dialog"`, `name="Cocktail konfigurieren"`): wähle die Checkbox
**„Minze"** ab (`uncheck`, danach `not.toBeChecked`), wähle den Radio-Button
**„Brauner Rum"** (`check`, danach `toBeChecked`), setze das Zahlen-Feld
**„Stärke"** (`getByRole("spinbutton", …)`) auf `2` und bestätige mit **„In den
Warenkorb"** — der Konfigurator schließt.

Öffne den Drawer und klicke **„Bestellen"**. Playwright wartet automatisch, bis
der Button aktiv wird — das ist die eingebaute Flakiness-Falle, die im Abschnitt
„Flakiness" vertieft wird.

Klicke im Bestellungs-Dialog **direkt** auf **„Jetzt bestellen"**, ohne einen
Namen einzugeben, und erwarte eine Fehlermeldung mit `role="alert"` und dem Text
**„Bitte gib einen Namen an."**. Fülle danach das Namensfeld
(`getByRole("textbox", { name: "Auf welchen Namen?" })`) mit `Anna`, klicke
erneut **„Jetzt bestellen"** und erwarte, dass der Zähler im Header via
`getByTestId("bestell-zaehler")` auf **1** hochgezählt hat.
