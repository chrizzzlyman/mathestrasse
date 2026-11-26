/* Die Aufgabenformate. Jedes Format zeichnet sich in `feld` und meldet
 * api.richtig(satz) oder api.falsch(hinweis) -> Anzahl der Fehlversuche bei dieser Aufgabe. */
(function () {
  'use strict';
  const MH = window.MH;
  const { el } = MH;
  const L = MH.logik;
  const Z = MH.zeichne;
  const U = MH.uebungen = {};

  const WORT = { H: 'Hunderter', Z: 'Zehner', E: 'Einer' };

  const knopf = (text, tun, klasse = '') => el('button', { type: 'button', class: 'knopf ' + klasse, onclick: tun }, text);
  const pruefKnopf = (tun) => knopf('Prüfen', tun, 'haupt pruefen');
  const wackeln = (e) => { e.classList.remove('wackelt'); void e.offsetWidth; e.classList.add('wackelt'); };

  const zeichenKnoepfe = (waehle, mitGleich = true) => el('div', { class: 'zeichenwahl' },
    (mitGleich ? ['<', '=', '>'] : ['<', '>']).map((z) => el('button', {
      type: 'button', class: 'knopf zeichen', 'data-zeichen': z, 'aria-label': L.worte[z],
      onclick: (ev) => waehle(z, ev.currentTarget),
    }, el('b', {}, z), el('span', {}, L.worte[z]))));

  const hze = (n) => {
    const s = L.stellen(n);
    return el('span', { class: 'hze', 'aria-label': `${s.h} Hunderter, ${s.z} Zehner, ${s.e} Einer` },
      el('span', { class: 'h' }, s.h + 'H'), el('span', { class: 'z' }, s.z + 'Z'), el('span', { class: 'e' }, s.e + 'E'));
  };

  /* Waage wie im Booklet: zwei Teller, darunter der Kasten mit den Zahlen. */
  function waage(links, rechts) {
    const teller = (seite, inhalt) => el('div', { class: 'schale ' + seite },
      el('div', { class: 'ware' }, inhalt), el('div', { class: 'teller' }), el('div', { class: 'stiel' }));
    const wareL = el('div'), wareR = el('div', { class: 'ablage' });
    const feldL = el('span', { class: 'zahlfeld' }, links);
    const mitte = el('span', { class: 'zeichenfeld' }, '?');
    const feldR = el('span', { class: 'zahlfeld' }, rechts);
    const balken = el('div', { class: 'balken', 'aria-hidden': 'true' });
    const knoten = el('div', { class: 'waage' },
      el('div', { class: 'stuetze', 'aria-hidden': 'true' }), balken,
      teller('links', wareL), teller('rechts', wareR),
      el('div', { class: 'kasten' }, feldL, mitte, feldR));
    return {
      knoten, wareL, wareR, mitte, feldR,
      neige: (zeichen) => {
        knoten.setAttribute('data-neigung', zeichen);
        // Die Teller stehen bei -24px und +20px; der Balken verbindet sie
        const grad = Math.atan2(44, (knoten.offsetWidth || 600) / 2) * (180 / Math.PI);
        const richtung = zeichen === '<' ? 1 : zeichen === '>' ? -1 : 0;
        balken.style.transform = `translateY(${richtung ? -2 : 0}px) rotate(${richtung * grad}deg)`;
      },
    };
  }

  /* ---------- Zwei Zahlen vergleichen (Waage, Material, HZE, Ziffern) ---------- */
  U.vergleich = (feld, a, api) => {
    const richtig = L.zeichen(a.a, a.b);
    let mitte, nachher = () => {}, markiere = () => {};

    if (a.bild === 'waage') {
      const w = waage(a.a, a.b);
      const rahmen = Z.rahmen(a.a, a.b);
      w.wareL.innerHTML = Z.material(a.a, 'bunt', rahmen);
      w.wareR.innerHTML = Z.material(a.b, 'bunt', rahmen);
      mitte = w.mitte;
      nachher = () => w.neige(richtig);
      feld.append(w.knoten);
    } else {
      mitte = el('span', { class: 'zeichenfeld' }, '?');
      const seite = (n) => {
        if (a.bild === 'holz') return el('div', { class: 'karte menge', html: Z.material(n, 'holz', Z.rahmen(a.a, a.b)) });
        if (a.bild === 'hze') return el('div', { class: 'karte' }, hze(n));
        return el('div', { class: 'karte grosszahl' }, n);
      };
      const reihe = el('div', { class: 'vergleichsreihe ' + a.bild }, seite(a.a), mitte, seite(a.b));
      feld.append(reihe);
      if (a.bild === 'hze') {
        markiere = () => {
          const stelle = L.entscheidend(a.a, a.b);
          const klassen = stelle ? [stelle.toLowerCase()] : ['h', 'z', 'e'];
          klassen.forEach((k) => reihe.querySelectorAll('.hze .' + k).forEach((s) => s.classList.add('entscheidet')));
        };
      }
    }

    feld.append(zeichenKnoepfe((z, k) => {
      if (z === richtig) {
        mitte.textContent = z;
        mitte.classList.add('gefunden');
        k.classList.add('richtig');
        markiere();
        nachher();
        api.richtig(L.satz(a.a, a.b));
      } else {
        k.classList.add('falsch');
        k.disabled = true;
        markiere();
        api.falsch(L.hinweis(a.a, a.b) + ' Das Krokodilmaul öffnet sich immer zur größeren Zahl.');
      }
    }));
  };

  /* ---------- Merksatz aus dem Booklet ---------- */
  U.merksatz = (feld, a, api) => {
    const luecke = el('span', { class: 'luecke' }, '…');
    feld.append(el('p', { class: 'merksatz' }, a.vor + ' ', luecke, '.'));
    if (a.nach) feld.append(el('p', { class: 'merksatz' }, a.nach));
    feld.append(el('div', { class: 'wortwahl' }, ['Einer', 'Hunderter', 'Zehner'].map((wort) => {
      const k = knopf(wort, () => {
        if (wort === a.loesung) {
          luecke.textContent = wort;
          luecke.classList.add('gefunden', wort[0].toLowerCase());
          k.classList.add('richtig');
          api.richtig(`${a.vor} ${wort}.`);
        } else {
          k.classList.add('falsch');
          k.disabled = true;
          api.falsch('Denk an die Aufgaben davor: Auf welche Stelle hast du geschaut?');
        }
      }, 'wort ' + wort[0].toLowerCase());
      return k;
    })));
  };

  /* ---------- Was hat entschieden? ---------- */
  U.entschieden = (feld, a, api) => {
    const richtig = L.zeichen(a.a, a.b);
    const stelle = L.entscheidend(a.a, a.b);
    const mitte = el('span', { class: 'zeichenfeld' }, '?');
    const ziffern = (n) => el('div', { class: 'karte grosszahl' },
      String(n).split('').map((d, i) => el('span', { 'data-stelle': 'HZE'[i] }, d)));
    const reihe = el('div', { class: 'vergleichsreihe' }, ziffern(a.a), mitte, ziffern(a.b));
    const zwei = el('div', { class: 'zweiter-schritt', hidden: true },
      el('p', { class: 'frage' }, 'Was hat entschieden?'),
      el('div', { class: 'wortwahl' }, ['H', 'Z', 'E'].map((s) => {
        const k = knopf(WORT[s], () => {
          if (s === stelle) {
            k.classList.add('richtig');
            reihe.querySelectorAll(`[data-stelle="${s}"]`).forEach((x) => x.classList.add('entscheidet', s.toLowerCase()));
            api.richtig(`${L.satz(a.a, a.b)} Die ${WORT[s]} haben entschieden.`);
          } else {
            k.classList.add('falsch');
            k.disabled = true;
            api.falsch('Vergleiche von links nach rechts. Wo sind die Ziffern zum ersten Mal verschieden?');
          }
        }, 'wort ' + s.toLowerCase());
        return k;
      })));
    const wahl = zeichenKnoepfe((z, k) => {
      if (z === richtig) {
        mitte.textContent = z;
        mitte.classList.add('gefunden');
        MH.ton('plopp');
        wahl.hidden = true;
        zwei.hidden = false;
      } else {
        k.classList.add('falsch');
        k.disabled = true;
        api.falsch(L.hinweis(a.a, a.b));
      }
    }, false);
    feld.append(reihe, wahl, zwei);
  };

  /* ---------- Lege auf der Waage nach ---------- */
  U.waageLegen = (feld, a, api) => {
    const lege = { H: 0, Z: 0, E: 0 };
    const w = waage(a.ziel, '…');
    if (!a.zeigeMaterial) w.wareL.append(el('div', { class: 'gewicht' }, a.ziel));
    let fertig = false;
    const wert = () => L.zahl(lege.H, lege.Z, lege.E);
    const zaehler = {};
    const zeige = () => {
      const rahmen = Z.rahmen(a.ziel, wert());
      if (a.zeigeMaterial) w.wareL.innerHTML = Z.material(a.ziel, 'bunt', rahmen);
      w.wareR.innerHTML = Z.material(wert(), 'bunt', rahmen);
      w.neige(L.zeichen(a.ziel, wert()));
      for (const k of ['H', 'Z', 'E']) {
        zaehler[k].weg.disabled = fertig || lege[k] === 0;
        zaehler[k].dazu.disabled = fertig || lege[k] === 9;
      }
    };
    const aendere = (k, um) => {
      if (fertig) return;
      lege[k] = Math.max(0, Math.min(9, lege[k] + um));
      MH.ton('plopp');
      zeige();
    };
    const namen = { H: 'Hunderterplatte', Z: 'Zehnerstange', E: 'Einerwürfel' };
    const lager = el('div', { class: 'lager' }, ['H', 'Z', 'E'].map((k) => {
      const dazu = el('button', {
        type: 'button', class: 'knopf teil', 'data-art': k, 'aria-label': namen[k] + ' dazulegen',
      }, el('span', { html: Z.einzelteil(k) }), el('span', {}, namen[k]));
      MH.ziehbar(dazu, { ziele: '.schale.rechts', tippen: () => aendere(k, 1), ablegen: () => aendere(k, 1) });
      const weg = el('button', {
        type: 'button', class: 'knopf klein', 'aria-label': namen[k] + ' wegnehmen', onclick: () => aendere(k, -1),
      }, 'wegnehmen');
      zaehler[k] = { dazu, weg };
      return el('div', { class: 'fach' }, dazu, weg);
    }));
    const pruefe = pruefKnopf(() => {
      if (wert() === a.ziel) {
        fertig = true;
        w.feldR.textContent = wert();
        w.mitte.textContent = '=';
        w.mitte.classList.add('gefunden');
        zeige();
        api.richtig(`${a.ziel} ist gleich viel wie ${a.ziel}. Auf beiden Seiten ist gleich viel.`);
      } else {
        wackeln(w.knoten);
        const soll = L.stellen(a.ziel);
        const k = soll.h !== lege.H ? 'H' : soll.z !== lege.Z ? 'Z' : 'E';
        const mehr = soll[k.toLowerCase()] > lege[k];
        api.falsch(`Schau auf die ${WORT[k]}: Rechts sind es noch zu ${mehr ? 'wenige' : 'viele'}.`);
      }
    });
    feld.append(w.knoten, lager, pruefe);
    zeige();
  };

  /* ---------- Was ist gleich viel? ---------- */
  U.gleichViel = (feld, a, api) => {
    const liste = a.optionen.map((o) => {
      const k = el('button', { type: 'button', class: 'knopf rechnung', 'aria-pressed': 'false' }, o.text);
      k.addEventListener('click', () => {
        k.setAttribute('aria-pressed', k.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        k.classList.remove('falsch');
        MH.ton('plopp');
      });
      return { k, o };
    });
    const pruefe = pruefKnopf(() => {
      const an = (x) => x.k.getAttribute('aria-pressed') === 'true';
      const zuviel = liste.filter((x) => an(x) && x.o.wert !== a.zahl);
      const fehlt = liste.filter((x) => !an(x) && x.o.wert === a.zahl);
      if (!zuviel.length && !fehlt.length) {
        liste.forEach((x) => x.k.classList.toggle('richtig', x.o.wert === a.zahl));
        const passend = liste.find((x) => x.o.wert === a.zahl);
        api.richtig(`${a.zahl} ist gleich viel wie ${passend.o.text}.`);
        return;
      }
      zuviel.forEach((x) => { x.k.classList.add('falsch'); x.k.setAttribute('aria-pressed', 'false'); });
      const n = api.falsch(zuviel.length
        ? 'Rechne nach: Wie viele Hunderter, Zehner und Einer sind es zusammen?'
        : 'Da fehlt noch etwas. Schau dir jede Rechnung an.');
      if (n >= 2) liste.forEach((x) => { x.k.textContent = `${x.o.text}  (das sind ${x.o.wert})`; });
    });
    feld.append(
      el('div', { class: 'zielzahl' }, a.zahl),
      el('p', { class: 'frage' }, 'ist gleich viel wie:'),
      el('div', { class: 'rechnungen' }, liste.map((x) => x.k)),
      pruefe);
  };

  /* ---------- Ballons ---------- */
  U.ballons = (feld, a, api) => {
    const sortiert = a.zahlen.slice().sort((x, y) => x - y);
    let i = 0;
    const leine = el('div', { class: 'leine', 'aria-live': 'polite' });
    const farben = ['#ef4a3f', '#ffc531', '#43b649', '#2f8ae6', '#a163d6'];
    const himmel = el('div', { class: 'ballonhimmel' }, a.zahlen.map((n, j) => {
      const k = el('button', {
        type: 'button', class: 'ballon', style: `--farbe:${farben[j % 5]};--versatz:${(j * 37) % 50}px;--takt:${j * -0.7}s`,
      }, el('span', {}, n));
      k.addEventListener('click', () => {
        if (n === sortiert[i]) {
          i++;
          k.classList.add('geplatzt');
          k.disabled = true;
          MH.ton('plopp');
          leine.append(el('span', {}, (i > 1 ? '< ' : '') + n));
          if (i === sortiert.length) api.richtig(sortiert.join(' < '));
        } else {
          wackeln(k);
          api.falsch('Gibt es noch eine kleinere Zahl? Vergleiche zuerst die Hunderter.');
        }
      });
      return k;
    }));
    feld.append(himmel, leine);
  };

  /* ---------- Karten in Felder legen (Ordnen, Ziffernkarten) ---------- */
  function legespiel({ werte, felder, beimAendern }) {
    const belegung = felder.map(() => null); // Index der Karte
    let gesperrt = false;
    const vorrat = el('div', { class: 'vorrat' });
    const karten = werte.map((v, i) => {
      const k = el('button', { type: 'button', class: 'knopf zahlkarte' }, v);
      MH.ziehbar(k, {
        ziele: '.platz, .vorrat',
        tippen: () => {
          if (gesperrt) return;
          const wo = belegung.indexOf(i);
          if (wo >= 0) belegung[wo] = null;
          else {
            const frei = belegung.indexOf(null);
            if (frei >= 0) belegung[frei] = i;
          }
          zeige();
        },
        ablegen: (ziel) => {
          if (gesperrt) return;
          const von = belegung.indexOf(i);
          const nach = felder.indexOf(ziel);
          if (nach < 0) { if (von >= 0) belegung[von] = null; } else {
            const dort = belegung[nach];
            if (von >= 0) belegung[von] = dort; // tauschen
            belegung[nach] = i;
          }
          zeige();
        },
      });
      return k;
    });
    function zeige() {
      MH.ton('plopp');
      karten.forEach((k, i) => {
        k.classList.remove('falsch');
        const wo = belegung.indexOf(i);
        (wo >= 0 ? felder[wo] : vorrat).append(k);
      });
      beimAendern(belegung.every((b) => b !== null));
    }
    karten.forEach((k) => vorrat.append(k));
    return {
      vorrat, karten, belegung,
      inhalt: () => belegung.map((b) => (b === null ? null : werte[b])),
      sperre: () => { gesperrt = true; },
    };
  }

  // Bausteine, die auch die Formate in uebungen-stellen.js benutzen
  MH.bausteine = { knopf, pruefKnopf, wackeln, legespiel, WORT };
  MH.auftraege = {};   // art -> (aufgabe, raum) => Überschrift
  MH.vorlesetexte = {}; // art -> (aufgabe) => zusätzlicher Text zum Vorlesen

  U.ordnen = (feld, a, api) => {
    const auf = a.richtung === 'auf';
    const soll = a.zahlen.slice().sort((x, y) => (auf ? x - y : y - x));
    const felder = a.zahlen.map((_, i) => el('div', { class: 'platz', 'aria-label': `Platz ${i + 1}` }));
    const pruefe = pruefKnopf(() => {
      const ist = spiel.inhalt();
      if (ist.every((v, i) => v === soll[i])) {
        spiel.sperre();
        spiel.karten.forEach((k) => k.classList.add('richtig'));
        api.richtig(soll.join(auf ? ' < ' : ' > '));
        return;
      }
      ist.forEach((v, i) => { if (v !== soll[i]) spiel.karten[spiel.belegung[i]].classList.add('falsch'); });
      api.falsch(`Welche Zahl ist am ${auf ? 'kleinsten' : 'größten'}? Vergleiche zuerst die Hunderter, dann die Zehner, dann die Einer.`);
    });
    pruefe.disabled = true;
    const spiel = legespiel({ werte: a.zahlen, felder, beimAendern: (voll) => { pruefe.disabled = !voll; } });
    const reihe = el('div', { class: 'ordnungsreihe' },
      felder.flatMap((f, i) => (i ? [el('span', { class: 'trenner' }, auf ? '<' : '>'), f] : [f])));
    feld.append(spiel.vorrat, el('p', { class: 'frage' }, auf ? 'ist kleiner als' : 'ist größer als'), reihe, pruefe);
  };

  U.ziffern = (feld, a, api) => {
    const felder = ['h', 'z', 'e'].map((s) => el('div', { class: 'platz', 'aria-label': WORT[s.toUpperCase()] }));
    const pruefe = pruefKnopf(() => {
      const ist = spiel.inhalt();
      const n = L.zahl(ist[0], ist[1], ist[2]);
      if (ist[0] !== 0 && a.loesungen.includes(n)) {
        spiel.sperre();
        spiel.karten.forEach((k) => k.classList.add('richtig'));
        api.richtig(a.ziel === 'zwischen'
          ? `${n} liegt zwischen ${a.von} und ${a.bis}.`
          : `${n} ist die ${a.ziel === 'groesste' ? 'größte' : 'kleinste'} Zahl aus diesen Karten.`);
        return;
      }
      let tipp;
      if (ist[0] === 0) tipp = 'Eine dreistellige Zahl beginnt nicht mit 0.';
      else if (a.ziel === 'groesste') tipp = 'Die größte Ziffer gehört zu den Hundertern. Und dann?';
      else if (a.ziel === 'kleinste') tipp = 'Welche kleine Ziffer darf bei den Hundertern stehen? Die 0 darf nicht vorne sein.';
      else tipp = `Deine Zahl ${n} liegt nicht dazwischen. Probiere andere Hunderter.`;
      api.falsch(tipp);
    });
    pruefe.disabled = true;
    const spiel = legespiel({ werte: a.ziffern, felder, beimAendern: (voll) => { pruefe.disabled = !voll; } });
    const tafel = el('div', { class: 'stellentafel' }, felder.map((f, i) => el('div', { class: 'spalte' },
      el('span', { class: 'stellenname ' + 'hze'[i] }, 'HZE'[i]), f)));
    feld.append(spiel.vorrat, tafel, pruefe);
  };

  /* ---------- Lückenziffer ---------- */
  U.luecke = (feld, a, api) => {
    const [vor, nach] = a.muster.split('_');
    const loch = el('span', { class: 'loch' }, '?');
    const probe = el('p', { class: 'probe', 'aria-live': 'polite' }, 'Tippe eine Ziffer an und probiere sie aus.');
    const gewaehlt = new Set();
    const ziffern = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
      const k = el('button', { type: 'button', class: 'knopf ziffer', 'aria-pressed': 'false' }, d);
      k.addEventListener('click', () => {
        const an = !gewaehlt.has(d);
        if (an) gewaehlt.add(d); else gewaehlt.delete(d);
        k.setAttribute('aria-pressed', String(an));
        k.classList.remove('falsch');
        loch.textContent = an ? d : '?';
        probe.textContent = an
          ? `Eingesetzt: ${L.einsetzen(a.muster, d)} ${a.zeichen} ${a.rechts}. Stimmt das?`
          : `${d} ist wieder abgewählt.`;
        MH.ton('plopp');
      });
      return k;
    });
    const pruefe = pruefKnopf(() => {
      const falsche = [...gewaehlt].filter((d) => !a.loesungen.includes(d));
      const fehlen = a.loesungen.filter((d) => !gewaehlt.has(d));
      if (!falsche.length && !fehlen.length) {
        a.loesungen.forEach((d) => ziffern[d].classList.add('richtig'));
        api.richtig(`Diese Ziffern passen: ${a.loesungen.join(', ')}.`);
        return;
      }
      let tipp;
      if (falsche.length) {
        const d = falsche[0];
        tipp = `Die ${d} passt nicht: ${L.einsetzen(a.muster, d)} ${a.zeichen} ${a.rechts} stimmt nicht.`;
        falsche.forEach((x) => {
          gewaehlt.delete(x);
          ziffern[x].setAttribute('aria-pressed', 'false');
          ziffern[x].classList.add('falsch');
        });
      } else {
        tipp = fehlen.length === 1 ? 'Eine Ziffer fehlt noch.' : `Es fehlen noch ${fehlen.length} Ziffern.`;
      }
      api.falsch(tipp);
    });
    feld.append(
      el('div', { class: 'lueckenreihe' },
        el('span', { class: 'karte grosszahl' }, vor, loch, nach),
        el('span', { class: 'zeichenfeld gefunden' }, a.zeichen),
        el('span', { class: 'karte grosszahl' }, a.rechts)),
      probe,
      el('div', { class: 'ziffernwahl' }, ziffern),
      pruefe);
  };

  /* ---------- Zahlen-Detektiv ---------- */
  U.raetsel = (feld, a, api) => {
    const karten = a.kandidaten.map((n) => {
      const k = knopf(String(n), () => {
        if (n === a.loesung) {
          k.classList.add('richtig');
          api.richtig(`Gefunden! Die gesuchte Zahl ist ${n}.`);
        } else {
          k.classList.add('falsch', 'raus');
          k.disabled = true;
          const verletzt = a.hinweise.find((h) => !h.passt(n));
          api.falsch(`${n} passt nicht zu diesem Hinweis: „${verletzt.text}“`);
        }
      }, 'zahlkarte');
      return k;
    });
    feld.append(
      el('ol', { class: 'hinweise' }, a.hinweise.map((h) => el('li', {}, h.text))),
      el('div', { class: 'vorrat' }, karten));
  };

  /* ---------- Fehler finden ---------- */
  U.fehler = (feld, a, api) => {
    const liste = a.aussagen.map((x) => {
      const k = el('button', { type: 'button', class: 'knopf aussage', 'aria-pressed': 'false' }, `${x.a} ${x.zeichen} ${x.b}`);
      k.addEventListener('click', () => {
        k.setAttribute('aria-pressed', k.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        k.classList.remove('falsch');
        MH.ton('plopp');
      });
      return { k, x };
    });
    const pruefe = pruefKnopf(() => {
      const an = (y) => y.k.getAttribute('aria-pressed') === 'true';
      const zuviel = liste.filter((y) => an(y) && y.x.stimmt);
      const fehlt = liste.filter((y) => !an(y) && !y.x.stimmt);
      if (!zuviel.length && !fehlt.length) {
        liste.forEach((y) => { if (!y.x.stimmt) y.k.classList.add('richtig'); });
        api.richtig('Alle Fehler gefunden!');
        return;
      }
      zuviel.forEach((y) => { y.k.classList.add('falsch'); y.k.setAttribute('aria-pressed', 'false'); });
      api.falsch(zuviel.length
        ? `${zuviel[0].x.a} ${zuviel[0].x.zeichen} ${zuviel[0].x.b} ist doch richtig.`
        : fehlt.length === 1 ? 'Ein Fehler versteckt sich noch.' : `Noch ${fehlt.length} Fehler verstecken sich.`);
    });
    feld.append(el('div', { class: 'aussagen' }, liste.map((y) => y.k)), pruefe);
  };

  // Das kleine Bild eines Zimmers: Zehnersystem-Teil ('H', 'Z', 'E') oder Datei aus assets/bilder
  MH.raumBild = (raum) => el('span', {
    class: 'zimmerbild', 'aria-hidden': 'true',
    html: ['H', 'Z', 'E'].includes(raum.bild) ? Z.einzelteil(raum.bild) : `<img src="assets/bilder/${raum.bild || 'star'}.svg" alt="">`,
  });

  /* ---------- Auftrag je Aufgabe ---------- */
  MH.auftragVon = (aufgabe, raum) => {
    if (MH.auftraege[aufgabe.art]) return MH.auftraege[aufgabe.art](aufgabe, raum);
    if (aufgabe.art === 'merksatz') return 'Wie heißt der Merksatz?';
    if (aufgabe.art === 'ordnen') return aufgabe.richtung === 'auf' ? 'Ordne von klein nach groß!' : 'Ordne von groß nach klein!';
    if (aufgabe.art === 'ziffern') {
      if (aufgabe.ziel === 'groesste') return 'Baue die größte Zahl!';
      if (aufgabe.ziel === 'kleinste') return 'Baue die kleinste Zahl!';
      return `Baue eine Zahl zwischen ${aufgabe.von} und ${aufgabe.bis}!`;
    }
    return raum.auftrag;
  };

  const vorlesetext = (aufgabe, auftrag) => {
    let text = auftrag;
    if (aufgabe.art === 'raetsel') text += ' ' + aufgabe.hinweise.map((h) => h.text).join(' ');
    if (aufgabe.art === 'merksatz') text += ` ${aufgabe.vor} … ${aufgabe.nach}`;
    if (aufgabe.art === 'gleichViel') text += ` Die Zahl ist ${aufgabe.zahl}.`;
    if (MH.vorlesetexte[aufgabe.art]) text += ' ' + MH.vorlesetexte[aufgabe.art](aufgabe);
    return text;
  };

  // Formate mit Zeitschaltern melden hier an, was beim Verlassen zu stoppen ist.
  let beimVerlassen = [];
  MH.beimVerlassen = (f) => beimVerlassen.push(f);
  MH.aufraeumenNachAufgabe = () => { beimVerlassen.forEach((f) => f()); beimVerlassen = []; };

  /* ---------- Ein Zimmer durchspielen ---------- */
  MH.raumSpielen = (wurzel, { raum, aufgaben, abschluss }) => {
    let i = 0, fehler = 0;
    const beginn = Date.now();
    const sitzung = MH.speicher && MH.speicher.sitzung;
    const tier = sitzung && !sitzung.gast ? sitzung.tier : null;
    const LOB = ['Richtig!', 'Super!', 'Stark!', 'Genau!', 'Klasse!'];
    const sprechblase = (kopfzeile, text, weiter) => [
      MH.tierBild(tier),
      el('div', { class: 'blase' }, el('div', {}, el('b', { class: 'lob' }, kopfzeile), el('p', {}, text)), weiter),
    ];
    const ziegel = el('div', { class: 'ziegel', role: 'img' }, aufgaben.map(() => el('i')));
    const buehne = el('div', { class: 'buehne' });
    wurzel.append(ziegel, buehne);

    const zeige = () => {
      MH.aufraeumenNachAufgabe();
      const aufgabe = aufgaben[i];
      let versuche = 0, geloest = false;
      const auftrag = MH.auftragVon(aufgabe, raum);
      ziegel.setAttribute('aria-label', `Aufgabe ${i + 1} von ${aufgaben.length}`);
      [...ziegel.children].forEach((z, j) => { z.className = j < i ? 'gelegt' : j === i ? 'jetzt' : ''; });

      const feld = el('div', { class: 'feld art-' + aufgabe.art });
      const meldung = el('div', { class: 'meldung', role: 'status' });
      buehne.replaceChildren(
        el('div', { class: 'auftrag' },
          MH.tierBild(tier),
          el('h2', {}, auftrag),
          MH.kannVorlesen && el('button', {
            type: 'button', class: 'knopf klein vorlesen', onclick: () => MH.sprich(vorlesetext(aufgabe, auftrag)),
            'aria-label': 'Vorlesen',
          }, el('span', { style: 'display:contents', html: MH.symbol('vorlesen') }), el('span', { class: 'wortlaut' }, 'Vorlesen'))),
        feld, meldung);

      const api = {
        richtig: (satz) => {
          if (geloest) return;
          geloest = true;
          MH.ton('richtig');
          feld.classList.add('gesperrt');
          feld.querySelectorAll('button').forEach((b) => { b.disabled = true; });
          ziegel.children[i].className = 'gelegt';
          const weiter = el('button', {
            type: 'button', class: 'knopf haupt',
            onclick: () => {
              if (window.speechSynthesis) speechSynthesis.cancel();
              i++;
              if (i < aufgaben.length) zeige();
              else abschluss({ fehler, dauer: (Date.now() - beginn) / 1000, anzahl: aufgaben.length });
            },
          }, i + 1 < aufgaben.length ? 'Weiter' : 'Zimmer abschließen');
          meldung.className = 'meldung gut';
          meldung.replaceChildren(...sprechblase(LOB[i % LOB.length], satz, weiter));
          weiter.focus({ preventScroll: true });
          meldung.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        },
        // blendet den letzten Hinweis aus, wenn innerhalb einer Aufgabe ein Schritt geschafft ist
        ruhe: () => {
          meldung.className = 'meldung';
          meldung.replaceChildren();
        },
        // zählt einen Fehler; den Hinweis zeigt die Übung selbst (ohne dass die Seite rollt)
        vertan: () => {
          versuche++;
          fehler++;
          MH.ton('falsch');
        },
        falsch: (hinweis) => {
          versuche++;
          fehler++;
          MH.ton('falsch');
          meldung.className = 'meldung nochmal';
          meldung.replaceChildren(...sprechblase('Noch nicht ganz.', hinweis));
          meldung.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return versuche;
        },
      };
      U[aufgabe.art](feld, aufgabe, api);
      window.scrollTo(0, 0);
    };
    zeige();
  };

  // 3 Sterne ohne Fehler, 2 Sterne bei wenigen Fehlern, sonst 1. Fertig ist immer fertig.
  MH.sterneFuer = (fehler, anzahl) => (fehler === 0 ? 3 : fehler <= Math.ceil(anzahl / 3) ? 2 : 1);
})();
