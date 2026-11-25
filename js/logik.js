/* Rechenlogik der Mathestraße (ohne Bildschirm, damit sie automatisch geprüft werden kann). */
(function (global) {
  'use strict';
  const MH = global.MH = global.MH || {};
  const L = MH.logik = {};

  L.rng = Math.random;
  L.ganz = (von, bis) => von + Math.floor(L.rng() * (bis - von + 1));
  L.eins = (liste) => liste[Math.floor(L.rng() * liste.length)];
  L.misch = (liste) => {
    const a = liste.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(L.rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  L.stellen = (n) => ({ h: Math.floor(n / 100) % 10, z: Math.floor(n / 10) % 10, e: n % 10 });
  L.zahl = (h, z, e) => h * 100 + z * 10 + e;
  L.zeichen = (a, b) => (a < b ? '<' : a > b ? '>' : '=');
  L.worte = { '<': 'ist kleiner als', '>': 'ist größer als', '=': 'ist gleich viel wie' };
  L.satz = (a, b) => `${a} ${L.worte[L.zeichen(a, b)]} ${b}.`;

  L.entscheidend = (a, b) => {
    const x = L.stellen(a), y = L.stellen(b);
    if (x.h !== y.h) return 'H';
    if (x.z !== y.z) return 'Z';
    if (x.e !== y.e) return 'E';
    return null;
  };

  L.hinweis = (a, b) => {
    const x = L.stellen(a), y = L.stellen(b);
    switch (L.entscheidend(a, b)) {
      case 'H': return `Vergleiche zuerst die Hunderter: links ${x.h}, rechts ${y.h}.`;
      case 'Z': return `Die Hunderter sind gleich. Vergleiche die Zehner: links ${x.z}, rechts ${y.z}.`;
      case 'E': return `Hunderter und Zehner sind gleich. Vergleiche die Einer: links ${x.e}, rechts ${y.e}.`;
      default: return 'Schau genau: Hunderter, Zehner und Einer sind auf beiden Seiten gleich.';
    }
  };

  /* ---------- Zahlenpaare ---------- */
  const anders = (von, bis, nicht) => {
    let v;
    do { v = L.ganz(von, bis); } while (v === nicht);
    return v;
  };

  // art: 'H' | 'Z' | 'E' | '=' ; max begrenzt die Ziffern (für gut zählbares Material)
  L.paar = (art, max = { h: 9, z: 9, e: 9 }) => {
    const h = L.ganz(1, max.h), z = L.ganz(0, max.z), e = L.ganz(0, max.e);
    const a = L.zahl(h, z, e);
    let b = a;
    if (art === 'H') b = L.zahl(anders(1, max.h, h), L.ganz(0, max.z), L.ganz(0, max.e));
    if (art === 'Z') b = L.zahl(h, anders(0, max.z, z), L.ganz(0, max.e));
    if (art === 'E') b = L.zahl(h, z, anders(0, max.e, e));
    return [a, b];
  };

  /* ---------- Zerlegungen ---------- */
  L.summanden = (n) => {
    const s = L.stellen(n);
    return [s.h * 100, s.z * 10, s.e].filter((t) => t > 0);
  };
  L.summe = (teile) => teile.join(' + ');

  // eine falsche Zahl, die der richtigen ähnlich sieht
  L.verwechsler = (n) => {
    const s = L.stellen(n);
    const kandidaten = [
      L.zahl(s.h, s.e, s.z),
      L.zahl(s.h, s.z, (s.e + L.ganz(1, 8)) % 10),
      L.zahl(s.h, (s.z + L.ganz(1, 8)) % 10, s.e),
      L.zahl(s.h === 9 ? 8 : s.h + 1, s.z, s.e),
    ].filter((k) => k !== n && k >= 100);
    return L.eins(kandidaten);
  };

  L.gleichVielEinfach = (n) => {
    const richtig = { text: L.summe(L.summanden(n)), wert: n };
    const w = L.verwechsler(n);
    const falsch = { text: L.summe(L.summanden(w)), wert: w };
    return { art: 'gleichViel', zahl: n, optionen: L.misch([richtig, falsch]) };
  };

  // vertauschte Summanden und Stellenschreibweise
  L.gleichVielKnifflig = () => {
    const h = L.ganz(2, 9);
    const z = L.rng() < 0.25 ? 0 : L.ganz(1, 9);
    const e = z === 0 ? L.ganz(1, 9) : L.ganz(0, 9);
    const n = L.zahl(h, z, e);

    const alsText = (wert, form) => {
      const s = L.stellen(wert);
      if (form === 'summe') {
        const teile = L.summanden(wert);
        let gemischt = L.misch(teile);
        if (teile.length > 1) while (gemischt.join() === teile.join()) gemischt = L.misch(teile);
        return L.summe(gemischt);
      }
      const teile = [[s.h, 'H'], [s.z, 'Z'], [s.e, 'E']].filter(([v]) => v > 0);
      return L.misch(teile).map(([v, k]) => `${v}${k}`).join(' ');
    };

    const anzahlRichtig = L.eins([1, 2, 2, 3]);
    const optionen = [];
    const texte = new Set();
    const nimm = (wert) => {
      const text = alsText(wert, L.eins(['summe', 'stellen']));
      if (texte.has(text)) return;
      texte.add(text);
      optionen.push({ text, wert });
    };
    let sicherung = 0;
    while (optionen.length < anzahlRichtig && sicherung++ < 60) nimm(n);
    while (optionen.length < 4 && sicherung++ < 200) nimm(L.verwechsler(n));
    return { art: 'gleichViel', zahl: n, optionen: L.misch(optionen) };
  };

  /* ---------- Ordnen und Ballons ---------- */
  L.reihe = (anzahl) => {
    const s = L.misch([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const [a, b, c] = s;
    const pool = L.misch([
      L.zahl(a, b, c), L.zahl(a, c, b), L.zahl(b, a, c),
      L.zahl(b, c, a), L.zahl(c, a, b), L.zahl(c, b, a),
    ]);
    return pool.slice(0, anzahl);
  };

  L.ballonZahlen = (anzahl = 4) =>
    L.misch([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, anzahl).map((h) => L.zahl(h, L.ganz(0, 9), L.ganz(0, 9)));

  /* ---------- Ziffernkarten ---------- */
  L.permutationen = (z) => {
    const [a, b, c] = z;
    return [[a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a]]
      .filter((p) => p[0] !== 0)
      .map((p) => L.zahl(p[0], p[1], p[2]));
  };

  L.ziffernAufgabe = (ziel) => {
    for (;;) {
      const ziffern = L.misch([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
      const alle = L.permutationen(ziffern);
      if (ziel === 'groesste') return { art: 'ziffern', ziffern, ziel, loesungen: [Math.max(...alle)] };
      if (ziel === 'kleinste') return { art: 'ziffern', ziffern, ziel, loesungen: [Math.min(...alle)] };
      const von = L.ganz(2, 7) * 100;
      const bis = von + 200;
      const passend = alle.filter((n) => n > von && n < bis);
      if (passend.length >= 1 && passend.length < alle.length) {
        return { art: 'ziffern', ziffern, ziel: 'zwischen', von, bis, loesungen: passend };
      }
    }
  };

  /* ---------- Lückenziffer ---------- */
  L.einsetzen = (muster, d) => Number(muster.replace('_', String(d)));
  L.lueckeLoesungen = (muster, zeichen, rechts) =>
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => L.zeichen(L.einsetzen(muster, d), rechts) === zeichen);

  L.lueckeAufgabe = () => {
    for (;;) {
      const h = L.ganz(2, 8), z = L.ganz(1, 8), e = L.ganz(0, 9);
      const stelle = L.eins(['z', 'z', 'e']);
      const muster = stelle === 'z' ? `${h}_${e}` : `${h}${z}_`;
      const rechts = stelle === 'z' ? L.zahl(h, L.ganz(2, 7), L.ganz(0, 9)) : L.zahl(h, z, L.ganz(2, 7));
      const zeichen = L.eins(['<', '>']);
      const loesungen = L.lueckeLoesungen(muster, zeichen, rechts);
      if (loesungen.length >= 2 && loesungen.length <= 7) {
        return { art: 'luecke', muster, zeichen, rechts, loesungen };
      }
    }
  };

  /* ---------- Zahlen-Detektiv ---------- */
  L.raetselAufgabe = () => {
    for (;;) {
      const n = L.zahl(L.ganz(2, 8), L.ganz(0, 9), L.ganz(0, 9));
      const von = Math.floor(n / 10) * 10 - L.ganz(1, 4) * 10;
      const bis = von + 80;
      const s = L.stellen(n);
      const verhaeltnis = (x) => {
        const t = L.stellen(x);
        return t.z > t.e ? 'mehr' : t.z < t.e ? 'weniger' : 'gleich';
      };
      const v = verhaeltnis(n);
      const hinweise = [
        { text: `Meine Zahl ist größer als ${von} und kleiner als ${bis}.`, passt: (x) => x > von && x < bis },
        { text: `Bei den Einern steht die ${s.e}.`, passt: (x) => x % 10 === s.e },
        {
          text: v === 'gleich' ? 'Sie hat gleich viele Zehner wie Einer.' : `Sie hat ${v} Zehner als Einer.`,
          passt: (x) => verhaeltnis(x) === v,
        },
      ];
      // Jede falsche Karte verletzt genau einen Hinweis, damit alle Hinweise gebraucht werden.
      const falsche = [];
      for (let i = 0; i < hinweise.length; i++) {
        const pool = [];
        for (let x = Math.max(100, n - 130); x <= Math.min(999, n + 130); x++) {
          if (x !== n && hinweise.every((hw, j) => (j === i ? !hw.passt(x) : hw.passt(x)))) pool.push(x);
        }
        L.misch(pool).slice(0, i === 0 ? 1 : 2).forEach((x) => falsche.push(x));
      }
      const einzig = [...new Set(falsche)];
      if (n >= 100 && von >= 100 && bis <= 999 && einzig.length >= 4) {
        return { art: 'raetsel', hinweise, kandidaten: L.misch([n, ...einzig.slice(0, 5)]), loesung: n };
      }
    }
  };

  /* ---------- Fehler-Detektiv ---------- */
  L.fehlerAufgabe = () => {
    const anzahlFalsch = L.eins([2, 3, 3]);
    const falschAn = new Set(L.misch([0, 1, 2, 3, 4, 5]).slice(0, anzahlFalsch));
    const arten = L.misch(['H', 'Z', 'E', 'dreh', 'dreh', '=']);
    const benutzt = new Set();
    const aussagen = arten.map((art, i) => {
      let a, b;
      do {
        if (art === 'dreh') {
          const [x, y] = L.reihe(2);
          a = x; b = y;
        } else {
          [a, b] = L.paar(art);
        }
      } while (benutzt.has(`${a}-${b}`));
      benutzt.add(`${a}-${b}`);
      const richtig = L.zeichen(a, b);
      const zeichen = falschAn.has(i) ? L.eins(['<', '>', '='].filter((z) => z !== richtig)) : richtig;
      return { a, b, zeichen, stimmt: zeichen === richtig };
    });
    return { art: 'fehler', aussagen };
  };
})(typeof window !== 'undefined' ? window : globalThis);
