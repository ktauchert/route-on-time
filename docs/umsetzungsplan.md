# Umsetzungsplan

So wird aus der [Roadmap](./roadmap.md) nacheinander die App. Der [Projektplan](./projektplan.md) hält Ziel und Annahmen. Diese Datei hält die Arbeitsweise.

## Ein Durchgang

1. Die früheste Phase öffnen, deren „Fertig, wenn“ noch offen ist.
2. Voraussetzung prüfen. Fehlt ein Konto, ein Schlüssel oder eine Entscheidung, hier stoppen und das fehlende Stück benennen.
3. Nur die Aufgaben dieser Phase umsetzen, Test zuerst. Siehe [AGENTS.md](../AGENTS.md).
4. „Fertig, wenn“ gegen die laufende App prüfen, bei Oberflächen im Browser. `npm test` ist grün.
5. In der Phase das Datum und das Ergebnis unter Anmerkungen ergänzen, wenn etwas von der Vorlage abgewichen ist.

Die nächste Phase startet nicht im selben Durchgang, außer es wird ausdrücklich darum gebeten.

## Was „fertig“ heißt

Jede Phase nennt eigene Prüfungen. Darüber gilt für alle:

- Die App baut ohne Fehler.
- Eine Phase, die eine Ansicht verändert, zeigt sie im Mobil-Layout und im Desktop-Layout, in Hell und in Dunkel. Siehe [Oberfläche](./oberflaeche.md).
- Ein fremder Nutzer sieht keine fremden Routen. Ab Phase 2 ist das eine Zeilensicherheit in Supabase, kein Filter nur in der Oberfläche.
- Die Fahrplanauskunft wird nur vom Server aufgerufen. Ab Phase 2 trägt jeder Aufruf einen User-Agent mit Kontaktweg. Tests ersetzen sie durch feste Fälle, siehe [AGENTS.md](../AGENTS.md). Ein nachgebauter HAFAS-Server entsteht nicht.
- Neue Wörter, die im [Glossar](../GLOSSARY.md) schon ein anderes Wort haben, werden nicht eingeführt. Jede Phase liefert sichtbare Texte auf Deutsch und Englisch. Die Fachwörter in der Diskussion bleiben die deutschen aus dem Glossar. Auf Englisch heißt passt Fits, passt nicht Doesn't fit, unklar Unclear, und die heutige Verbindung Today's connection.

## Anmerkungen, die für alle Phasen gelten

- `.env.local` und echte Schlüssel werden nicht eingecheckt. Im Repo liegt höchstens ein `.env.example` mit leeren Namen.
- Ein Free-Projekt bei Supabase pausiert nach etwa einer Woche ohne Datenbankaktivität. Die Uhr in Phase 7 hält es an Tagen mit Routen wach. Eine leere Woche pausiert es.
- `vbb-hafas` spricht die mobile Schnittstelle. Der Autor der Bibliothek schreibt, dass dafür streng genommen eine Erlaubnis nötig ist. Für das private Ausprobieren läuft sie auf dem eigenen Server. Sobald weitere Personen Zugänge bekommen, ist das der Moment für die offizielle API und ihre Nutzungsregeln.
- Antworten der Auskunft werden nur so weit gespeichert, wie der Stand und die angezeigte Verbindung sie brauchen: Uhrzeiten, Linienname, Verspätung, Ausfall, Haltestellennamen. Kein Rohprotokoll.
- CC BY 4.0 wird fällig, sobald GTFS- oder GTFS-RT-Inhalte in der Oberfläche stehen. Das ist vor Phase „Später“ nicht der Fall.
- Die Vorgabe rechnet in Europe/Berlin.

## MCPs im Durchgang

Welche Server anzuschließen sind und welche außen vor bleiben: [MCP](./mcp.md). Phase 0 nutzt den shadcn-Server, sobald die App existiert. Ab Phase 1 den Supabase-Server, eingeschränkt auf dieses Projekt.
