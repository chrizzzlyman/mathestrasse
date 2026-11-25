/* Prüft die Rechenlogik und alle Aufgaben aller Häuser.  Start:  node tests/aufgaben.test.js */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const wurzel = path.join(__dirname, '..');

require(path.join(wurzel, 'js/logik.js'));
require(path.join(wurzel, 'haeuser/liste.js'));
require(path.join(wurzel, 'js/abzeichen.js'));
const MH = globalThis.MH;
MH.HAUS_DATEIEN.forEach((d) => require(path.join(wurzel, 'haeuser', d)));
const L = MH.logik;

let geprueft = 0;
const dreistellig = (n) => assert(Number.isInteger(n) && n >= 100 && n <= 999, `keine dreistellige Zahl: ${n}`);
const rechne = (text) => {
  if (/[HZE]/.test(text)) {
    return text.split(' ').reduce((s, t) => s + Number(t.slice(0, -1)) * { H: 100, Z: 10, E: 1 }[t.slice(-1)], 0);
  }
  return text.split('+').reduce((s, t) => s + Number(t.trim()), 0);
};

const pruefe = {
  vergleich(a) {
    dreistellig(a.a); dreistellig(a.b);
    assert(['waage', 'holz', 'hze', 'zahl'].includes(a.bild));
  },
  merksatz(a) { assert(['Hunderter', 'Zehner', 'Einer'].includes(a.loesung)); },
  entschieden(a) { dreistellig(a.a); dreistellig(a.b); assert.notStrictEqual(a.a, a.b); },
  waageLegen(a) { dreistellig(a.ziel); },
  gleichViel(a) {
    dreistellig(a.zahl);
    a.optionen.forEach((o) => assert.strictEqual(rechne(o.text), o.wert, `Rechnung "${o.text}" ergibt nicht ${o.wert}`));
    assert(a.optionen.some((o) => o.wert === a.zahl), 'keine richtige Rechnung');
    assert(a.optionen.some((o) => o.wert !== a.zahl), 'keine falsche Rechnung');
    assert.strictEqual(new Set(a.optionen.map((o) => o.text)).size, a.optionen.length, 'doppelte Rechnung');
  },
  ballons(a) {
    a.zahlen.forEach(dreistellig);
    assert.strictEqual(new Set(a.zahlen).size, a.zahlen.length, 'doppelte Ballonzahl');
  },
  ordnen(a) {
    assert.strictEqual(a.zahlen.length, 5);
    a.zahlen.forEach(dreistellig);
    assert.strictEqual(new Set(a.zahlen).size, 5, 'doppelte Zahl beim Ordnen');
  },
  ziffern(a) {
    assert.strictEqual(new Set(a.ziffern).size, 3);
    assert(a.loesungen.length >= 1);
    const alle = L.permutationen(a.ziffern);
    alle.forEach(dreistellig);
    let soll;
    if (a.ziel === 'groesste') soll = [Math.max(...alle)];
    else if (a.ziel === 'kleinste') soll = [Math.min(...alle)];
    else soll = alle.filter((n) => n > a.von && n < a.bis);
    assert.deepStrictEqual(a.loesungen.slice().sort(), soll.sort());
  },
  luecke(a) {
    assert(/^\d_\d$|^\d\d_$/.test(a.muster), a.muster);
    const soll = [];
    for (let d = 0; d < 10; d++) {
      const n = Number(a.muster.replace('_', d));
      dreistellig(n);
      if ((a.zeichen === '<' && n < a.rechts) || (a.zeichen === '>' && n > a.rechts)) soll.push(d);
    }
    assert.deepStrictEqual(a.loesungen, soll);
    assert(soll.length >= 2 && soll.length <= 7);
  },
  raetsel(a) {
    dreistellig(a.loesung);
    a.kandidaten.forEach(dreistellig);
    assert.strictEqual(new Set(a.kandidaten).size, a.kandidaten.length);
    assert(a.kandidaten.length >= 5, 'zu wenige Karten');
    const passend = a.kandidaten.filter((n) => a.hinweise.every((h) => h.passt(n)));
    assert.deepStrictEqual(passend, [a.loesung], 'Rätsel ist nicht eindeutig');
  },
  fehler(a) {
    assert.strictEqual(a.aussagen.length, 6);
    a.aussagen.forEach((x) => {
      dreistellig(x.a); dreistellig(x.b);
      assert.strictEqual(x.stimmt, L.zeichen(x.a, x.b) === x.zeichen);
    });
    const falsch = a.aussagen.filter((x) => !x.stimmt).length;
    assert(falsch >= 2 && falsch <= 3);
  },

  /* Haus 9 */
  anzahlen(a) { dreistellig(a.zahl); },
  legen(a) { dreistellig(a.zahl); },
  schreibzahl(a) { dreistellig(a.zahl); assert.strictEqual(typeof a.wirr, 'boolean'); },
  frage(a) {
    assert(a.antworten.includes(a.richtig));
    assert.strictEqual(new Set(a.antworten).size, a.antworten.length);
  },
  aufraeumen(a) {
    dreistellig(a.zahl);
    const { h, z, e } = L.stellen(a.zahl);
    assert(h + z + e <= 30, 'passt nicht ins Streufeld');
  },
  blitz(a) { dreistellig(a.zahl); assert(a.sekunden >= 2); },
  verbinde(a) {
    assert(a.zahlen.length >= 3);
    a.zahlen.forEach(dreistellig);
    assert.strictEqual(new Set(a.zahlen).size, a.zahlen.length, 'doppelte Zahl beim Verbinden');
  },
  stempeln(a) { dreistellig(a.zahl); },
  baukasten(a) {
    dreistellig(a.zahl);
    // jedes Wort, das gebraucht wird, liegt in der passenden Gruppe der Wortbank
    L.zahlwortTeile(a.zahl).forEach((t) => {
      if (t.art !== 'und') assert((a.bank[t.art] || []).includes(t.text), `Baukasten ${a.zahl}: „${t.text}“ fehlt`);
    });
    assert(L.zahlwortTeile(a.zahl).some((t) => t.art === 'und'), 'Baukasten braucht „und“: ' + a.zahl);
    ['H', 'E', 'Z'].forEach((k) => assert.strictEqual(new Set(a.bank[k]).size, a.bank[k].length));
  },
  reihenfolge(a) { assert(['schreibe', 'spreche'].includes(a.wie)); },
  ziffernfolge(a) {
    const { h, z, e } = L.stellen(a.zahl);
    assert(['schreibe', 'spreche'].includes(a.wie));
    assert.strictEqual(new Set([h, z, e]).size, 3, 'gleiche Ziffern: ' + a.zahl);
    assert(z >= 2 && e >= 1, 'Sprechfolge wäre unklar: ' + a.zahl);
  },
  dreher(a) {
    assert.strictEqual(a.optionen.length, 4);
    assert.strictEqual(new Set(a.optionen).size, 4);
    assert(a.optionen.includes(a.zahl));
    a.optionen.forEach(dreistellig);
    assert.strictEqual(new Set(a.optionen.map(L.zahlwort)).size, 4);
  },
  diktat(a) { dreistellig(a.zahl); },
  buendeln(a) {
    dreistellig(a.zahl);
    assert.strictEqual(a.h * 100 + a.z * 10 + a.e, a.zahl);
    assert(a.z >= 10 || a.e >= 10, 'nichts zu bündeln');
    assert(a.z <= 18 && a.e <= 18);
  },
  schieben(a) {
    // alle Möglichkeiten unabhängig nachrechnen
    const start = [a.h, a.z, a.e];
    const ergebnisse = [];
    for (let von = 0; von < 3; von++) {
      for (let nach = 0; nach < 3; nach++) {
        if (von === nach || !start[von] || start[nach] === 9) continue;
        const neu = start.slice();
        neu[von]--; neu[nach]++;
        const n = neu[0] * 100 + neu[1] * 10 + neu[2];
        if (n >= 100) ergebnisse.push(n);
      }
    }
    assert(ergebnisse.includes(a.soll), 'Ziel nicht mit einem Plättchen erreichbar');
    if (a.ziel === 'groesste') assert.strictEqual(a.soll, Math.max(...ergebnisse));
    if (a.ziel === 'kleinste') assert.strictEqual(a.soll, Math.min(...ergebnisse));
  },
  stellenraetsel(a) {
    dreistellig(a.zahl);
    const passend = [];
    for (let x = 100; x <= 999; x++) if (a.hinweise.every((h) => h.passt(x))) passend.push(x);
    assert.deepStrictEqual(passend, [a.zahl], 'Stellen-Rätsel ist nicht eindeutig');
  },
  wortSchreiben(a) { dreistellig(a.zahl); assert.strictEqual(L.wortHinweis(a.zahl, L.zahlwort(a.zahl)), null); },
};

