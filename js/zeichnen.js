/* Alle Zeichnungen: wachsendes Haus, Zehnersystem-Material, Hanteln, Sterne. */
(function () {
  'use strict';
  const MH = window.MH;
  const Z = MH.zeichne = {};

  const rect = (x, y, w, h, fill, extra = '') =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
  const linie = 'stroke="#1f2d3d" stroke-width="2.5" stroke-linejoin="round"';

  /* ---------- Haus auf der Straße ----------
   * stufe: 0 (leerer Bauplatz) bis 16 (fertig). neu: Teil, das gerade dazukommt. */
  Z.TEILE = 16;
  Z.haus = ({ nummer, farbe, stufe, neu = null }) => {
    const licht = stufe >= Z.TEILE ? '#ffe27a' : '#bfe4f7';
    const teil = (i, inhalt) => (i <= stufe ? `<g class="teil${i === neu ? ' neu' : ''}">${inhalt}</g>` : '');
    const fenster = (x, y, w = 32, h = 30) =>
      rect(x, y, w, h, licht, `rx="3" ${linie}`) +
      `<path d="M${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}" stroke="#1f2d3d" stroke-width="1.5"/>`;

    let s = `<svg viewBox="0 0 240 290" role="img" aria-label="Haus ${nummer}: ${stufe} von ${Z.TEILE} Teilen gebaut">`;

    if (stufe < 12) { // Kran
      s += `<g stroke="#e0a100" stroke-width="5" fill="none" stroke-linecap="round">
        <path d="M18 280V34H168"/><path d="M18 62L46 34" stroke-width="3"/></g>
        <path d="M150 34v26" stroke="#1f2d3d" stroke-width="1.5"/>
        ${rect(138, 60, 24, 12, '#c86a3c', linie)}`;
    }
    if (stufe === 0) { // Baugrube mit Sand und Ziegeln
      s += `<path d="M60 280q40-52 80 0z" fill="#e8c77d" ${linie}/>`;
      for (const [x, y] of [[150, 268], [176, 268], [163, 256]]) s += rect(x, y, 26, 12, '#c86a3c', linie);
    }

    s += teil(1, rect(30, 266, 180, 14, '#9aa3ad', linie));
    s += teil(2, rect(40, 196, 160, 70, farbe.wand, linie));
    s += teil(6, rect(40, 126, 160, 70, farbe.wand, linie));
    s += teil(14, rect(172, 52, 18, 40, '#c86a3c', linie) +
      '<g class="rauch" fill="#fff" stroke="#9aa3ad"><circle cx="184" cy="40" r="7"/><circle cx="195" cy="28" r="9"/><circle cx="208" cy="14" r="11"/></g>');
    s += teil(12, `<path d="M18 128L64 70H176L222 128Z" fill="${farbe.dach}" ${linie}/>`);
    s += teil(3, rect(104, 218, 32, 48, '#8a5a32', `rx="12" ${linie}`) + '<circle cx="128" cy="244" r="3" fill="#ffc83d"/>');
    s += teil(4, fenster(56, 214));
    s += teil(5, fenster(152, 214));
    s += teil(7, fenster(54, 144));
    s += teil(8, fenster(154, 144));
    s += teil(9, fenster(105, 142, 30, 44));
    s += teil(10, rect(92, 172, 56, 5, '#fff', linie) + rect(92, 188, 56, 5, '#fff', linie) +
      '<path d="M96 177v11M108 177v11M120 177v11M132 177v11M144 177v11" stroke="#1f2d3d" stroke-width="2.5"/>');
    const blumen = (x) => rect(x - 3, 174, 38, 9, '#8a5a32', linie) +
      [0, 11, 22, 31].map((d, i) => `<circle cx="${x + d + 1}" cy="173" r="4.5" fill="${i % 2 ? '#ffc83d' : '#fff'}" stroke="#1f2d3d"/>`).join('');
    s += teil(11, blumen(54) + blumen(154));
    s += teil(15, [64, 176].map((x) =>
      `<circle cx="${x}" cy="104" r="11" fill="${licht}" ${linie}/><path d="M${x} 93v22M${x - 11} 104h22" stroke="#1f2d3d" stroke-width="1.5"/>`).join(''));
    // Hausnummernschild wie auf dem Booklet
    const schild = (x, y) =>
      `<path d="M${x + 7} ${y}H${x + 49}q0 7 7 7V${y + 39}q-7 0-7 7H${x + 7}q0-7-7-7V${y + 7}q7 0 7-7Z" fill="#fff" stroke="#8f2b22" stroke-width="5"/>
       <text x="${x + 28}" y="${y + 32}" text-anchor="middle" font-size="26" font-weight="700" fill="#1f2d3d">${nummer}</text>`;
    s += teil(13, schild(92, 58));
    s += teil(16, `<path d="M72 70V24" ${linie}/><path d="M72 24h30l-8 9 8 9H72Z" fill="#ffc83d" ${linie}/>
      <g fill="#4f9a3b" ${linie}><circle cx="24" cy="270" r="12"/><circle cx="37" cy="274" r="9"/><circle cx="217" cy="270" r="12"/></g>
      <g fill="#fff" stroke="#1f2d3d"><circle cx="22" cy="266" r="3"/><circle cx="215" cy="267" r="3"/></g>`);

    if (stufe >= 2 && stufe < 12) { // Gerüst
      s += '<g stroke="#a9742f" stroke-width="3" fill="none"><path d="M206 280V118M228 280V118M200 196h34M200 126h34M206 196l22-70M206 266l22-70"/></g>';
    }
    if (stufe < 13) { // Bauschild mit Hausnummer, solange das richtige Schild noch fehlt
      s += `<path d="M44 280v-22" ${linie}/>${rect(26, 236, 36, 26, '#fff', `rx="4" stroke="#8f2b22" stroke-width="4"`)}
        <text x="44" y="255" text-anchor="middle" font-size="17" font-weight="700" fill="#1f2d3d">${nummer}</text>`;
    }
    return s + '</svg>';
  };

  Z.stufe = (fertig, gesamt) => {
    if (fertig <= 0) return 0;
    if (fertig >= gesamt) return Z.TEILE;
    return Math.max(1, Math.min(Z.TEILE - 1, Math.round((fertig / gesamt) * Z.TEILE)));
  };

  Z.bauplatz = () => `<svg viewBox="0 0 240 290" aria-hidden="true">
    <path d="M50 280q45-48 92 0z" fill="#e8c77d" ${linie}/>
    <path d="M24 280v-34M70 280v-34M170 280v-34M216 280v-34M16 254h62M162 254h62M16 268h62M162 268h62" stroke="#a9742f" stroke-width="6"/>
    <path d="M120 232v-44" ${linie}/>
    ${rect(62, 140, 116, 52, '#ffc83d', `rx="6" ${linie}`)}
    <text x="120" y="162" text-anchor="middle" font-size="15" font-weight="700" fill="#1f2d3d">Hier wird</text>
    <text x="120" y="181" text-anchor="middle" font-size="15" font-weight="700" fill="#1f2d3d">bald gebaut</text>
  </svg>`;

  /* ---------- Zehnersystem-Material ----------
   * Immer gleicher Maßstab, damit beide Seiten wirklich vergleichbar sind. */
  const FARBEN = {
    bunt: { H: ['#46a83f', '#1f6b1c'], Z: ['#dd3a30', '#8f1c15'], E: ['#2379d1', '#0f477f'] },
    holz: { H: ['#e2b56e', '#8f6027'], Z: ['#e2b56e', '#8f6027'], E: ['#e2b56e', '#8f6027'] },
  };

  const platte = (x, y, [f, r]) => {
    let s = rect(x, y, 40, 40, f, `stroke="${r}" stroke-width="1.5"`);
    let d = '';
    for (let i = 4; i < 40; i += 4) d += `M${x + i} ${y}v40M${x} ${y + i}h40`;
    return s + `<path d="${d}" stroke="${r}" stroke-width="0.5" fill="none"/>`;
  };
  const stange = (x, y, [f, r]) => {
    let d = '';
    for (let i = 4; i < 40; i += 4) d += `M${x} ${y + i}h7`;
    return rect(x, y, 7, 40, f, `stroke="${r}" stroke-width="1.2"`) + `<path d="${d}" stroke="${r}" stroke-width="0.7"/>`;
  };
  const wuerfel = (x, y, [f, r]) => rect(x, y, 11, 11, f, `stroke="${r}" stroke-width="1.4"`);

  const breiten = ({ h, z, e }) => [
    h ? Math.min(h, 3) * 44 - 4 : 0,
    z ? z * 11 + (z > 5 ? 6 : 0) - 4 : 0,
    e ? (e > 5 ? 26 : 11) : 0,
  ].filter(Boolean);
  const gesamtBreite = (teile) => teile.reduce((a, b) => a + b, 0) + Math.max(0, teile.length - 1) * 12;

  // Gemeinsamer Ausschnitt für alle Zahlen, die miteinander verglichen werden.
  Z.rahmen = (...zahlen) => {
    const st = zahlen.map(MH.logik.stellen);
    return {
      b: Math.max(160, ...st.map((s) => gesamtBreite(breiten(s)) + 8)),
      h: Math.max(70, ...st.map((s) => Math.max(Math.ceil(s.h / 3) * 44, Math.min(s.e, 5) * 13) + 6)),
    };
  };

  Z.material = (zahl, stil = 'bunt', rahmen = Z.rahmen(zahl)) => {
    const { h, z, e } = MH.logik.stellen(zahl);
    const farben = FARBEN[stil];
    const { b: B, h: H } = rahmen;
    let x = Math.max(0, (B - gesamtBreite(breiten({ h, z, e }))) / 2);
    let s = `<svg class="material" viewBox="0 0 ${B} ${H}" role="img" aria-label="Material: ${h} Hunderterplatten, ${z} Zehnerstangen, ${e} Einerwürfel">`;
    for (let i = 0; i < h; i++) {
      s += platte(x + (i % 3) * 44, H - 42 - Math.floor(i / 3) * 44, farben.H);
    }
    if (h) x += Math.min(h, 3) * 44 - 4 + 12;
    for (let i = 0; i < z; i++) s += stange(x + i * 11 + (i >= 5 ? 6 : 0), H - 42, farben.Z);
    if (z) x += z * 11 + (z > 5 ? 6 : 0) - 4 + 12;
    for (let i = 0; i < e; i++) s += wuerfel(x + Math.floor(i / 5) * 15, H - 13 - (i % 5) * 13, farben.E);
    return s + '</svg>';
  };

  Z.einzelteil = (art) => {
    const farben = FARBEN.bunt;
    const inhalt = art === 'H' ? platte(4, 4, farben.H) : art === 'Z' ? stange(20, 4, farben.Z) : wuerfel(18, 18, farben.E);
    return `<svg viewBox="0 0 48 48" aria-hidden="true">${inhalt}</svg>`;
  };

  Z.hantel = (stufe) => {
    const [r, b] = { leicht: [6, 13], mittel: [9, 17], schwer: [13, 18] }[stufe];
    const stern = stufe === 'schwer'
      ? '<path d="M8 4l-4-3M56 4l4-3M8 36l-4 3M56 36l4 3" stroke="#1f2d3d" stroke-width="2"/>' : '';
    return `<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M${32 - b} 20h${2 * b}" stroke="#1f2d3d" stroke-width="5"/>
      <circle cx="${32 - b}" cy="20" r="${r}" fill="#fff" stroke="#1f2d3d" stroke-width="3"/>
      <circle cx="${32 + b}" cy="20" r="${r}" fill="#fff" stroke="#1f2d3d" stroke-width="3"/>${stern}</svg>`;
  };

  Z.stern = (voll) =>
    `<svg class="stern${voll ? ' voll' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 6.6 7 .8-5.2 4.8 1.4 7.1L12 17.7 5.8 21.3l1.4-7.1L2 9.4l7-.8z"/></svg>`;
  Z.sterne = (n) => [1, 2, 3].map((i) => Z.stern(i <= n)).join('');
})();
