/* Mathehaus 9 (hellblau): Ich ordne in Hunderter, Zehner und Einer.
 * Beim ersten Besuch eines Zimmers kommen die Aufgaben aus dem Booklet (erst === true),
 * bei jeder Wiederholung werden neue Zahlen gewürfelt. */
(function (global) {
  'use strict';
  const MH = global.MH;
  const L = MH.logik;

  const wiederhole = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const je = (art, zahlen, mehr = {}) => zahlen.map((zahl) => Object.assign({ art, zahl }, mehr));
  const WENIG = { h: 6, z: 6, e: 9 }; // gut zählbar

  const warumSchwer = {
    art: 'frage',
    frage: 'Welche Bilder konntest du nicht so gut erkennen? Warum?',
    antworten: [
      'Die ordentlichen, weil alles in Reihen steht.',
      'Die durcheinander gemalten, weil Gleiches nicht zusammensteht.',
      'Die mit Punkten, weil man Blau schlecht sieht.',
    ],
    richtig: 'Die durcheinander gemalten, weil Gleiches nicht zusammensteht.',
    erklaerung: 'Genau. Wenn Quadrate, Striche und Punkte geordnet sind, sieht man die Zahl sofort.',
    tipp: 'Schau noch einmal zurück: Bei welchen Bildern musstest du lange suchen?',
  };

  MH.haus({
    nummer: 9,
    titel: 'Hunderter, Zehner, Einer',
    untertitel: 'Ich ordne in Hunderter, Zehner und Einer.',
    // Wie auf dem Deckblatt: rotes Dach, hellblaue Wände und hellblaues Nummernschild
    farbe: { dach: '#e8321f', wand: '#ade0fb', hell: '#e8f7ff', akzent: '#4fb8ec', rand: '#4fb0e0', schatten: '#0b3358', ring: 'blau' },

    // Die Liste vom Deckblatt des Booklets
    koennen: [
      { text: 'Ich erkenne Hunderter, Zehner und Einer in einer Menge.', raeume: ['wie-viele'] },
      { text: 'Ich erkenne, wie viele Hunderter, Zehner und Einer in einer Zahl stecken.', raeume: ['lege'] },
      { text: 'Ich schreibe die passende Zahl.', raeume: ['geheimschrift'] },
      { text: 'Ich schreibe die passenden Zahlwörter.', raeume: ['verbinden', 'malen', 'baukasten'] },
    ],

    // Besondere Abzeichen dieses Hauses: alle genannten Zimmer mit 3 Sternen
    abzeichen: [
      { id: 'geheimschrift', titel: 'Geheimschrift-Profi', text: '3 Sterne in „Wie viele?“, „Geheimschrift“ und „Blitzblick“.', bild: 'old-key', raeume: ['wie-viele', 'geheimschrift', 'blitzblick'] },
      { id: 'zahlwort', titel: 'Wörter-Profi', text: '3 Sterne in „Verbinden“, „Baukasten“ und „Wörter schreiben“.', bild: 'pencil', raeume: ['verbinden', 'baukasten', 'wortschreiben'] },
    ],

    etagen: [
      {
        name: 'Erdgeschoss', stufe: 'leicht',
        raeume: [
          {
            id: 'wie-viele', bild: 'eyes', titel: 'Wie viele?', auftrag: 'Wie viele sind es?',
            aufgaben: (erst) => je('anzahlen', erst ? [342, 536, 164, 641, 259] : L.zahlen(5, WENIG)),
          },
          {
            id: 'lege', bild: 'brick', titel: 'Lege und schreibe', auftrag: 'Lege die Zahl in der Stellentafel!',
            aufgaben: (erst) => je('legen', erst
              ? [241, 173, 358, 519, 406, 290]
              : L.misch([L.zahl(L.ganz(1, 6), 0, L.ganz(1, 6)), L.zahl(L.ganz(1, 6), L.ganz(1, 6), 0), ...L.zahlen(2, WENIG)])),
          },
          {
            id: 'geheimschrift', bild: 'old-key', titel: 'Geheimschrift', auftrag: 'Schreibe die Zahl!',
            aufgaben: (erst) => {
              const liste = erst
                ? [[234, false], [344, true], [462, false], [425, true], [158, false], [209, false]]
                : L.zahlen(5, WENIG).map((n, i) => [n, i % 2 === 1]);
              return liste.map(([zahl, wirr]) => ({ art: 'schreibzahl', zahl, wirr })).concat(warumSchwer);
            },
          },
          {
            id: 'aufraeumen', bild: 'broom', titel: 'Aufräumen', auftrag: 'Räume auf! Ziehe jedes Zeichen in das richtige Feld.',
            aufgaben: () => je('aufraeumen', L.zahlen(4, { h: 5, z: 5, e: 7 })),
          },
          {
            id: 'blitzblick', bild: 'high-voltage', titel: 'Blitzblick', auftrag: 'Schau schnell und merke dir die Zahl!',
            aufgaben: () => L.zahlen(5, { h: 5, z: 5, e: 6 }).map((zahl, i) => ({ art: 'blitz', zahl, sekunden: i < 3 ? 4 : 3 })),
          },
        ],
      },
      {
        name: '1. Stock', stufe: 'mittel',
        raeume: [
          {
            id: 'verbinden', bild: 'link', titel: 'Verbinden', auftrag: 'Verbinde Zahlwort, Geheimschrift und Zahl!',
            aufgaben: (erst) => [erst ? [283, 125, 852, 921, 885] : L.zahlen(4), L.zahlen(3), L.zahlen(3)]
              .map((zahlen) => ({ art: 'verbinde', zahlen })),
          },
          {
            id: 'malen', bild: 'artist-palette', titel: 'Male und schreibe', auftrag: 'Male und schreibe die Zahl!',
            aufgaben: (erst) => je('stempeln', (erst ? [236, 529] : []).concat(
              wiederhole(erst ? 2 : 4, () => L.zahl(L.ganz(1, 5), L.ganz(2, 5), L.ganz(1, 6))))),
          },
          {
            id: 'baukasten', bild: 'input-latin-letters', titel: 'Baukasten', auftrag: 'Schreibe das Zahlwort! Lege die Wörter.',
            aufgaben: (erst) => {
              if (!erst) return wiederhole(4, () => { const zahl = L.sprechZahl(); return { art: 'baukasten', zahl, bank: L.wortbank(zahl) }; });
              // die Wortkarten genau wie im Heft
              const bank = {
                H: [1, 2, 3, 4, 5, 6].map(L.hunderterWort),
                E: [3, 4, 5].map(L.einerWort),
                Z: [2, 3, 4, 5, 6, 7].map(L.zehnerWort),
              };
              return [243, 674, 444, 525].map((zahl) => ({ art: 'baukasten', zahl, bank }));
            },
          },
          {
            id: 'frieda', bild: 'girl', titel: 'Friedas Frage', auftrag: 'Hilf Frieda!',
            aufgaben: (erst) => [
              { art: 'reihenfolge', wie: 'schreibe' },
              { art: 'ziffernfolge', wie: 'schreibe', zahl: erst ? 123 : L.sprechZahl() },
              { art: 'reihenfolge', wie: 'spreche' },
              { art: 'ziffernfolge', wie: 'spreche', zahl: erst ? 123 : L.sprechZahl() },
              { art: 'ziffernfolge', wie: 'spreche', zahl: L.sprechZahl() },
            ],
          },
          {
            id: 'dreher', bild: 'counterclockwise-arrows-button', titel: 'Zahlendreher', auftrag: 'Welche Zahl ist das? Achtung, Zahlendreher!',
            aufgaben: () => wiederhole(6, () => L.dreherAufgabe()),
          },
        ],
      },
      {
        name: 'Dachgeschoss', stufe: 'schwer',
        raeume: [
          {
            id: 'diktat', bild: 'ear', titel: 'Ohren auf', auftrag: 'Hör genau zu und schreibe die Zahl!',
            aufgaben: () => je('diktat', [L.sprechZahl(), L.sprechZahl(), L.zahl(L.ganz(1, 9), 0, L.ganz(1, 9)),
              L.zahl(L.ganz(1, 9), 1, L.ganz(1, 9)), L.sprechZahl(), L.zahl(L.ganz(1, 9), L.ganz(2, 9), 0)]),
          },
          {
            id: 'buendeln', bild: 'package', titel: 'Bündeln', auftrag: 'Zu viele! Bündle und schreibe die Zahl.',
            aufgaben: () => ['E', 'Z', 'E', 'Z', 'beide'].map((wo) => L.buendelAufgabe(wo)),
          },
          {
            id: 'schieben', bild: 'round-pushpin', titel: 'Plättchen schieben', auftrag: 'Verschiebe ein Plättchen!',
            aufgaben: () => ['groesste', 'kleinste', 'genau', 'genau', 'groesste'].map((z) => L.schiebeAufgabe(z)),
          },
          {
            id: 'stellenraetsel', bild: 'light-bulb', titel: 'Stellen-Rätsel', auftrag: 'Lies alle Hinweise. Welche Zahl bin ich?',
            aufgaben: () => wiederhole(5, () => L.stellenRaetsel()),
          },
          {
            id: 'wortschreiben', bild: 'pencil', titel: 'Wörter schreiben', auftrag: 'Schreibe das Zahlwort selbst!',
            aufgaben: () => je('wortSchreiben', [L.sprechZahl(), L.sprechZahl(),
              L.zahl(L.ganz(1, 9), 0, L.ganz(2, 9)), L.sprechZahl()]),
          },
        ],
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
