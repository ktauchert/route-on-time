# Phase 2 — Route anlegen

**Ergebnis:** Eine angemeldete Person sucht Start und Ziel, setzt die Vorgabe und die Wochentage, und sieht die Route nach dem Neuladen wieder. Eine andere Person sieht sie nicht.

**Voraussetzung:** [Phase 1](./01-anmeldung.md) ist fertig. `vbb-hafas` darf auf dem Server laufen. Der User-Agent mit Kontaktweg steht in der Server-Umgebung.

## Daten

Eine Route speichert:

- den Nutzer
- einen kurzen Namen, optional
- Start und Ziel: zwei verschiedene Haltestellen, jeweils Auskunfts-Kennung und Anzeigename
- die Wochentage, an denen sie gilt. Montag bis Freitag sind vorausgewählt, mindestens ein Tag bleibt gesetzt. Ein Feiertag gilt als sein Wochentag
- die gesetzten Teile der Vorgabe, jeder für sich optional: Ankunftsuhrzeit in Europe/Berlin, Mindestminuten für einen Umstieg, Höchstzahl der Umstiege, eine Linie aus der Auskunft

Mindestens die Ankunftsuhrzeit oder, ab Phase 3, eine heute gewählte Verbindung muss gesetzt sein. Sonst hat die Uhr später keinen Zeitpunkt. In dieser Phase gibt es die heutige Verbindung noch nicht, deshalb verlangt das Formular die Ankunftsuhrzeit. Linie, Umstiegsminuten und Höchstzahl bleiben leer, wenn die Route sie nicht verlangt.

Die Kennung kommt aus der Haltestellensuche der Auskunft. Ein freier Text ohne Kennung lässt sich später nicht prüfen.

## Aufgaben

1. Tabelle und Zeilensicherheit: lesen, anlegen, ändern und löschen nur für `auth.uid()`.
2. Eine Server-Suche nach Haltestellen über `vbb-hafas`, mit dem festgelegten User-Agent. Der Browser ruft nur die eigene Next-Route auf.
3. Formular zum Anlegen und Ändern: Name, Start, Ziel, Ankunftsuhrzeit, Umstiegsminuten, Höchstzahl der Umstiege, Linie, Wochentage. Start und Ziel suchen ab drei Buchstaben selbst, mit kurzer Verzögerung. Tippt die Person weiter, wird die laufende Anfrage abgebrochen. Die Linie kommt aus der Auskunft, nicht aus einem freien Text. Start und Ziel müssen zwei verschiedene Haltestellen sein.
4. Liste der eigenen Routen, an jedem Tag alle, auch wenn die Route heute nicht gilt. Ohne Namen stehen Start und Ziel da. Mehrere Routen mit demselben Start und Ziel sind erlaubt. Löschen erst nach einer Rückfrage, auf Deutsch und Englisch.
5. Leerer Zustand, wenn noch keine Route da ist.
6. Mobil eine Spalte und der Schnellstart aus der [Oberfläche](../oberflaeche.md): Neue Route, plus jede Route, die heute gilt. Desktop: Liste links, Route rechts, ohne Schnellstart. Beides auf Deutsch und Englisch, in Hell und Dunkel.

## Fertig, wenn

- Eine Route mit zwei verschiedenen echten Haltestellen übersteht ein Neuladen und lässt sich danach ändern.
- Dieselbe Haltestelle als Start und Ziel lässt sich nicht speichern.
- Der Rückweg entsteht nur, wenn er als zweite Route angelegt wird.
- Löschen fragt nach und entfernt die Route erst nach der Bestätigung.
- Die Liste zeigt die Route auch an einem Tag, an dem sie nicht gilt. Ohne Namen stehen Start und Ziel da.
- Zwei Routen mit demselben Start und Ziel und verschiedenen Ankunftszeiten lassen sich beide speichern.
- Dieselbe Liste mit einem zweiten Konto leer ist, auch wenn die Kennung der Route bekannt ist.
- In den Netzwerkanfragen des Browsers kein Aufruf an die HAFAS-Adresse auftaucht.
- Unter 768 px der Schnellstart Neue Route und die heute geltenden Routen öffnet, und ab 768 px Liste und Route nebeneinander stehen.

## Anmerkungen

- Adressen als Start oder Ziel können warten. In dieser Phase sind Orte Haltestellen.
- Die mobile Schnittstelle verlangt streng genommen eine Erlaubnis. Das private Ausprobieren bleibt auf dem eigenen Server.
- Noch keine Verbindungen und kein Stand. Die Route ist nur die gespeicherte Absicht.

## Bleibt liegen

Vorschläge, Stand, Alternative, Cron, Karte, Adresssuche.
