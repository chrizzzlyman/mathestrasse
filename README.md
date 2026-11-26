# Mathestraße

Mathehäuser auf einer Straße. Jedes geschaffte Zimmer baut ein Stück am Haus.
Erdgeschoss = leicht, 1. Stock = mittel, Dachgeschoss = schwer. Die Etagen öffnen sich nacheinander.

Reine Webseite ohne Bau-Schritt. Zum Ausprobieren `index.html` doppelt anklicken und
„Ohne Anmeldung ausprobieren“ wählen.

## Auf GitHub veröffentlichen

1. Auf GitHub ein Repository anlegen, z. B. `mathehaeuser`.
   Im kostenlosen Tarif muss es für GitHub Pages **öffentlich** sein.
2. Den **Inhalt** dieses Ordners hochladen (`index.html` liegt ganz oben).
3. *Settings → Pages → Deploy from a branch → `main`, `/ (root)`*.
4. Nach kurzer Zeit ist die Seite unter `https://DEIN-NAME.github.io/mathehaeuser/` erreichbar.

Der Schlüssel in `js/config.js` darf öffentlich sein. Den *secret*- oder *service_role*-Schlüssel niemals eintragen.

## Lehrkraft einrichten (einmalig)

1. Supabase-Dashboard → Projekt `mathehaeuser` → *Authentication → Users → Add user*
   (E-Mail, Passwort, „Auto Confirm User“ ankreuzen).
2. *Authentication → Sign In / Providers*: **„Allow new users to sign up“ ausschalten**.
3. `lehrkraft.html` öffnen und anmelden. Die Seite zeigt eine SQL-Zeile.
4. Diese Zeile im Supabase-Dashboard unter *SQL Editor* ausführen, dann „Erledigt, neu prüfen“.
5. Reiter *Kinder und QR-Karten*: Kinder anlegen, Karten **von der veröffentlichten Seite aus** drucken.

Für eine ganz neue Datenbank werden vorher `supabase/schema.sql` und danach `supabase/zeitlimit.sql`
einmal im *SQL Editor* ausgeführt. Im Projekt `mathehaeuser` ist beides schon geschehen.

## Tägliches Zeitlimit

Einstellen: `lehrkraft.html` → Reiter *Zeitlimit*. Es gilt für jedes Kind pro Tag, auf allen Geräten.

- Zwei Minuten vor Schluss kommt ein Hinweis, danach meldet sich die App ab. Weiter geht es am nächsten Tag.
- Wahlweise darf ein angefangenes Zimmer noch beendet werden (höchstens 3 Minuten länger).
- Gezählt wird nur, solange die App zu sehen ist und in den letzten 3 Minuten berührt wurde.
- Ohne Netz zählt das Gerät selbst weiter und meldet die Zeit später.
- Mit Limit gibt es kein „Ohne Anmeldung ausprobieren“.
- `index.html?ansehen` („Alle Zimmer ansehen“) ist nicht begrenzt.
- Das Limit hilft beim Maßhalten, ist aber keine unüberwindbare Sperre
  (z. B. kann man am Gerät selbst Datum oder gespeicherte Daten verstellen).

## Nach dem ersten Veröffentlichen prüfen

- Ein Test-Kind anlegen, QR-Karte mit dem Tablet scannen.
- Ein Zimmer lösen: Unten steht „Gespeichert“.
- In der Lehrkraft-Ansicht erscheinen die Sterne.
- Zeitlimit auf 3 Minuten stellen, mit dem Test-Kind üben, bis die App sich abmeldet. Danach wieder zurückstellen.
- Test-Kind wieder löschen.

## Ein neues Mathehaus bauen

Das Aussehen ist in [DESIGN.md](DESIGN.md) festgelegt und gilt auch für neue Häuser.

1. `haeuser/haus10.js` oder `haus9.js` kopieren, z. B. als `haeuser/haus11.js`.
2. `nummer`, `titel`, `untertitel`, `farbe` (siehe DESIGN.md), `koennen`, `abzeichen` und die Zimmer anpassen.
3. In `haeuser/liste.js` eine Zeile ergänzen: `'haus11.js',` (die Reihenfolge dort ist die Reihenfolge auf der Straße).

