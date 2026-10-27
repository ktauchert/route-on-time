# Machbarkeit

Eine PWA mit Anmeldung, pro Nutzer gespeicherten Routen und einem laufend neu gesetzten Stand ist im Verkehrsverbund Berlin-Brandenburg machbar. Suche, Alternativen und Echtzeit (Verspätung, Ausfall, Gleis) liefern etablierte Schnittstellen. Der erste ausprobierbare Stand braucht dafür ein kleines Backend. Die Verdrahtung aus der Voranalyse — HAFAS-Suche, dann GTFS-RT über dieselbe Trip-ID, dann die beim ersten Suchen gemerkte Alternative — trägt die Idee nicht.

Geprüft am 27. Oktober 2026.

## Was an der Voranalyse stimmt

Der VBB veröffentlicht drei getrennte Zugänge, und die Angaben dazu stimmen im Wesentlichen.

**Fahrplan-API.** Die offizielle REST-API liefert unter anderem `location.name`, `location.nearbystops`, `departureBoard`, `arrivalBoard`, `trip`, `journeyDetail`, `journeyPosition`, `GIS route` und `HimSearch`. Zugang gibt es nach einer kurzen Projektbeschreibung an `api@vbb.de`: zuerst Testsystem, nach Zustimmung zu den Nutzungsregeln das Produktivsystem. Die Regeln selbst stehen nicht auf der öffentlichen Seite. Sie müssen gelesen werden, bevor Antworten der API gespeichert oder weitergegeben werden.

In der HAFAS-Benennung ist `trip` die Suche von A nach B. `journeyDetail` ist eine konkrete Verbindung. Das Wort Trip in dieser API ist eine Verbindung, keine Fahrt im GTFS-Sinn.

**GTFS-RT.** Der Feed liegt unter `https://production.gtfsrt.vbb.de/data`, Lizenz CC BY 4.0, ohne Authentifizierung, höchstens 60 Abrufe pro Minute. Ein aussagekräftiger `User-Agent` mit Kontaktweg ist verlangt; generische Agents werden gesperrt. Ein Reverse-DNS-Eintrag der Server-IP ist erwünscht. CORS ist an, ETag auch. Staging: `https://staging.gtfsrt.vbb.de/data`. Statusmeldungen: `https://production.gtfsrt.vbb.de/news.atom.xml`.

Seit dem 4. Juni 2026, 16:00 Uhr, fehlen dem Feed Daten. Der VBB nennt weder den Umfang noch ein Ende. Der Feed ist damit kein verlässlicher alleiniger Beweis, dass eine Fahrt pünktlich ist. Am 30. Oktober 2026, 12:30–13:30 Uhr, ist Wartung angekündigt.

**GTFS Static.** Sollfahrplan, Haltestellen und Linienwege als ZIP, zweimal wöchentlich, ebenfalls CC BY 4.0. Das Archiv ist groß (zuletzt rund 80 MB gepackt, über 600 MB entpackt). Es gehört in einen Router auf einem Server, nicht in die PWA.

**Auslastung.** Eine einheitliche Live-Auslastung für alle Busse, Trams und Bahnen im Verbund gibt es nicht. Der GTFS-Standard kennt `occupancy_status`, der öffentliche VBB-Feed ist daraus nicht als Belegung aufgebaut. Auslastung bleibt außerhalb des ersten Stands.

**Community-Client.** `vbb-hafas` kapselt die mobile HAFAS-Schnittstelle über `hafas-client`. Dieselbe Verbindung lässt sich später mit `refreshJourney` neu lesen: gleiche Fahrzeuge, aktuelle Verspätungen und Ausfälle. Der Autor von `hafas-client` schreibt, dass für diese mobile Schnittstelle streng genommen eine Erlaubnis nötig ist. Die Bibliothek räumt die technische Hürde, sie ist nicht der offizielle Open-Data-Zugang. Für ein privates Ausprobieren hinter dem eigenen Server ist sie der übliche Weg. Sobald weitere Personen Zugänge bekommen, ist die offizielle API der tragfähige Zugang.

