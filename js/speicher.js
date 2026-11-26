/* Anmeldung und Lernfortschritt.
 * Ergebnisse landen zuerst in einer Warteschlange auf dem Gerät und werden dann gesendet.
 * Fällt das WLAN aus, geht nichts verloren. */
(function () {
  'use strict';
  const MH = window.MH;
  const S = MH.speicher = { sitzung: null, stand: {} };

  const SCHLANGE = 'mh.warteschlange';
  const schluessel = (haus, raum) => `${haus}/${raum}`;
  const standName = (sitzung) => (sitzung.gast ? 'mh.stand.gast' : `mh.stand.${sitzung.tier}-${sitzung.zahl}`);

  async function rpc(name, werte) {
    const abbruch = new AbortController();
    const uhr = setTimeout(() => abbruch.abort(), 8000);
    try {
      const antwort = await fetch(`${MH.config.SUPABASE_URL}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: { apikey: MH.config.SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(werte),
        signal: abbruch.signal,
      });
      if (!antwort.ok) {
        const fehler = new Error('HTTP ' + antwort.status);
        fehler.status = antwort.status;
        throw fehler;
      }
      const text = await antwort.text();
      return text ? JSON.parse(text) : null;
    } finally {
      clearTimeout(uhr);
    }
  }

  S.rpc = rpc;

  const besser = (stand, haus, raum, sterne) => {
    const k = schluessel(haus, raum);
    stand[k] = Math.max(stand[k] || 0, sterne);
  };

  function uebernimm(token, profil) {
    S.sitzung = { token, tier: profil.tier, zahl: profil.zahl };
    const stand = {};
    for (const f of profil.fortschritt || []) besser(stand, f.haus, f.raum, f.sterne);
    // noch nicht gesendete Ergebnisse dieses Kindes mitzählen
    for (const w of MH.hole(SCHLANGE, [])) {
      if (w.p_token === token) besser(stand, w.p_haus, w.p_raum, w.p_sterne);
    }
    S.stand = stand;
    MH.merke('mh.sitzung', S.sitzung);
    MH.merke(standName(S.sitzung), stand);
  }

  S.anmeldenMitToken = async (token) => {
    try {
      await S.senden();
      const profil = await rpc('kind_anmelden', { p_token: token });
      if (!profil) return { ok: false, grund: 'unbekannt' };
      uebernimm(token, profil);
      return { ok: true };
    } catch (e) {
      // ohne Netz: nur weitermachen, wenn dieses Kind auf dem Gerät schon bekannt ist
      const alt = MH.hole('mh.sitzung');
      if (alt && alt.token === token) {
        S.sitzung = alt;
        S.stand = MH.hole(standName(alt), {});
        return { ok: true, offline: true };
      }
      return { ok: false, grund: 'netz' };
    }
  };

  S.anmeldenMitTier = async (tier, zahl) => {
    try {
      const antwort = await rpc('kind_anmelden_tier', { p_tier: tier, p_zahl: zahl });
      if (!antwort || !antwort.ok) return { ok: false, grund: (antwort && antwort.grund) || 'unbekannt' };
      uebernimm(antwort.token, antwort);
      return { ok: true };
    } catch (e) {
      return { ok: false, grund: 'netz' };
    }
  };

  S.alsGast = () => {
    S.sitzung = { gast: true };
    S.stand = MH.hole('mh.stand.gast', {});
  };

  // Nur zum Anschauen für die Lehrkraft: alles offen, nichts wird gespeichert.
  S.zumAnschauen = () => {
    S.sitzung = { gast: true, ansehen: true };
    S.stand = {};
  };

  S.gemerkt = () => MH.hole('mh.sitzung');

  S.abmelden = () => {
    S.sitzung = null;
    S.stand = {};
    MH.merke('mh.sitzung', null);
  };

  S.sterne = (haus, raum) => S.stand[schluessel(haus, raum)] || 0;

  /* ---------- Speichern ---------- */
  let laeuft = null;
  S.senden = () => {
    if (laeuft) return laeuft;
    laeuft = (async () => {
      for (;;) {
        const schlange = MH.hole(SCHLANGE, []);
        if (!schlange.length) return true;
        const eintrag = schlange[0];
        const gesendet = JSON.stringify(eintrag);
        try {
          await rpc('durchgang_speichern', eintrag);
        } catch (e) {
          // 400 = die Daten selbst sind ungültig; nicht ewig wiederholen. Sonst später nochmal.
          if (e.status !== 400) return false;
        }
        // nur entfernen, wenn der Eintrag inzwischen nicht ergänzt wurde
        const jetzt = MH.hole(SCHLANGE, []);
        MH.merke(SCHLANGE, jetzt.filter((w) => JSON.stringify(w) !== gesendet));
      }
    })().finally(() => { laeuft = null; });
    return laeuft;
  };

  const inSchlange = (eintrag) => {
    const schlange = MH.hole(SCHLANGE, []).filter((w) => w.p_id !== eintrag.p_id);
    schlange.push(eintrag);
    MH.merke(SCHLANGE, schlange);
  };

  // gibt den Datensatz zurück, damit später die Selbsteinschätzung ergänzt werden kann
  S.speichereDurchgang = ({ haus, raum, sterne, fehler, dauer }) => {
    if (S.sitzung.ansehen) return { eintrag: null, gesendet: Promise.resolve(null) };
    besser(S.stand, haus, raum, sterne);
    MH.merke(standName(S.sitzung), S.stand);
    if (S.sitzung.gast) return { eintrag: null, gesendet: Promise.resolve(null) };
    const eintrag = {
      p_token: S.sitzung.token, p_id: MH.uuid(), p_haus: haus, p_raum: raum,
      p_sterne: sterne, p_fehler: Math.min(fehler, 999), p_dauer: Math.min(Math.round(dauer), 86400),
      p_einschaetzung: null,
    };
    inSchlange(eintrag);
    return { eintrag, gesendet: S.senden() };
  };

  S.einschaetzen = (eintrag, wert) => {
    if (!eintrag) return Promise.resolve(null);
    inSchlange(Object.assign({}, eintrag, { p_einschaetzung: wert }));
    // falls gerade gesendet wird: danach noch einmal anstoßen
    return S.senden().then(() => S.senden());
  };

  window.addEventListener('online', () => S.senden());
})();
