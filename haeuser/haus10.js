/* Mathehaus 10 (rot): Ich vergleiche und ordne Zahlen bis 1000.
 * Beim ersten Besuch eines Zimmers kommen die Aufgaben aus dem Booklet (erst === true),
 * bei jeder Wiederholung werden neue Zahlen gewürfelt. */
(function (global) {
  'use strict';
  const MH = global.MH;
  const L = MH.logik;

  const vergleich = (bild) => ([a, b]) => ({ art: 'vergleich', bild, a, b });
  const wiederhole = (n, f) => Array.from({ length: n }, (_, i) => f(i));

  const merksatz = (vor, loesung, nach = '') => ({ art: 'merksatz', vor, loesung, nach });

  MH.haus({
    nummer: 10,
    titel: 'Vergleichen und ordnen',
    untertitel: 'Ich vergleiche und ordne Zahlen bis 1000.',
    farbe: { dach: '#e8321f', wand: '#ffb4ae', hell: '#fff0ee', akzent: '#e8321f', rand: '#a3271c', ring: 'rot' },

    // Die Liste vom Deckblatt des Booklets: Haken erscheint, wenn alle genannten Zimmer fertig sind.
    koennen: [
      { text: 'Ich vergleiche auf der Waage.', raeume: ['waage', 'waage-legen'] },
      { text: 'Ich vergleiche Mengen.', raeume: ['mengen'] },
      { text: 'Ich vergleiche Zahlen zuerst bei den Hundertern.', raeume: ['hunderter'] },
      { text: 'Ich vergleiche bei gleichen Hundertern die Zehner.', raeume: ['zehner'] },
      { text: 'Ich vergleiche bei gleichen Zehnern die Einer.', raeume: ['einer'] },
      { text: 'Ich vergleiche Zahlen bis 1000.', raeume: ['entschieden', 'zeichen'] },
      { text: 'Ich ordne Zahlen der Größe nach.', raeume: ['ballons', 'ordnen'] },
      { text: 'Ich erkenne, was gleich viel ist.', raeume: ['gleich-viel'] },
    ],

    // Besondere Abzeichen dieses Hauses: alle genannten Zimmer mit 3 Sternen
    abzeichen: [
      { id: 'waage', titel: 'Waagemeister', text: '3 Sterne in „Die Waage“, „Lege nach“ und „Wo ist mehr?“.', bild: 'balance-scale', raeume: ['waage', 'waage-legen', 'mengen'] },
      { id: 'krokodil', titel: 'Krokodil-Profi', text: '3 Sterne in „Was entscheidet?“, „Setz das Zeichen“ und „Der Größe nach“.', bild: 'crocodile', raeume: ['entschieden', 'zeichen', 'ordnen'] },
    ],

    etagen: [
      {
        name: 'Erdgeschoss', stufe: 'leicht',
        raeume: [
          {
            id: 'waage', bild: 'balance-scale', titel: 'Die Waage', auftrag: 'Vergleiche auf der Waage!',
            aufgaben: (erst) => {
              const paare = erst ? [[214, 214], [214, 321], [214, 112]] : [];
              const max = { h: 4, z: 5, e: 6 };
              const arten = erst ? ['Z', 'E', 'H'] : L.misch(['H', 'H', 'Z', 'Z', 'E', '=']);
              return paare.concat(arten.map((art) => L.paar(art, max))).map(vergleich('waage'));
            },
          },
          {
            id: 'waage-legen', bild: 'brick', titel: 'Lege nach', auftrag: 'Lege rechts so viel, dass die Waage gerade steht!',
            aufgaben: (erst) => {
              const zahl = () => L.zahl(L.ganz(1, 4), L.ganz(0, 5), L.ganz(1, 6));
              const ziele = erst ? [214, 321, 112, zahl()] : wiederhole(4, zahl);
              return ziele.map((ziel, i) => ({ art: 'waageLegen', ziel, zeigeMaterial: i < 2 }));
            },
          },
          {
            id: 'mengen', bild: 'abacus', titel: 'Wo ist mehr?', auftrag: 'Wo ist mehr? Vergleiche die Mengen!',
            aufgaben: (erst) => {
              const max = { h: 5, z: 6, e: 8 };
              const paare = erst
                ? [[213, 111], [222, 322], [134, 131], [245, 225], [236, 418], [420, 600]]
                : L.misch(['H', 'H', 'Z', 'Z', 'E', 'E']).map((art) => L.paar(art, max));
              return paare.map(vergleich('holz'));
            },
          },
          {
            id: 'gleich-viel', bild: 'heavy-equals-sign', titel: 'Gleich viel?', auftrag: 'Male alle Rechnungen an, die gleich viel sind wie die Zahl!',
            aufgaben: (erst) => {
              if (!erst) {
                return wiederhole(6, () => L.gleichVielEinfach(L.zahl(L.ganz(1, 9), L.ganz(1, 9), L.ganz(1, 9))));
              }
              const booklet = [
                [245, [[200, 40, 5], [200, 60, 2]]],
                [728, [[700, 30, 6], [700, 20, 8]]],
                [963, [[900, 60, 2], [900, 60, 3]]],
                [658, [[600, 50, 8], [500, 50, 8]]],
                [473, [[400, 70, 3], [400, 70, 9]]],
                [524, [[500, 40, 2], [500, 20, 4]]],
              ];
              return booklet.map(([zahl, summen]) => ({
                art: 'gleichViel', zahl,
                optionen: summen.map((t) => ({ text: L.summe(t), wert: t[0] + t[1] + t[2] })),
              }));
            },
          },
          {
            id: 'ballons', bild: 'balloon', titel: 'Ballons', auftrag: 'Lass die Ballons platzen: von der kleinsten zur größten Zahl!',
            aufgaben: () => wiederhole(4, (i) => ({ art: 'ballons', zahlen: L.ballonZahlen(i < 2 ? 4 : 5) })),
          },
        ],
      },
      {
        name: '1. Stock', stufe: 'mittel',
        raeume: [
          {
            id: 'hunderter', bild: 'H', titel: 'Erst die Hunderter', auftrag: 'Vergleiche zuerst die Hunderter!',
            aufgaben: (erst) => {
              const paare = erst
                ? [[367, 542], [283, 851], [953, 793], [772, 694], [689, 589]]
                : wiederhole(5, () => L.paar('H'));
              return paare.map(vergleich('hze')).concat(merksatz('Ich vergleiche zuerst die', 'Hunderter', 'Dann weiß ich sofort, welche Zahl größer ist.'));
            },
          },
          {
            id: 'zehner', bild: 'Z', titel: 'Dann die Zehner', auftrag: 'Gleiche Hunderter? Dann schau auf die Zehner!',
            aufgaben: (erst) => {
              const paare = erst
                ? [[367, 342], [283, 251], [953, 993], [772, 794], [679, 689]]
                : wiederhole(5, () => L.paar('Z'));
              return paare.map(vergleich('hze'))
                .concat(merksatz('Sind die Hunderter gleich, vergleiche ich die', 'Zehner'));
            },
          },
          {
            id: 'einer', bild: 'E', titel: 'Zuletzt die Einer', auftrag: 'Gleiche Hunderter und Zehner? Dann schau auf die Einer!',
            aufgaben: (erst) => {
              const paare = erst
                ? [[367, 362], [283, 281], [953, 954], [772, 774], [679, 679]]
                : L.misch(['E', 'E', 'E', 'E', '=']).map((art) => L.paar(art));
              return paare.map(vergleich('hze'))
                .concat(merksatz('Sind die Hunderter und die Zehner gleich, vergleiche ich die', 'Einer'));
            },
          },
          {
            id: 'entschieden', bild: 'magnifying-glass-tilted-left', titel: 'Was entscheidet?', auftrag: 'Vergleiche und kreuze an, was entschieden hat!',
            aufgaben: (erst) => {
              const paare = erst
                ? [[742, 755], [573, 528], [817, 814], [315, 312], [496, 596]]
                : L.misch(['H', 'Z', 'Z', 'E', 'E', 'H']).map((art) => L.paar(art));
              return paare.map(([a, b]) => ({ art: 'entschieden', a, b }));
            },
          },
          {
            id: 'zeichen', bild: 'crocodile', titel: 'Setz das Zeichen', auftrag: 'Vergleiche!',
            aufgaben: (erst) => {
              const paare = erst
                ? [[252, 258], [170, 174], [119, 786], [714, 442], [352, 318], [362, 177],
                  [253, 250], [239, 115], [831, 833], [104, 130], [872, 872], [849, 846]]
                : L.misch(['H', 'H', 'H', 'Z', 'Z', 'Z', 'Z', 'E', 'E', 'E', '=', '=']).map((art) => L.paar(art));
              return paare.map(vergleich('zahl'));
            },
          },
          {
            id: 'ordnen', bild: 'ladder', titel: 'Der Größe nach', auftrag: 'Ordne die Zahlen!',
            aufgaben: (erst) => {
              const reihen = erst
                ? [[241, 352, 748, 371, 916], [523, 181, 794, 162, 967], [745, 547, 574, 754, 475], [517, 715, 175, 571, 157]]
                : wiederhole(4, () => L.reihe(5));
              return reihen.map((zahlen, i) => ({ art: 'ordnen', zahlen, richtung: i % 2 === 0 ? 'ab' : 'auf' }));
            },
          },
        ],
      },
      {
        name: 'Dachgeschoss', stufe: 'schwer',
        raeume: [
          {
            id: 'verdreht', bild: 'cyclone', titel: 'Verdreht', auftrag: 'Achtung, durcheinander! Was ist gleich viel wie die Zahl?',
            aufgaben: () => wiederhole(5, () => L.gleichVielKnifflig()),
          },
          {
            id: 'ziffern', bild: 'input-numbers', titel: 'Ziffernkarten', auftrag: 'Baue die gesuchte Zahl aus den drei Karten!',
            aufgaben: () => ['groesste', 'kleinste', 'groesste', 'kleinste', 'zwischen'].map((z) => L.ziffernAufgabe(z)),
          },
          {
            id: 'luecke', bild: 'puzzle-piece', titel: 'Lücken-Zahl', auftrag: 'Welche Ziffern passen in die Lücke? Finde alle!',
            aufgaben: () => wiederhole(5, () => L.lueckeAufgabe()),
          },
          {
            id: 'fehler', bild: 'smiling-face-with-horns', titel: 'Fehler finden', auftrag: 'Hier hat sich jemand vertan. Tippe alle falschen Vergleiche an!',
            aufgaben: () => wiederhole(3, () => L.fehlerAufgabe()),
          },
          {
            id: 'detektiv', bild: 'detective', titel: 'Zahlen-Detektiv', auftrag: 'Lies alle Hinweise. Welche Zahl ist gesucht?',
            aufgaben: () => wiederhole(5, () => L.raetselAufgabe()),
          },
        ],
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
