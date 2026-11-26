/* Kleine Helfer: Elemente bauen, merken, vorlesen, Töne, ziehen. */
(function () {
  'use strict';
  const MH = window.MH = window.MH || {};

  // el('button', { class: 'knopf', onclick: f }, 'Text', kind)
  MH.el = (name, eigenschaften = {}, ...kinder) => {
    const e = document.createElement(name);
    for (const [k, v] of Object.entries(eigenschaften || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'html') e.innerHTML = v; // nur für selbst gezeichnete SVGs
      else if (k === 'style') e.style.cssText = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const kind of kinder.flat()) {
      if (kind === null || kind === undefined || kind === false) continue;
      e.append(kind.nodeType ? kind : document.createTextNode(String(kind)));
    }
    return e;
  };

  MH.hole = (schluessel, sonst = null) => {
    try {
      const v = localStorage.getItem(schluessel);
      return v === null ? sonst : JSON.parse(v);
    } catch (e) { return sonst; }
  };
  MH.merke = (schluessel, wert) => {
    try {
      if (wert === null) localStorage.removeItem(schluessel);
      else localStorage.setItem(schluessel, JSON.stringify(wert));
    } catch (e) { /* privater Modus: dann eben nur bis zum Schließen */ }
  };

  MH.uuid = () => {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  };

  /* ---------- Vorlesen ---------- */
  MH.kannVorlesen = 'speechSynthesis' in window;
  MH.sprich = (text) => {
    if (!MH.kannVorlesen) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      text.replace(/</g, ' ist kleiner als ').replace(/>/g, ' ist größer als ')
    );
    u.lang = 'de-DE';
    u.rate = 0.9;
    speechSynthesis.speak(u);
  };

  /* ---------- Töne ---------- */
  let klang = null;
  MH.stumm = () => MH.hole('mh.stumm', false);
  MH.ton = (art) => {
    if (MH.stumm()) return;
    try {
      klang = klang || new (window.AudioContext || window.webkitAudioContext)();
      if (klang.state === 'suspended') klang.resume();
      const folgen = {
        richtig: [[660, 0], [880, 0.09]],
        falsch: [[220, 0]],
        plopp: [[520, 0]],
        fertig: [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36]],
      };
      for (const [hz, start] of folgen[art] || []) {
        const o = klang.createOscillator();
        const g = klang.createGain();
        o.type = art === 'falsch' ? 'sine' : 'triangle';
        o.frequency.value = hz;
        const t = klang.currentTime + start;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g).connect(klang.destination);
        o.start(t);
        o.stop(t + 0.25);
      }
    } catch (e) { /* ohne Ton geht es auch */ }
  };

  MH.konfetti = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const farben = ['#e8321f', '#ffc83d', '#2a8f35', '#1667c9'];
    const feld = MH.el('div', { class: 'konfetti', 'aria-hidden': 'true' });
    for (let i = 0; i < 60; i++) {
      feld.append(MH.el('i', {
        style: `left:${Math.random() * 100}%;background:${farben[i % 4]};animation-delay:${Math.random() * 0.5}s;animation-duration:${1.6 + Math.random()}s`,
      }));
    }
    document.body.append(feld);
    setTimeout(() => feld.remove(), 3200);
  };

  /* ---------- Antippen ODER ziehen ----------
   * Antippen ruft tippen() auf. Wird gezogen und auf einem Ziel (Selektor) losgelassen,
   * wird ablegen(ziel) aufgerufen. Tastatur (Enter) zählt als Antippen. */
  MH.ziehbar = (knopf, { ziele, tippen, ablegen }) => {
    let start = null, geist = null, gezogen = false, markiert = null;
    const zielBei = (ev) => {
      const unter = document.elementFromPoint(ev.clientX, ev.clientY);
      return unter && unter.closest(ziele);
    };
    const markiere = (ziel) => {
      if (ziel === markiert) return;
      if (markiert) markiert.classList.remove('drueber');
      markiert = ziel;
      if (markiert) markiert.classList.add('drueber');
    };
    const ende = () => {
      markiere(null);
      start = null;
      if (geist) geist.remove();
      geist = null;
      knopf.classList.remove('wird-gezogen');
    };
    knopf.classList.add('ziehbar');
    knopf.addEventListener('pointerdown', (ev) => {
      if (knopf.disabled || ev.button > 0) return;
      start = { x: ev.clientX, y: ev.clientY };
      gezogen = false;
      try { knopf.setPointerCapture(ev.pointerId); } catch (e) { /* egal */ }
    });
    knopf.addEventListener('pointermove', (ev) => {
      if (!start) return;
      if (!gezogen && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 10) return;
      if (!geist) {
        gezogen = true;
        geist = knopf.cloneNode(true);
        geist.classList.add('geist');
        const r = knopf.getBoundingClientRect();
        geist.style.width = r.width + 'px';
        geist.style.height = r.height + 'px';
        document.body.append(geist);
        knopf.classList.add('wird-gezogen');
      }
      geist.style.left = ev.clientX + 'px';
      geist.style.top = ev.clientY + 'px';
      markiere(zielBei(ev));
    });
    knopf.addEventListener('pointerup', (ev) => {
      if (!start) return;
      const warGezogen = gezogen;
      ende();
      if (warGezogen) {
        const ziel = zielBei(ev);
        if (ziel) ablegen(ziel);
      }
    });
    knopf.addEventListener('pointercancel', ende);
    knopf.addEventListener('click', (ev) => {
      // nach dem Ziehen folgt oft noch ein Klick: der zählt nicht
      if (gezogen && ev.detail !== 0) { gezogen = false; return; }
      tippen(ev);
    });
  };
})();