Das Haus erscheint dann auf der Straße und in der Lehrkraft-Ansicht. Die Datenbank bleibt unverändert.
Jedes Zimmer kann mit `bild` ein kleines Bild bekommen: der Name einer Datei aus `assets/bilder`
(ohne `.svg`) oder `'H'`, `'Z'`, `'E'` für Platte, Stange und Würfel. Ohne Angabe erscheint ein Stern.
Zimmer-Kennungen (`id`) nur aus Kleinbuchstaben, Ziffern und `-`, und später nicht mehr umbenennen,
sonst geht der Fortschritt dieses Zimmers verloren.

Vorhandene Aufgabenformate (`art`):

| art | Angaben |
|---|---|
| `vergleich` | `a`, `b`, `bild`: `waage`, `holz`, `hze` oder `zahl` |
| `waageLegen` | `ziel`, `zeigeMaterial` |
| `gleichViel` | `zahl`, `optionen: [{ text, wert }]` |
| `ballons` | `zahlen` |
| `merksatz` | `vor`, `loesung` (Hunderter, Zehner, Einer), `nach` |
| `entschieden` | `a`, `b` |
| `ordnen` | `zahlen` (5 Stück), `richtung`: `auf` oder `ab` |
| `ziffern`, `luecke`, `raetsel`, `fehler` | werden von `js/logik.js` erzeugt |
| `anzahlen`, `legen`, `aufraeumen`, `stempeln`, `diktat`, `wortSchreiben` | `zahl` |
| `schreibzahl` | `zahl`, `wirr` (durcheinander gemalt: ja oder nein) |
| `blitz` | `zahl`, `sekunden` |
| `verbinde` | `zahlen` |
| `baukasten` | `zahl`, `bank: { H, E, Z }` (Wortkarten) |
| `frage` | `frage`, `antworten`, `richtig`, `erklaerung`, `tipp` |
| `reihenfolge`, `ziffernfolge` | `wie`: `schreibe` oder `spreche` (bei `ziffernfolge` dazu `zahl`) |
| `dreher`, `buendeln`, `schieben`, `stellenraetsel` | werden von `js/logik.js` erzeugt |

Die Formate ab `anzahlen` stehen in `js/uebungen-stellen.js`.

## Abzeichen

16 Abzeichen: 8 für die ganze Straße und je Haus 4 (Richtfest, zwei besondere, Goldhaus).
Sie werden in `js/abzeichen.js` allein aus den besten Sternen je Zimmer berechnet. Dafür wird nichts
zusätzlich gespeichert. Die Lehrkraft-Ansicht zeigt die Anzahl je Kind.
Mit jedem neuen Haus kommen 2 Abzeichen plus die aus seiner `abzeichen`-Liste dazu.

Die Formate sind auf Zahlen bis 999 ausgelegt. Für andere Themen (z. B. Plus und Minus)
kommen neue Formate dazu.

Rechenprüfung: `node tests/aufgaben.test.js`

## Datenschutz und Betrieb

- Gespeichert werden Tier + Zahl, ein geheimer QR-Schlüssel, die Ergebnisse und für das Zeitlimit die
  heute genutzten Sekunden (ältere Tage werden beim nächsten Üben gelöscht). Keine Namen.
  Notizen in der Lehrkraft-Ansicht bleiben im Browser.
- Weil du Tier und Zahl Kindern zuordnen kannst, sind es dennoch personenbezogene (pseudonyme) Daten.
  Bitte mit der Schule klären (u. a. Vertrag zur Auftragsverarbeitung mit Supabase).
- „Tier + Zahl“ ist bequem, aber kein starkes Passwort. Der QR-Code ist der sicherere Weg.
  Nach 40 Fehlversuchen in 10 Minuten ist diese Anmeldung kurz gesperrt (für alle), der QR-Code geht weiter.
- Eine QR-Karte ist wie ein Schlüssel. Bei Verlust: „Neuer QR-Code“.
- Kostenlose Supabase-Projekte werden bei wenig Nutzung über 7 Tage pausiert (Ferien!).
  Im Dashboard „Resume project“ wählen; das geht bis 90 Tage nach der Pause.
- Schriften, Tierbilder, Symbole und Programmbibliotheken liegen im Ordner selbst (Lizenzen in `vendor/lizenzen`).
  Die Tiere sind eigene Bilddateien (`assets/tiere`), damit sie auf jedem Gerät gleich aussehen.
