# Phase 4 — Stand

**Ergebnis:** Ein Knopf „Jetzt prüfen“ setzt auf der Route den Stand passt, passt nicht oder unklar und zeigt, woran es lag.

**Voraussetzung:** [Phase 3](./03-vorschlaege.md) ist fertig. Die Vorgabe ist entschieden, siehe [offene Fragen](../offene-fragen.md).

## Regel

Ein Vorschlag erfüllt die Vorgabe, wenn jeder gesetzte Punkt gilt. Leere Punkte prüfen nichts.

- Ein ausgefallener Abschnitt erfüllt die Vorgabe nicht.
- Ankunftsuhrzeit: die Ankunft, mit Verspätung wenn vorhanden, sonst die Sollzeit, liegt an diesem Tag in Europe/Berlin vor oder auf dieser Uhrzeit.
- Umstiegsminuten: zwischen Ankunft eines Abschnitts und Abfahrt des nächsten liegen mindestens so viele Minuten.
- Höchstzahl der Umstiege: die Verbindung hat höchstens so viele.
- Linie: mindestens ein Abschnitt fährt diese Linie.
- Heutige Verbindung: geprüft wird diese Verbindung, erneut gelesen, nicht ein beliebiger anderer Vorschlag. Dafür wählt die Person in der Liste aus Phase 3 eine Verbindung. Ohne diese Wahl gelten die übrigen Punkte für die Vorschläge des Tages.

Der Stand der Route:

- **passt** — die heutige Verbindung erfüllt die Vorgabe, oder es ist keine gewählt und der erste der fünf Vorschläge, der sie erfüllt, tut es.
- **passt nicht** — die Auskunft hat geantwortet, und keine Verbindung, die zählt, erfüllt die Vorgabe. Ohne heutige Verbindung zeigt die Seite den ersten der fünf und den Grund.
- **unklar** — die Auskunft ist nicht erreichbar, antwortet fehlerhaft, oder die Abfahrt liegt in der nächsten Stunde und der Echtzeitstempel der Antwort ist älter als 15 Minuten.

Eine geglückte Antwort nur mit Sollzeiten, ohne gemeldete Verspätung, ist eine gültige Grundlage. Fehlende Verspätung ist dann keine Lücke.

## Aufgaben

1. Den Stand speichern: Route, Datum, Stand, Zeitpunkt der Prüfung, und die Kurzfassung der Verbindung, die den Stand trägt. Das ist die heutige Verbindung, sonst der erste der fünf, der die Vorgabe erfüllt, sonst der erste der fünf. Linien, Uhrzeiten, Verspätung, Ausfall, Haltestellennamen, Fußwege. Kein Rohprotokoll.
2. Eine gewählte Verbindung des Tages an der Route merken, als heutige Verbindung. „Jetzt prüfen“ liest sie erneut, wenn sie gesetzt ist, und sucht sonst die fünf Vorschläge.
3. Derselbe Knopf wie in Phase 3 zeigt die fünf Vorschläge und den Stand. Es gibt keinen zweiten Knopf nur für die Liste. Im Schnellstart startet der Eintrag einer heute geltenden Route dieses Prüfen.
4. Beim Stand einen Satz, der den Grund nennt: Ankunft, Umstieg zu kurz, zu viele Umstiege, Linie fehlt, Ausfall, oder keine Antwort.
5. Zeilensicherheit gilt auch für den Stand.

## Fertig, wenn

- Eine Route mit erreichbarer Ankunft auf passt steht, nachdem die Auskunft eine passende Verbindung geliefert hat.
- Eine Ankunftsuhrzeit vor allen Vorschlägen auf passt nicht steht.
- Eine gesetzte Linie, die in keinem Vorschlag vorkommt, auf passt nicht steht.
- Eine gesetzte Höchstzahl, die jeder Vorschlag überschreitet, auf passt nicht steht.
- Eine gewählte heutige Verbindung, die ausfällt, auf passt nicht steht, auch wenn ein anderer Vorschlag die Ankunft noch halten würde.
- Eine unterbrochene Auskunft auf unklar steht und den letzten Stand nicht stillschweigend auf passt setzt.
- Zwei Konten sehen nicht denselben Stand.

## Anmerkungen

- Diese Phase sucht neu und bewertet. Sie merkt sich keinen zweiten Vorschlag als Alternative. Das ist Phase 5.
- Unklar wegen alter Echtzeit gilt so: Abfahrt in der nächsten Stunde, Echtzeitstempel älter als 15 Minuten.
- Noch keine Uhr. Wer den Tab schließt, bekommt keinen neuen Stand, bis Phase 7 da ist.
- Die Suche beginnt am Start der Route. Den nächsten Halt nimmt Phase 6.

## Bleibt liegen

Alternative, Suche ab dem nächsten Halt, Cron, Push.
