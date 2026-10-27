---
status: proposed
---

# Next.js spricht mit der Fahrplanauskunft, Supabase hält Nutzer und Routen

Für den Prototyp baut Next.js die PWA und ruft die Fahrplanauskunft auf. Supabase liefert Anmeldung, Postgres und Zeilensicherheit, damit eine Route nur ihrem Nutzer gehört. Die Oberfläche ist shadcn/ui mit Tailwind. Die Uhr ist Supabase Cron: sie ruft alle paar Minuten eine Next-Route auf, und die schreibt den Stand zurück.

Supabase Edge Functions können HTTP und Cron kann sie wecken. `vbb-hafas` ist eine Node-Bibliothek mit Node-Modulen. Die Functions laufen auf Deno, mit 2 Sekunden CPU pro Aufruf und 150 Sekunden Wartezeit auf dem Free-Plan. Die Prüfung dort zu starten hieße, die Bibliothek auf einem zweiten Laufzeitsystem zum Laufen zu bringen. Eine Node-Route in Next.js reicht für Suche, erneutes Lesen und den Stand.

Ein Free-Projekt pausiert nach etwa einer Woche ohne Datenbankaktivität. Die Morgenprüfung hält es an Werktagen wach. Eine Woche Pause ohne Aufrufe pausiert das Projekt, bis es im Dashboard wieder gestartet wird.
