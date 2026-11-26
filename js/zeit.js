/* Tägliches Zeitlimit.
 * Gezählt wird nur, solange die App zu sehen ist und in den letzten 3 Minuten berührt wurde.
 * Die Summe je Kind steht in der Datenbank und gilt damit auf allen Geräten.
 * Ohne Netz merkt sich das Gerät die Zeit und meldet sie später. */
(function () {
  'use strict';
  const MH = window.MH;
  const S = MH.speicher;
  const Z = MH.zeit = {};

  const MELDEN_ALLE = 30000;          // Millisekunden
  const UNTAETIG = 3 * 60 * 1000;     // so lange ohne Berührung: Uhr steht
  const NACHSPIEL = 3 * 60;           // Sekunden, um ein angefangenes Zimmer zu beenden
  const WARNUNG = 2 * 60;             // Sekunden vor Schluss
  const REGEL = 'mh.zeitregel';

  let hooks = null;
  let laeuftFuer = null;              // Token des Kindes, dessen Anmeldung fertig geprüft ist
  let letzterTakt = Date.now();
  let letzteBeruehrung = Date.now();
  let letzteMeldung = Date.now();
  let gewarnt = false, nachspielGemeldet = false;

  /* ---------- Regel (stellt die Lehrkraft ein) ---------- */
  Z.regel = () => MH.hole(REGEL, { limit_min: null, zimmer_beenden: true });
  const merkeRegel = (r) => {
    if (r && r.limit_min !== undefined) MH.merke(REGEL, { limit_min: r.limit_min, zimmer_beenden: r.zimmer_beenden !== false });
  };
  Z.ladeRegel = async () => {
    try { merkeRegel(await S.rpc('zeitregel', {})); } catch (e) { /* ohne Netz gilt die zuletzt bekannte Regel */ }
    return Z.regel();
  };

  /* ---------- Heute genutzte Zeit eines Kindes ---------- */
  const heute = () => {
    const d = new Date();
    const zwei = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`;
  };
  const ablage = (kind) => `mh.zeit.${kind.tier}-${kind.zahl}`;
  // gemeldet = Stand der Datenbank, offen = noch nicht gemeldete Sekunden
  const lies = (kind) => {
    const stand = MH.hole(ablage(kind));
    return stand && stand.tag === heute() ? stand : { tag: heute(), server: null, gemeldet: 0, offen: 0 };
  };

  const kindJetzt = () => (S.sitzung && !S.sitzung.gast ? S.sitzung : null);
  Z.rest = (kind) => {
    const minuten = Z.regel().limit_min;
    if (!minuten) return Infinity;
    const stand = lies(kind);
    return minuten * 60 - stand.gemeldet - stand.offen;
  };
  Z.abgelaufen = (kind = kindJetzt()) => Boolean(kind) && Z.rest(kind) <= 0;

  async function sende(kind) {
    try {
      const vorher = lies(kind);
      const sekunden = Math.floor(vorher.offen);
      const antwort = await S.rpc('zeit_melden', { p_token: kind.token, p_tag: vorher.server || vorher.tag, p_sekunden: sekunden });
      if (!antwort) return;
      merkeRegel(antwort);
      const jetzt = lies(kind);
      MH.merke(ablage(kind), {
        tag: jetzt.tag, server: antwort.tag, gemeldet: antwort.sekunden, offen: Math.max(0, jetzt.offen - sekunden),
      });
    } catch (e) { /* ohne Netz: beim nächsten Mal */ }
  }
  // nacheinander, damit keine Sekunde doppelt gemeldet wird
  let kette = Promise.resolve();
  Z.melden = (kind) => {
    kette = kette.then(() => sende(kind));
    return kette;
  };

  /* ---------- Hinweisband ---------- */
  let band = null, bandUhr = null;
  const bandWeg = () => {
    clearTimeout(bandUhr);
    if (band) band.remove();
    band = null;
  };
  Z.bandWeg = bandWeg;
  const sage = (text) => {
    bandWeg();
    band = MH.el('div', { class: 'zeitband', role: 'status' }, text);
    document.body.append(band);
    bandUhr = setTimeout(bandWeg, 12000);
  };

  /* ---------- Beginn und Ende einer Sitzung ---------- */
  // true = für heute ist schon Schluss
  Z.beginne = async (kind) => {
    laeuftFuer = null;
    bandWeg();
    gewarnt = false;
    nachspielGemeldet = false;
    await Z.melden(kind);
    letzterTakt = letzteBeruehrung = letzteMeldung = Date.now();
    laeuftFuer = kind.token;
    return Z.abgelaufen(kind);
  };

  Z.ende = (kind) => {
    laeuftFuer = null;
    bandWeg();
    if (kind && !kind.gast) Z.melden(kind);
  };

  /* ---------- Uhr ---------- */
  function pruefe(kind) {
    const rest = Z.rest(kind);
    if (rest > 0) {
      if (rest <= WARNUNG && !gewarnt) {
        gewarnt = true;
        sage(rest > 60 ? 'Noch 2 Minuten, dann ist für heute Schluss.' : 'Noch 1 Minute, dann ist für heute Schluss.');
      }
      return;
    }
    const wo = hooks.wo();
    if (wo === 'abschluss') return;
    if (wo === 'zimmer' && Z.regel().zimmer_beenden && rest > -NACHSPIEL) {
      if (!nachspielGemeldet) {
        nachspielGemeldet = true;
        sage('Die Zeit ist um. Beende noch dieses Zimmer.');
      }
      return;
    }
    hooks.schluss(kind);
  }

  function takt() {
    const jetzt = Date.now();
    const dauer = Math.min(Math.max(jetzt - letzterTakt, 0), 5000) / 1000;
    letzterTakt = jetzt;
    const sitzung = S.sitzung;
    if (!sitzung || sitzung.ansehen) return;
    const faellig = jetzt - letzteMeldung >= MELDEN_ALLE && !document.hidden;

    if (sitzung.gast) {
      // wird während des Ausprobierens ein Limit eingestellt, endet das Ausprobieren
      if (faellig) {
        letzteMeldung = jetzt;
        Z.ladeRegel().then((r) => { if (r.limit_min && S.sitzung === sitzung) hooks.gastSchluss(); });
      }
      return;
    }
    if (sitzung.token !== laeuftFuer) return;
    if (!document.hidden && jetzt - letzteBeruehrung < UNTAETIG) {
      const stand = lies(sitzung);
      stand.offen += dauer;
      MH.merke(ablage(sitzung), stand);
    }
    if (faellig) {
      letzteMeldung = jetzt;
      Z.melden(sitzung);
    }
    pruefe(sitzung);
  }

  Z.starte = (rueckrufe) => {
    hooks = rueckrufe;
    ['pointerdown', 'keydown'].forEach((art) => window.addEventListener(art, () => { letzteBeruehrung = Date.now(); }, true));
    document.addEventListener('visibilitychange', () => {
      letzterTakt = Date.now();
      const kind = kindJetzt();
      if (kind && kind.token === laeuftFuer) Z.melden(kind);
    });
    setInterval(takt, 1000);
  };
})();
