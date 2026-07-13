## Teil 1 — codegen

### 1.1. Grundlegende Navigation & Assertion

Starte auf der Startseite. Klicke bei der Karte **Caipirinha** auf
**„Konfigurieren"**, um den Detail-Dialog zu öffnen. Prüfe, dass die
Dialog-Überschrift **„Caipirinha"** sichtbar ist und der angezeigte Preis
**9,00 €** lautet.


### 1.2. Formular mit gemischten Eingabetypen

Öffne bei **Mojito** den Konfigurator („Konfigurieren"). Entferne den Haken bei
der Zutat **„Minze"** (Checkbox), wähle bei **Basis-Spirituose** die Option
**„Brauner Rum"** (Radio), setze **Stärke** auf `2` (Zahlenfeld) und schreibe
**„wenig Eis"** in **„Notiz an die Bar"** (Textarea). Klicke **„In den
Warenkorb"**. Prüfe, dass der Kopfzeilen-Zähler nun **1 Artikel** zeigt und der
Mojito-Einzelpreis durch Stärke 2 auf **17,00 €** gestiegen ist.


### 1.3. Mehrfach vorhandene Interaktionselemente

Auf der Startseite trägt **jede** der fünf Cocktail-Karten einen Button
**„In den Warenkorb"**. Zeichne mit `codegen` das Hinzufügen von **Caipirinha**
auf und lege danach eine zweite Position **Ipanema** an. Prüfe im Warenkorb,
dass **genau diese beiden** Cocktails enthalten sind.


### 1.4. Menge im Warenkorb ändern

Klicke auf der Startseite bei **Mojito** auf **„In den Warenkorb"** (der erste
Cocktail auf der Karte). Öffne den Warenkorb und erhöhe die Menge mit dem
**+**-Button (aria-label „Menge erhöhen für Mojito") zweimal. Prüfe, dass die
Position nun **Menge: 3** anzeigt.

### 1.5. Liste mit clientseitigem Filtern

Tippe ins Suchfeld **„Cocktail suchen"** den Text **„caip"** — prüfe, dass genau
**Caipirinha** übrig bleibt. Leere das Feld. Wähle im Dropdown **„Nach Zutat
filtern"** die Zutat **„Rum"** — prüfe, dass **genau zwei** Karten übrig bleiben
(Mojito, Cuba Libre). Setze zusätzlich den Haken **„nur alkoholfrei"** — prüfe,
dass **keine** Karte mehr passt. Entferne alle Filter und prüfe, dass wieder
**alle fünf** Cocktails sichtbar sind.

Überlege: Wo sind die Grenzen des Codegenerators, welche Assertions kann der Codegenerator erzeugen und welche nicht?

