---
status: proposed
---

# Suche und Echtzeit kommen aus derselben Fahrplanauskunft

Im Prototyp liest der Server eine gefundene Verbindung über dieselbe Auskunft neu, die sie berechnet hat (`refreshJourney` bei `vbb-hafas`, `journeyDetail` bei der offiziellen API). Passt die Route nicht mehr, sucht dieselbe Auskunft neu. Der GTFS-RT-Feed ist in diesem Stand keine zweite Datenquelle.

HAFAS-Fahrtkennungen und GTFS-`trip_id`s bezeichnen dieselbe Fahrt nicht mit demselben Schlüssel. Der öffentliche Feed entsteht erst durch einen eigenen Abgleich auf den Sollfahrplan, und seit dem 4. Juni 2026 fehlen ihm Daten, ohne dass der Umfang genannt wird. Zwei Quellen können sich widersprechen; der Stand hätte dann keine Regel, welcher er folgt.

Ein Abruf des GTFS-RT-Feeds auf dem Server wird sinnvoll, wenn viele Routen dieselben Fahrten teilen und die Auskunft Kennungen aus dem GTFS-Sollfahrplan liefert. Bis dahin verdoppelt eine Verknüpfung den Betrieb (Sollfahrplan importieren, Namen normalisieren, mehrdeutige Treffer verwerfen), ohne die Prüfung zu verbessern.
