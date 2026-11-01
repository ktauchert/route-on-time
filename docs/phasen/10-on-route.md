# Phase 10 — On-Route-Modus

**Ergebnis:** Läuft eine Route oder startet sie in höchstens 20 Minuten, zeigt die App eine Pixelkarte von Berlin und Umland mit genau den Stationen und dem Weg dieser Route. Oben steht der Name der Route, unten die Restzeit mit einem Pixel-Fortschrittsbalken. Ein Tipp auf eine Station öffnet ein Popup. Der Modus lässt sich pro Gerät an- und ausschalten.

**Voraussetzung:** [Phase 9](./09-ausfaelle.md) ist in `main`. Die Verbindung, die für die Route zählt, ist die heutige Verbindung, sonst die Verbindung, die den Stand trägt.

## Aufgaben

1. **Koordinaten.** Die Auskunft liefert Orte und Linienform mit (`polylines`). Jeder Abschnitt behält Start, Ziel, Zwischenhalte und eine auf höchstens 40 Punkte ausgedünnte Form. Alte Stände ohne Koordinaten bleiben lesbar.
2. **Aktive Route.** Aktiv ist die Route, deren Verbindung gerade fährt, sonst die, die in höchstens 20 Minuten abfährt. Eine fahrende Route geht vor, unter mehreren abfahrenden die nähere.
3. **Seite `/on-route`.** Vollbild: oben der Name, in der Mitte die Karte, unten die Statusleiste mit „Noch 23 min“ oder „Abfahrt in 12 min“ und einem Pixel-Balken. „Zur Route“ führt auf die Routenseite, „Modus aus“ schaltet den Modus aus.
4. **Karte.** Eine statische Grundkarte in Pixeln (Berliner Grenze, Wasser, S-Bahn-Ring) in zwei Auflösungen, Stadt und Umland. Gezeigt werden nur Linien und Stationen dieser Route, in den Farben der Verkehrsmittel. Ein Marker zeigt, wo die Fahrt nach Fahrplan sein sollte. Die Karte nennt OpenStreetMap als Quelle.
5. **Station antippen.** Ein Popup nennt Ankunft, Abfahrt, Verspätung, die Umstiegszeit mit dem Wechsel der Linie („Umstieg 4 min, S7 → S2“) und einen Fußweg bis zur nächsten Station.
6. **Schalter.** Der Modus ist standardmäßig an und wird pro Gerät in einem Cookie gespeichert. Der Schalter steht in den Einstellungen und auf der Seite selbst.
7. **Einstieg.** Die Routenliste leitet auf `/on-route`, solange der Modus an ist und eine Route aktiv ist. Ein gewollter Sprung zur Liste (`/routes?all=1`) bleibt auf der Liste.

## Fertig, wenn

- Eine aktive Route die Seite `/on-route` zeigt, eine inaktive nicht.
- 19 Minuten vor der Abfahrt die Seite erscheint, 21 Minuten davor nicht.
- Die Karte nur Stationen und Weg dieser einen Route zeigt.
- Ein Tipp auf eine Umstiegsstation die Umstiegszeit nennt, in Deutsch und Englisch.
- Bei ausgeschaltetem Modus die Liste bleibt.
- Mobil und Desktop, Paper und Stone im Browser geprüft sind.

## Anmerkungen

- Die Position ist eine Schätzung nach Fahrplan, kein GPS.
- Fehlt der Auskunft die Linienform eines Abschnitts, zeichnet die Karte gerade Linien zwischen den Stationen.
- Die Grundkarte entsteht einmal mit `scripts/build-basemap.mjs` aus OpenStreetMap-Daten und liegt eingecheckt in `lib/basemap/`. Der Testlauf und die CI rufen keinen Kartendienst auf. Siehe [ADR 0013](../adr/0013-statische-pixel-grundkarte.md).

## Bleibt liegen

GPS-Position, Karte für andere Verbünde, Zoomen und Verschieben, Hinweis beim Aussteigen.