// Grundregeln
assert.strictEqual(L.satz(214, 321), '214 ist kleiner als 321.');
assert.strictEqual(L.satz(214, 112), '214 ist größer als 112.');
assert.strictEqual(L.satz(214, 214), '214 ist gleich viel wie 214.');
assert.strictEqual(L.entscheidend(236, 415), 'H');
assert.strictEqual(L.entscheidend(573, 528), 'Z');
assert.strictEqual(L.entscheidend(315, 312), 'E');
assert.strictEqual(L.entscheidend(679, 679), null);
assert.strictEqual(L.summe(L.summanden(705)), '700 + 5');

// Zahlenpaare: die gewünschte Stelle entscheidet wirklich
for (let i = 0; i < 20000; i++) {
  for (const art of ['H', 'Z', 'E']) {
    const [a, b] = L.paar(art);
    dreistellig(a); dreistellig(b);
    assert.strictEqual(L.entscheidend(a, b), art);
  }
  const [x, y] = L.paar('=');
  assert.strictEqual(x, y);
}

// Alle Zimmer aller Häuser: Booklet-Durchgang und viele Zufallsdurchgänge
for (const haus of MH.haeuser) {
  const ids = haus.etagen.flatMap((e) => e.raeume.map((r) => r.id));
  assert.strictEqual(new Set(ids).size, ids.length, 'doppelte Zimmer-Kennung');
  ids.forEach((id) => assert(/^[a-z0-9-]{1,40}$/.test(id), 'Kennung passt nicht zur Datenbank: ' + id));
  haus.koennen.forEach((k) => k.raeume.forEach((id) => assert(ids.includes(id), 'unbekanntes Zimmer ' + id)));
  haus.etagen.forEach((e) => assert(['leicht', 'mittel', 'schwer'].includes(e.stufe)));

  for (const raum of haus.etagen.flatMap((e) => e.raeume)) {
    for (let lauf = 0; lauf < 1500; lauf++) {
      const aufgaben = raum.aufgaben(lauf === 0);
      assert(aufgaben.length >= 3, raum.id);
      for (const a of aufgaben) {
        try { pruefe[a.art](a); } catch (e) {
          console.error('Fehler in Zimmer', raum.id, JSON.stringify(a));
          throw e;
        }
        geprueft++;
      }
    }
  }

  // Passen die „Dann die …“-Zimmer zur jeweiligen Stelle?
  const erwartet = haus.nummer === 10 ? { hunderter: 'H', zehner: 'Z', einer: 'E' } : {};
  for (const raum of haus.etagen.flatMap((e) => e.raeume)) {
    if (!erwartet[raum.id]) continue;
    for (let lauf = 0; lauf < 500; lauf++) {
      raum.aufgaben(lauf === 0).filter((a) => a.art === 'vergleich').forEach((a) => {
        const s = L.entscheidend(a.a, a.b);
        assert(s === erwartet[raum.id] || (raum.id === 'einer' && s === null), `${raum.id}: ${a.a}/${a.b}`);
      });
    }
  }
}

