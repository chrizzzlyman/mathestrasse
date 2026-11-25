/* Lehrkraft-Ansicht: anmelden, Kinder anlegen, QR-Karten drucken, Fortschritt sehen.
 * Notiznamen bleiben ausschließlich auf diesem Gerät und werden nie hochgeladen. */
(function () {
  'use strict';
  const MH = window.MH;
  const { el } = MH;
  const wurzel = document.getElementById('app');
  if (!window.supabase) { wurzel.textContent = 'Die Datei vendor/supabase.js fehlt.'; return; }
  const db = window.supabase.createClient(MH.config.SUPABASE_URL, MH.config.SUPABASE_KEY, {
    // Die Anmeldung endet, sobald der Tab geschlossen wird (wichtig auf geteilten Geräten).
    auth: { storageKey: 'mh.lehrkraft', storage: window.sessionStorage },
  });

  let reiter = 'fortschritt';
  let hausNummer = null;
  let kinder = [];
  let durchgaenge = [];

  const knopf = (text, tun, klasse = '') => el('button', { type: 'button', class: 'knopf klein ' + klasse, onclick: tun }, text);
  const setze = (...inhalt) => wurzel.replaceChildren(...inhalt.filter(Boolean));
  const notizen = () => MH.hole('mh.notizen', {});
  const bild = (k, klasse = 'mini') => MH.tierBild(k.tier, klasse);
  const sterne = (n) => el('span', { class: 'sterne', role: 'img', 'aria-label': `${n} von 3 Sternen`, html: MH.zeichne.sterne(n) });
  const schild = () => el('span', { class: 'strassenschild' }, 'Mathestraße');
  const kennung = (k) => `${k.tier} ${k.zahl}`;
  const fehlertext = (e) => (e && e.message) || 'Unbekannter Fehler';

  /* ---------- Anmelden ---------- */
  function anmeldung(meldung) {
    const mail = el('input', { type: 'email', required: true, autocomplete: 'username', id: 'mail' });
    const passwort = el('input', { type: 'password', required: true, autocomplete: 'current-password', id: 'passwort' });
    const form = el('form', { class: 'lk-karte schmal' },
      el('div', {}, schild()),
      el('h1', {}, 'Für Lehrkräfte'),
      el('label', { for: 'mail' }, 'E-Mail'), mail,
      el('label', { for: 'passwort' }, 'Passwort'), passwort,
      el('button', { type: 'submit', class: 'knopf haupt' }, 'Anmelden'),
      meldung && el('p', { class: 'meldung nochmal', role: 'alert' }, meldung),
      el('a', { href: 'index.html' }, 'Zur Straße der Kinder'));
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const { error } = await db.auth.signInWithPassword({ email: mail.value, password: passwort.value });
      if (error) anmeldung('Anmeldung nicht möglich: ' + fehlertext(error));
      else starte();
    });
    setze(form);
  }

  async function abmelden() {
    await db.auth.signOut();
    kinder = [];
    durchgaenge = [];
    anmeldung();
  }

  /* ---------- Daten ---------- */
  async function alle(tabelle, spalten) {
    const zeilen = [];
    for (let von = 0; ; von += 1000) {
      const { data, error } = await db.from(tabelle).select(spalten).order('erstellt_am').order('id').range(von, von + 999);
      if (error) throw error;
      zeilen.push(...data);
      if (data.length < 1000) return zeilen;
    }
  }

  async function lade() {
    [kinder, durchgaenge] = await Promise.all([
      alle('kinder', 'id,tier,zahl,token,erstellt_am'),
      alle('durchgaenge', 'id,kind_id,haus,raum,sterne,fehler,dauer_s,einschaetzung,erstellt_am'),
    ]);
    kinder.sort((a, b) => kennung(a).localeCompare(kennung(b), 'de'));
  }

  async function starte() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return anmeldung();
    setze(el('p', { class: 'laedt' }, 'Daten werden geladen …'));
    try {
      const { data, error } = await db.from('lehrkraefte').select('user_id');
      if (error) throw error;
      if (!data.length) return nichtFreigeschaltet(session.user);
      await lade();
      zeige();
    } catch (e) {
      setze(el('div', { class: 'lk-karte schmal' },
        el('p', {}, 'Die Daten konnten nicht geladen werden: ' + fehlertext(e)),
        el('p', {}, 'Ist das Supabase-Projekt pausiert? Dann im Supabase-Dashboard „Resume project“ wählen.'),
        knopf('Noch einmal versuchen', starte, 'haupt'),
        knopf('Abmelden', abmelden)));
    }
  }

  function nichtFreigeschaltet(user) {
    setze(el('div', { class: 'lk-karte' },
      el('h1', {}, 'Noch nicht freigeschaltet'),
      el('p', {}, 'Dieses Konto ist noch keine Lehrkraft. Führe im Supabase-Dashboard unter „SQL Editor“ einmal aus:'),
      el('pre', {}, `insert into public.lehrkraefte (user_id) values ('${user.id}');`),
      knopf('Erledigt, neu prüfen', starte, 'haupt'),
      knopf('Abmelden', abmelden)));
  }

  /* ---------- Fortschritt ---------- */
  function abzeichenZelle(liste) {
    const namen = liste.map((a) => (a.gruppe ? `${a.titel} (Haus ${a.gruppe})` : a.titel)).join(', ');
    return el('td', { class: 'abzeichenzahl', title: namen || 'noch keine' }, liste.length);
  }

  function fortschritt() {
    const haus = MH.haeuser.find((h) => h.nummer === hausNummer) || MH.haeuser[0];
    const raeume = haus.etagen.flatMap((e) => e.raeume);
    const namen = notizen();

    const werte = new Map(); // kind|raum -> Zusammenfassung
    const zuletzt = new Map();
    for (const d of durchgaenge) {
      if (!zuletzt.has(d.kind_id) || zuletzt.get(d.kind_id) < d.erstellt_am) zuletzt.set(d.kind_id, d.erstellt_am);
      if (d.haus !== haus.nummer) continue;
      const k = `${d.kind_id}|${d.raum}`;
      const w = werte.get(k) || { sterne: 0, mal: 0, fehler: 0, einschaetzung: null };
      w.sterne = Math.max(w.sterne, d.sterne);
      w.mal++;
      w.fehler = d.fehler; // nach Datum sortiert: letzter Versuch
      w.einschaetzung = d.einschaetzung || w.einschaetzung;
      werte.set(k, w);
    }

    if (!kinder.length) {
      return el('div', { class: 'lk-karte' },
        el('p', {}, 'Noch keine Kinder angelegt.'),
        knopf('Kinder anlegen', () => { reiter = 'kinder'; zeige(); }, 'haupt'));
    }

    const kopf1 = el('tr', {}, el('th', { rowspan: 2, class: 'kindspalte' }, 'Kind'),
      haus.etagen.map((e) => el('th', { colspan: e.raeume.length, class: 'etagenspalte' }, `${e.name} (${e.stufe})`)),
      el('th', { rowspan: 2 }, 'Zimmer'), el('th', { rowspan: 2 }, 'Abzeichen'), el('th', { rowspan: 2 }, 'zuletzt'));
    const kopf2 = el('tr', {}, raeume.map((r) => el('th', { class: 'raum' }, el('span', {}, r.titel))));

    // Abzeichen zählen über alle Häuser: bestes Ergebnis je Kind und Zimmer
    const beste = new Map();
    for (const d of durchgaenge) {
      const k = `${d.kind_id}|${d.haus}|${d.raum}`;
      beste.set(k, Math.max(beste.get(k) || 0, d.sterne));
    }
    const abzeichenVon = (kind) => MH.abzeichen.verdient(MH.haeuser, (h, r) => beste.get(`${kind.id}|${h}|${r}`) || 0);

    const zeilen = kinder.map((kind) => {
      let fertig = 0;
      const zellen = raeume.map((r) => {
        const w = werte.get(`${kind.id}|${r.id}`);
        if (!w) return el('td', { class: 'leer' }, '–');
        fertig++;
        const urteil = w.einschaetzung ? w.einschaetzung[0].toUpperCase() : '';
        return el('td', {
          class: 's' + w.sterne,
          title: `${r.titel}: ${w.sterne} Sterne, ${w.mal}× geschafft, zuletzt ${w.fehler} Fehler` +
            (w.einschaetzung ? `, Kind findet es ${w.einschaetzung}` : ''),
        }, sterne(w.sterne), urteil && el('small', {}, urteil));
      });
      const letzte = zuletzt.get(kind.id);
      return el('tr', {},
        el('th', { class: 'kindspalte' }, el('span', { class: 'wer' }, bild(kind),
          el('span', {}, kennung(kind), namen[kind.id] && el('small', {}, namen[kind.id])))),
        zellen,
        el('td', {}, `${fertig}/${raeume.length}`),
        abzeichenZelle(abzeichenVon(kind)),
        el('td', {}, letzte ? new Date(letzte).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '–'));
    });

    const summe = el('tr', { class: 'summe' }, el('th', { class: 'kindspalte' }, 'geschafft von'),
      raeume.map((r) => el('td', {}, kinder.filter((k) => werte.has(`${k.id}|${r.id}`)).length)),
      el('td', {}), el('td', {}), el('td', {}));

    const schwierig = raeume.map((r) => {
      const betroffen = kinder.filter((k) => {
        const w = werte.get(`${k.id}|${r.id}`);
        return w && (w.sterne === 1 || w.einschaetzung === 'schwer');
      });
      return { r, betroffen };
    }).filter((x) => x.betroffen.length).sort((a, b) => b.betroffen.length - a.betroffen.length).slice(0, 3);

    const wahl = el('select', { id: 'hauswahl' }, MH.haeuser.map((h) =>
      el('option', { value: h.nummer, selected: h.nummer === haus.nummer }, `Haus ${h.nummer}: ${h.titel}`)));
    wahl.addEventListener('change', () => { hausNummer = Number(wahl.value); zeige(); });

    return el('div', {},
      el('div', { class: 'leiste' }, el('label', { for: 'hauswahl' }, 'Haus'), wahl,
        knopf('Neu laden', async () => { await lade(); zeige(); })),
      schwierig.length ? el('div', { class: 'lk-karte' },
        el('h2', {}, 'Hier lohnt sich ein Blick'),
        el('ul', {}, schwierig.map((x) => el('li', {},
          `${x.r.titel}: ${x.betroffen.map((k) => namen[k.id] || kennung(k)).join(', ')}`))),
        el('p', { class: 'klein' }, 'Kinder mit nur 1 Stern oder der Einschätzung „schwer“.')) : null,
      el('div', { class: 'tabellenrahmen', style: `--hell:${haus.farbe.hell}` },
        el('table', {}, el('thead', {}, kopf1, kopf2), el('tbody', {}, zeilen, summe))),
      el('p', { class: 'klein' }, 'Sterne = bestes Ergebnis. L, M, S = so hat das Kind das Zimmer empfunden (leicht, mittel, schwer).'),
      el('p', { class: 'klein' }, 'Abzeichen zählen über alle Häuser. Mit der Maus auf die Zahl zeigen, um die Namen zu sehen.'));
  }

  /* ---------- Kinder und QR-Karten ---------- */
  const seitenUrl = () => MH.config.SEITEN_URL || new URL('index.html', location.href.split(/[?#]/)[0]).href;

  function qrSvg(text) {
    const q = window.qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 8, scalable: true });
  }

  const neuerToken = () => Array.from(crypto.getRandomValues(new Uint8Array(18)), (x) => x.toString(16).padStart(2, '0')).join('');

  function kinderVerwalten() {
    const namen = notizen();
    const anzahl = el('input', { type: 'number', min: 1, max: 40, value: 25, id: 'anzahl' });
    const anlegen = knopf('Kinder anlegen', async () => {
      const n = Number(anzahl.value);
      if (!Number.isInteger(n) || n < 1 || n > 40) { alert('Bitte eine Zahl von 1 bis 40 eingeben.'); return; }
      anlegen.disabled = true;
      const { error } = await db.rpc('kinder_anlegen', { p_anzahl: n });
      if (error) alert('Anlegen nicht möglich: ' + fehlertext(error));
      await lade();
      zeige();
    }, 'haupt');

    const liste = kinder.map((kind) => {
      const notiz = el('input', {
        type: 'text', value: namen[kind.id] || '', placeholder: 'Notiz, z. B. Vorname',
        'aria-label': `Notiz zu ${kennung(kind)}`,
      });
      notiz.addEventListener('change', () => {
        const n = notizen();
        if (notiz.value.trim()) n[kind.id] = notiz.value.trim(); else delete n[kind.id];
        MH.merke('mh.notizen', n);
      });
      return el('li', {},
        el('span', { class: 'wer' }, bild(kind), kennung(kind)),
        notiz,
        knopf('Neuer QR-Code', async () => {
          if (!confirm(`Neuen QR-Code für ${kennung(kind)} erzeugen? Die alte Karte gilt dann nicht mehr.`)) return;
          const { error } = await db.from('kinder').update({ token: neuerToken() }).eq('id', kind.id);
          if (error) alert(fehlertext(error));
          await lade();
          zeige();
        }),
        knopf('Löschen', async () => {
          if (!confirm(`${kennung(kind)} mit dem gesamten Fortschritt endgültig löschen?`)) return;
          const { error } = await db.from('kinder').delete().eq('id', kind.id);
          if (error) alert(fehlertext(error));
          await lade();
          zeige();
        }));
    });

    const online = seitenUrl().startsWith('https:');
    const karten = el('div', { class: 'qr-karten' }, kinder.map((kind) => el('div', { class: 'qr-karte' },
      el('div', { class: 'qr', html: qrSvg(`${seitenUrl()}#k=${kind.token}`) }),
      el('div', { class: 'qr-wer' },
        schild(),
        bild(kind, 'qr-tier'),
        el('div', { class: 'qr-name' }, kennung(kind))))));

    return el('div', {},
      el('div', { class: 'lk-karte nicht-drucken' },
        el('div', { class: 'leiste' }, el('label', { for: 'anzahl' }, 'Anzahl neuer Kinder'), anzahl, anlegen),
        el('p', { class: 'klein' }, 'Jedes Kind bekommt ein Tier und eine Zahl. Echte Namen werden nicht gespeichert; Notizen bleiben nur in diesem Browser.')),
      kinder.length ? el('div', { class: 'lk-karte nicht-drucken' }, el('ul', { class: 'kinderliste' }, liste)) : null,
      kinder.length ? el('div', {},
        el('div', { class: 'leiste nicht-drucken' },
          knopf('QR-Karten drucken', () => window.print(), 'haupt'),
          !online && el('span', { class: 'meldung nochmal' }, 'Erst auf der veröffentlichten Seite (https) drucken, sonst funktionieren die Codes nicht.')),
        karten) : null);
  }

  function zeige() {
    const tab = (id, text) => el('button', {
      type: 'button', class: 'knopf klein', 'aria-pressed': String(reiter === id),
      onclick: () => { reiter = id; zeige(); },
    }, text);
    setze(
      el('header', { class: 'kopf nicht-drucken' },
        el('div', { class: 'lk-titel' }, schild(), el('b', {}, 'für Lehrkräfte')),
        el('div', { class: 'kopf-rechts' },
          tab('fortschritt', 'Fortschritt'),
          tab('kinder', 'Kinder und QR-Karten'),
          el('a', { href: 'index.html?ansehen', target: '_blank', rel: 'noopener' }, 'Alle Zimmer ansehen'),
          knopf('Abmelden', abmelden))),
      el('main', { class: 'lk-inhalt' }, reiter === 'fortschritt' ? fortschritt() : kinderVerwalten()));
  }

  MH.ladeHaeuser().then(starte);
})();
