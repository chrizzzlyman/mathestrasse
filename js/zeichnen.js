/* Alle Zeichnungen: wachsendes Haus, Straßenkulisse, Zehnersystem-Material, Hanteln, Sterne.
 * Alles wirkt wie Spielzeug: Vorderseite, Deckfläche und dunklere Seitenfläche, keine Umrandungen. */
(function () {
  'use strict';
  const MH = window.MH;
  const Z = MH.zeichne = {};

  const rect = (x, y, w, h, fill, extra = '') =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
  const flaeche = (punkte, fill, extra = '') => `<polygon points="${punkte}" fill="${fill}" ${extra}/>`;
  const kreis = (x, y, r, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
  const schatten = (fill) => `<ellipse cx="136" cy="283" rx="${fill}" ry="8" fill="#123a20" opacity=".18"/>`;

  /* ---------- Haus auf der Straße ----------
   * stufe: 0 (leerer Bauplatz) bis 16 (fertig). neu: Teil, das gerade dazukommt.
   * Schräge Ansicht: Die Seitenwand läuft um 34 nach rechts und 18 nach oben. */
  Z.TEILE = 16;
  Z.haus = ({ nummer, farbe, stufe, neu = null }) => {
    const fertig = stufe >= Z.TEILE;
    const rand = farbe.rand || '#a3271c';       // Rand der Nummernschilder
    const tief = farbe.schatten || '#4a0d18';   // dunkelt die Seitenwand ab
    const teil = (i, inhalt) => (i <= stufe ? `<g class="teil${i === neu ? ' neu' : ''}">${inhalt}</g>` : '');

    const glas = (x, y, w, h, rund = 5) =>
      rect(x - 4, y - 4, w + 8, h + 8, '#fff', `rx="${rund + 3}"`) +
      rect(x, y, w, h, fertig ? '#ffd95c' : '#7fc4f2', `rx="${rund}"`) +
      flaeche(`${x + 4},${y + h - 4} ${x + w * 0.55},${y + 3} ${x + w * 0.8},${y + 3} ${x + w * 0.28},${y + h - 4}`, '#fff', 'opacity=".4"') +
      `<path d="M${x + w / 2} ${y}v${h}" stroke="#fff" stroke-width="3"/>` +
      rect(x - 6, y + h + 3, w + 12, 5, '#fff', 'rx="2"') +
      rect(x - 6, y + h + 6, w + 12, 2, '#000', 'opacity=".12"');

    // Wandstück mit Seitenfläche
    const wand = (y, h) =>
      rect(36, y, 144, h, farbe.wand) +
      flaeche(`180,${y} 214,${y - 18} 214,${y + h - 18} 180,${y + h}`, farbe.wand) +
      flaeche(`180,${y} 214,${y - 18} 214,${y + h - 18} 180,${y + h}`, tief, 'opacity=".2"') +
      rect(36, y, 144, 4, '#000', 'opacity=".07"');
    const deckel = (y) => flaeche(`36,${y} 70,${y - 18} 214,${y - 18} 180,${y}`, farbe.wand) +
      flaeche(`36,${y} 70,${y - 18} 214,${y - 18} 180,${y}`, '#fff', 'opacity=".45"');

    let s = `<svg class="haus${fertig ? ' ganz' : ''}" viewBox="0 0 250 292" role="img" aria-label="Haus ${nummer}: ${stufe} von ${Z.TEILE} Teilen gebaut">`;
    if (stufe > 0) s += schatten(112);

    if (stufe < 12) { // Kran
      s += `<g fill="none" stroke="#f2b100" stroke-linecap="round">
          <path d="M14 282V30M26 282V30" stroke-width="4"/>
          <path d="M14 274l12-18-12-18 12-18-12-18 12-18-12-18 12-18-12-18 12-18-12-18 12-18-12-18 12-18" stroke-width="2.5"/>
          <path d="M8 30h168" stroke-width="8"/><path d="M20 8L8 30M20 8l66 22M20 8v22" stroke-width="3"/>
        </g>
        ${rect(4, 30, 14, 20, '#51607a', 'rx="3"')}
        <g class="haken-last"><path d="M150 34v24M150 58l-14 12M150 58l14 12" stroke="#51607a" stroke-width="2" fill="none"/>
          ${rect(134, 70, 32, 8, '#e0793f', 'rx="2"')}${rect(134, 79, 15, 8, '#c9602b', 'rx="2"')}${rect(151, 79, 15, 8, '#c9602b', 'rx="2"')}</g>`;
    }
    if (stufe === 0) { // Baugrube mit Sand und Ziegeln
      s += `<ellipse cx="118" cy="278" rx="92" ry="12" fill="#a9733f" opacity=".45"/>
        <path d="M48 278q38-58 90 0z" fill="#f4cd72"/><path d="M93 249q26 6 45 29H100z" fill="#e3b552"/>`;
      for (const [x, y] of [[150, 266], [178, 266], [164, 254], [150, 242]]) {
        s += rect(x, y, 26, 11, '#e0793f', 'rx="2"') + rect(x, y + 8, 26, 3, '#a94d1f', 'rx="1"');
      }
    }

    s += teil(1, rect(28, 266, 160, 16, '#b9c2d1', 'rx="3"') +
      flaeche('188,266 220,249 220,265 188,282', '#8793a8'));
    s += teil(2, wand(196, 70) + (stufe < 6 ? deckel(196) : ''));
    s += teil(6, wand(126, 70) + rect(36, 193, 144, 6, '#fff', 'opacity=".75"') + (stufe < 12 ? deckel(126) : ''));
    s += teil(14, rect(154, 46, 20, 56, '#d4663a') + flaeche('174,46 182,42 182,98 174,102', '#a94d1f') +
      rect(151, 42, 26, 8, '#8f3f19', 'rx="2"') +
      '<g class="rauch" fill="#fff" opacity=".9"><circle cx="166" cy="29" r="7"/><circle cx="177" cy="17" r="9"/><circle cx="192" cy="9" r="8"/></g>');

    // Dach: vordere Dachfläche, seitlicher Giebel, Ziegelreihen
    let ziegel = '';
    for (let reihe = 0; reihe < 5; reihe++) {
      const y = 66 + reihe * 13;
      const links = 50 - (y - 54) * 0.32, rechts = 197 - (y - 54) * 0.146;
      const n = Math.floor((rechts - links - 8) / 14);
      let d = `M${links + 4 + (reihe % 2) * 7} ${y}`;
      for (let i = 0; i < n - (reihe % 2); i++) d += 'q7 8 14 0';
      ziegel += `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".16" stroke-width="2.5" stroke-linecap="round"/>`;
    }
    s += teil(12, flaeche('180,126 214,108 197,56', farbe.wand) +
      flaeche('180,126 214,108 197,56', tief, 'opacity=".2"') +
      `<path d="M26 130L50 54H197L186 130Z" fill="${farbe.dach}" stroke="${farbe.dach}" stroke-width="5" stroke-linejoin="round"/>` +
      ziegel +
      `<path d="M197 54L218 107" stroke="${farbe.dach}" stroke-width="9" stroke-linecap="round" fill="none"/>
       <path d="M197 54L218 107" stroke="#000" stroke-opacity=".22" stroke-width="9" stroke-linecap="round" fill="none"/>
       <path d="M52 54H196" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
       <path d="M28 130H186" stroke="#000" stroke-opacity=".25" stroke-width="5" stroke-linecap="round"/>`);

    s += teil(3, '<path d="M90 266V232a18 18 0 0 1 36 0v34Z" fill="#fff"/>' +
      '<path d="M94 266V232a14 14 0 0 1 28 0v34Z" fill="#8a5232"/>' +
      '<path d="M108 218v48" stroke="#000" stroke-opacity=".15" stroke-width="2"/>' +
      kreis(116, 244, 3, '#ffd04d') + rect(84, 264, 48, 8, '#d9dfe8', 'rx="2"') + rect(80, 272, 56, 8, '#c3ccda', 'rx="2"'));
    s += teil(4, glas(50, 216, 28, 28));
    s += teil(5, glas(138, 216, 28, 28));
    s += teil(7, glas(50, 144, 28, 28));
    s += teil(8, glas(138, 144, 28, 28));
    s += teil(9, glas(95, 142, 26, 42, 12));
    s += teil(10, rect(80, 186, 56, 7, '#fff', 'rx="3"') + rect(80, 168, 56, 5, '#fff', 'rx="2"') +
      '<path d="M84 172v14M95 172v14M108 172v14M121 172v14M132 172v14" stroke="#fff" stroke-width="3.5"/>' +
      rect(80, 193, 56, 3, '#000', 'opacity=".18"'));
    const blumen = (x) => [3, 13, 23, 33].map((d, i) =>
      kreis(x + d - 3, 179 - (i % 2) * 2, 5, i % 2 ? '#ffd04d' : '#ff6f91') + kreis(x + d - 3, 179 - (i % 2) * 2, 1.8, '#fff')).join('') +
      rect(x - 6, 180, 40, 9, '#8a5232', 'rx="3"');
    s += teil(11, blumen(50) + blumen(138));
    // Fenster in der Seitenwand
    s += teil(15, [138, 208].map((y) =>
      flaeche(`189,${y + 7} 205,${y - 2} 205,${y + 26} 189,${y + 35}`, '#fff') +
      flaeche(`192,${y + 9} 202,${y + 3} 202,${y + 24} 192,${y + 30}`, fertig ? '#ffd95c' : '#7fc4f2')).join(''));

    // Hausnummernschild wie auf dem Booklet
    s += teil(13, rect(82, 76, 52, 40, '#fff', `rx="11" stroke="${rand}" stroke-width="4"`) +
      `<text x="108" y="106" text-anchor="middle" font-size="29" font-weight="800" fill="#17233f">${nummer}</text>`);

    s += teil(16, `<path d="M64 54V16" stroke="#51607a" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      <path class="fahne" d="M66 17q12-5 22 1t20-1v17q-10 6-20 0t-22 1Z" fill="#ffc531"/>
      ${kreis(30, 272, 13, '#3fae55')}${kreis(43, 276, 9, '#56c46a')}${kreis(20, 277, 7, '#56c46a')}
      ${kreis(206, 264, 12, '#3fae55')}${kreis(219, 262, 8, '#56c46a')}
      ${kreis(28, 268, 3, '#fff')}${kreis(42, 273, 2.5, '#ff6f91')}${kreis(209, 259, 3, '#ff6f91')}`);

    if (stufe >= 2 && stufe < 12) { // Gerüst
      s += `<g stroke="#c98a3c" stroke-width="4" stroke-linecap="round" fill="none">
          <path d="M222 280V112M244 280V112M222 262l22-66M222 192l22-66"/></g>
        ${rect(212, 194, 38, 7, '#e8b36a', 'rx="3"')}${rect(212, 126, 38, 7, '#e8b36a', 'rx="3"')}`;
    }
    if (stufe < 13) { // Bauschild mit Hausnummer, solange das richtige Schild noch fehlt
      s += `<path d="M46 282v-26" stroke="#8a5232" stroke-width="5" fill="none"/>
        ${rect(27, 232, 38, 28, '#fff', `rx="8" stroke="${rand}" stroke-width="3.5"`)}
        <text x="46" y="253" text-anchor="middle" font-size="19" font-weight="800" fill="#17233f">${nummer}</text>`;
    }
    return s + '</svg>';
  };

  Z.stufe = (fertig, gesamt) => {
    if (fertig <= 0) return 0;
    if (fertig >= gesamt) return Z.TEILE;
    return Math.max(1, Math.min(Z.TEILE - 1, Math.round((fertig / gesamt) * Z.TEILE)));
  };

  Z.bauplatz = () => {
    const zaun = (x) => [0, 14, 28, 42].map((d) => `<path d="M${x + d} 282v-30l5-7 5 7v30Z" fill="#e8b36a"/>`).join('') +
      rect(x - 3, 258, 58, 6, '#c98a3c', 'rx="2"');
    return `<svg viewBox="0 0 250 292" aria-hidden="true">
      <ellipse cx="125" cy="280" rx="100" ry="9" fill="#123a20" opacity=".14"/>
      <path d="M76 278q42-62 98 0z" fill="#f4cd72"/><path d="M122 247q30 8 52 31h-44z" fill="#e3b552"/>
      ${zaun(18)}${zaun(182)}
      <path d="M125 246v-52" stroke="#8a5232" stroke-width="7" fill="none"/>
      ${rect(60, 140, 130, 62, '#ffc531', 'rx="12"')}${rect(66, 146, 118, 50, 'none', 'rx="8" stroke="#17233f" stroke-width="2.5" stroke-dasharray="9 6"')}
      <text x="125" y="168" text-anchor="middle" font-size="17" font-weight="800" fill="#17233f">Hier wird</text>
      <text x="125" y="188" text-anchor="middle" font-size="17" font-weight="800" fill="#17233f">bald gebaut</text>
    </svg>`;
  };

  /* ---------- Straßenkulisse ---------- */
  const baum = (x, y, r, ton) =>
    rect(x - r * 0.14, y - r * 0.5, r * 0.28, r * 1.1, '#8a5232', 'rx="2"') +
    kreis(x, y - r, r, ton) + kreis(x - r * 0.3, y - r * 1.3, r * 0.45, '#fff', 'opacity=".18"');

  // Zwei Hügelketten mit Bäumen, unten bündig. Die Zeichnung ist absichtlich sehr breit, damit sie auf
  // breiten Bildschirmen nicht vergrößert und dadurch oben abgeschnitten wird.
  const HUEGEL_FERN = 'M-1600 104C-1470 50 -1260 56 -1080 108S-720 46 -520 88S-170 200 0 120C170 40 330 50 520 112S880 40 1090 90S1440 60 1600 108S1940 50 2120 100S2500 40 2700 92S3050 60 3200 108V220H-1600Z';
  const HUEGEL_NAH = 'M-1600 156C-1480 130 -1300 130 -1100 164S-760 190 -560 164S-220 226 0 172C220 118 430 188 700 156S1160 192 1340 150S1550 142 1600 156S1900 120 2100 150S2480 196 2700 164S3060 130 3200 160V220H-1600Z';
  Z.huegel = () => {
    let s = '<svg viewBox="-1600 0 4800 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      `<path d="${HUEGEL_FERN}" fill="#a9e27f"/>`;
    for (const [x, y, r] of [[-1450, 80, 16], [-1190, 93, 13], [-1150, 100, 18], [-640, 89, 15], [-250, 160, 17], [90, 108, 17], [128, 100, 12], [410, 98, 14], [830, 90, 19], [866, 98, 12], [1250, 84, 15], [1520, 100, 18], [1830, 117, 14], [2290, 120, 18], [2330, 116, 12], [2780, 116, 16], [3090, 103, 13]]) {
      s += baum(x, y, r, '#5fbf5a');
    }
    s += `<path d="${HUEGEL_NAH}" fill="#86d45f"/>`;
    for (const [x, y, r] of [[-1510, 156, 19], [-1180, 166, 24], [-830, 200, 17], [-420, 176, 22], [-170, 204, 16], [40, 176, 22], [300, 178, 16], [570, 176, 24], [990, 184, 18], [1160, 180, 25], [1420, 170, 17], [1790, 161, 23], [2230, 181, 17], [2580, 191, 25], [2950, 153, 18]]) {
      s += baum(x, y, r, '#3fae55');
    }
    return s + '</svg>';
  };

  Z.himmel = () => `<div class="himmel" aria-hidden="true">
    <i class="sonne"></i><i class="wolke w1"></i><i class="wolke w2"></i><i class="wolke w3"></i></div>`;

  /* ---------- Zehnersystem-Material ----------
   * Immer gleicher Maßstab, damit beide Seiten wirklich vergleichbar sind.
   * Je Farbe: [Vorderseite, Deckfläche, Seite, Kerben] */
  const FARBEN = {
    bunt: {
      H: ['#43b649', '#8ee08f', '#23812b', '#1d6e24'],
      Z: ['#ef4a3f', '#ff9b92', '#b3261d', '#9c1d15'],
      E: ['#2f8ae6', '#8cc4ff', '#1559a6', '#0f477f'],
    },
    holz: {
      H: ['#eec283', '#fbe0b4', '#bb8746', '#96662a'],
      Z: ['#eec283', '#fbe0b4', '#bb8746', '#96662a'],
      E: ['#eec283', '#fbe0b4', '#bb8746', '#96662a'],
    },
  };
  const T = 3; // sichtbare Tiefe der Klötze

  const klotz = (x, y, w, h, [vorn, oben, seite]) =>
    flaeche(`${x},${y} ${x + T},${y - T} ${x + w + T},${y - T} ${x + w},${y}`, oben) +
    flaeche(`${x + w},${y} ${x + w + T},${y - T} ${x + w + T},${y + h - T} ${x + w},${y + h}`, seite) +
    rect(x, y, w, h, vorn);

  const platte = (x, y, f) => {
    let d = '';
    for (let i = 4; i < 40; i += 4) d += `M${x + i} ${y}v40M${x} ${y + i}h40`;
    return klotz(x, y, 40, 40, f) + `<path d="${d}" stroke="${f[3]}" stroke-opacity=".6" stroke-width="0.6" fill="none"/>`;
  };
  const stange = (x, y, f) => {
    let d = '';
    for (let i = 4; i < 40; i += 4) d += `M${x} ${y + i}h7`;
    return klotz(x, y, 7, 40, f) + `<path d="${d}" stroke="${f[3]}" stroke-width="0.7"/>`;
  };
  const wuerfel = (x, y, f) => klotz(x, y, 10, 10, f);

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
      h: Math.max(70, ...st.map((s) => Math.max(Math.ceil(s.h / 3) * 44, Math.min(s.e, 5) * 13) + 8)),
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
    for (let i = 0; i < e; i++) s += wuerfel(x + Math.floor(i / 5) * 15, H - 12 - (i % 5) * 13, farben.E);
    return s + '</svg>';
  };

  Z.einzelteil = (art) => {
    const farben = FARBEN.bunt;
    const inhalt = art === 'H' ? platte(3, 6, farben.H) : art === 'Z' ? stange(19, 5, farben.Z) : wuerfel(17, 20, farben.E);
    return `<svg viewBox="0 0 48 48" aria-hidden="true">${inhalt}</svg>`;
  };

  /* ---------- Geheimschrift: Quadrat = Hunderter, Strich = Zehner, Punkt = Einer ---------- */
  const GEHEIM = { H: '#249a2e', Z: '#b01d12', E: '#1672dc' };
  const zeichenBei = (art, x, y) => { // x, y = Mitte des Zeichens
    if (art === 'H') return rect(x - 11, y - 11, 22, 22, 'none', `rx="2" stroke="${GEHEIM.H}" stroke-width="4.5"`);
    if (art === 'Z') return rect(x - 16, y - 3, 32, 6, GEHEIM.Z, 'rx="3"');
    return kreis(x, y, 8.5, GEHEIM.E);
  };
  Z.zeichen = (art) => `<svg class="gz ${art.toLowerCase()}" viewBox="0 0 ${art === 'Z' ? 36 : 28} 28" aria-hidden="true">${zeichenBei(art, art === 'Z' ? 18 : 14, 14)}</svg>`;

  const beschreibung = (h, z, e) => `Geheimschrift: ${h} Quadrate, ${z} Striche, ${e} Punkte`;

  // Ordentlich: Quadrate zu dritt, Striche zu fünft untereinander, Punkte zu dritt. Immer gleicher Maßstab.
  Z.geheim = (h, z, e) => {
    const gruppen = [
      h && { b: Math.min(h, 3) * 29 - 7, h: Math.ceil(h / 3) * 29 - 7, male: (x, y) => Array.from({ length: h }, (_, i) => zeichenBei('H', x + 11 + (i % 3) * 29, y + 11 + Math.floor(i / 3) * 29)) },
      z && { b: Math.ceil(z / 5) * 40 - 8, h: Math.min(z, 5) * 15 - 9, male: (x, y) => Array.from({ length: z }, (_, i) => zeichenBei('Z', x + 16 + Math.floor(i / 5) * 40, y + 3 + (i % 5) * 15)) },
      e && { b: Math.min(e, 3) * 23 - 6, h: Math.ceil(e / 3) * 23 - 6, male: (x, y) => Array.from({ length: e }, (_, i) => zeichenBei('E', x + 8.5 + (i % 3) * 23, y + 8.5 + Math.floor(i / 3) * 23)) },
    ].filter(Boolean);
    const breite = gruppen.reduce((a, g) => a + g.b, 0) + Math.max(0, gruppen.length - 1) * 20;
    let x = (264 - breite) / 2;
    let s = `<svg class="geheim" viewBox="0 0 264 96" role="img" aria-label="${beschreibung(h, z, e)}">`;
    for (const g of gruppen) {
      s += g.male(x, (96 - g.h) / 2).join('');
      x += g.b + 20;
    }
    return s + '</svg>';
  };

  // Plätze für durcheinander gemalte Zeichen: 6 Spalten, 5 Reihen, in Prozent der Fläche
  Z.streuung = (anzahl) => MH.logik.misch(Array.from({ length: 30 }, (_, i) => i)).slice(0, anzahl).map((i) => ({
    x: ((i % 6) + 0.5 + (MH.logik.rng() - 0.5) * 0.16) * (100 / 6),
    y: (Math.floor(i / 6) + 0.5 + (MH.logik.rng() - 0.5) * 0.3) * 20,
  }));
  Z.arten = (h, z, e) => [...Array(h).fill('H'), ...Array(z).fill('Z'), ...Array(e).fill('E')];

  /* ---------- Abzeichen: Rosette mit Bild ---------- */
  Z.plakette = (bild, ring = 'gold') => {
    const [hell, dunkel] = {
      gold: ['#ffd04d', '#d99a00'], rot: ['#ff7a6b', '#c4281a'], blau: ['#8fd6ff', '#2f8fc4'],
    }[ring] || ['#ffd04d', '#d99a00'];
    let zacken = '';
    for (let i = 0; i < 16; i++) {
      const w = (i / 16) * Math.PI * 2;
      zacken += kreis((50 + Math.cos(w) * 38).toFixed(1), (46 + Math.sin(w) * 38).toFixed(1), 8, dunkel);
    }
    return `<svg class="plakette" viewBox="0 0 100 112" aria-hidden="true">
      ${flaeche('30,70 16,108 29,103 37,112 50,76', '#2f6fd6')}${flaeche('70,70 84,108 71,103 63,112 50,76', '#1c4fb5')}
      ${zacken}${kreis(50, 46, 40, dunkel)}${kreis(50, 45, 36, hell)}${kreis(50, 46, 29, '#fff')}
      <image href="assets/bilder/${bild}.svg" x="29" y="25" width="42" height="42"/>
    </svg>`;
  };

  /* ---------- Hanteln und Sterne ---------- */
  Z.hantel = (stufe) => {
    const { h, ton, dunkel } = {
      leicht: { h: 16, ton: '#43b649', dunkel: '#23812b' },
      mittel: { h: 24, ton: '#ffb31f', dunkel: '#c07f00' },
      schwer: { h: 32, ton: '#ef4a3f', dunkel: '#b3261d' },
    }[stufe];
    const scheibe = (x, hoehe, w) => rect(x, 20 - hoehe / 2, w, hoehe, dunkel, 'rx="3"') + rect(x, 20 - hoehe / 2, w, hoehe - 4, ton, 'rx="3"');
    const kraft = stufe === 'schwer'
      ? '<path d="M7 8L3 4M57 8l4-4M7 32l-4 4M57 32l4 4" stroke="#b3261d" stroke-width="3" stroke-linecap="round"/>' : '';
    return `<svg viewBox="0 0 64 40" aria-hidden="true">${rect(18, 17, 28, 6, '#8793a8', 'rx="3"')}
      ${scheibe(12, h, 8)}${scheibe(44, h, 8)}${scheibe(6, h * 0.65, 5)}${scheibe(53, h * 0.65, 5)}${kraft}</svg>`;
  };

  Z.stern = (voll) =>
    `<svg class="stern${voll ? ' voll' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"/></svg>`;
  Z.sterne = (n) => [1, 2, 3].map((i) => Z.stern(i <= n)).join('');
})();
