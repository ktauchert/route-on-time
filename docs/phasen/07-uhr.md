# Phase 7 — Uhr

**Ergebnis:** Fällige Routen bekommen einen neuen Stand, auch wenn kein Tab offen ist. Die offene App zeigt ihn nach dem Laden. Eine angetretene Fahrt wird dabei ab dem nächsten Halt geprüft.

**Voraussetzung:** [Phase 6](./06-unterwegs.md) ist fertig. Die Next.js-App ist unter HTTPS erreichbar, nicht nur auf dem Laptop. Supabase Cron kann diese URL aufrufen.

## Aufgaben

1. Eine Server-Route prüft alle fälligen Routen mit dem Service-Role-Schlüssel und schreibt den Stand wie in Phase 4, 5 und 6.
2. Fällig heißt: heute ist ein gespeicherter Wochentag, und die aktuelle Zeit in Europe/Berlin liegt nach drei Stunden vor der Ankunftsuhrzeit. Die Uhr hört auf, wenn die heutige Verbindung angekommen ist, oder wenn die Ankunftsuhrzeit vorbei ist und gerade kein Abschnitt angetreten ist und kein Umstieg läuft. Ohne Ankunftsuhrzeit, nur mit heutiger Verbindung, läuft das Fenster von 30 Minuten vor ihrer Abfahrt bis zu ihrer Ankunft. Ist an dem Tag keine Verbindung gewählt und keine Ankunftsuhrzeit gesetzt, prüft die Uhr diese Route nicht.
3. Die Route akzeptiert nur einen geheimen Aufruf. Das Geheimnis liegt in der Server-Umgebung und in Supabase Vault, nicht in der PWA.
4. Supabase Cron ruft die Route alle fünf Minuten auf.
5. Die Seite zeigt den zuletzt geschriebenen Stand mit Uhrzeit der Prüfung.

## Fertig, wenn

- Bei geschlossenen Tabs schreibt ein Cron-Lauf den Stand einer fälligen Route.
- Ein Aufruf ohne Geheimnis schreibt nichts und fragt die Auskunft nicht.
- Außerhalb des Zeitfensters und an einem ausgelassenen Wochentag bleibt der Stand unberührt.
- Eine Fahrt, die über die Ankunftsuhrzeit hinaus dauert, weiter geprüft wird, bis sie angekommen ist.
- Zwischen den Prüfungen fünf Minuten liegen.
- Liegt die Zeit in einem angetretenen Abschnitt, sucht der Cron-Lauf ab dem nächsten Halt.
- Die offene App zeigt nach dem Neuladen den von der Uhr geschriebenen Stand.

## Anmerkungen

- Fünf Minuten reichen zum Ausprobieren. Jede fällige Route ist ein Aufruf der Auskunft. Bei einer Handvoll Routen bleibt das weit unter dem, was die mobile Schnittstelle üblicherweise verträgt. Der GTFS-RT-Feed mit 60 Abrufen pro Minute ist hier nicht im Spiel.
- Der Free-Tarif pausiert ein Projekt nach etwa einer Woche ohne Datenbankaktivität. Läufe an Tagen mit Routen zählen als Aktivität. Eine Woche ohne Route pausiert das Projekt, bis es im Dashboard weiterläuft.
- Echtzeit-Abo von Supabase an den Browser kann das Neuladen später ersetzen. Für diese Phase reicht Laden.
- Die Next.js-Funktion muss das Zeitfenster einer Handvoll Routen in ihrem Hosting-Limit schaffen. Sequenzielle Auskunftsaufrufe für sehr viele Routen sind ein späteres Thema.

## Bleibt liegen

Push, GTFS-RT, andere Verbünde.