// Booklet-Zahlen stichprobenartig
const zimmerIn = (nummer) => (id) => MH.haeuser.find((h) => h.nummer === nummer).etagen.flatMap((e) => e.raeume).find((r) => r.id === id);
const raum = zimmerIn(10);
assert.deepStrictEqual(raum('waage').aufgaben(true).slice(0, 3).map((a) => [a.a, a.b]), [[214, 214], [214, 321], [214, 112]]);
assert.deepStrictEqual(raum('gleich-viel').aufgaben(true).map((a) => a.optionen.filter((o) => o.wert === a.zahl).length), [1, 1, 1, 1, 1, 1]);

// Haus 9: die Zahlen aus dem Booklet
const neun = zimmerIn(9);
const zahlenIn = (id) => neun(id).aufgaben(true).filter((a) => a.zahl).map((a) => a.zahl);
assert.deepStrictEqual(MH.haeuser.map((h) => h.nummer), [9, 10]);
assert.deepStrictEqual(zahlenIn('wie-viele'), [342, 536, 164, 641, 259]);
assert.deepStrictEqual(zahlenIn('lege'), [241, 173, 358, 519, 406, 290]);
assert.deepStrictEqual(zahlenIn('geheimschrift'), [234, 344, 462, 425, 158, 209]);
assert.deepStrictEqual(neun('verbinden').aufgaben(true)[0].zahlen.slice().sort(), [125, 283, 852, 885, 921]);
assert.deepStrictEqual(zahlenIn('malen').slice(0, 2), [236, 529]);
assert.deepStrictEqual(zahlenIn('baukasten'), [243, 674, 444, 525]);