## Wo die Voranalyse bricht

### Fahrtkennungen sind nicht dieselben

Eine Kennung aus `vbb-hafas` hat die Form `1|12308|1|86|7112020`. Eine Kennung im GTFS-RT-Feed ist die GTFS-`trip_id` des Sollfahrplans. Dieselbe Fahrt trägt in beiden Welten verschiedene Kennungen. Der öffentliche GTFS-RT-Feed entsteht selbst erst durch einen Abgleich: Linienkürzel, mindestens zwei Halte, ungefähr dieselbe Sollzeit, ungefähr dieselbe Haltestelle, und nur wenn genau eine Sollfahrt passt. Zwei Treffer gelten als mehrdeutig und fallen weg.

Eine Route kann ihre HAFAS-Kennung im GTFS-RT-Feed nicht nachschlagen. Diesen Abgleich selbst zu bauen heißt, GTFS Static in eine Datenbank zu laden und Haltestellen- sowie Liniennamen zu normalisieren. Das ist ein eigenes Projekt (`match-gtfs-rt-to-gtfs`), kein Schritt im ersten Prototyp.

### Eine gemerkte Alternative ist keine Neuberechnung

Die Voranalyse sucht einmal, merkt sich zwei oder drei Verbindungen und zeigt bei einer Störung die zweite. Drei Fälle, in denen das die falsche Auskunft ist:

1. **Dieselbe Störung trifft beide Vorschläge.** Ringbahn fällt aus, beide Wege aus der Morgensuche nutzen die Ringbahn. Der gemerkte zweite Vorschlag passt ebenfalls nicht. Eine neue Suche ab jetzt findet den Bus, der in der ersten Ergebnisliste nicht vorkam.
2. **Die Vorgabe ist eine Ankunftszeit, keine Verspätungsminute.** Die S-Bahn hat 12 Minuten Verspätung und kommt trotzdem vor 9:00 an: die Route passt. Dieselbe S-Bahn hat 8 Minuten und reißt den Umstieg: die Route passt nicht. Eine feste Schwelle „mehr als X Minuten“ beantwortet die Frage nicht.
3. **Die Person ist schon unterwegs.** Fällt der zweite Abschnitt aus, beginnt die neue Suche am nächsten Halt der aktuellen Fahrt, nicht wieder zu Hause.

Eine Alternative ist das Ergebnis einer neuen Suche, nachdem der Stand auf passt nicht gekippt ist. Die Vorschläge der ersten Suche sind nur der Ausgangspunkt.

### Echtzeit fehlt heißt nicht „alles in Ordnung“

Wenn der Feed lückenhaft ist oder `realtimeDataUpdatedAt` einer Verbindung alt ist, lautet der Stand unklar. Sonst zeigt die App eine Route als passend, obwohl die Störung in den Daten fehlt.

### Der GTFS-RT-Feed ist ein Verbund-Datensatz, kein Abo pro Fahrt

Ein Abruf liefert den ganzen Verbund, als Protocol Buffers. 60 Abrufe pro Minute gelten für den Aufrufer. Holt jede geöffnete PWA den Feed selbst, ist das Kontingent bei einer Handvoll Geräten aufgebraucht, und das Telefon lädt jedes Mal den gesamten Verbund. Ein Server ruft den Feed ab und versorgt alle Routen daraus. Das lohnt sich, sobald viele Routen dieselben Fahrten teilen und die Kennungen zusammenpassen. Im Prototyp liest der Server die konkrete Verbindung über die Fahrplanauskunft neu (`refreshJourney` bzw. `journeyDetail`) und sucht bei einem Bruch neu.

`HimSearch` in der offiziellen API liefert Störungstexte (gesperrte Haltestelle, Ersatzverkehr). Ein reiner Blick auf `CANCELED` und `DELAY` sieht diese Fälle nicht.

