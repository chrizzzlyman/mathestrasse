/* Aufgabenformate rund um Hunderter, Zehner, Einer und Zahlwörter (Haus 9).
 * Gleiche Regeln wie in uebungen.js: in `feld` zeichnen, api.richtig(satz) oder api.falsch(hinweis) melden. */
(function () {
  'use strict';
  const MH = window.MH;
  const { el } = MH;
  const L = MH.logik;
  const Z = MH.zeichne;
  const U = MH.uebungen;
  const { knopf, pruefKnopf, wackeln, legespiel, WORT } = MH.bausteine;

  const STELLEN = ['H', 'Z', 'E'];
  const TEIL = { H: 'Quadrat', Z: 'Strich', E: 'Punkt' };
  const ziffernVon = (n) => { const s = L.stellen(n); return [s.h, s.z, s.e]; };
  const zerlegt = (n) => { const s = L.stellen(n); return `${s.h} Hunderter, ${s.z} Zehner, ${s.e} Einer`; };
  const bild = (html, klasse) => el('span', { class: klasse, html });

  /* ---------- Baustein: Zahlwort farbig wie im Booklet ---------- */
  const farbwort = (n) => el('span', { class: 'zahlwort' },
    L.zahlwortTeile(n).flatMap((t, i) => [i ? el('wbr') : null, el('span', { class: 'teil-' + t.art }, t.text)]));

  /* ---------- Baustein: drei Kästchen und ein Ziffernfeld ---------- */
  function ziffernEingabe({ kopf = 'hze', beiVoll = () => {} } = {}) {
    const werte = [null, null, null];
    let aktiv = 0, gesperrt = false;
    const kaesten = STELLEN.map((s, i) => el('button', {
      type: 'button', class: 'kaestchen', 'aria-label': WORT[s], onclick: () => { if (!gesperrt) { aktiv = i; zeige(); } },
    }));
    const zeige = () => {
      kaesten.forEach((k, i) => {
        k.textContent = werte[i] === null ? '' : werte[i];
        k.classList.toggle('aktiv', i === aktiv && !gesperrt);
      });
      beiVoll(werte.every((w) => w !== null));
    };
    const setze = (d) => {
      if (gesperrt) return;
      werte[aktiv] = d;
      kaesten[aktiv].classList.remove('falsch');
      const frei = [1, 2].map((v) => (aktiv + v) % 3).find((i) => werte[i] === null);
      aktiv = frei === undefined ? Math.min(aktiv + 1, 2) : frei;
      MH.ton('plopp');
      zeige();
    };
    const loesche = () => {
      if (gesperrt) return;
      if (werte[aktiv] === null && aktiv > 0) aktiv--;
      werte[aktiv] = null;
      zeige();
    };
    const knoten = el('div', { class: 'eingabe' },
      el('div', { class: 'kaestchenreihe' }, STELLEN.map((s, i) => el('div', { class: 'spalte' },
        kopf === 'zeichen' ? bild(Z.zeichen(s), 'zeichenkopf') : el('span', { class: 'stellenname ' + s.toLowerCase() }, s),
        kaesten[i]))),
      el('div', { class: 'tasten' },
        [1, 2, 3, 4, 5].map((d) => knopf(String(d), () => setze(d), 'ziffer')),
        el('button', { type: 'button', class: 'knopf ziffer', 'aria-label': 'Ziffer löschen', html: MH.symbol('loeschen'), onclick: loesche }),
        [6, 7, 8, 9, 0].map((d) => knopf(String(d), () => setze(d), 'ziffer'))));
    knoten.addEventListener('keydown', (ev) => {
      if (/^[0-9]$/.test(ev.key)) setze(Number(ev.key));
      if (ev.key === 'Backspace') loesche();
    });
    zeige();
    return {
      knoten,
      werte: () => werte.slice(),
      zahl: () => (werte.every((w) => w !== null) ? L.zahl(werte[0], werte[1], werte[2]) : null),
      markiere: (zahl) => ziffernVon(zahl).forEach((d, i) => kaesten[i].classList.toggle('falsch', werte[i] !== d)),
      sperre: () => { gesperrt = true; kaesten.forEach((k) => { k.classList.remove('aktiv'); k.classList.add('richtig'); }); },
    };
  }

  // Kästchen mit Prüfen-Knopf: der häufigste Abschluss einer Aufgabe
  function zahlAbfragen(api, zahl, { kopf, hinweis, satz, danach = () => {} }) {
    const pruefe = pruefKnopf(() => {
      if (eingabe.zahl() === zahl) {
        eingabe.sperre();
        danach();
        api.richtig(satz || `${zahl}: ${zerlegt(zahl)}.`);
        return;
      }
      eingabe.markiere(zahl);
      const ist = eingabe.werte(), soll = ziffernVon(zahl);
      const i = [0, 1, 2].find((j) => ist[j] !== soll[j]);
      api.falsch(hinweis(STELLEN[i], eingabe.zahl()));
    });
    const eingabe = ziffernEingabe({ kopf, beiVoll: (voll) => { pruefe.disabled = !voll; } });
    return [eingabe.knoten, pruefe];
  }

  /* ---------- Baustein: Stellentafel mit drei Spalten ---------- */
  const stellentafel = (inhalt, unten) => el('div', { class: 'tafel' }, STELLEN.map((s, i) => el('div', { class: 'tafelspalte ' + s.toLowerCase(), 'data-stelle': s },
    el('div', { class: 'tafelkopf' }, s), inhalt(s, i), unten && unten(s, i))));

  const zeichenHaufen = (art, anzahl) => Array.from({ length: anzahl }, () => bild(Z.zeichen(art), 'stueck'));

  /* ---------- Wie viele sind es? (Material zählen) ---------- */
  U.anzahlen = (feld, a, api) => {
    feld.append(
      el('div', { class: 'karte materialkarte', html: Z.material(a.zahl, 'holz') }),
      ...zahlAbfragen(api, a.zahl, {
        kopf: 'zeichen',
        hinweis: (s) => `Zähle die ${{ H: 'Hunderterplatten', Z: 'Zehnerstangen', E: 'Einerwürfel' }[s]} noch einmal.`,
      }));
  };

  /* ---------- Lege und schreibe ---------- */
  U.legen = (feld, a, api) => {
    const lege = { H: 0, Z: 0, E: 0 };
    let fertig = false;
    const haufen = {}, weg = {}, dazu = {}, ziffer = {};
    const zeige = () => STELLEN.forEach((s) => {
      haufen[s].replaceChildren(...zeichenHaufen(s, lege[s]));
      weg[s].disabled = fertig || lege[s] === 0;
      dazu[s].disabled = fertig || lege[s] === 9;
    });
    const aendere = (s, um) => {
      if (fertig) return;
      lege[s] = Math.max(0, Math.min(9, lege[s] + um));
      MH.ton('plopp');
      zeige();
    };
    const tafel = stellentafel(
      (s) => (haufen[s] = el('div', { class: 'haufen', 'aria-live': 'polite' })),
      (s) => el('div', { class: 'tafelfuss' },
        (ziffer[s] = el('div', { class: 'tafelziffer' }, '')),
        (dazu[s] = el('button', { type: 'button', class: 'knopf klein stempel', 'data-art': s, 'aria-label': `${TEIL[s]} dazulegen`, onclick: () => aendere(s, 1) },
          el('b', {}, '+'), bild(Z.zeichen(s), 'zeichenkopf'))),
        (weg[s] = el('button', { type: 'button', class: 'knopf klein weg', 'aria-label': `${TEIL[s]} wegnehmen`, onclick: () => aendere(s, -1), html: MH.symbol('minus') }))));
    const pruefe = pruefKnopf(() => {
      const soll = L.stellen(a.zahl);
      const s = STELLEN.find((x) => lege[x] !== soll[x.toLowerCase()]);
      if (!s) {
        fertig = true;
        zeige();
        STELLEN.forEach((x) => { ziffer[x].textContent = lege[x]; });
        api.richtig(`In ${a.zahl} stecken ${zerlegt(a.zahl)}.`);
        return;
      }
      wackeln(tafel);
      api.falsch(`Schau auf die ${WORT[s]}: Es sind noch zu ${soll[s.toLowerCase()] > lege[s] ? 'wenige' : 'viele'}.`);
    });
    feld.append(el('div', { class: 'karte grosszahl' }, a.zahl), tafel, pruefe);
    zeige();
  };

  /* ---------- Geheimschrift lesen ---------- */
  // Durcheinander gemalte Zeichen. Antippen blendet ab: „schon gezählt“.
  const wirrFeld = (h, z, e) => {
    const arten = Z.arten(h, z, e);
    const plaetze = Z.streuung(arten.length);
    return el('div', { class: 'wirrfeld', role: 'group', 'aria-label': `Durcheinander: ${h} Quadrate, ${z} Striche, ${e} Punkte` },
      arten.map((art, i) => {
        const k = el('button', {
          type: 'button', class: 'streu', 'data-art': art, 'aria-label': TEIL[art], 'aria-pressed': 'false',
          style: `left:${plaetze[i].x}%;top:${plaetze[i].y}%`, html: Z.zeichen(art),
        });
        k.addEventListener('click', () => k.setAttribute('aria-pressed', String(k.getAttribute('aria-pressed') !== 'true')));
        return k;
      }));
  };

  const ZAEHLTIPP = { H: 'Zähle die Quadrate noch einmal. Jedes ist ein Hunderter.', Z: 'Zähle die Striche noch einmal. Jeder ist ein Zehner.', E: 'Zähle die Punkte noch einmal. Jeder ist ein Einer.' };

  U.schreibzahl = (feld, a, api) => {
    const s = L.stellen(a.zahl);
    feld.append(a.wirr ? wirrFeld(s.h, s.z, s.e) : el('div', { class: 'karte geheimkarte', html: Z.geheim(s.h, s.z, s.e) }));
    if (a.wirr) feld.append(el('p', { class: 'tipp' }, 'Tipp: Tippe an, was du schon gezählt hast.'));
    feld.append(...zahlAbfragen(api, a.zahl, { hinweis: (x) => ZAEHLTIPP[x] }));
  };

  /* ---------- Nachdenkfrage mit Antworten ---------- */
  U.frage = (feld, a, api) => {
    feld.append(
      el('p', { class: 'frage' }, a.frage),
      el('div', { class: 'antworten' }, a.antworten.map((text) => {
        const k = knopf(text, () => {
          if (text === a.richtig) {
            k.classList.add('richtig');
            api.richtig(a.erklaerung);
          } else {
            k.classList.add('falsch');
            k.disabled = true;
            api.falsch(a.tipp);
          }
        }, 'antwort');
        return k;
      })));
  };
  MH.auftraege.frage = () => 'Denk nach!';
  MH.vorlesetexte.frage = (a) => `${a.frage} ${a.antworten.join(' Oder: ')}`;

  /* ---------- Aufräumen: Zeichen in die Stellentafel sortieren ---------- */
  U.aufraeumen = (feld, a, api) => {
    const s = L.stellen(a.zahl);
    const haufen = {};
    const tafel = stellentafel((x) => (haufen[x] = el('div', { class: 'haufen' })));
    const zimmer = wirrFeld(s.h, s.z, s.e);
    const zweiter = el('div', { class: 'zweiter-schritt', hidden: true },
      el('p', { class: 'frage' }, 'Aufgeräumt! Wie heißt die Zahl?'),
      zahlAbfragen(api, a.zahl, { hinweis: (x) => ZAEHLTIPP[x] }));
    let uebrig = s.h + s.z + s.e;
    zimmer.querySelectorAll('.streu').forEach((k) => {
      k.addEventListener('click', () => {
        haufen[k.dataset.art].append(bild(Z.zeichen(k.dataset.art), 'stueck neu'));
        k.remove();
        MH.ton('plopp');
        if (--uebrig === 0) {
          zimmer.hidden = true;
          zweiter.hidden = false;
          zweiter.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      });
    });
    feld.append(zimmer, tafel, zweiter);
  };

  /* ---------- Blitzblick ---------- */
  U.blitz = (feld, a, api) => {
    const s = L.stellen(a.zahl);
    const fenster = el('div', { class: 'karte geheimkarte blitzfenster' });
    const unten = el('div', { class: 'zweiter-schritt', hidden: true }, zahlAbfragen(api, a.zahl, {
      hinweis: () => 'Schau noch einmal hin: Zähle zuerst die Quadrate, dann Striche und Punkte.',
      danach: () => { zeigeBild(); los.hidden = true; },
    }));
    let uhr = null;
    const zeigeBild = () => { fenster.innerHTML = Z.geheim(s.h, s.z, s.e); fenster.classList.remove('zu'); };
    const verstecke = () => {
      fenster.classList.add('zu');
      fenster.textContent = 'Weg! Was hast du gesehen?';
      los.textContent = 'Noch einmal zeigen';
      los.classList.remove('haupt');
      los.disabled = false;
      unten.hidden = false;
    };
    const los = knopf('Los!', () => {
      los.disabled = true;
      unten.hidden = true;
      zeigeBild();
      clearTimeout(uhr);
      uhr = setTimeout(verstecke, a.sekunden * 1000);
    }, 'haupt blitzknopf');
    MH.beimVerlassen(() => clearTimeout(uhr));
    fenster.classList.add('zu');
    fenster.textContent = `Bereit? Du hast ${a.sekunden} Sekunden.`;
    feld.append(fenster, los, unten);
  };

  /* ---------- Verbinde Zahlwort, Geheimschrift und Zahl ---------- */
  U.verbinde = (feld, a, api) => {
    const fertig = el('div', { class: 'verbunden', 'aria-live': 'polite' });
    const gewaehlt = { wort: null, geheim: null, zahl: null };
    let offen = a.zahlen.length;
    const inhalt = {
      wort: (n) => farbwort(n),
      geheim: (n) => { const s = L.stellen(n); return bild(Z.geheim(s.h, s.z, s.e), 'geheimbild'); },
      zahl: (n) => el('b', {}, n),
    };
    const waehle = (spalte, n, k) => {
      const alt = gewaehlt[spalte];
      if (alt) alt.k.setAttribute('aria-pressed', 'false');
      gewaehlt[spalte] = alt && alt.k === k ? null : { n, k };
      if (gewaehlt[spalte]) k.setAttribute('aria-pressed', 'true');
      MH.ton('plopp');
      const { wort, geheim, zahl } = gewaehlt;
      if (!wort || !geheim || !zahl) return;
      const drei = [wort, geheim, zahl];
      Object.keys(gewaehlt).forEach((x) => { gewaehlt[x] = null; });
      drei.forEach((x) => x.k.setAttribute('aria-pressed', 'false'));
      if (wort.n === geheim.n && geheim.n === zahl.n) {
        drei.forEach((x) => x.k.remove());
        fertig.append(el('div', { class: 'zug' },
          el('span', { class: 'glied' }, inhalt.wort(wort.n)), el('i'),
          el('span', { class: 'glied' }, inhalt.geheim(wort.n)), el('i'),
          el('span', { class: 'glied' }, inhalt.zahl(wort.n))));
        if (--offen === 0) {
          spalten.hidden = true;
          api.richtig('Alles richtig verbunden!');
        } else MH.ton('richtig');
        return;
      }
      drei.forEach((x) => wackeln(x.k));
      api.falsch(wort.n !== zahl.n
        ? 'Zahlwort und Zahl passen nicht. Achtung: Beim Sprechen kommen die Einer vor den Zehnern.'
        : 'Die Geheimschrift passt nicht. Zähle Quadrate, Striche und Punkte.');
    };
    const spalten = el('div', { class: 'verbindespalten' }, ['wort', 'geheim', 'zahl'].map((spalte) =>
      el('div', { class: 'verbindespalte ' + spalte }, L.misch(a.zahlen).map((n) => {
        const k = el('button', { type: 'button', class: 'knopf paar', 'aria-pressed': 'false', 'data-wert': n }, inhalt[spalte](n));
        k.addEventListener('click', () => waehle(spalte, n, k));
        return k;
      }))));
    feld.append(el('p', { class: 'tipp' }, 'Tippe immer drei Karten an, die zusammengehören.'), fertig, spalten);
  };

  /* ---------- Male (stemple) und schreibe ---------- */
  U.stempeln = (feld, a, api) => {
    const lege = { H: 0, Z: 0, E: 0 };
    let fertig = false;
    const blatt = el('div', { class: 'karte geheimkarte malblatt' });
    const knoepfe = {};
    const zeige = () => {
      blatt.innerHTML = Z.geheim(lege.H, lege.Z, lege.E);
      STELLEN.forEach((s) => {
        knoepfe[s].weg.disabled = fertig || lege[s] === 0;
        knoepfe[s].dazu.disabled = fertig || lege[s] === 9;
      });
    };
    const aendere = (s, um) => { if (!fertig) { lege[s] = Math.max(0, Math.min(9, lege[s] + um)); MH.ton('plopp'); zeige(); } };
    const stempel = el('div', { class: 'stempelkasten' }, STELLEN.map((s) => {
      const dazu = el('button', { type: 'button', class: 'knopf stempel', 'data-art': s, 'aria-label': `${TEIL[s]} malen`, onclick: () => aendere(s, 1) },
        bild(Z.zeichen(s), 'zeichenkopf'), el('span', {}, TEIL[s]));
      const weg = el('button', { type: 'button', class: 'knopf klein weg', 'aria-label': `${TEIL[s]} wegradieren`, onclick: () => aendere(s, -1), html: MH.symbol('minus') });
      knoepfe[s] = { dazu, weg };
      return el('div', { class: 'fach' }, dazu, weg);
    }));
    const pruefe = pruefKnopf(() => {
      const soll = L.stellen(a.zahl);
      const s = STELLEN.find((x) => lege[x] !== soll[x.toLowerCase()]);
      if (s) {
        wackeln(blatt);
        api.falsch(`Bei deinem Bild stimmen die ${WORT[s]} noch nicht. Lies das Zahlwort noch einmal.`);
        return;
      }
      if (eingabe.zahl() !== a.zahl) {
        eingabe.markiere(a.zahl);
        api.falsch('Dein Bild stimmt! Jetzt schreibe noch die passende Zahl.');
        return;
      }
      fertig = true;
      zeige();
      eingabe.sperre();
      api.richtig(`${L.zahlwort(a.zahl)} ist ${a.zahl}.`);
    });
    const eingabe = ziffernEingabe({ beiVoll: (voll) => { pruefe.disabled = !voll; } });
    feld.append(el('div', { class: 'wortschild' }, farbwort(a.zahl)), blatt, stempel, eingabe.knoten, pruefe);
    zeige();
  };

  /* ---------- Zahlwort aus Bausteinen ---------- */
  U.baukasten = (feld, a, api) => {
    const s = L.stellen(a.zahl);
    const soll = L.zahlwortTeile(a.zahl).map((t) => t.text);
    const gelegt = [];
    const zeile = el('div', { class: 'wortzeile', 'aria-live': 'polite' });
    const zeige = () => {
      zeile.replaceChildren(...(gelegt.length
        ? gelegt.map((g, i) => el('button', {
          type: 'button', class: 'knopf baustein teil-' + g.art, 'aria-label': `${g.text} zurücklegen`,
          onclick: () => { g.k.disabled = false; gelegt.splice(i, 1); MH.ton('plopp'); zeige(); },
        }, g.text))
        : [el('span', { class: 'platzhalter' }, 'Tippe die Wörter der Reihe nach an.')]));
      pruefe.disabled = !gelegt.length;
    };
    const stein = (text, art) => {
      const k = knopf(text, () => {
        gelegt.push({ text, art, k });
        k.disabled = true;
        MH.ton('plopp');
        zeige();
      }, 'baustein teil-' + art);
      return k;
    };
    const bank = el('div', { class: 'wortbank' },
      el('div', { class: 'bankteil H' }, a.bank.H.map((w) => stein(w, 'H'))),
      el('div', { class: 'bankteil E' }, a.bank.E.map((w) => stein(w, 'E'))),
      el('div', { class: 'bankteil und' }, stein('und', 'und')),
      el('div', { class: 'bankteil Z' }, a.bank.Z.map((w) => stein(w, 'Z'))));
    const pruefe = pruefKnopf(() => {
      const ist = gelegt.map((g) => g.text);
      if (ist.join(' ') === soll.join(' ')) {
        zeile.querySelectorAll('button').forEach((k) => k.classList.add('richtig'));
        api.richtig(`${a.zahl}: ${L.zahlwort(a.zahl)}.`);
        return;
      }
      wackeln(zeile);
      let tipp;
      if (ist[0] !== soll[0]) tipp = `Fang mit den Hundertern an: ${s.h} Hunderter.`;
      else if (gelegt[1] && gelegt[1].art === 'Z') tipp = 'Beim Sprechen kommen nach „hundert“ zuerst die Einer.';
      else if (ist[1] !== soll[1]) tipp = `Schau in die Spalte E: ${s.e} Einer.`;
      else if (ist[2] !== 'und') tipp = 'Zwischen Einern und Zehnern steht ein kleines Wort.';
      else if (ist.length > 4) tipp = 'Da liegt ein Wort zu viel.';
      else tipp = `Schau in die Spalte Z: ${s.z} Zehner.`;
      api.falsch(tipp);
    });
    feld.append(
      stellentafel((x, i) => el('div', { class: 'tafelziffer' }, ziffernVon(a.zahl)[i])),
      zeile, bank, pruefe);
    zeige();
  };

  /* ---------- Friedas Frage: Schreib- und Sprechfolge ---------- */
  const frieda = (satz) => el('div', { class: 'frieda' },
    el('img', { src: 'assets/bilder/girl.svg', alt: 'Frieda' }),
    el('p', { class: 'sprechblase' }, satz));
  const FOLGE = { schreibe: ['H', 'Z', 'E'], spreche: ['H', 'E', 'Z'] };

  U.reihenfolge = (feld, a, api) => {
    const soll = FOLGE[a.wie].map((s) => WORT[s]);
    const felder = soll.map((_, i) => el('span', { class: 'platz wortplatz', 'aria-label': `${i + 1}. Wort` }));
    const pruefe = pruefKnopf(() => {
      const ist = spiel.inhalt();
      if (ist.every((w, i) => w === soll[i])) {
        spiel.sperre();
        spiel.karten.forEach((k) => k.classList.add('richtig'));
        api.richtig(`Ich ${a.wie} zuerst die ${soll[0]}, dann die ${soll[1]} und zuletzt die ${soll[2]}.`);
        return;
      }
      ist.forEach((w, i) => { if (w !== soll[i]) spiel.karten[spiel.belegung[i]].classList.add('falsch'); });
      api.falsch(a.wie === 'schreibe'
        ? 'Schreib die 123 mit dem Finger in die Luft. Welche Ziffer kommt zuerst?'
        : 'Sprich laut: ein-hundert-drei-und-zwanzig. Was hörst du nacheinander?');
    });
    pruefe.disabled = true;
    const spiel = legespiel({ werte: L.misch(['Hunderter', 'Zehner', 'Einer']), felder, beimAendern: (voll) => { pruefe.disabled = !voll; } });
    feld.append(
      frieda('Zuerst die Zehner? Oder doch die Einer? Oder die Hunderter?'),
      el('p', { class: 'merksatz folge' }, 'Ich ', el('b', {}, a.wie), ' bei Zahlen wie 123 zuerst die ', felder[0],
        ', dann die ', felder[1], ' und zuletzt die ', felder[2], '.'),
      spiel.vorrat, pruefe);
  };
  MH.auftraege.reihenfolge = (a) => (a.wie === 'schreibe' ? 'Hilf Frieda! In welcher Reihenfolge schreibst du?' : 'Hilf Frieda! In welcher Reihenfolge sprichst du?');
  MH.vorlesetexte.reihenfolge = (a) => `Ich ${a.wie} bei Zahlen wie 123 zuerst die …`;

  U.ziffernfolge = (feld, a, api) => {
    const ziffern = ziffernVon(a.zahl);
    const soll = FOLGE[a.wie].map((s) => ziffern[STELLEN.indexOf(s)]);
    let i = 0;
    const spur = el('div', { class: 'spur', 'aria-live': 'polite' }, [0, 1, 2].map(() => el('span', {})));
    const karten = el('div', { class: 'vorrat' }, L.misch(ziffern).map((d) => {
      const k = knopf(String(d), () => {
        if (d === soll[i]) {
          spur.children[i].textContent = d;
          k.classList.add('richtig');
          k.disabled = true;
          i++;
          MH.ton('plopp');
          if (i === 3) {
            api.richtig(a.wie === 'spreche'
              ? `${L.zahlwort(a.zahl)}: zuerst ${soll[0]}, dann ${soll[1]}, dann ${soll[2]}.`
              : `${a.zahl}: Ich schreibe von links nach rechts.`);
          }
          return;
        }
        wackeln(k);
        api.falsch(a.wie === 'spreche'
          ? 'Sprich die Zahl langsam und laut. Welche Ziffer hörst du als Nächstes?'
          : 'Welche Ziffer schreibst du als Nächstes? Denk an Hunderter, Zehner, Einer.');
      }, 'zahlkarte');
      return k;
    }));
    feld.append(el('div', { class: 'karte grosszahl' }, a.zahl), karten, spur);
  };
  MH.auftraege.ziffernfolge = (a) => `Tippe die Ziffern so an, wie du die Zahl ${a.wie === 'spreche' ? 'sprichst' : 'schreibst'}!`;

  /* ---------- Zahlendreher-Falle ---------- */
  U.dreher = (feld, a, api) => {
    feld.append(
      el('div', { class: 'wortschild' }, el('span', { class: 'zahlwort' }, L.zahlwort(a.zahl))),
      el('div', { class: 'vorrat' }, a.optionen.map((n) => {
        const k = knopf(String(n), () => {
          if (n === a.zahl) {
            k.classList.add('richtig');
            api.richtig(`${L.zahlwort(a.zahl)} ist ${a.zahl}.`);
          } else {
            k.classList.add('falsch', 'raus');
            k.disabled = true;
            api.falsch(`${n} heißt ${L.zahlwort(n)}. Hör genau auf Einer und Zehner.`);
          }
        }, 'zahlkarte');
        return k;
      })));
  };
  MH.vorlesetexte.dreher = (a) => L.zahlwort(a.zahl);

  /* ---------- Ohren auf: Zahlendiktat ---------- */
  U.diktat = (feld, a, api) => {
    const wort = el('div', { class: 'wortschild', hidden: MH.kannVorlesen }, el('span', { class: 'zahlwort' }, L.zahlwort(a.zahl)));
    const hoeren = MH.kannVorlesen && el('button', {
      type: 'button', class: 'knopf haupt hoerknopf', onclick: () => MH.sprich(L.zahlwort(a.zahl)),
    }, bild(MH.symbol('ton'), 'zeichnung'), el('span', {}, 'Zahl hören'));
    // für Geräte ohne deutsche Stimme oder mit stummem Lautsprecher
    const zeigen = MH.kannVorlesen && knopf('Ich höre nichts: Wort zeigen', () => { wort.hidden = false; zeigen.hidden = true; }, 'leise');
    feld.append(hoeren || el('p', { class: 'tipp' }, 'Dieses Gerät kann nicht vorlesen. Lies das Zahlwort.'), wort);
    if (zeigen) feld.append(zeigen);
    feld.append(
      ...zahlAbfragen(api, a.zahl, {
        hinweis: (s, ist) => {
          const soll = L.stellen(a.zahl);
          if (ist === L.zahl(soll.h, soll.e, soll.z)) return 'Zahlendreher! Die Einer hörst du zuerst, geschrieben stehen sie aber ganz rechts.';
          return `Hör noch einmal genau auf die ${WORT[s]}.`;
        },
        satz: `${a.zahl}: ${L.zahlwort(a.zahl)}.`,
        danach: () => { wort.hidden = false; },
      }));
  };

  /* ---------- Bündel-Werkstatt ---------- */
  U.buendeln = (feld, a, api) => {
    const hat = { H: a.h, Z: a.z, E: a.e };
    let fertig = false;
    const haufen = {};
    const tafel = stellentafel((s) => (haufen[s] = el('div', { class: 'haufen' })));
    const buendle = (von, nach) => {
      hat[von] -= 10;
      hat[nach] += 1;
      MH.ton('plopp');
      zeige();
      haufen[nach].lastChild.classList.add('neu');
    };
    const einer = knopf('Bündle 10 Einer', () => buendle('E', 'Z'), 'buendler');
    const zehner = knopf('Bündle 10 Zehner', () => buendle('Z', 'H'), 'buendler');
    const zeige = () => {
      STELLEN.forEach((s) => haufen[s].replaceChildren(...zeichenHaufen(s, hat[s])));
      einer.disabled = fertig || hat.E < 10;
      zehner.disabled = fertig || hat.Z < 10;
    };
    feld.append(tafel, el('div', { class: 'wortwahl' }, einer, zehner),
      ...zahlAbfragen(api, a.zahl, {
        hinweis: () => (hat.E > 9 || hat.Z > 9
          ? 'In jede Spalte passt nur eine Ziffer. Bündle zuerst!'
          : 'Zähle jetzt noch einmal: Quadrate, Striche, Punkte.'),
        satz: `${a.h} Hunderter, ${a.z} Zehner, ${a.e} Einer sind zusammen ${a.zahl}.`,
        danach: () => { fertig = true; zeige(); },
      }));
    zeige();
  };

  /* ---------- Plättchen schieben ---------- */
  U.schieben = (feld, a, api) => {
    const start = { H: a.h, Z: a.z, E: a.e };
    let zug = null;      // { von, nach } – immer höchstens ein verschobenes Plättchen
    let genommen = null; // Spalte, aus der gerade eines in der Hand ist
    let fertig = false;
    const haufen = {};
    const jetzt = () => {
      const w = Object.assign({}, start);
      if (zug) { w[zug.von]--; w[zug.nach]++; }
      return w;
    };
    const anzeige = el('div', { class: 'karte grosszahl', 'aria-live': 'polite' });
    const hinweis = el('p', { class: 'tipp' });
    const nimm = (s) => { genommen = s; MH.ton('plopp'); zeige(); };
    const lege = (nach) => {
      const von = genommen;
      genommen = null;
      if (von && von !== nach && start[nach] < 9) { zug = { von, nach }; MH.ton('plopp'); }
      zeige();
    };
    const tippe = (s) => {
      if (fertig) return;
      if (genommen) return lege(s);
      // nach einem Zug fängt das nächste Antippen wieder bei der Ausgangslage an
      if (zug) zug = null;
      if (start[s]) nimm(s); else zeige();
    };
    const zeige = () => {
      const w = jetzt();
      STELLEN.forEach((s) => {
        haufen[s].replaceChildren(...Array.from({ length: w[s] }, (_, i) => el('span', {
          class: 'plaettchen' + (genommen === s && i === w[s] - 1 ? ' hoch' : '') + (zug && zug.nach === s && i === w[s] - 1 ? ' gewandert' : ''),
        })));
        haufen[s].setAttribute('aria-label', `${WORT[s]}: ${w[s]} Plättchen`);
        haufen[s].disabled = fertig;
        haufen[s].classList.toggle('genommen', genommen === s);
      });
      anzeige.textContent = L.zahl(w.H, w.Z, w.E);
      hinweis.textContent = genommen ? 'Wohin damit? Tippe auf eine andere Spalte.' : 'Tippe auf die Spalte, aus der ein Plättchen wandern soll.';
      pruefe.disabled = fertig || !zug;
      zurueck.disabled = fertig || (!zug && !genommen);
    };
    const tafel = stellentafel((s) => (haufen[s] = el('button', { type: 'button', class: 'haufen schiebe', 'data-art': s, onclick: () => tippe(s) })));
    const zurueck = knopf('Zurücklegen', () => { zug = null; genommen = null; zeige(); }, 'klein');
    const pruefe = pruefKnopf(() => {
      const w = jetzt();
      const n = L.zahl(w.H, w.Z, w.E);
      if (n === a.soll) {
        fertig = true;
        zeige();
        hinweis.textContent = '';
        api.richtig(`Aus ${L.zahl(a.h, a.z, a.e)} wird ${n}. Ein Plättchen ist von den ${WORT[zug.von]}n zu den ${WORT[zug.nach]}n gewandert.`);
        return;
      }
      wackeln(tafel);
      if (n < 100) api.falsch('Die Zahl soll dreistellig bleiben.');
      else if (a.ziel === 'genau') api.falsch(`Du hast ${n}. Gesucht ist ${a.soll}. Welche Ziffer wird größer, welche kleiner?`);
      else api.falsch(`Du hast ${n}. Es geht noch ${a.ziel === 'groesste' ? 'größer' : 'kleiner'}: Wo ist ein Plättchen am meisten wert?`);
    });
    feld.append(tafel, anzeige, hinweis, el('div', { class: 'wortwahl' }, zurueck), pruefe);
    zeige();
  };
  MH.auftraege.schieben = (a) => {
    if (a.ziel === 'groesste') return 'Verschiebe 1 Plättchen: Mache die größte Zahl!';
    if (a.ziel === 'kleinste') return 'Verschiebe 1 Plättchen: Mache die kleinste dreistellige Zahl!';
    return `Verschiebe 1 Plättchen: Mache die Zahl ${a.soll}!`;
  };

  /* ---------- Stellen-Rätsel ---------- */
  U.stellenraetsel = (feld, a, api) => {
    feld.append(
      el('ol', { class: 'hinweise' }, a.hinweise.map((h) => el('li', {}, h.text))),
      ...zahlAbfragen(api, a.zahl, {
        hinweis: (s, ist) => {
          const verletzt = a.hinweise.find((h) => !h.passt(ist));
          return `${ist} passt nicht zu diesem Hinweis: „${verletzt.text}“`;
        },
        satz: `Gefunden! Die gesuchte Zahl ist ${a.zahl}.`,
      }));
  };
  MH.vorlesetexte.stellenraetsel = (a) => a.hinweise.map((h) => h.text).join(' ');

  /* ---------- Zahlwort selbst schreiben ---------- */
  U.wortSchreiben = (feld, a, api) => {
    const eingabe = el('input', {
      type: 'text', class: 'wortfeld', 'aria-label': 'Zahlwort', placeholder: 'Schreibe hier …',
      autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', maxlength: 60,
    });
    const hilfe = el('p', { class: 'tipp', hidden: true });
    const pruefe = pruefKnopf(() => {
      if (!eingabe.value.trim()) return;
      const tipp = L.wortHinweis(a.zahl, eingabe.value);
      if (tipp === null) {
        const genau = L.schreibweise(eingabe.value) === L.zahlwort(a.zahl);
        eingabe.value = L.zahlwort(a.zahl);
        eingabe.readOnly = true;
        eingabe.classList.add('richtig');
        api.richtig(genau ? `${a.zahl}: ${L.zahlwort(a.zahl)}.` : `Richtig gehört! So schreibt man es genau: ${L.zahlwort(a.zahl)}.`);
        return;
      }
      wackeln(eingabe);
      if (api.falsch(tipp) >= 3) {
        const bank = L.zahlwortTeile(a.zahl).map((t) => t.text);
        hilfe.textContent = `Diese Bausteine brauchst du: ${L.misch(bank).join('   ')}`;
        hilfe.hidden = false;
      }
    });
    eingabe.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && !eingabe.readOnly) { ev.preventDefault(); pruefe.click(); } });
    feld.append(stellentafel((x, i) => el('div', { class: 'tafelziffer' }, ziffernVon(a.zahl)[i])), eingabe, hilfe, pruefe);
  };
})();
