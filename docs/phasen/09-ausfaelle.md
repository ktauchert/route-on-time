# Phase 9 — Ausfälle verständlich

**Ergebnis:** Bei „passt nicht“ sagt die App, was genau nicht passt, und zeigt die Wege, die man stattdessen nehmen kann, mit ihren Folgen.

**Voraussetzung:** [Phase 8](./08-pwa.md) ist fertig. Der Alltag mit der App hat gezeigt, welche Ausfälle vorkommen und was die Auskunft dazu liefert. Ohne echte Antworten würde diese Phase Annahmen bauen. Die Fälle kommen aus aufgezeichneten Antworten und gehen in die Stellvertreterin der Tests, nicht in einen Aufruf der echten Auskunft.

## Aufgaben

1. **Konkreter Grund.** Statt „Ein Abschnitt fällt aus.“ steht, welcher Abschnitt auf welcher Linie ausfällt („S7 Potsdam Hbf → Griebnitzsee um 07:42 fällt aus“) oder welcher Anschluss um wie viele Minuten reißt („Umstieg in Griebnitzsee: 2 min statt 4 min“). Gesperrte Haltestellen und Ersatzverkehr, die die Auskunft als Meldung liefert, stehen mit ihrem Text dabei, wenn sie eindeutig zur Verbindung gehören.
2. **Bis zu drei Alternativen.** Statt einer Alternative bis zu drei passende Verbindungen aus der weiteren Suche, jede mit ihren Folgen: Abfahrt und Ankunft, Dauer, Umstiege, Unterschied zur ursprünglichen Verbindung („12 min später“, „1 Umstieg mehr“). Das bevorzugte Verkehrsmittel und „entspannt“ gelten für die Reihenfolge wie bisher.
3. **Nächstbeste Verbindung.** Gibt es keine Alternative, die die Vorgabe erfüllt, zeigt die App die Verbindung, die am nächsten dran ist, mit ihrer Ankunft und dem, was nicht passt. Sie ist deutlich als nicht passend gekennzeichnet und wird nicht zur heutigen Verbindung.
4. **Beim Aufbruch per Knopf.** Dieselben Regeln: Fällt die gewählte Fahrt aus, steht der Grund da, und die nächsten Abfahrten sind die Alternativen.

## Fertig, wenn

- Die Stellvertreterin liefert Ausfall, Anschlussverlust, gesperrte Haltestelle, leere Liste und Fehler. Für jeden Fall prüft ein Test den angezeigten Grund.
- Bei einem Ausfall steht Linie, Abschnitt und Uhrzeit im Text, in Deutsch und Englisch.
- Es erscheinen höchstens drei Alternativen, jede mit Abfahrt, Ankunft, Dauer und dem Unterschied zur ursprünglichen Verbindung.
- Ohne passende Alternative steht die nächstbeste Verbindung da und ist als nicht passend gekennzeichnet.
- Eine Alternative lässt sich als heutige Verbindung wählen. Die nächstbeste nicht.

## Anmerkungen

- Die Alternative ist weiter „die nächste passende Verbindung“ ([ADR 0008](../adr/0008-alternative-zur-selben-ankunft.md)). Neu ist die Zahl und die Erklärung, nicht die Regel.
- Der Grund wird aus den Abschnitten der Verbindung gelesen. Hat die Auskunft für einen Ausfall keinen Text, bleibt der allgemeine Satz.
- Schnellste oder ruhigste Route und Auslastung gehören nicht hierher. Siehe [Später](./spaeter.md).

## Bleibt liegen

Push, Auslastung, schnellste oder ruhigste Route, Weg zur Haltestelle.
