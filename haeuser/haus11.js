/* Mathehaus 11 (orange): Ich rechne mit Zehnern und Hundertern.
 * Beim ersten Besuch eines Zimmers kommen die Aufgaben aus dem Booklet (erst === true),
 * bei jeder Wiederholung werden neue Zahlen gewürfelt. Wie im Heft muss nie gebündelt werden. */
(function (global) {
  'use strict';
  const MH = global.MH;
  const L = MH.logik;

  const wiederhole = (n, f) => Array.from({ length: n }, (_, i) => f(i));

  // '60-20' -> { a: 60, op: '-', b: 20, luecke: 'c' }
  const zeile = (text) => {
    const [, a, op, b] = text.match(/^(\d+)([+-])(\d+)$/);
    return { a: Number(a), op, b: Number(b), luecke: 'c' };
  };
  const paeckchen = (zeilen) => ({ art: 'paeckchen', zeilen });
  const heft = (...texte) => texte.map((t) => paeckchen(t.split(' ').map(zeile)));
  const aufgabe = (art) => (text) => { const { a, op, b } = zeile(text); return { art, a, op, b }; };
  const bild = aufgabe('bildrechnung');
  const lege = aufgabe('legerechnen');
  const als = (art) => (t) => ({ art, a: t.a, op: t.op, b: t.b });
  const rechenzeile = (t) => ({ a: t.a, op: t.op, b: t.b, luecke: 'c' });

  // Kleine Aufgaben bis 100: erst die Einer, dann dieselbe mit Zehnern
  const bis100 = (op) => wiederhole(4, () => paeckchen(L.helferpaeckchen(op)));

  // Vier ähnliche Aufgaben: glatt, ohne Einer, zweimal mit Einern; Plus und Minus im Wechsel
  const mitHundertern = () => ['-', '+', '-', '+'].map((op) =>
    paeckchen(['H', 'Z', 'E', 'E'].map((art) => rechenzeile(L.mitHundertern(op, art)))));
  const mitZehnern = () => ['-', '+', '-', '+'].map((op) =>
    paeckchen(['Z', 'Z', 'E', 'E'].map((art) => rechenzeile(L.mitZehnern(op, art)))));

  // fehlt vorne oder in der Mitte
  const platz = (art) => paeckchen([
    L.platzhalter(art, '+', 'b'), L.platzhalter(art, '-', 'b'), L.platzhalter(art, '+', 'a'), L.platzhalter(art, '-', 'a'),
  ]);

  const denk = (art, op) => als('denkzahl')(L.platzhalter(art, op, 'a'));

  MH.haus({
    nummer: 11,
    titel: 'Plus und minus',
    untertitel: 'Ich rechne mit Zehnern und Hundertern.',
    // Wie auf dem Deckblatt: rotes Dach, orange Wände und oranges Nummernschild
    farbe: { dach: '#e8321f', wand: '#ffd094', hell: '#fff3e2', akzent: '#ff8c2b', rand: '#e0661c', schatten: '#5c2a06', ring: 'orange' },

    // Die Liste vom Deckblatt des Booklets
    koennen: [
      { text: 'Ich subtrahiere bis 100.', raeume: ['minus100'] },
      { text: 'Ich subtrahiere mit Hunderterzahlen.', raeume: ['wegnehmen', 'bild-minus', 'hunderter'] },
      { text: 'Ich subtrahiere mit Zehnerzahlen.', raeume: ['stangen', 'bild-minus', 'zehner'] },
      { text: 'Ich addiere bis 100.', raeume: ['plus100'] },
      { text: 'Ich addiere mit Hunderterzahlen.', raeume: ['dazulegen', 'bild-plus', 'hunderter'] },
      { text: 'Ich addiere mit Zehnerzahlen.', raeume: ['stangen', 'bild-plus', 'zehner'] },
      { text: 'Ich erkenne fehlende Zahlen bei Platzhalteraufgaben.', raeume: ['platzhalter', 'zahlenraetsel'] },
    ],

    // Besondere Abzeichen dieses Hauses: alle genannten Zimmer mit 3 Sternen
    abzeichen: [
      { id: 'rechnen', titel: 'Rechen-Profi', text: '3 Sterne in „Minus bis 100“, „Plus bis 100“, „Hunderter“ und „Zehner“.', bild: 'abacus', raeume: ['minus100', 'plus100', 'hunderter', 'zehner'] },
      { id: 'platzhalter', titel: 'Platzhalter-Detektiv', text: '3 Sterne in „Platzhalter“, „Zahlenrätsel“ und „Friedas Fehler“.', bild: 'detective', raeume: ['platzhalter', 'zahlenraetsel', 'friedas-fehler'] },
    ],

    etagen: [
      {
        name: 'Erdgeschoss', stufe: 'leicht',
        raeume: [
          {
            id: 'minus100', bild: 'abacus', titel: 'Minus bis 100', auftrag: 'Rechne! Die kleine Aufgabe hilft dir.',
            aufgaben: (erst) => (erst
              ? heft('8-3 9-5 7-2', '60-20 80-60 20-10', '30-20 50-10 50-20', '40-20 60-10 60-40', '80-30 70-30 90-40')
              : bis100('-')),
          },
          {
            id: 'plus100', bild: 'input-numbers', titel: 'Plus bis 100', auftrag: 'Rechne! Die kleine Aufgabe hilft dir.',
            aufgaben: (erst) => (erst
              ? heft('6+2 5+2 5+1', '90+10 50+30 30+10', '70+20 70+10 30+40', '10+80 60+20 20+30', '40+50 10+40 30+50')
              : bis100('+')),
          },
          {
            id: 'wegnehmen', bild: 'H', titel: 'Wegnehmen', auftrag: 'Lege und rechne!',
            aufgaben: (erst) => [
              erst ? lege('900-400') : als('legerechnen')(L.legeAufgabe('-', 'H', true)),
              als('legerechnen')(L.legeAufgabe('-', 'H', true)),
              als('legerechnen')(L.legeAufgabe('-', 'H', false, 4)),
              als('legerechnen')(L.legeAufgabe('-', 'H', false, 4)),
            ],
          },
          {
            id: 'dazulegen', bild: 'package', titel: 'Dazulegen', auftrag: 'Lege und rechne!',
            aufgaben: (erst) => [
              erst ? lege('500+400') : als('legerechnen')(L.legeAufgabe('+', 'H', true)),
              als('legerechnen')(L.legeAufgabe('+', 'H', true)),
              als('legerechnen')(L.legeAufgabe('+', 'H', false, 4)),
              als('legerechnen')(L.legeAufgabe('+', 'H', false, 4)),
            ],
          },
          {
            id: 'stangen', bild: 'Z', titel: 'Zehnerstangen', auftrag: 'Lege und rechne mit Zehnern!',
            aufgaben: (erst) => (erst ? [lege('234-20'), lege('231+10')] : [
              als('legerechnen')(L.legeAufgabe('-', 'Z')), als('legerechnen')(L.legeAufgabe('+', 'Z')),
            ]).concat(['-', '+'].map((op) => als('legerechnen')(L.legeAufgabe(op, 'Z')))),
          },
        ],
      },
      {
        name: '1. Stock', stufe: 'mittel',
        raeume: [
          {
            id: 'bild-minus', bild: 'eyes', titel: 'Bild minus', auftrag: 'Welche Aufgabe zeigt das Bild?',
            aufgaben: (erst) => (erst ? ['500-200', '234-100', '452-300', '356-40'].map(bild) : [
              L.legeAufgabe('-', 'H', true), L.legeAufgabe('-', 'H'), L.legeAufgabe('-', 'Z'), L.legeAufgabe('-', 'Z'),
            ].map(als('bildrechnung'))),
          },
          {
            id: 'bild-plus', bild: 'magnifying-glass-tilted-left', titel: 'Bild plus', auftrag: 'Welche Aufgabe zeigt das Bild?',
            aufgaben: (erst) => (erst ? ['400+200', '131+100', '314+300', '313+40'].map(bild) : [
              L.legeAufgabe('+', 'H', true), L.legeAufgabe('+', 'H'), L.legeAufgabe('+', 'Z'), L.legeAufgabe('+', 'Z'),
            ].map(als('bildrechnung'))),
          },
          {
            id: 'hunderter', bild: 'H', titel: 'Hunderter', auftrag: 'Rechne mit Hunderterzahlen!',
            aufgaben: (erst) => (erst
              ? heft('400-200 330-200 621-400 577-300', '100+200 130+200 121+400 577+300',
                '600-300 520-300 963-700 739-600', '200+300 220+300 263+300 339+600')
              : mitHundertern()),
          },
          {
            id: 'zehner', bild: 'Z', titel: 'Zehner', auftrag: 'Rechne mit Zehnerzahlen!',
            aufgaben: (erst) => (erst
              ? heft('140-20 350-30 138-10 477-30', '140+20 350+30 138+10 457+30',
                '230-10 470-60 247-20 673-60', '230+10 420+60 247+20 633+60')
              : mitZehnern()),
          },
          {
            id: 'frieda', bild: 'girl', titel: 'Friedas Frage', auftrag: 'Hilf Frieda!',
            aufgaben: (erst) => {
              const h = erst ? [{ a: 234, op: '+', b: 100 }, { a: 452, op: '-', b: 300 }]
                : [L.mitHundertern('+', 'E'), L.mitHundertern('-', 'E')];
              const z = erst ? { a: 356, op: '-', b: 40 } : L.mitZehnern(L.eins(['+', '-']), 'E');
              return [als('aendert')(h[0]), als('aendert')(h[1]), { art: 'merkspruch', wie: 'H' },
                als('aendert')(z), { art: 'merkspruch', wie: 'Z' }];
            },
          },
        ],
      },
      {
        name: 'Dachgeschoss', stufe: 'schwer',
        raeume: [
          {
            id: 'platzhalter', bild: 'puzzle-piece', titel: 'Platzhalter', auftrag: 'Welche Zahl fehlt?',
            aufgaben: () => [platz('bis100'), platz('H'), platz('Z'),
              paeckchen(L.misch(['H', 'H', 'Z', 'Z']).map((art) => L.platzhalter(art)))],
          },
          {
            id: 'zahlenraetsel', bild: 'thinking-face', titel: 'Zahlenrätsel', auftrag: 'Welche Zahl habe ich mir gedacht?',
            aufgaben: () => [denk('bis100', '+'), denk('H', '+'), denk('Z', '-'), denk('H', '-'), denk('Z', '+')],
          },
          {
            id: 'mauern', bild: 'brick', titel: 'Zahlenmauern', auftrag: 'Rechne die Zahlenmauer aus!',
            aufgaben: () => {
              const [leer, ...knifflig] = L.MAUER_MUSTER;
              const muster = L.misch(knifflig);
              return [L.mauer('H', leer), L.mauer('Z', leer), L.mauer('EH', muster[0]), L.mauer('EZ', muster[1])];
            },
          },
          {
            id: 'ergebnis-ballons', bild: 'balloon', titel: 'Ballons', auftrag: 'Lass den richtigen Ballon platzen!',
            aufgaben: () => wiederhole(7, () => L.ergebnisBallons()),
          },
          {
            id: 'friedas-fehler', bild: 'detective', titel: 'Friedas Fehler', auftrag: 'Finde Friedas Fehler!',
            aufgaben: () => wiederhole(3, () => L.friedaFehler()),
          },
        ],
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