// Zahlwörter
const WOERTER = {
  100: 'einhundert', 101: 'einhunderteins', 110: 'einhundertzehn', 111: 'einhundertelf', 112: 'einhundertzwölf',
  116: 'einhundertsechzehn', 117: 'einhundertsiebzehn', 123: 'einhundertdreiundzwanzig', 125: 'einhundertfünfundzwanzig',
  201: 'zweihunderteins', 236: 'zweihundertsechsunddreißig', 283: 'zweihundertdreiundachtzig', 290: 'zweihundertneunzig',
  361: 'dreihunderteinundsechzig', 406: 'vierhundertsechs', 529: 'fünfhundertneunundzwanzig', 674: 'sechshundertvierundsiebzig',
  852: 'achthundertzweiundfünfzig', 885: 'achthundertfünfundachtzig', 921: 'neunhunderteinundzwanzig', 999: 'neunhundertneunundneunzig',
};
Object.entries(WOERTER).forEach(([n, w]) => assert.strictEqual(L.zahlwort(Number(n)), w));
const alleWoerter = new Set();
for (let n = 100; n <= 999; n++) {
  alleWoerter.add(L.zahlwort(n));
  assert.strictEqual(L.wortHinweis(n, L.zahlwort(n)), null);
}
assert.strictEqual(alleWoerter.size, 900);
assert.strictEqual(L.wortHinweis(243, ' Zweihundert drei und vierzig '), null);
assert.strictEqual(L.wortHinweis(125, 'hundertfünfundzwanzig'), null);
assert.strictEqual(L.wortHinweis(236, 'zweihundertsechsunddreissig'), null);
assert(/Hundertern/.test(L.wortHinweis(243, 'dreihundertzweiundvierzig')));
assert(/zuerst die Einer/.test(L.wortHinweis(243, 'zweihundertvierzigdrei')));
assert(/kommen die Einer/.test(L.wortHinweis(243, 'zweihundertvierunddreißig')));
assert(/„und“/.test(L.wortHinweis(243, 'zweihundertdreivierzig')));
assert(/Ende/.test(L.wortHinweis(243, 'zweihundertdreiundfünfzig')));

// Abzeichen
const abzeichen = (sterne) => MH.abzeichen.berechne(MH.haeuser, sterne);
const leer = abzeichen(() => 0);
assert.strictEqual(leer.length, 16);
assert.strictEqual(new Set(leer.map((a) => a.id)).size, leer.length, 'doppelte Abzeichen-Kennung');
assert(leer.every((a) => !a.verdient && a.ist === 0 && a.soll > 0));
assert(abzeichen(() => 3).every((a) => a.verdient), 'mit allen Sternen muss jedes Abzeichen erreichbar sein');
const einStern = abzeichen((h, r) => (h === 9 && r === 'wie-viele' ? 1 : 0)).filter((a) => a.verdient).map((a) => a.id);
assert.deepStrictEqual(einStern, ['erster-stein']);
const alleMitEinem = abzeichen(() => 1).filter((a) => a.verdient).map((a) => a.id);
assert.deepStrictEqual(alleMitEinem, ['erster-stein', 'fleissige-biene', 'baumeister', 'dachstuermer', 'sternensammler', 'haus9-richtfest', 'haus10-richtfest']);
for (const h of MH.haeuser) {
  const ids = h.etagen.flatMap((e) => e.raeume.map((r) => r.id));
  (h.abzeichen || []).forEach((a) => a.raeume.forEach((id) => assert(ids.includes(id), 'Abzeichen nennt unbekanntes Zimmer ' + id)));
}

// Jedes Bild, das genannt wird, liegt auch im Projekt
const bilder = leer.map((a) => a.bild).concat(MH.haeuser.flatMap((h) => h.etagen.flatMap((e) => e.raeume.map((r) => r.bild))), 'girl', 'sports-medal', 'trophy');
bilder.filter((b) => !['H', 'Z', 'E'].includes(b)).forEach((b) => assert(fs.existsSync(path.join(wurzel, 'assets/bilder', b + '.svg')), 'Bild fehlt: ' + b));

// Tierliste in der App und in der Datenbank müssen übereinstimmen
globalThis.window = globalThis;
require(path.join(wurzel, 'js/tiere.js'));
const sql = fs.readFileSync(path.join(wurzel, 'supabase/schema.sql'), 'utf8');
const block = sql.match(/tiere constant text\[\] := array\[([\s\S]*?)\];/)[1];
assert.deepStrictEqual([...block.matchAll(/'([^']+)'/g)].map((m) => m[1]), Object.keys(MH.tiere));

console.log(`Alles in Ordnung. ${geprueft} Aufgaben geprüft.`);
