/* Alle Mathehäuser der Straße, in der Reihenfolge von links nach rechts.
 * Neues Haus: Datei in diesen Ordner legen und hier eintragen. Mehr ist nicht nötig. */
(function (global) {
  'use strict';
  const MH = global.MH = global.MH || {};

  MH.HAUS_DATEIEN = [
    'haus9.js',
    'haus10.js',
  ];

  MH.haeuser = [];
  MH.haus = (definition) => { MH.haeuser.push(definition); };

  MH.ladeHaeuser = () => MH.HAUS_DATEIEN.reduce(
    (kette, datei) => kette.then(() => new Promise((fertig, fehler) => {
      const s = document.createElement('script');
      s.src = 'haeuser/' + datei;
      s.onload = fertig;
      s.onerror = () => fehler(new Error('Haus-Datei fehlt: ' + datei));
      document.head.appendChild(s);
    })),
    Promise.resolve()
  );
})(typeof window !== 'undefined' ? window : globalThis);
