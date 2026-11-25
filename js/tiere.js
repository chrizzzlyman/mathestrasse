/* Die Tiernamen und ihre Bilder (assets/tiere/<datei>.svg).
 * Die Namen müssen zur Liste in supabase/schema.sql (kinder_anlegen) passen. */
(function () {
  'use strict';
  const MH = window.MH = window.MH || {};
  MH.tiere = {
    Fuchs: 'fuchs', Igel: 'igel', Eule: 'eule', 'Bär': 'baer', Hase: 'hase', 'Löwe': 'loewe', Tiger: 'tiger', Frosch: 'frosch',
    Pinguin: 'pinguin', Koala: 'koala', Panda: 'panda', Affe: 'affe', Katze: 'katze', Hund: 'hund', Pferd: 'pferd', Wal: 'wal',
    Delfin: 'delfin', Biene: 'biene', 'Schildkröte': 'schildkroete', Elefant: 'elefant', Giraffe: 'giraffe', Zebra: 'zebra', Otter: 'otter',
    Faultier: 'faultier',
  };

  // Hintergrundfarbe der runden Plakette hinter jedem Tier
  const TOENE = ['#ffe3c2', '#d9f1ff', '#e9e0ff', '#ddf5d6', '#ffdfe8', '#fff1b8'];
  MH.tierFarbe = (tier) => TOENE[Math.max(0, Object.keys(MH.tiere).indexOf(tier)) % TOENE.length];
  MH.tierDatei = (tier) => `assets/tiere/${MH.tiere[tier] || 'gast'}.svg`;

  // <span class="tierbild …"><img …></span>
  MH.tierBild = (tier, klasse = '') => {
    const rahmen = document.createElement('span');
    rahmen.className = ('tierbild ' + klasse).trim();
    rahmen.style.setProperty('--ton', MH.tierFarbe(tier));
    const bild = document.createElement('img');
    bild.src = MH.tierDatei(tier);
    bild.alt = '';
    bild.draggable = false;
    rahmen.append(bild);
    return rahmen;
  };
})();
