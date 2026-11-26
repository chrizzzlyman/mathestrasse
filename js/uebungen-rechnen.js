/* Aufgabenformate zum Plus- und Minusrechnen (Mathehaus 11).
 * Gleiche Regeln wie in uebungen.js: zeichnen in `feld`, dann api.richtig(satz) oder api.falsch(hinweis). */
(function () {
  'use strict';
  const MH = window.MH;
  const { el } = MH;
  const L = MH.logik;
  const Z = MH.zeichne;
  const U = MH.uebungen;
  const { knopf, pruefKnopf, wackeln, legespiel, WORT } = MH.bausteine;
  const OP = L.OP;
  const STELLEN = ['H', 'Z', 'E'];
  const NUR = { H: 'Nur die Hunderter haben sich verändert.', Z: 'Nur die Zehner haben sich verändert.', E: 'Nur die Einer haben sich verändert.' };

  const rechentext = ({ a, op, b }) => `${a} ${OP[op]} ${b}`;
  const gesprochen = (text) => text.replace(/−/g, 'minus').replace(/\+/g, 'plus').replace(/=/g, 'ist gleich');
  const zahl = (n) => el('span', { class: 'rzahl' }, n);
  const zeichen = (z) => el('span', { class: 'rzeichen' }, z);
  const tierName = () => {
    const sitzung = MH.speicher && MH.speicher.sitzung;
    return sitzung && !sitzung.gast ? sitzung.tier : null;
  };
  const friedaSagt = (satz) => el('div', { class: 'frieda' },
    el('img', { src: 'assets/bilder/girl.svg', alt: 'Frieda' }),
    el('p', { class: 'sprechblase' }, satz));
  const insBild = (knoten) => knoten.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

  // Die Ziffer der Stelle, die sich geändert hat, leuchtet in ihrer Farbe
  const faerbe = (knoten, wert, stelle) => {
    const text = String(wert);
    const i = text.length - { H: 3, Z: 2, E: 1 }[stelle];
    knoten.replaceChildren(...text.split('').map((d, j) => el('span', { class: j === i ? 'geaendert ' + stelle.toLowerCase() : '' }, d)));
  };

  /* ---------- Baustein: Lücken, ein Ziffernfeld und „Prüfen“ ----------
   * auto: die Lücke hat eine bekannte Länge, danach geht es von selbst zur nächsten. */
  const luecke = (loesung, { auto = false, art = '' } = {}) => ({
    knoten: el('button', { type: 'button', class: 'rluecke ' + art }),
    loesung, auto, wert: '', fertig: false, neu: false,
  });

  // gruppen werden einzeln geprüft: { luecken, hinweis(ersteFalsche, werte), zeile?, geschafft?() }
  function rechenpult(api, gruppen, beiFertig) {
    const alle = [];
    gruppen.forEach((g) => g.luecken.forEach((l) => { l.gruppe = g; alle.push(l); }));
    let aktiv = alle[0];
    const zeige = () => {
      alle.forEach((l) => {
        if (l.fertig) return;
        l.knoten.textContent = l.wert;
        l.knoten.classList.toggle('aktiv', l === aktiv);
        l.knoten.setAttribute('aria-label', l.wert ? `Lücke mit ${l.wert}` : 'leere Lücke');
      });
      gruppen.forEach((g) => { if (g.zeile) g.zeile.classList.toggle('dran', Boolean(aktiv) && g === aktiv.gruppe && gruppen.length > 1); });
      pruefe.disabled = !aktiv || !aktiv.gruppe.luecken.every((l) => l.wert !== '');
    };
    const setze = (d) => {
      const l = aktiv;
      if (!l) return;
      const laenge = String(l.loesung).length;
      if (l.neu || l.wert === '0' || (l.auto && l.wert.length >= laenge)) l.wert = '';
      l.neu = false;
      if (l.wert.length >= 4) return;
      l.wert += d;
      l.knoten.classList.remove('falsch');
      MH.ton('plopp');
      if (l.auto && l.wert.length === laenge) {
        const g = l.gruppe.luecken;
        const naechste = g.slice(g.indexOf(l) + 1).concat(g).find((x) => x.wert === '' || x.neu);
        if (naechste) aktiv = naechste;
      }
      zeige();
    };
    const loesche = () => {
      if (!aktiv) return;
      if (aktiv.wert === '') {
        const g = aktiv.gruppe.luecken;
        if (g.indexOf(aktiv) > 0) aktiv = g[g.indexOf(aktiv) - 1];
      }
      aktiv.wert = aktiv.neu ? '' : aktiv.wert.slice(0, -1);
      aktiv.neu = false;
      aktiv.knoten.classList.remove('falsch');
      zeige();
    };
    const pruefen = () => {
      if (!aktiv) return;
      const g = aktiv.gruppe;
      if (!g.luecken.every((l) => l.wert !== '')) return;
      const falsche = g.luecken.filter((l) => Number(l.wert) !== l.loesung);
      if (falsche.length) {
        falsche.forEach((l) => { l.neu = true; l.knoten.classList.add('falsch'); });
        aktiv = falsche[0];
        zeige();
        api.falsch(g.hinweis(falsche[0], g.luecken.map((l) => Number(l.wert))));
        return;
      }
      g.luecken.forEach((l) => {
        l.fertig = true;
        l.knoten.classList.remove('aktiv', 'falsch');
        l.knoten.classList.add('richtig');
        l.knoten.disabled = true;
      });
      if (g.zeile) { g.zeile.classList.remove('dran'); g.zeile.classList.add('geschafft'); }
      if (g.geschafft) g.geschafft();
      const offen = gruppen.find((x) => !x.luecken[0].fertig);
      if (offen) {
        aktiv = offen.luecken.find((l) => l.wert === '') || offen.luecken[0];
        api.ruhe();
        MH.ton('plopp');
        zeige();
        return;
      }
      aktiv = null;
      zeige();
      beiFertig();
    };
    alle.forEach((l) => l.knoten.addEventListener('click', () => {
      if (l.fertig) return;
      aktiv = l;
      zeige();
    }));
    const pruefe = pruefKnopf(pruefen);
    const tasten = el('div', { class: 'rtasten' }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 'weg', 0].map((d) => (d === 'weg'
      ? el('button', { type: 'button', class: 'knopf ziffer loeschtaste', 'aria-label': 'Ziffer löschen', html: MH.symbol('loeschen'), onclick: loesche })
      : knopf(String(d), () => setze(String(d)), 'ziffer t' + d))));
    // Mit Tastatur: Ziffern, Rücktaste und Eingabetaste
    const tippen = (ev) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey || !aktiv) return;
      if (/^[0-9]$/.test(ev.key)) setze(ev.key);
      else if (ev.key === 'Backspace') { ev.preventDefault(); loesche(); }
      else if (ev.key === 'Enter' && !(ev.target && ev.target.closest && ev.target.closest('button'))) pruefen();
    };
    document.addEventListener('keydown', tippen);
    MH.beimVerlassen(() => document.removeEventListener('keydown', tippen));
    zeige();
    return el('div', { class: 'rpad' }, tasten, pruefe);
  }

  const pultMitBlatt = (blatt, pad) => el('div', { class: 'rechenpult' }, blatt, pad);

  // Spalten untereinander wie im Rechenheft: so breit wie die längste Zahl (eine Lücke etwas breiter)
  const spaltenBreiten = (blatt, zeilen) => ['a', 'b', 'c'].forEach((k) => {
    const breite = Math.max(...zeilen.map((z) => {
      const ziffern = String(z[k]).length * 0.62;
      return z.luecke === k ? Math.max(2.7, ziffern + 0.7) : ziffern + 0.1;
    }));
    blatt.style.setProperty('--' + k, breite.toFixed(2) + 'em');
  });
  const alsZeile = (z, luecke) => ({ a: z.a, b: z.b, c: L.rechne(z.a, z.op, z.b), luecke });

  /* ---------- Päckchen: mehrere Aufgaben untereinander, auch mit Platzhalter ---------- */
  U.paeckchen = (feld, a, api) => {
    const gruppen = a.zeilen.map((z) => {
      const werte = { a: z.a, b: z.b, c: L.rechne(z.a, z.op, z.b) };
      const l = luecke(werte[z.luecke]);
      const stelle = (k) => (z.luecke === k ? l.knoten : zahl(werte[k]));
      return {
        zeile: el('div', { class: 'rzeile' }, stelle('a'), zeichen(OP[z.op]), stelle('b'), zeichen('='), stelle('c')),
        luecken: [l],
        hinweis: (_, [getippt]) => L.zeilenHinweis(z, getippt),
        geschafft: () => { if (z.luecke === 'c') faerbe(l.knoten, werte.c, L.stelleVon(z.b)); },
      };
    });
    const pad = rechenpult(api, gruppen, () => api.richtig('Alle Aufgaben in diesem Päckchen stimmen!'));
    const blatt = el('div', { class: 'rblatt spalten' }, gruppen.map((g) => g.zeile));
    spaltenBreiten(blatt, a.zeilen.map((z) => alsZeile(z, z.luecke)));
    feld.append(pultMitBlatt(blatt, pad));
  };
  MH.vorlesetexte.paeckchen = (a) => a.zeilen.map((z) => {
    const werte = { a: z.a, b: z.b, c: L.rechne(z.a, z.op, z.b) };
    const w = (k) => (z.luecke === k ? 'Lücke' : werte[k]);
    return gesprochen(`${w('a')} ${OP[z.op]} ${w('b')} = ${w('c')}.`);
  }).join(' ');

  /* ---------- Material als Bild ---------- */
  const TEIL = { H: 'Hunderterplatte', Z: 'Zehnerstange', E: 'Einerwürfel' };
  const TEILE = { H: 'Hunderterplatten', Z: 'Zehnerstangen', E: 'Einerwürfel' };
  const menge = (s, n) => `${n} ${n === 1 ? TEIL[s] : TEILE[s]}`;
  const anzahlen = (n) => { const s = L.stellen(n); return { H: s.h, Z: s.z, E: s.e }; };

  const materialbild = (n, weg = {}) => {
    const hat = anzahlen(n);
    const teile = STELLEN.filter((s) => hat[s]);
    const ansage = teile.map((s) => menge(s, hat[s]) + (weg[s] ? `, davon ${weg[s]} mit Pfeil` : '')).join(', ');
    return el('div', { class: 'materialbild', role: 'img', 'aria-label': 'Material: ' + ansage }, teile.map((s) => {
      const stuecke = Array.from({ length: hat[s] }, (_, i) => {
        const geht = i >= hat[s] - (weg[s] || 0);
        return el('span', { class: 'bildstueck ' + s.toLowerCase() + (geht ? ' geht' : ''), html: Z.liegend(s) + (geht ? Z.pfeil() : '') });
      });
      const spalten = [];
      for (let i = 0; i < stuecke.length; i += 5) spalten.push(el('div', { class: 'bildspalte' }, stuecke.slice(i, i + 5)));
      return el('div', { class: 'bildgruppe ' + s.toLowerCase() + (weg[s] ? ' mitpfeil' : '') }, spalten);
    }));
  };

  /* ---------- Welche Aufgabe zeigt das Bild? (wie „Lege und rechne“ im Heft) ---------- */
  U.bildrechnung = (feld, a, api) => {
    const minus = a.op === '-';
    const c = L.rechne(a.a, a.op, a.b);
    const stelle = L.stelleVon(a.b);
    const anzahl = a.b / (stelle === 'H' ? 100 : 10);
    const glatt = a.a % 100 === 0 && a.b % 100 === 0; // nur Platten: wie im Heft nur mit H
    const spalten = glatt ? ['H'] : STELLEN;

    const bild = minus
      ? materialbild(a.a, { [stelle]: anzahl })
      : el('div', { class: 'plusbild' }, materialbild(a.a), el('span', { class: 'plusgross', 'aria-label': 'plus' }, '+'), materialbild(a.b));

    const WO = {
      a: minus ? 'im ganzen Bild, auch die mit Pfeil' : 'im linken Haufen',
      b: minus ? 'nur mit Pfeil' : 'im rechten Haufen',
      c: minus ? 'ohne Pfeil' : 'in beiden Haufen zusammen',
    };

    // erste Zeile: in Hundertern, Zehnern und Einern
    const stellenLuecken = [];
    const inStellen = (wert, welche, rolle) => el('span', { class: 'rterm' }, welche.map((s) => {
      const l = luecke(anzahlen(wert)[s], { auto: true, art: 'klein' });
      l.rolle = rolle;
      l.stelle = s;
      stellenLuecken.push(l);
      return el('span', { class: 'rstelle' }, l.knoten, el('b', { class: s.toLowerCase() }, s));
    }));
    const oben = el('div', { class: 'rzeile stellenzeile' },
      inStellen(a.a, spalten, 'a'), zeichen(OP[a.op]), inStellen(a.b, [stelle], 'b'), zeichen('='), inStellen(c, spalten, 'c'));

    // zweite Zeile: dieselbe Aufgabe mit Zahlen
    const zahlLuecken = [a.a, a.b, c].map((w) => luecke(w, { auto: true }));
    const unten = el('div', { class: 'rzeile' }, zahlLuecken[0].knoten, zeichen(OP[a.op]), zahlLuecken[1].knoten, zeichen('='), zahlLuecken[2].knoten);

    const pad = rechenpult(api, [
      { zeile: oben, luecken: stellenLuecken, hinweis: (l) => `Zähle die ${WORT[l.stelle]} ${WO[l.rolle]}.` },
      {
        zeile: unten,
        luecken: zahlLuecken,
        hinweis: (l, [x, y, z]) => (l === zahlLuecken[2] && x === a.a && y === a.b
          ? L.rechenHinweis(a.a, a.op, a.b, z)
          : 'Schreibe dieselbe Aufgabe wie oben, jetzt als Zahlen.'),
      },
    ], () => api.richtig(`${rechentext(a)} = ${c}. ${NUR[stelle]}`));
    feld.append(pultMitBlatt(el('div', { class: 'rblatt' }, bild, oben, unten), pad));
  };
  MH.auftraege.bildrechnung = () => 'Welche Aufgabe zeigt das Bild? Rechne!';
  MH.vorlesetexte.bildrechnung = (a) => (a.op === '-' ? 'Die Teile mit Pfeil werden weggenommen.' : 'Beide Haufen kommen zusammen.');

  /* ---------- Lege und rechne: Teile wegziehen oder dazuziehen ---------- */
  const FALSCHES_FELD = {
    H: 'Das ist eine Hunderterplatte. Sie gehört in das Feld H.',
    Z: 'Das ist eine Zehnerstange. Sie gehört in das Feld Z.',
    E: 'Das ist ein Einerwürfel. Er gehört in das Feld E.',
  };
  U.legerechnen = (feld, a, api) => {
    const minus = a.op === '-';
    const c = L.rechne(a.a, a.op, a.b);
    const art = L.stelleVon(a.b);
    const soll = a.b / (art === 'H' ? 100 : 10);
    const start = anzahlen(a.a);
    const bewegt = { H: 0, Z: 0, E: 0 };
    let fertig = false;
    let nurTastatur = false; // nach einem Tastendruck bleibt der Fokus beim Material

    const spalten = STELLEN.map((s) => el('div', { class: 'tafelspalte ' + s.toLowerCase(), 'data-stelle': s },
      el('div', { class: 'tafelkopf' }, s), el('div', { class: 'legehaufen' })));
    const matte = el('div', { class: 'tafel legematte' }, spalten);
    const kasten = el('div', { class: minus ? 'wegkorb' : 'vorratskasten' });
    const hinweis = el('p', { class: 'tipp sortierhinweis', role: 'status' });
    const anleitung = minus
      ? 'Zieh Teile von der Tafel hierher, um sie wegzunehmen.'
      : 'Zieh neue Teile von hier auf die Tafel.';

    const nurZiehen = () => { hinweis.textContent = 'Nicht nur antippen: Ziehe das Teil mit dem Finger oder der Maus.'; };

    // ein bewegliches Teil; schritt = +1 (wegnehmen oder dazulegen) oder -1 (zurück)
    const beweglich = (s, schritt, { ziele, passt, klasse = '', name }) => {
      const k = el('button', { type: 'button', class: `teilstueck ${s.toLowerCase()} ${klasse}`, 'data-art': s, 'aria-label': name, html: Z.liegend(s) });
      const ausfuehren = () => {
        if (fertig) return;
        if (schritt > 0 && !minus && start[s] + bewegt[s] >= 9) {
          hinweis.textContent = 'Mehr als 9 passen nicht in ein Feld.';
          return;
        }
        bewegt[s] += schritt;
        hinweis.textContent = '';
        MH.ton('plopp');
        zeige();
        // Beim Wegnehmen entstehen die Teile neu, der Fokus muss mit (der Vorrat bleibt stehen)
        if (nurTastatur && (minus || schritt < 0)) {
          const naechstes = feld.querySelector(`.teilstueck[data-art="${s}"]`);
          if (naechstes) naechstes.focus();
        }
      };
      MH.ziehbar(k, {
        ziele,
        ablegen: (ziel) => {
          nurTastatur = false;
          if (passt && !passt(ziel)) { // Dazulegen: in die falsche Spalte
            api.vertan();
            hinweis.textContent = FALSCHES_FELD[s];
            wackeln(ziel);
            return;
          }
          ausfuehren();
        },
        tippen: (ev) => {
          if (ev.detail !== 0) { nurZiehen(); return; }
          nurTastatur = true;
          ausfuehren();
        },
      });
      return k;
    };
    const fest = (s, klasse = '') => el('span', { class: `teilstueck fest ${s.toLowerCase()} ${klasse}`, html: Z.liegend(s) });

    function zeige() {
      STELLEN.forEach((s, i) => {
        const haufen = spalten[i].lastChild;
        const liegt = minus ? start[s] - bewegt[s] : start[s];
        const teile = Array.from({ length: liegt }, () => (minus && !fertig
          ? beweglich(s, 1, { ziele: '.wegkorb', name: `${TEIL[s]} wegnehmen` })
          : fest(s)));
        if (!minus) {
          for (let n = 0; n < bewegt[s]; n++) {
            teile.push(fertig ? fest(s, 'neu') : beweglich(s, -1, { ziele: '.vorratskasten', klasse: 'neu', name: `${TEIL[s]} wieder zurücklegen` }));
          }
        }
        haufen.replaceChildren(...teile);
        haufen.setAttribute('aria-label', menge(s, liegt + (minus ? 0 : bewegt[s])));
      });
      if (minus) {
        const weg = STELLEN.flatMap((s) => Array.from({ length: bewegt[s] }, () => beweglich(s, -1, { ziele: '.legematte', name: `${TEIL[s]} zurücklegen` })));
        kasten.replaceChildren(el('p', {}, weg.length ? 'Weggenommen:' : anleitung), el('div', { class: 'korbteile' }, weg));
      }
    }

    if (!minus) {
      kasten.append(el('p', {}, anleitung), el('div', { class: 'korbteile' }, STELLEN.map((s) => el('div', { class: 'quelle' },
        beweglich(s, 1, {
          ziele: '.legematte .tafelspalte',
          passt: (spalte) => spalte.dataset.stelle === s,
          name: `${TEIL[s]} dazulegen`,
        }),
        el('span', {}, TEIL[s])))));
    }

    const zweiter = el('div', { class: 'zweiter-schritt', hidden: true });
    const pruefe = pruefKnopf(() => {
      const andere = STELLEN.some((s) => s !== art && bewegt[s] > 0);
      if (!andere && bewegt[art] === soll) {
        fertig = true;
        zeige();
        kasten.hidden = true;
        hinweis.hidden = true;
        pruefe.hidden = true;
        api.ruhe();
        MH.ton('plopp');
        const l = luecke(c);
        const zeile = el('div', { class: 'rzeile' }, zahl(a.a), zeichen(OP[a.op]), zahl(a.b), zeichen('='), l.knoten);
        const pad = rechenpult(api, [{ zeile, luecken: [l], hinweis: (_, [x]) => L.rechenHinweis(a.a, a.op, a.b, x) }],
          () => api.richtig(`${rechentext(a)} = ${c}. ${NUR[art]}`));
        zweiter.append(
          el('p', { class: 'frage' }, minus ? 'Weggenommen! Wie viel bleibt?' : 'Dazugelegt! Wie viel ist es jetzt?'),
          pultMitBlatt(el('div', { class: 'rblatt' }, zeile), pad));
        zweiter.hidden = false;
        insBild(zweiter);
        return;
      }
      wackeln(matte);
      const tun = minus ? 'weg' : 'dazu';
      if (andere) api.falsch(`Bei ${rechentext(a)} ${minus ? 'nimmst' : 'legst'} du nur ${WORT[art]} ${tun}.`);
      else api.falsch(bewegt[art] < soll
        ? `Es sind noch zu wenige ${WORT[art]}. Schau auf die Zahl ${a.b}.`
        : `Das sind zu viele ${WORT[art]}. Zieh welche zurück.`);
    });

    zeige();
    feld.append(el('p', { class: 'rterm gross' }, `${rechentext(a)}`), matte, kasten, hinweis, pruefe, zweiter);
    // Auf kleinen Bildschirmen so weit rollen, dass Tafel und Kasten gleichzeitig zu sehen sind.
    const rollen = requestAnimationFrame(() => {
      const ueberstand = kasten.getBoundingClientRect().bottom - window.innerHeight + 8;
      if (ueberstand > 0) window.scrollBy(0, Math.min(ueberstand, matte.getBoundingClientRect().top - 8));
    });
    MH.beimVerlassen(() => cancelAnimationFrame(rollen));
  };
  MH.auftraege.legerechnen = (a) => (a.op === '-' ? 'Lege und rechne! Nimm weg, was abgezogen wird.' : 'Lege und rechne! Lege dazu, was dazukommt.');
  MH.vorlesetexte.legerechnen = (a) => gesprochen(rechentext(a)) + '.';

  /* ---------- Was ändert sich? ---------- */
  U.aendert = (feld, a, api) => {
    const c = L.rechne(a.a, a.op, a.b);
    const stelle = L.stelleVon(a.b);
    const l = luecke(c);
    const zeile = el('div', { class: 'rzeile' }, zahl(a.a), zeichen(OP[a.op]), zahl(a.b), zeichen('='), l.knoten);
    const zweiter = el('div', { class: 'zweiter-schritt', hidden: true });
    const rechnen = el('div', { class: 'rechnen-teil' });
    const pad = rechenpult(api, [{ zeile, luecken: [l], hinweis: (_, [x]) => L.rechenHinweis(a.a, a.op, a.b, x) }], () => {
      api.ruhe();
      MH.ton('plopp');
      pad.hidden = true;
      const vorher = anzahlen(a.a), nachher = anzahlen(c);
      const wahl = el('div', { class: 'vergleichstafel' }, STELLEN.map((s) => {
        const k = el('button', {
          type: 'button', class: 'knopf stellenwahl ' + s.toLowerCase(), 'data-stelle': s,
          'aria-label': `${WORT[s]}: vorher ${vorher[s]}, nachher ${nachher[s]}`,
        }, el('b', {}, s), el('span', {}, vorher[s]), el('span', {}, nachher[s]));
        k.addEventListener('click', () => {
          if (s === stelle) {
            k.classList.add('richtig');
            api.richtig(NUR[s]);
          } else {
            k.classList.add('falsch');
            k.disabled = true;
            api.falsch('Vergleiche oben und unten: Wo steht jetzt eine andere Ziffer?');
          }
        });
        return k;
      }));
      zweiter.append(el('p', { class: 'frage' }, `Vorher ${a.a}, nachher ${c}. Welche Stelle hat sich verändert?`), wahl);
      zweiter.hidden = false;
      insBild(zweiter);
    });
    rechnen.append(pultMitBlatt(el('div', { class: 'rblatt' }, zeile), pad));
    feld.append(rechnen, zweiter);
  };
  MH.auftraege.aendert = () => 'Rechne und schau genau: Was ändert sich?';
  MH.vorlesetexte.aendert = (a) => gesprochen(rechentext(a)) + '.';

  /* ---------- Merkspruch für Frieda ---------- */
  const ANLASS = { H: 'Beim Rechnen mit Hunderterzahlen', Z: 'Beim Rechnen mit Zehnerzahlen' };
  U.merkspruch = (feld, a, api) => {
    const richtig = WORT[a.wie];
    const felder = [0, 1, 2].map((i) => el('div', { class: 'platz wortplatz', 'aria-label': `Lücke ${i + 1}` }));
    const pruefe = pruefKnopf(() => {
      if (spiel.inhalt()[0] === richtig) {
        spiel.sperre();
        spiel.karten.forEach((k) => k.classList.add('richtig'));
        api.richtig(`Danke! ${ANLASS[a.wie]} ändert sich nur die Stelle der ${richtig}.`);
        return;
      }
      const erste = felder[0].querySelector('.zahlkarte');
      if (erste) erste.classList.add('falsch');
      api.falsch(`Denk an ${a.wie === 'H' ? '345 + 200 = 545' : '345 + 20 = 365'}: Welche Ziffer ist neu?`);
    });
    const spiel = legespiel({ werte: L.misch(['Hunderter', 'Zehner', 'Einer']), felder, beimAendern: (voll) => { pruefe.disabled = !voll; } });
    spiel.karten.forEach((k) => k.classList.add('wort', k.textContent[0].toLowerCase()));
    pruefe.disabled = true;
    feld.append(
      friedaSagt('Was ändert sich? Die Hunderter, die Zehner oder die Einer?'),
      el('div', { class: 'ichsage' },
        MH.tierBild(tierName()),
        el('div', { class: 'merkblatt' },
          el('p', { class: 'merksatz folge' }, `${ANLASS[a.wie]} ändert sich nur die Stelle der `, felder[0], '.'),
          el('p', { class: 'merksatz folge' }, 'Gleich bleiben die Stellen der ', felder[1], ' und der ', felder[2], '.'))),
      spiel.vorrat, pruefe);
  };
  MH.auftraege.merkspruch = () => 'Schreibe einen Merkspruch für Frieda!';
  MH.vorlesetexte.merkspruch = (a) => `${ANLASS[a.wie]} ändert sich nur die Stelle der … Gleich bleiben die Stellen der … und der …`;

  /* ---------- Zahlenrätsel: Ich denke mir eine Zahl ---------- */
  const TAT = { '+': 'addiere', '-': 'subtrahiere' };
  const geschichte = (a) => `Ich denke mir eine Zahl. Ich ${TAT[a.op]} ${a.b}. Jetzt habe ich ${L.rechne(a.a, a.op, a.b)}.`;
  U.denkzahl = (feld, a, api) => {
    const c = L.rechne(a.a, a.op, a.b);
    const l = luecke(a.a);
    const pfeil = () => el('span', { class: 'maschinenpfeil', html: MH.symbol('weiter') });
    const maschine = el('div', { class: 'rzeile maschine' },
      l.knoten, pfeil(), el('span', { class: 'regel' }, `${OP[a.op]} ${a.b}`), pfeil(), zahl(c));
    const pad = rechenpult(api, [{ zeile: maschine, luecken: [l], hinweis: () => L.zeilenHinweis({ a: a.a, op: a.op, b: a.b, luecke: 'a' }) }],
      () => api.richtig(`Die Zahl war ${a.a}. Probe: ${rechentext(a)} = ${c}.`));
    feld.append(el('p', { class: 'geschichte' }, geschichte(a)), pultMitBlatt(el('div', { class: 'rblatt' }, maschine), pad));
  };
  MH.auftraege.denkzahl = () => 'Welche Zahl habe ich mir gedacht?';
  MH.vorlesetexte.denkzahl = geschichte;

  /* ---------- Zahlenmauer ---------- */
  const NACHBARN = [[0, 1, 3], [1, 2, 4], [3, 4, 5]]; // links + rechts = darüber
  U.mauer = (feld, a, api) => {
    const luecken = [];
    const stein = (i) => {
      if (a.gegeben.includes(i)) return el('span', { class: 'stein' }, a.steine[i]);
      luecken[i] = luecke(a.steine[i], { art: 'stein' });
      return luecken[i].knoten;
    };
    const mauer = el('div', { class: 'mauer' }, [[5], [3, 4], [0, 1, 2]].map((reihe) => el('div', { class: 'mauerreihe' }, reihe.map(stein))));

    // in der Reihenfolge, in der man die Steine ausrechnen kann
    const bekannt = new Set(a.gegeben);
    const folge = [];
    while (bekannt.size < 6) {
      const drei = NACHBARN.find((d) => d.filter((i) => bekannt.has(i)).length === 2);
      const i = drei.find((x) => !bekannt.has(x));
      const [x, y, oben] = drei;
      luecken[i].tipp = i === oben
        ? `Zwei Steine nebeneinander ergeben den Stein darüber: ${a.steine[x]} + ${a.steine[y]}.`
        : `Rechne rückwärts: ${a.steine[oben]} ${OP['-']} ${a.steine[i === x ? y : x]}.`;
      folge.push(luecken[i]);
      bekannt.add(i);
    }
    const pad = rechenpult(api, [{ luecken: folge, hinweis: (l) => l.tipp }],
      () => api.richtig('Die Mauer steht! Oben ist ' + a.steine[5] + '.'));
    feld.append(pultMitBlatt(el('div', { class: 'rblatt' }, mauer), pad));
  };
  MH.auftraege.mauer = () => 'Rechne die Zahlenmauer aus!';
  MH.vorlesetexte.mauer = () => 'Zwei Steine nebeneinander ergeben zusammen den Stein darüber.';

  /* ---------- Ergebnis-Ballons ---------- */
  U.ergebnisballons = (feld, a, api) => {
    const richtig = L.rechne(a.a, a.op, a.b);
    const farben = ['#ef4a3f', '#ffc531', '#43b649', '#2f8ae6', '#a163d6'];
    const loch = el('span', { class: 'loch' }, '?');
    const himmel = el('div', { class: 'ballonhimmel' }, a.optionen.map((n, j) => {
      const k = el('button', {
        type: 'button', class: 'ballon', style: `--farbe:${farben[j % 5]};--versatz:${(j * 37) % 40}px;--takt:${j * -0.7}s`,
      }, el('span', {}, n));
      k.addEventListener('click', () => {
        if (n === richtig) {
          k.classList.add('geplatzt');
          loch.textContent = n;
          loch.classList.add('gefunden');
          api.richtig(`${rechentext(a)} = ${richtig}.`);
        } else {
          wackeln(k);
          k.disabled = true;
          k.classList.add('daneben');
          api.falsch(L.rechenHinweis(a.a, a.op, a.b, n));
        }
      });
      return k;
    }));
    feld.append(el('p', { class: 'rterm gross' }, `${rechentext(a)} = `, loch), himmel);
  };
  MH.auftraege.ergebnisballons = () => 'Lass den richtigen Ballon platzen!';
  MH.vorlesetexte.ergebnisballons = (a) => gesprochen(rechentext(a)) + '.';

  /* ---------- Friedas Fehler finden und verbessern ---------- */
  U.friedafehler = (feld, a, api) => {
    const text = (z) => `${rechentext(z)} = ${z.ergebnis}`;
    const liste = a.zeilen.map((z) => {
      const k = el('button', { type: 'button', class: 'knopf aussage', 'aria-pressed': 'false' }, text(z));
      k.addEventListener('click', () => {
        k.setAttribute('aria-pressed', k.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        k.classList.remove('falsch');
        MH.ton('plopp');
      });
      return { k, z };
    });
    const aussagen = el('div', { class: 'aussagen rechnungsliste' }, liste.map((y) => y.k));
    const tipp = el('p', { class: 'tipp' }, 'Tippe alle falschen Rechnungen an.');
    const zweiter = el('div', { class: 'zweiter-schritt', hidden: true });
    const pruefe = pruefKnopf(() => {
      const an = (y) => y.k.getAttribute('aria-pressed') === 'true';
      const zuviel = liste.filter((y) => an(y) && y.z.stimmt);
      const fehlt = liste.filter((y) => !an(y) && !y.z.stimmt);
      if (zuviel.length || fehlt.length) {
        zuviel.forEach((y) => { y.k.classList.add('falsch'); y.k.setAttribute('aria-pressed', 'false'); });
        api.falsch(zuviel.length
          ? `${text(zuviel[0].z)} ist doch richtig.`
          : 'Ein Fehler versteckt sich noch. Schau, welche Stelle sich geändert hat.');
        return;
      }
      api.ruhe();
      MH.ton('plopp');
      aussagen.hidden = true;
      tipp.hidden = true;
      pruefe.hidden = true;
      const falsche = liste.filter((y) => !y.z.stimmt).map((y) => y.z);
      const gruppen = falsche.map((z) => {
        const l = luecke(L.rechne(z.a, z.op, z.b));
        return {
          zeile: el('div', { class: 'rzeile' }, zahl(z.a), zeichen(OP[z.op]), zahl(z.b), zeichen('='), l.knoten),
          luecken: [l],
          hinweis: (_, [x]) => L.rechenHinweis(z.a, z.op, z.b, x),
          geschafft: () => faerbe(l.knoten, l.loesung, L.stelleVon(z.b)),
        };
      });
      const pad = rechenpult(api, gruppen, () => api.richtig('Gefunden und verbessert. Frieda sagt Danke!'));
      const blatt = el('div', { class: 'rblatt spalten' }, gruppen.map((g) => g.zeile));
      spaltenBreiten(blatt, falsche.map((z) => alsZeile(z, 'c')));
      zweiter.append(el('p', { class: 'frage' }, 'Gefunden! Jetzt rechne richtig.'), pultMitBlatt(blatt, pad));
      zweiter.hidden = false;
      insBild(zweiter);
    });
    feld.append(friedaSagt('Habe ich richtig gerechnet?'), aussagen, tipp, pruefe, zweiter);
  };
  MH.auftraege.friedafehler = () => 'Welche Rechnungen von Frieda sind falsch?';
  MH.vorlesetexte.friedafehler = (a) => a.zeilen.map((z) => gesprochen(`${rechentext(z)} = ${z.ergebnis}.`)).join(' ');
})();
