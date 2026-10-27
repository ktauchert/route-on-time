# Phase 3 — Vorschläge

**Ergebnis:** Auf einer gespeicherten Route zeigt ein Knopf bis zu fünf Verbindungen, die zur Ankunftsuhrzeit ankommen sollen: Abfahrt, Ankunft, Linien, Umstiege, Fußwege. Die Seite nennt den Tag, für den gesucht wurde. Ab Phase 4 heißt der Knopf „Jetzt prüfen“ und zeigt dazu den Stand. In dieser Phase gibt es den Stand noch nicht.

**Voraussetzung:** [Phase 2](./02-route-anlegen.md) ist fertig. Heute ist ein Tag, an dem im VBB gefahren wird, sonst ist die leere Liste nicht von einem Fehler zu unterscheiden.

## Aufgaben

1. Eine Server-Route ruft `journeys` mit Ankunft zur Uhrzeit der Route auf. Liegt die Uhrzeit heute noch voraus, ist der Tag heute. Sonst der nächste Wochentag, an dem die Route gilt. Höchstens fünf Vorschläge.
2. Die Seite nennt diesen Tag und zeigt je Vorschlag die Abschnitte: Linienname, Abfahrt, Ankunft, Umstieg, Fußweg. Namen bleiben so, wie die Auskunft sie liefert. Verspätung anzeigen, wenn die Auskunft eine mitliefert.
3. Eine leere Antwort bekommt einen eigenen Satz. Ein Fehler der Auskunft bekommt einen anderen. Beides auf Deutsch und Englisch. Die gespeicherte Route bleibt stehen.
4. Nichts davon dauerhaft speichern. Der Knopf fragt jedes Mal neu.

## Fertig, wenn

- Eine bekannte Strecke Vorschläge mit Linien, Uhrzeiten und Fußwegen zeigt, und der genannte Tag zur Ankunftsuhrzeit passt.
- Nach der Ankunftsuhrzeit der nächste passende Wochentag gesucht wird, nicht der inzwischen vergangene Morgen.
- Eine leere Antwort und eine unerreichbare Auskunft zwei verschiedene Sätze zeigen.
- Ein Fehlerfall, etwa eine unerreichbare Auskunft, einen Hinweis zeigt und die gespeicherte Route stehen lässt.
- Der Browser spricht weiterhin nur mit der eigenen App.

## Anmerkungen

- Die Suche bittet um Verbindungen zur Ankunftsuhrzeit. Ob einer davon die übrigen Punkte der Vorgabe erfüllt, und ob eine Verspätung die Ankunft danach reißt, entscheidet Phase 4. Haltestellen- und Liniennamen werden nicht übersetzt.
- `v6.vbb.transport.rest` kann eine einzelne Antwort gegenprüfen. Die App hängt nicht davon ab.

## Bleibt liegen

Stand, Alternative, Speichern der Vorschläge, Cron.
