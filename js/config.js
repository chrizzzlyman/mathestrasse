/* Verbindung zur Datenbank.
 * Der "publishable key" darf öffentlich sein: Was er darf, regelt die Datenbank selbst
 * (siehe supabase/schema.sql). Niemals den "service_role"- oder "secret"-Schlüssel eintragen! */
(function () {
  'use strict';
  const MH = window.MH = window.MH || {};
  MH.config = {
    SUPABASE_URL: 'https://tyfuobzixeyvzxtoydjh.supabase.co',
    SUPABASE_KEY: 'sb_publishable_Qtho9THbFuV3Tkoxu8mXmQ_r-4bK4wX',
    // Adresse der veröffentlichten Seite für die QR-Karten. Leer = wird automatisch erkannt.
    SEITEN_URL: '',
  };
})();
