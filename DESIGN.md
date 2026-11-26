# Gestaltung der Mathestraße

Dieses Design ist von der Lehrkraft so gewünscht (Stand: 25.11.2026). Es gilt für alle neuen
Mathehäuser, Aufgabenformate und Änderungen. Davon abweichen nur, wenn sie es ausdrücklich will.

## Grundidee

Eine freundliche Spielzeugstadt: Himmel, Sonne, Wolken, Hügel mit Bäumen, Gehweg und Straße.
Häuser und Material wirken räumlich (Vorderseite, Deckfläche, dunklere Seite), ohne schwarze Umrandungen.

## Farben

| Zweck | Wert |
| --- | --- |
| Schrift | `#17233f` |
| Nebentext | `#56627f` |
| Straßenschild | `#1c4fb5` |
| Hauptknopf (Gelb), Kante | `#ffc531`, `#d49500` |
| Wiese | `#86d45f` |
| Richtig (Schrift, Fläche) | `#1d7d34`, `#dff6de` |
| Noch einmal (Fläche, nie Rot) | `#fff2c4` |
| Material Hunderter, Zehner, Einer (in jedem Haus gleich) | `#43b649`, `#ef4a3f`, `#2f8ae6` |
| Haus 10: Dach, Wand, helle Fläche | `#e8321f`, `#ffb4ae`, `#fff0ee` |
| Haus 9: Dach, Wand, helle Fläche, Akzent | `#e8321f`, `#ade0fb`, `#e8f7ff`, `#4fb8ec` |
| Haus 11: Dach, Wand, helle Fläche, Akzent | `#e8321f`, `#ffd094`, `#fff3e2`, `#ff8c2b` |
| Geheimschrift Quadrat, Strich, Punkt | `#249a2e`, `#b01d12`, `#1672dc` |

Alle weiteren Werte stehen oben in `css/stil.css`.

## Schrift

- **Baloo 2** (700, 800): Überschriften, Knöpfe, Schilder.
- **Andika**: Aufgaben, Zahlen und Fließtext (klare Schulziffern).

## Bausteine

- `.strassenschild`: der Name „Mathestraße“ als blaues Schild.
- `.knopf`: dicke Spielsteine mit Kante unten, `.knopf.haupt` ist gelb. Mindestens 44 px hoch.
- Karten: weiß, stark gerundet, weicher Schatten. Übungs- und Ergebniskarten tragen oben die Dachfarbe.
- `MH.tierBild(tier)`: das Tier als runde Plakette. Es stellt die Aufgabe und gibt Rückmeldung.
- `MH.zeichne.haus(...)`: alle Häuser wachsen in 16 Stufen und stehen auf der Straße.
- `MH.raumBild(raum)`: jedes Zimmer hat ein eigenes kleines Bild.
- Straße: Passen nicht alle Häuser nebeneinander, erscheinen runde Pfeilknöpfe links und rechts
  (wischen geht auch).
- Bewegung sparsam und als Antwort auf eine Handlung. „Bewegung reduzieren“ wird beachtet.

## Keine Emojis und Symbol-Schriftzeichen

Manche Geräte zeigen sie nur als Rechteck. Stattdessen Bilddateien aus `assets/` oder `MH.symbol(name)`
verwenden. Schriften und Bilder liegen im Projekt, nichts wird von fremden Servern geladen.

## Abzeichen

Rosette mit Bild (`MH.zeichne.plakette`): Gold für die ganze Straße, sonst die Ringfarbe des Hauses.
Noch nicht verdiente Abzeichen sind grau und zeigen, wie viel fehlt. Beim Üben geht keines verloren.
Bekommt ein bestehendes Haus neue Zimmer, sind dort „Richtfest“ und „Goldhaus“ wieder offen.

## Beim nächsten Mathehaus

- Eigene Farben über `farbe: { dach, wand, hell, akzent, rand, schatten, ring }`
  (`akzent`: Streifen an Karten, `rand`: Nummernschild, `schatten`: Seitenwand, `ring`: `rot`, `blau`, `orange`, `gold`).
- Auf dem Schild an der Straße steht der Ich-Satz vom Deckblatt (`untertitel`, passt in zwei Zeilen,
  etwa 45 Zeichen). Der kurze `titel` erscheint in der Lehrkraft-Ansicht.
- Material, das man bewegen kann, ziehen die Kinder selbst (`MH.ziehbar`); Antippen allein reicht dann nicht.
  Verwandlungen (z. B. Bündeln) sind Schritt für Schritt zu sehen.
- Jedem Zimmer ein `bild` geben (siehe README).
- Zwei besondere Abzeichen über `abzeichen` in der Haus-Datei festlegen.
- Neue Bildschirme in Handy-, Tablet- (quer: ohne Scrollen bis „Prüfen“) und sehr breiter Größe ansehen:
  nichts darf seitlich überstehen, und die Hügel dürfen oben nicht abgeschnitten sein.
