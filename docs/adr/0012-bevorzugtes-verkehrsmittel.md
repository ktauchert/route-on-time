---
status: proposed
---

# Eine Route bevorzugt ein Verkehrsmittel, keine Linie

Die Vorgabe „Linie“ wird durch ein bevorzugtes Verkehrsmittel ersetzt: S-Bahn, Regionalbahn, U-Bahn, Tram oder Bus. Es ist eine Vorliebe und kein Muss. Unter den passenden Verbindungen kommt eine mit diesem Verkehrsmittel zuerst. Gibt es keine, gilt die erste passende, und die Route zeigt den Hinweis „Keine passende Verbindung mit …“.

Im Kopf eines Nutzers steht „ich nehme hier immer die Regionalbahn“, nicht die Nummer. Eine feste Linie war zudem eine harte Vorgabe: Fiel sie aus oder fehlte sie in den fünf Vorschlägen, hieß es „passt nicht“, obwohl eine andere S-Bahn gepasst hätte. Eine Vorliebe verhindert das.

Daneben gibt es „entspannt“: Unter den passenden Verbindungen, die höchstens 20 Minuten später ankommen als die früheste, gewinnt die mit den wenigsten Umstiegen. Die Vorliebe für das Verkehrsmittel gilt zuerst, „entspannt“ wählt danach innerhalb dieser Verbindungen.

Eine einzelne Linie lässt sich meiden, ohne die ganze Art zu sperren („nicht die S7, aber andere S-Bahnen“). Die Suche gibt die Linie an die Auskunft als Ausschluss mit, einem Filter des mobilen HAFAS-Zugangs, den `hafas-client` nicht als Option anbietet und den die App über das Suchprofil einhängt. Er ist undokumentiert. Darum prüft die App die Antwort zusätzlich: Eine Verbindung mit gemiedener Linie gilt nie als passend. Im Formular wählt ein Dialog in drei Schritten die Art, die Linie und die Übernahme.

Die Spalten `line_id` und `line_name` bleiben in der Tabelle, ungenutzt, bis keine alte Version der App mehr läuft. Gespeicherte Linien gehen verloren.