### OpenTripPlanner ist für den Prototyp unnötig

Den Sollfahrplan selbst zu rechnen lohnt, wenn die Fahrplanauskunft wegfällt oder Fuß, Rad und ÖPNV in einem Graphen liegen sollen. Für „passt diese Route noch, und was fährt stattdessen“ reicht die vorhandene Auskunft. GTFS Static bleibt die Grundlage, falls der Server später über den GTFS-RT-Feed prüft, weil die Kennungen dann aus demselben Fahrplan stammen.

## Was Anmeldung und gespeicherte Routen zusätzlich verlangen

Die Voranalyse beschreibt eine Sitzung: suchen, eine Verbindung wählen, diese Fahrten weiterlesen. Eine Route ist etwas anderes. „Mo–Fr, von zu Hause zur Arbeit, ankommen vor 9:00“ hat an jedem Tag neue Fahrten. Die Fahrtkennungen von Dienstag gelten am Mittwoch nicht. Gespeichert werden Start, Ziel, Vorgabe und Wochentage. Die Verbindungen sucht der Server am jeweiligen Tag. Siehe [ADR 0001](./adr/0001-route-gilt-ueber-tage.md).

Dafür braucht es:

- einen Zugang pro Nutzer, damit eine Route nicht in einem fremden Browser liegt
- eine Datenbank, die Nutzer und Routen trennt
- einen Server, der die Fahrplanauskunft abfragt; die mobile HAFAS-Schnittstelle erlaubt keine Browser-CORS-Anfragen, und ein API-Schlüssel der offiziellen API darf nicht in der PWA stehen
- eine Uhr auf dem Server, die eine Route vor der Abfahrt in Verbindungen sucht und bis zur Ankunft neu prüft
- HTTPS, sonst lässt sich die PWA nicht zuverlässig installieren und Web Push nicht abonnieren

Die PWA kann den Stand zeigen, solange sie offen ist. Ein Service Worker kann den Verbund nicht im Hintergrund minütlich prüfen. Meldungen bei gesperrtem Telefon kommen von einem Server per Web Push (VAPID). Auf dem iPhone geht das ab iOS 16.4, und nur wenn die Seite zum Home-Bildschirm hinzugefügt wurde und von dort als eigene App läuft. Ein Safari-Tab kann die Erlaubnis nicht einholen. Jede Push-Nachricht muss sichtbar sein, sonst zieht Safari die Erlaubnis zurück. Android Chrome kann auch ohne Installation benachrichtigen.

Orte wie Wohnung und Arbeitsplatz sind Bewegungsdaten. Auch ein privater Probebetrieb speichert sie personenbezogen: Zugang nur für den Eigentümer, Löschen eines Nutzers löscht seine Routen, Transport nur über HTTPS.

## Quellen

- VBB-API: <https://unternehmen.vbb.de/digitale-services/api/>
- Offene Datensätze und GTFS: <https://unternehmen.vbb.de/digitale-services/datensaetze/>
- GTFS-RT: <https://production.gtfsrt.vbb.de/> und <https://production.gtfsrt.vbb.de/news.atom.xml>
- Feed-Aufbau und Abgleich Soll/Ist: <https://github.com/OpenDataVBB/gtfs-rt-feed>
- `hafas-client` (Hinweis zur Erlaubnis, kein CORS): <https://github.com/public-transport/hafas-client/blob/master/readme.md>
- `vbb-hafas`: <https://github.com/public-transport/vbb-hafas>
- Refresh einer Verbindung: <https://github.com/public-transport/hafas-client/blob/6/docs/journeys.md> und <https://v6.vbb.transport.rest/api.html>
- Abgleich verschiedener Kennungen am Beispiel VBB: <https://github.com/derhuerst/match-gtfs-rt-to-gtfs>
- Web Push auf iOS: <https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/>
