/* Die Bildschirme: Anmeldung, Straße, Haus, Zimmer, Ergebnis. */
(function () {
  'use strict';
  const MH = window.MH;
  const { el } = MH;
  const S = MH.speicher;
  const Z = MH.zeichne;
  const wurzel = document.getElementById('app');
  const TOKEN = /^[0-9a-f]{36}$/;

  let kameraStopp = null;

  const knopf = (text, tun, klasse = '') => el('button', { type: 'button', class: 'knopf ' + klasse, onclick: tun }, text);
  const symbol = (name) => el('span', { class: 'zeichnung', style: 'display:contents', html: MH.symbol(name) });
  const symbolKnopf = (name, text, tun, klasse = '') => knopf([symbol(name), el('span', {}, text)], tun, klasse);
  const gehe = (hash) => { if (location.hash === hash) zeigeRoute(); else location.hash = hash; };

  function setze(...inhalt) {
    if (kameraStopp) kameraStopp();
    MH.aufraeumenNachAufgabe();
    if (window.speechSynthesis) speechSynthesis.cancel();
    document.querySelectorAll('.konfetti').forEach((k) => k.remove());
    wurzel.replaceChildren(...inhalt.filter(Boolean));
    window.scrollTo(0, 0);
  }

  const hausNr = (nummer) => MH.haeuser.find((h) => h.nummer === Number(nummer));
  const farben = (haus) => {
    const f = haus.farbe;
    return `--dach:${f.dach};--wand:${f.wand};--hell:${f.hell};--akzent:${f.akzent || f.dach};--rand:${f.rand || '#a3271c'}`;
  };
  const raeume = (haus) => haus.etagen.flatMap((e) => e.raeume);
  const fertigImZimmer = (haus, raum) => S.sterne(haus.nummer, raum.id) > 0;
  const anzahlFertig = (haus) => raeume(haus).filter((r) => fertigImZimmer(haus, r)).length;
  const stufe = (haus) => Z.stufe(anzahlFertig(haus), raeume(haus).length);
  const etageFertig = (haus, etage) => etage.raeume.every((r) => fertigImZimmer(haus, r));
  const etageOffen = (haus, i) => Boolean(S.sitzung.ansehen) || haus.etagen.slice(0, i).every((e) => etageFertig(haus, e));
  const alleAbzeichen = () => MH.abzeichen.berechne(MH.haeuser, S.sterne);
  const plakette = (a) => el('span', { class: 'abzeichenbild', html: Z.plakette(a.bild, a.ring) });

  /* ---------- Kopfzeile ---------- */
  function kopf() {
    const sitzung = S.sitzung;
    const ton = el('button', { type: 'button', class: 'knopf klein rund' });
    const tonBild = () => {
      ton.innerHTML = MH.symbol(MH.stumm() ? 'glockeAus' : 'glocke');
      ton.setAttribute('aria-label', MH.stumm() ? 'Töne einschalten' : 'Töne ausschalten');
    };
    ton.addEventListener('click', () => { MH.merke('mh.stumm', !MH.stumm()); tonBild(); });
    tonBild();
    const name = sitzung.ansehen ? 'Nur ansehen' : sitzung.gast ? 'Ausprobieren' : `${sitzung.tier} ${sitzung.zahl}`;
    return el('header', { class: 'kopf' },
      el('button', { type: 'button', class: 'logo', onclick: () => gehe('#/strasse') },
        el('span', { class: 'strassenschild' }, 'Mathestraße')),
      el('div', { class: 'kopf-rechts' },
        el('span', { class: 'wer' }, MH.tierBild(sitzung.gast ? null : sitzung.tier), el('span', { class: 'wername' }, name)),
        abzeichenKnopf(),
        ton,
        symbolKnopf('raus', sitzung.gast ? 'Anmelden' : 'Abmelden', () => {
          S.abmelden();
          history.replaceState(null, '', location.pathname);
          anmeldung();
        }, 'klein abmelden')));
  }

  function abzeichenKnopf() {
    const anzahl = alleAbzeichen().filter((a) => a.verdient).length;
    return el('button', {
      type: 'button', class: 'knopf klein abzeichenknopf', onclick: () => gehe('#/abzeichen'),
      'aria-label': `Meine Abzeichen: ${anzahl}`,
    }, el('img', { src: 'assets/bilder/sports-medal.svg', alt: '' }), el('span', { class: 'wortlaut' }, 'Abzeichen'), el('b', {}, anzahl));
  }

  /* ---------- Anmeldung ---------- */
  function anmeldeRahmen(optionen, ...inhalt) {
    const erstes = MH.haeuser[0];
    setze(el('main', { class: 'anmeldung' + (optionen.haus ? '' : ' mittig'), style: farben(erstes) },
      el('div', { html: Z.himmel(), style: 'display:contents' }),
      el('div', { class: 'landschaft', html: Z.huegel() }),
      el('div', { class: 'anmelde-szene' + (optionen.haus ? '' : ' ohne-haus') },
        optionen.haus && el('div', { class: 'anmelde-haus', html: Z.haus({ nummer: erstes.nummer, farbe: erstes.farbe, stufe: Z.TEILE }) }),
        el('div', { class: 'anmelde-karte' }, ...inhalt))));
  }
  const MIT_HAUS = { haus: true }, OHNE_HAUS = { haus: false };

  function anmeldung(meldung) {
    S.sitzung = null;
    anmeldeRahmen(MIT_HAUS,
      el('h1', {}, el('span', { class: 'strassenschild' }, 'Mathestraße')),
      el('p', { class: 'unterzeile' }, 'Wer baut heute?'),
      meldung && el('p', { class: 'meldung nochmal', role: 'alert' }, meldung),
      symbolKnopf('kamera', 'QR-Code scannen', scannen, 'haupt gross'),
      symbolKnopf('pfote', 'Mit Tier und Zahl', tierWaehlen, 'gross'),
      knopf('Ohne Anmeldung ausprobieren', () => { S.alsGast(); gehe('#/strasse'); }, 'leise'),
      el('a', { class: 'lehrkraft-link', href: 'lehrkraft.html' }, 'Für Lehrkräfte'));
  }

  const GRUENDE = {
    unbekannt: 'Das habe ich nicht gefunden. Schau noch einmal auf deine Karte.',
    pause: 'Zu viele Versuche. Nimm deinen QR-Code oder warte ein paar Minuten.',
    netz: 'Keine Verbindung. Prüfe das WLAN und versuche es noch einmal.',
  };

  async function mitToken(token) {
    anmeldeRahmen(MIT_HAUS, el('p', { role: 'status' }, 'Ich schließe dein Haus auf …'));
    const antwort = await S.anmeldenMitToken(token);
    history.replaceState(null, '', location.pathname + '#/strasse');
    if (antwort.ok) zeigeRoute();
    else {
      if (antwort.grund === 'unbekannt') S.abmelden();
      anmeldung(GRUENDE[antwort.grund]);
    }
  }

  function tierWaehlen() {
    anmeldeRahmen(OHNE_HAUS,
      el('h2', {}, 'Welches Tier bist du?'),
      el('div', { class: 'tierwahl' }, Object.keys(MH.tiere).map((name) =>
        el('button', { type: 'button', class: 'knopf tier', onclick: () => zahlEingeben(name) },
          MH.tierBild(name), el('span', {}, name)))),
      knopf('Zurück', () => anmeldung(), 'leise'));
  }

  function zahlEingeben(tier) {
    let zahl = '';
    let beschaeftigt = false;
    const anzeige = el('div', { class: 'zahlanzeige', 'aria-live': 'polite' });
    const hinweis = el('p', { class: 'hinweiszeile', role: 'alert' });
    const zeige = () => anzeige.replaceChildren(...[0, 1, 2].map((i) => el('span', {}, zahl[i] || '')));
    const tippe = async (d) => {
      if (beschaeftigt || zahl.length >= 3) return;
      zahl += d;
      zeige();
      if (zahl.length < 3) return;
      beschaeftigt = true;
      hinweis.textContent = 'Ich schaue nach …';
      const antwort = await S.anmeldenMitTier(tier, Number(zahl));
      if (!anzeige.isConnected) return;
      if (antwort.ok) { gehe('#/strasse'); return; }
      beschaeftigt = false;
      zahl = '';
      zeige();
      hinweis.textContent = GRUENDE[antwort.grund] || GRUENDE.unbekannt;
    };
    zeige();
    const zurueck = el('button', {
      type: 'button', class: 'knopf ziffer', 'aria-label': 'Ziffer löschen', html: MH.symbol('loeschen'),
      onclick: () => { if (!beschaeftigt) { zahl = zahl.slice(0, -1); zeige(); } },
    });
    anmeldeRahmen(OHNE_HAUS,
      el('div', { class: 'mit-tier' }, MH.tierBild(tier), el('h2', {}, `${tier}, wie ist deine Zahl?`)),
      anzeige,
      hinweis,
      el('div', { class: 'ziffernblock' },
        [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => knopf(String(d), () => tippe(String(d)), 'ziffer')),
        zurueck,
        knopf('0', () => tippe('0'), 'ziffer')),
      knopf('Zurück', tierWaehlen, 'leise'));
  }

  const ladeScript = (src) => new Promise((ok, nein) => {
    if (window.jsQR) return ok();
    document.head.appendChild(el('script', { src, onload: ok, onerror: nein }));
  });

  async function scannen() {
    const video = el('video', { playsinline: true, muted: true, class: 'kamera' });
    const status = el('p', { role: 'status' }, 'Halte deine QR-Karte vor die Kamera.');
    let richtung = 'environment', strom = null, aktiv = true, uhr = null;
    const halt = () => {
      clearTimeout(uhr);
      if (strom) strom.getTracks().forEach((t) => t.stop());
      strom = null;
    };
    anmeldeRahmen(OHNE_HAUS, el('div', { class: 'sucher' }, video), status,
      knopf('Kamera wechseln', () => { richtung = richtung === 'environment' ? 'user' : 'environment'; starte(); }),
      knopf('Zurück', () => anmeldung(), 'leise'));
    kameraStopp = () => { aktiv = false; halt(); kameraStopp = null; };

    const leinwand = document.createElement('canvas');
    const bild = leinwand.getContext('2d', { willReadFrequently: true });
    function suche() {
      if (!aktiv) return;
      if (video.readyState >= 2 && video.videoWidth) {
        const b = Math.min(640, video.videoWidth);
        const h = Math.round(video.videoHeight * (b / video.videoWidth));
        leinwand.width = b;
        leinwand.height = h;
        bild.drawImage(video, 0, 0, b, h);
        const fund = window.jsQR(bild.getImageData(0, 0, b, h).data, b, h);
        if (fund) {
          const m = fund.data.match(/#k=([0-9a-f]{36})$/);
          if (m) { kameraStopp(); mitToken(m[1]); return; }
          status.textContent = 'Das ist keine Mathestraßen-Karte.';
        }
      }
      uhr = setTimeout(suche, 200);
    }
    async function starte() {
      halt();
      try {
        await ladeScript('vendor/jsQR.js');
        const neu = await navigator.mediaDevices.getUserMedia({ video: { facingMode: richtung }, audio: false });
        if (!aktiv) { neu.getTracks().forEach((t) => t.stop()); return; }
        strom = neu;
        video.srcObject = strom;
        video.muted = true;
        await video.play();
        suche();
      } catch (e) {
        status.textContent = 'Die Kamera geht hier nicht. Nimm „Mit Tier und Zahl“.';
      }
    }
    starte();
  }

  function weiterAls(gemerkt) {
    anmeldeRahmen(MIT_HAUS,
      el('h2', {}, 'Bist du das?'),
      el('div', { class: 'grosses-tier' }, MH.tierBild(gemerkt.tier)),
      el('p', { class: 'grosser-name' }, `${gemerkt.tier} ${gemerkt.zahl}`),
      knopf('Ja, das bin ich', () => mitToken(gemerkt.token), 'haupt gross'),
      knopf('Nein', () => { S.abmelden(); anmeldung(); }, 'gross'));
  }

  /* ---------- Straße ---------- */
  function strasse() {
    const sitzung = S.sitzung;
    // Das Tier steht beim angefangenen Haus, sonst beim ersten noch nicht fertigen
    const offen = MH.haeuser.filter((h) => anzahlFertig(h) < raeume(h).length);
    const baustelle = offen.find((h) => anzahlFertig(h) > 0) || offen[0] || MH.haeuser[MH.haeuser.length - 1];
    const reihe = el('div', { class: 'haeuserreihe' },
      MH.haeuser.map((haus) => {
        const n = anzahlFertig(haus), von = raeume(haus).length;
        return el('button', {
          type: 'button', class: 'grundstueck', style: farben(haus), onclick: () => gehe(`#/haus/${haus.nummer}`),
        },
          el('span', { class: 'bild' },
            el('span', { style: 'display:contents', html: Z.haus({ nummer: haus.nummer, farbe: haus.farbe, stufe: stufe(haus) }) }),
            haus === baustelle && MH.tierBild(sitzung.gast ? null : sitzung.tier, 'maskottchen')),
          el('span', { class: 'namensschild' },
            el('b', {}, haus.titel),
            el('span', { class: 'baubalken', 'aria-hidden': 'true' }, el('i', { style: `width:${Math.round((n / von) * 100)}%` })),
            n === von
              ? el('span', { class: 'stand' }, el('img', { src: 'assets/bilder/trophy.svg', alt: '' }), 'Haus fertig!')
              : el('span', { class: 'stand' }, `${n} von ${von} Zimmern gebaut`)));
      }),
      Array.from({ length: Math.max(1, 3 - MH.haeuser.length) }, () => el('div', { class: 'grundstueck leer' }, el('span', { class: 'bild', html: Z.bauplatz() }))));
    const gruss = sitzung.gast ? 'Hallo!' : `Hallo, ${sitzung.tier}!`;
    setze(kopf(), el('main', { class: 'strasse' },
      el('div', { html: Z.himmel(), style: 'display:contents' }),
      el('div', { class: 'gruss' },
        !sitzung.gast && MH.tierBild(sitzung.tier),
        el('div', {},
          el('h1', {}, gruss),
          el('p', {}, 'Tippe auf ein Haus und baue weiter.'),
          sitzung.gast && !sitzung.ansehen && el('p', { class: 'merkzettel' },
            'Du probierst nur aus: Der Fortschritt bleibt allein auf diesem Gerät.'))),
      el('div', { class: 'gegend' },
        el('div', { class: 'huegel', html: Z.huegel() }),
        reihe, el('div', { class: 'gehweg' }), el('div', { class: 'fahrbahn' }))));
    // auf schmalen Bildschirmen zum eigenen Haus schieben
    const meins = reihe.children[MH.haeuser.indexOf(baustelle)];
    reihe.scrollLeft = Math.max(0, meins.offsetLeft - reihe.offsetLeft - (reihe.clientWidth - meins.offsetWidth) / 2);
  }

  /* ---------- Im Haus ---------- */
  function hausAnsicht(haus) {
    const etagen = haus.etagen.map((etage, i) => {
      const offen = etageOffen(haus, i);
      const zimmer = etage.raeume.map((raum) => {
        const sterne = S.sterne(haus.nummer, raum.id);
        return el('button', {
          type: 'button', class: 'zimmer' + (sterne ? ' fertig' : ''), disabled: !offen,
          onclick: () => gehe(`#/zimmer/${haus.nummer}/${raum.id}`),
        },
          !offen && el('span', { class: 'schlosszeichen', html: MH.symbol('schloss') }),
          MH.raumBild(raum),
          el('span', { class: 'zimmername' }, raum.titel),
          el('span', { class: 'sterne', role: 'img', 'aria-label': `${sterne} von 3 Sternen`, html: Z.sterne(sterne) }));
      });
      return el('section', { class: 'etage' + (offen ? '' : ' zu') },
        el('div', { class: 'etagenkopf' },
          el('div', { class: 'etagenschild' },
            el('span', { class: 'hantel', html: Z.hantel(etage.stufe) }),
            el('h2', {}, `${etage.name}: ${etage.stufe}`)),
          !offen && el('p', {}, `Baue zuerst ${i === 1 ? 'das Erdgeschoss' : 'den 1. Stock'} fertig.`)),
        el('div', { class: 'zimmerreihe' }, zimmer));
    });

    const koennen = el('ul', { class: 'koennen' }, haus.koennen.map((k) => {
      const kann = k.raeume.every((id) => S.sterne(haus.nummer, id) > 0);
      return el('li', { class: kann ? 'kann' : '' },
        el('span', {}, k.text),
        el('span', { class: 'haken', role: 'img', 'aria-label': kann ? 'geschafft' : 'noch offen', html: kann ? MH.symbol('haken') : '' }));
    }));

    setze(kopf(), el('main', { class: 'hausansicht', style: farben(haus) },
      el('div', { class: 'hausspalte' },
        el('div', { class: 'hauskopf' },
          symbolKnopf('zurueck', 'Zur Straße', () => gehe('#/strasse'), 'klein'),
          el('h1', {}, haus.untertitel)),
        el('div', { class: 'schnitt' },
          el('div', { class: 'dach' }, el('span', { class: 'hausschild' }, haus.nummer)),
          el('div', { class: 'mauern' }, etagen.slice().reverse()),
          el('div', { class: 'sockel' }))),
      el('aside', { class: 'seitenspalte' },
        el('div', { class: 'baustand', html: Z.haus({ nummer: haus.nummer, farbe: haus.farbe, stufe: stufe(haus) }) }),
        el('h2', {}, 'Das kann ich'),
        koennen)));

    // gleich zur Etage springen, an der gerade gebaut wird (sonst sieht man zuerst das Dach)
    const aktuell = haus.etagen.findIndex((e) => !etageFertig(haus, e));
    if (aktuell >= 0 && !S.sitzung.ansehen) {
      etagen[aktuell].scrollIntoView({ block: aktuell === 0 ? 'end' : 'center' });
    }
  }

  /* ---------- Zimmer ---------- */
  function zimmer(haus, raum) {
    const erst = !fertigImZimmer(haus, raum);
    const aufgaben = raum.aufgaben(erst);
    const spielfeld = el('div', { class: 'spielfeld' });
    setze(kopf(), el('main', { class: 'uebung', style: farben(haus) },
      el('div', { class: 'uebungskopf' },
        symbolKnopf('zurueck', 'Ins Haus', () => gehe(`#/haus/${haus.nummer}`), 'klein'),
        MH.raumBild(raum),
        el('h1', {}, raum.titel)),
      spielfeld));
    MH.raumSpielen(spielfeld, {
      raum, aufgaben,
      abschluss: (ergebnis) => ergebnisZeigen(haus, raum, ergebnis),
    });
  }

  function naechstesZimmer(haus, nach) {
    const offene = haus.etagen.flatMap((etage, i) => (etageOffen(haus, i) ? etage.raeume : []));
    const ab = offene.findIndex((r) => r.id === nach.id);
    const reihenfolge = offene.slice(ab + 1).concat(offene.slice(0, ab));
    return reihenfolge.find((r) => !fertigImZimmer(haus, r)) || null;
  }

  function ergebnisZeigen(haus, raum, { fehler, dauer, anzahl }) {
    const sterne = MH.sterneFuer(fehler, anzahl);
    const vorher = stufe(haus);
    const warNeu = !fertigImZimmer(haus, raum);
    const etage = haus.etagen.findIndex((e) => e.raeume.includes(raum));
    const vorherAbzeichen = new Set(alleAbzeichen().filter((a) => a.verdient).map((a) => a.id));
    const speicherung = S.speichereDurchgang({ haus: haus.nummer, raum: raum.id, sterne, fehler, dauer });
    const jetzt = stufe(haus);
    const neu = jetzt > vorher ? jetzt : null;
    const neueAbzeichen = alleAbzeichen().filter((a) => a.verdient && !vorherAbzeichen.has(a.id));
    const hausFertig = anzahlFertig(haus) === raeume(haus).length;
    const etageGeschafft = warNeu && etageFertig(haus, haus.etagen[etage]);

    let botschaft = warNeu ? 'Dein Haus ist um ein Stück gewachsen.' : 'Gut geübt!';
    if (etageGeschafft && haus.etagen[etage + 1]) {
      botschaft = `${haus.etagen[etage].name} fertig! Jetzt ist ${etage === 0 ? 'der 1. Stock' : 'das Dachgeschoss'} offen.`;
    }
    if (warNeu && hausFertig) botschaft = `Haus ${haus.nummer} ist fertig gebaut!`;
    if (S.sitzung.ansehen) botschaft = 'Nur angesehen – es wurde nichts gespeichert.';

    const stand = el('p', { class: 'speicherstand', role: 'status' });
    const zeigeStand = (versprechen) => {
      if (S.sitzung.gast) return;
      stand.textContent = 'Wird gespeichert …';
      versprechen.then((ok) => {
        if (ok) stand.replaceChildren(symbol('haken'), 'Gespeichert');
        else stand.textContent = 'Auf diesem Gerät gemerkt. Wird gesendet, sobald das Netz wieder da ist.';
      });
    };
    zeigeStand(speicherung.gesendet);

    const wahl = el('div', { class: 'einschaetzung' }, ['leicht', 'mittel', 'schwer'].map((w) => {
      const k = el('button', { type: 'button', class: 'knopf hantelwahl', 'aria-pressed': 'false' },
        el('span', { html: Z.hantel(w) }), el('span', {}, w));
      k.addEventListener('click', () => {
        wahl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === k)));
        MH.ton('plopp');
        zeigeStand(S.einschaetzen(speicherung.eintrag, w).then(() => !MH.hole('mh.warteschlange', [])
          .some((x) => speicherung.eintrag && x.p_id === speicherung.eintrag.p_id)));
      });
      return k;
    }));

    const naechstes = naechstesZimmer(haus, raum);
    setze(kopf(), el('main', { class: 'ergebnis', style: farben(haus) },
      el('div', { class: 'ergebnis-karte' },
        el('h1', {}, 'Zimmer geschafft!'),
        el('div', { class: 'sterne gross', role: 'img', 'aria-label': `${sterne} von 3 Sternen`, html: Z.sterne(sterne) }),
        el('div', { class: 'schaubild' },
          el('div', { class: 'wachstum', html: Z.haus({ nummer: haus.nummer, farbe: haus.farbe, stufe: jetzt, neu }) }),
          MH.tierBild(S.sitzung.gast ? null : S.sitzung.tier)),
        el('p', { class: 'botschaft' }, botschaft),
        neueAbzeichen.length > 0 && el('section', { class: 'neue-abzeichen' },
          el('h2', {}, neueAbzeichen.length === 1 ? 'Neues Abzeichen!' : 'Neue Abzeichen!'),
          el('ul', {}, neueAbzeichen.map((a) => el('li', {}, plakette(a),
            el('b', {}, a.titel),
            a.gruppe && el('span', {}, `Haus ${a.gruppe}`))))),
        el('h2', {}, 'So war es für mich:'),
        wahl,
        stand,
        el('div', { class: 'weiterwahl' },
          naechstes && knopf(`Weiter: ${naechstes.titel}`, () => gehe(`#/zimmer/${haus.nummer}/${naechstes.id}`), 'haupt'),
          knopf('Ins Haus', () => gehe(`#/haus/${haus.nummer}`), naechstes ? '' : 'haupt'),
          knopf('Noch einmal üben', () => zimmer(haus, raum))))));
    MH.ton('fertig');
    if (sterne === 3 || neueAbzeichen.length || (warNeu && (etageGeschafft || hausFertig))) MH.konfetti();
  }

  /* ---------- Abzeichen ---------- */
  function abzeichenAnsicht() {
    const alle = alleAbzeichen();
    const karte = (a) => el('li', { class: 'abzeichen' + (a.verdient ? ' verdient' : '') },
      plakette(a),
      el('b', {}, a.titel),
      el('p', {}, a.text),
      a.verdient
        ? el('span', { class: 'stand geschafft' }, symbol('haken'), 'Geschafft!')
        : el('span', { class: 'stand' },
          el('span', { class: 'baubalken', 'aria-hidden': 'true' }, el('i', { style: `width:${Math.round((a.ist / a.soll) * 100)}%` })),
          `${a.ist} von ${a.soll}`));
    const gruppe = (titel, liste, haus) => el('section', { class: 'abzeichengruppe', style: haus ? farben(haus) : '--akzent:var(--sonne)' },
      el('h2', {}, titel), el('ul', {}, liste.map(karte)));
    const anzahl = alle.filter((a) => a.verdient).length;
    setze(kopf(), el('main', { class: 'abzeichenseite' },
      el('div', { class: 'hauskopf' },
        symbolKnopf('zurueck', 'Zur Straße', () => gehe('#/strasse'), 'klein'),
        el('h1', {}, 'Meine Abzeichen'),
        el('p', { class: 'zaehler' }, `${anzahl} von ${alle.length}`)),
      gruppe('Auf der ganzen Straße', alle.filter((a) => !a.gruppe)),
      MH.haeuser.map((haus) => gruppe(`Haus ${haus.nummer}: ${haus.titel}`, alle.filter((a) => a.gruppe === haus.nummer), haus))));
  }

  /* ---------- Wegweiser ---------- */
  function zeigeRoute() {
    const token = location.hash.match(/^#k=(.*)$/);
    if (token) {
      if (TOKEN.test(token[1])) mitToken(token[1]);
      else { history.replaceState(null, '', location.pathname); anmeldung(GRUENDE.unbekannt); }
      return;
    }
    if (!S.sitzung) return;
    const [, seite, nummer, raumId] = location.hash.split('/');
    const haus = nummer && hausNr(nummer);
    if (seite === 'abzeichen') return abzeichenAnsicht();
    if (seite === 'haus' && haus) return hausAnsicht(haus);
    if (seite === 'zimmer' && haus) {
      const i = haus.etagen.findIndex((e) => e.raeume.some((r) => r.id === raumId));
      if (i >= 0 && etageOffen(haus, i)) return zimmer(haus, haus.etagen[i].raeume.find((r) => r.id === raumId));
      return hausAnsicht(haus);
    }
    return strasse();
  }

  window.addEventListener('hashchange', zeigeRoute);

  // Geteilte Geräte: Nach 15 Minuten ohne Berührung wird gefragt, wer jetzt da ist.
  const PAUSE = 15 * 60 * 1000;
  let letzteBeruehrung = Date.now();
  const nachfragen = () => {
    if (!S.sitzung || S.sitzung.gast || Date.now() - letzteBeruehrung < PAUSE) return false;
    const wer = S.sitzung;
    S.sitzung = null;
    history.replaceState(null, '', location.pathname);
    weiterAls(wer);
    return true;
  };
  ['pointerdown', 'keydown'].forEach((art) => window.addEventListener(art, (ev) => {
    if (nachfragen()) { ev.preventDefault(); ev.stopPropagation(); }
    letzteBeruehrung = Date.now();
  }, true));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) nachfragen(); });

  MH.ladeHaeuser().then(() => {
    if (location.hash.startsWith('#k=')) return zeigeRoute();
    if (new URLSearchParams(location.search).has('ansehen')) {
      S.zumAnschauen();
      return zeigeRoute();
    }
    S.senden();
    const gemerkt = S.gemerkt();
    if (gemerkt) return weiterAls(gemerkt);
    return anmeldung();
  }).catch(() => {
    wurzel.textContent = 'Die Seite konnte nicht geladen werden. Bitte lade sie neu.';
  });
})();
