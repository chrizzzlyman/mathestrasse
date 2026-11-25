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
  const gehe = (hash) => { if (location.hash === hash) zeigeRoute(); else location.hash = hash; };

  function setze(...inhalt) {
    if (kameraStopp) kameraStopp();
    if (window.speechSynthesis) speechSynthesis.cancel();
    document.querySelectorAll('.konfetti').forEach((k) => k.remove());
    wurzel.replaceChildren(...inhalt.filter(Boolean));
    window.scrollTo(0, 0);
  }

  const hausNr = (nummer) => MH.haeuser.find((h) => h.nummer === Number(nummer));
  const farben = (haus) => `--dach:${haus.farbe.dach};--wand:${haus.farbe.wand};--hell:${haus.farbe.hell}`;
  const raeume = (haus) => haus.etagen.flatMap((e) => e.raeume);
  const fertigImZimmer = (haus, raum) => S.sterne(haus.nummer, raum.id) > 0;
  const anzahlFertig = (haus) => raeume(haus).filter((r) => fertigImZimmer(haus, r)).length;
  const stufe = (haus) => Z.stufe(anzahlFertig(haus), raeume(haus).length);
  const etageFertig = (haus, etage) => etage.raeume.every((r) => fertigImZimmer(haus, r));
  const etageOffen = (haus, i) => Boolean(S.sitzung.ansehen) || haus.etagen.slice(0, i).every((e) => etageFertig(haus, e));

  /* ---------- Kopfzeile ---------- */
  function kopf() {
    const sitzung = S.sitzung;
    const ton = el('button', { type: 'button', class: 'knopf klein' });
    const tonText = () => {
      ton.textContent = MH.stumm() ? '🔇' : '🔔';
      ton.setAttribute('aria-label', MH.stumm() ? 'Töne einschalten' : 'Töne ausschalten');
    };
    ton.addEventListener('click', () => { MH.merke('mh.stumm', !MH.stumm()); tonText(); });
    tonText();
    const wer = sitzung.ansehen ? '👀 Nur ansehen'
      : sitzung.gast ? '🙂 Ausprobieren'
        : `${MH.tiere[sitzung.tier] || '🙂'} ${sitzung.tier} ${sitzung.zahl}`;
    return el('header', { class: 'kopf' },
      knopf('Mathestraße', () => gehe('#/strasse'), 'logo'),
      el('div', { class: 'kopf-rechts' },
        el('span', { class: 'wer' }, wer),
        ton,
        knopf(sitzung.gast ? 'Anmelden' : 'Abmelden', () => {
          S.abmelden();
          history.replaceState(null, '', location.pathname);
          anmeldung();
        }, 'klein')));
  }

  /* ---------- Anmeldung ---------- */
  function anmeldeRahmen(...inhalt) {
    const erstes = MH.haeuser[0];
    setze(el('main', { class: 'anmeldung', style: farben(erstes) },
      el('div', { class: 'anmelde-haus', html: Z.haus({ nummer: erstes.nummer, farbe: erstes.farbe, stufe: Z.TEILE }) }),
      el('div', { class: 'anmelde-karte' }, ...inhalt)));
  }

  function anmeldung(meldung) {
    S.sitzung = null;
    anmeldeRahmen(
      el('h1', {}, 'Mathestraße'),
      el('p', {}, 'Wer baut heute?'),
      meldung && el('p', { class: 'meldung nochmal', role: 'alert' }, meldung),
      knopf('📷 QR-Code scannen', scannen, 'haupt gross'),
      knopf('🐾 Mit Tier und Zahl', tierWaehlen, 'gross'),
      knopf('Ohne Anmeldung ausprobieren', () => { S.alsGast(); gehe('#/strasse'); }, 'leise'),
      el('a', { class: 'lehrkraft-link', href: 'lehrkraft.html' }, 'Für Lehrkräfte'));
  }

  const GRUENDE = {
    unbekannt: 'Das habe ich nicht gefunden. Schau noch einmal auf deine Karte.',
    pause: 'Zu viele Versuche. Nimm deinen QR-Code oder warte ein paar Minuten.',
    netz: 'Keine Verbindung. Prüfe das WLAN und versuche es noch einmal.',
  };

  async function mitToken(token) {
    anmeldeRahmen(el('p', { role: 'status' }, 'Ich schließe dein Haus auf …'));
    const antwort = await S.anmeldenMitToken(token);
    history.replaceState(null, '', location.pathname + '#/strasse');
    if (antwort.ok) zeigeRoute();
    else {
      if (antwort.grund === 'unbekannt') S.abmelden();
      anmeldung(GRUENDE[antwort.grund]);
    }
  }

  function tierWaehlen() {
    anmeldeRahmen(
      el('h2', {}, 'Welches Tier bist du?'),
      el('div', { class: 'tierwahl' }, Object.entries(MH.tiere).map(([name, bild]) =>
        el('button', { type: 'button', class: 'knopf tier', onclick: () => zahlEingeben(name) },
          el('span', { class: 'bild' }, bild), el('span', {}, name)))),
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
    anmeldeRahmen(
      el('h2', {}, `${MH.tiere[tier]} ${tier} – und deine Zahl?`),
      anzeige,
      hinweis,
      el('div', { class: 'ziffernblock' },
        [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => knopf(String(d), () => tippe(String(d)), 'ziffer')),
        knopf('⌫', () => { if (!beschaeftigt) { zahl = zahl.slice(0, -1); zeige(); } }, 'ziffer'),
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
    anmeldeRahmen(video, status,
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
    anmeldeRahmen(
      el('h2', {}, 'Bist du das?'),
      el('div', { class: 'grosses-tier' }, MH.tiere[gemerkt.tier] || '🙂'),
      el('p', { class: 'grosser-name' }, `${gemerkt.tier} ${gemerkt.zahl}`),
      knopf('Ja, das bin ich', () => mitToken(gemerkt.token), 'haupt gross'),
      knopf('Nein', () => { S.abmelden(); anmeldung(); }, 'gross'));
  }

  /* ---------- Straße ---------- */
  function strasse() {
    const reihe = el('div', { class: 'haeuserreihe' },
      MH.haeuser.map((haus) => {
        const n = anzahlFertig(haus), von = raeume(haus).length;
        return el('button', {
          type: 'button', class: 'grundstueck', style: farben(haus), onclick: () => gehe(`#/haus/${haus.nummer}`),
        },
          el('span', { class: 'bild', html: Z.haus({ nummer: haus.nummer, farbe: haus.farbe, stufe: stufe(haus) }) }),
          el('span', { class: 'namensschild' },
            el('b', {}, haus.titel),
            el('span', {}, n === von ? '🏆 Haus fertig!' : `${n} von ${von} Zimmern gebaut`)));
      }),
      [1, 2].map(() => el('div', { class: 'grundstueck leer' }, el('span', { class: 'bild', html: Z.bauplatz() }))));
    const gruss = S.sitzung.gast ? 'Hallo!' : `Hallo, ${S.sitzung.tier}!`;
    setze(kopf(), el('main', { class: 'strasse' },
      el('div', { class: 'gruss' },
        el('h1', {}, gruss),
        el('p', {}, 'Tippe auf ein Haus und baue weiter.'),
        S.sitzung.gast && !S.sitzung.ansehen && el('p', { class: 'merkzettel' },
          'Du probierst nur aus: Der Fortschritt bleibt allein auf diesem Gerät.')),
      el('div', { class: 'gegend' }, reihe, el('div', { class: 'gehweg' }), el('div', { class: 'fahrbahn' }))));
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
          el('span', { class: 'zimmername' }, raum.titel),
          el('span', { class: 'sterne', role: 'img', 'aria-label': `${sterne} von 3 Sternen`, html: Z.sterne(sterne) }));
      });
      return el('section', { class: 'etage' + (offen ? '' : ' zu') },
        el('div', { class: 'etagenkopf' },
          el('span', { class: 'hantel', html: Z.hantel(etage.stufe) }),
          el('h2', {}, `${etage.name}: ${etage.stufe}`),
          !offen && el('p', {}, `🔒 Baue zuerst ${i === 1 ? 'das Erdgeschoss' : 'den 1. Stock'} fertig.`)),
        el('div', { class: 'zimmerreihe' }, zimmer));
    });

    const koennen = el('ul', { class: 'koennen' }, haus.koennen.map((k) => {
      const kann = k.raeume.every((id) => S.sterne(haus.nummer, id) > 0);
      return el('li', { class: kann ? 'kann' : '' },
        el('span', {}, k.text),
        el('span', { class: 'haken', role: 'img', 'aria-label': kann ? 'geschafft' : 'noch offen' }, kann ? '✔' : ''));
    }));

    setze(kopf(), el('main', { class: 'hausansicht', style: farben(haus) },
      el('div', { class: 'hausspalte' },
        knopf('← Zur Straße', () => gehe('#/strasse'), 'klein'),
        el('h1', {}, haus.untertitel),
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
        knopf('← Ins Haus', () => gehe(`#/haus/${haus.nummer}`), 'klein'),
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
    const speicherung = S.speichereDurchgang({ haus: haus.nummer, raum: raum.id, sterne, fehler, dauer });
    const jetzt = stufe(haus);
    const neu = jetzt > vorher ? jetzt : null;
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
        stand.textContent = ok ? 'Gespeichert ✔' : 'Auf diesem Gerät gemerkt. Wird gesendet, sobald das Netz wieder da ist.';
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
        el('div', { class: 'wachstum', html: Z.haus({ nummer: haus.nummer, farbe: haus.farbe, stufe: jetzt, neu }) }),
        el('p', { class: 'botschaft' }, botschaft),
        el('h2', {}, 'So war es für mich:'),
        wahl,
        stand,
        el('div', { class: 'weiterwahl' },
          naechstes && knopf(`Weiter: ${naechstes.titel}`, () => gehe(`#/zimmer/${haus.nummer}/${naechstes.id}`), 'haupt'),
          knopf('Ins Haus', () => gehe(`#/haus/${haus.nummer}`), naechstes ? '' : 'haupt'),
          knopf('Noch einmal üben', () => zimmer(haus, raum))))));
    MH.ton('fertig');
    if (sterne === 3 || (warNeu && (etageGeschafft || hausFertig))) MH.konfetti();
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
