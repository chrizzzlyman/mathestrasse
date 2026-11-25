/* Abzeichen. Sie werden allein aus den besten Sternen je Zimmer berechnet:
 * Dafür wird nichts zusätzlich gespeichert, sie gelten auf jedem Gerät und gehen beim Üben nie verloren.
 * Ein Teil belohnt Fleiß (Zimmer schaffen), ein Teil genaues Arbeiten (3 Sterne). */
(function (global) {
  'use strict';
  const MH = global.MH = global.MH || {};
  const A = MH.abzeichen = {};

  // sterne(hausNummer, raumId) -> 0 bis 3
  A.berechne = (haeuser, sterne) => {
    const zimmer = haeuser.flatMap((haus) => haus.etagen.flatMap((etage, i) => etage.raeume.map((raum) => ({
      dach: i === haus.etagen.length - 1,
      s: sterne(haus.nummer, raum.id),
    }))));
    const fertig = zimmer.filter((x) => x.s > 0).length;
    const perfekt = zimmer.filter((x) => x.s === 3).length;
    const summe = zimmer.reduce((a, x) => a + x.s, 0);
    const dach = zimmer.filter((x) => x.dach && x.s > 0).length;

    const eins = (gruppe, ring, id, titel, text, bild, ist, soll) =>
      ({ gruppe, ring, id, titel, text, bild, ist: Math.min(ist, soll), soll, verdient: ist >= soll });
    const strasse = (...rest) => eins(null, 'gold', ...rest);

    const liste = [
      strasse('erster-stein', 'Erster Stein', 'Schaffe dein erstes Zimmer.', 'brick', fertig, 1),
      strasse('fleissige-biene', 'Fleißige Biene', 'Schaffe 10 Zimmer.', 'honeybee', fertig, 10),
      strasse('baumeister', 'Baumeister', 'Schaffe 25 Zimmer.', 'building-construction', fertig, 25),
      strasse('dachstuermer', 'Dachstürmer', 'Schaffe ein Zimmer im Dachgeschoss.', 'rocket', dach, 1),
      strasse('volltreffer', 'Volltreffer', 'Hole 3 Sterne in einem Zimmer.', 'bullseye', perfekt, 1),
      strasse('superhirn', 'Superhirn', 'Hole 3 Sterne in 10 Zimmern.', 'brain', perfekt, 10),
      strasse('sternensammler', 'Sternensammler', 'Sammle 25 Sterne.', 'glowing-star', summe, 25),
      strasse('sternenschatz', 'Sternenschatz', 'Sammle 60 Sterne.', 'gem-stone', summe, 60),
    ];

    for (const haus of haeuser) {
      const ids = haus.etagen.flatMap((e) => e.raeume.map((r) => r.id));
      const mit = (liste_, mindestens) => liste_.filter((id) => sterne(haus.nummer, id) >= mindestens).length;
      const imHaus = (id, ...rest) => eins(haus.nummer, haus.farbe.ring || 'gold', `haus${haus.nummer}-${id}`, ...rest);
      liste.push(imHaus('richtfest', 'Richtfest', `Baue Haus ${haus.nummer} ganz fertig.`, 'party-popper', mit(ids, 1), ids.length));
      for (const x of haus.abzeichen || []) liste.push(imHaus(x.id, x.titel, x.text, x.bild, mit(x.raeume, 3), x.raeume.length));
      liste.push(imHaus('gold', 'Goldhaus', `Hole in jedem Zimmer von Haus ${haus.nummer} 3 Sterne.`, 'crown', mit(ids, 3), ids.length));
    }
    return liste;
  };

  A.verdient = (haeuser, sterne) => A.berechne(haeuser, sterne).filter((a) => a.verdient);
})(typeof window !== 'undefined' ? window : globalThis);
