/* Prüft die Rechenlogik und alle Aufgaben aller Häuser.  Start:  node tests/aufgaben.test.js */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const wurzel = path.join(__dirname, '..');

require(path.join(wurzel, 'js/logik.js'));
require(path.join(wurzel, 'haeuser/liste.js'));
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
  const erwartet = { hunderter: 'H', zehner: 'Z', einer: 'E' };
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
const raum = (id) => MH.haeuser[0].etagen.flatMap((e) => e.raeume).find((r) => r.id === id);
assert.deepStrictEqual(raum('waage').aufgaben(true).slice(0, 3).map((a) => [a.a, a.b]), [[214, 214], [214, 321], [214, 112]]);
assert.deepStrictEqual(raum('gleich-viel').aufgaben(true).map((a) => a.optionen.filter((o) => o.wert === a.zahl).length), [1, 1, 1, 1, 1, 1]);

// Tierliste in der App und in der Datenbank müssen übereinstimmen
globalThis.window = globalThis;
require(path.join(wurzel, 'js/tiere.js'));
const sql = fs.readFileSync(path.join(wurzel, 'supabase/schema.sql'), 'utf8');
const block = sql.match(/tiere constant text\[\] := array\[([\s\S]*?)\];/)[1];
assert.deepStrictEqual([...block.matchAll(/'([^']+)'/g)].map((m) => m[1]), Object.keys(MH.tiere));

console.log(`Alles in Ordnung. ${geprueft} Aufgaben geprüft.`);
