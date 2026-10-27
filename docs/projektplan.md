# Projektplan

Route on Time ist eine PWA, in der ein Nutzer Routen speichert und sieht, ob eine Verbindung die Vorgabe noch erfüllt. Der Bau folgt der [Roadmap](./roadmap.md), eine Phase pro Durchgang. Die Begriffe stehen im [Glossar](../GLOSSARY.md).

## Ziel des ersten benutzbaren Stands

Eine Person meldet sich an, legt eine Route im Verkehrsverbund Berlin-Brandenburg an und sieht am selben Tag den Stand: passt, passt nicht oder unklar. Bei passt nicht zeigt die App eine neu gesuchte Alternative. Ist sie schon unterwegs, beginnt diese Suche am nächsten Halt. Die Prüfung läuft auch, wenn der Tab zu ist. Eine Meldung auf dem gesperrten Telefon gehört nicht zu diesem Stand.

## Entscheidungen

Beantwortet am 27. Oktober 2026. Offen bleibt nur, was die Nutzungsregeln der offiziellen API erlauben, sobald sie vorliegen. Siehe [offene Fragen](./offene-fragen.md).

1. Gebiet ist der VBB.
2. Eine Route kann als Vorgabe setzen: Ankunft vor einer Uhrzeit, Mindestzeit beim Umstieg, Höchstzahl der Umstiege, eine bestimmte Linie, und die heute gewählte Verbindung. Gesetzt wird nur, was diese Route verlangt. Ohne Ankunftsuhrzeit und ohne heutige Verbindung hat die Uhr keinen Zeitpunkt. Eine Route hat eine Richtung. Der Rückweg ist eine zweite Route. Sie gilt an Wochentagen. Ein Feiertag zählt als sein Wochentag.
3. Geprüft wird vor der Abfahrt und, sobald eine Fahrt angetreten ist, neu ab dem nächsten Halt.
4. Der Stand erscheint in der offenen App. Push kommt später.
5. Die Fahrplanauskunft im Prototyp ist `vbb-hafas` auf dem Next.js-Server. Die offizielle API wird parallel beantragt und erst nach den Nutzungsregeln angeschlossen.
6. Angemeldet ist in diesem Stand nur der Eigentümer. Das Konto entsteht im Supabase-Dashboard, die App hat keine Registrierung. Das Projekt liegt in Frankfurt. Eine falsche Anmeldung sagt nur, dass E-Mail oder Passwort nicht stimmt.
7. Die App heißt sichtbar „Route on Time“.
8. Die Oberfläche spricht Deutsch und Englisch. Beim ersten Öffnen ist Deutsch aktiv. Ein Schalter liegt auf jeder Seite, auch vor der Anmeldung. Die Browsersprache ändert nichts. Die Wahl bleibt auf dem Gerät und ist kein Feld am Nutzer. Jede Phase liefert beide Sprachen mit. Die Begriffe im Glossar bleiben Deutsch. Auf Englisch heißt passt Fits, passt nicht Doesn't fit, unklar Unclear, und die heutige Verbindung Today's connection. Die App liegt in diesem Projektordner.

9. Der User-Agent heißt bis zum ersten Auskunftsaufruf `route-on-time`. Die Kontaktadresse wird vor Phase 2 eingetragen.
10. Mobil und Desktop sind zwei Layouts. Die Themen heißen Paper (hell) und Stone (dunkel), beide aus der shadcn-Basis `stone`. Nur das Mobil-Layout hat einen Schnellstart für Neue Route und die heute geltenden Routen. Siehe [Oberfläche](./oberflaeche.md).

Die Phasen 0 bis 8 sind durchgesprochen und am 27. Oktober 2026 als Grundlage bestätigt. Der Bau beginnt bei Phase 0, sobald er ausdrücklich gestartet wird. Offen vor dem ersten Auskunftsaufruf bleibt die Kontaktadresse im User-Agent. Die Nutzungsregeln der offiziellen API bleiben offen, bis sie vorliegen.

## Was eine Phase ist

Eine Phase endet mit etwas, das eine Person sehen oder auslösen kann. Sie hat eine Voraussetzung, Aufgaben, ein „Fertig, wenn“ und Anmerkungen. Was in „Bleibt liegen“ steht, wird in dieser Phase nicht gebaut.

Ein Durchgang bearbeitet eine Phase. Die nächste beginnt, wenn „Fertig, wenn“ erfüllt ist. Steht eine Phase, bleibt der Grund in ihrer Datei unter Anmerkungen, statt in einer späteren Phase weiterzubauen.

## Festlegungen, die jede Phase einhält

- Die PWA ruft die Fahrplanauskunft nicht selbst auf. Das tut eine Next.js-Route auf Node. [ADR 0004](./adr/0004-nextjs-und-supabase.md)
- Supabase hält Nutzer, Routen und Stand. Zeilensicherheit beschränkt jede Zeile auf ihren Nutzer. [ADR 0003](./adr/0003-server-prueft-die-routen.md)
- Gespeichert wird die Route, nicht die Fahrt von heute. [ADR 0001](./adr/0001-route-gilt-ueber-tage.md)
- Suche und erneutes Lesen kommen aus derselben Auskunft. [ADR 0002](./adr/0002-eine-auskunft-fuer-suche-und-echtzeit.md)
- Schlüssel, der User-Agent der Auskunft und Cron-Geheimnisse liegen nur in der Server-Umgebung, nie im Browser und nie im Git.

Form und Technik des ersten Stands: [Prototyp](./prototyp.md). Was die Schnittstellen hergeben: [Machbarkeit](./machbarkeit.md). Welche MCPs beim Bau helfen: [MCP](./mcp.md).
