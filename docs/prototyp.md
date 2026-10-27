# Prototyp

Der Bau in Phasen steht in der [Roadmap](./roadmap.md). Ziel des ersten Stands: eine Person meldet sich an, speichert wenige Routen und sieht am selben Tag, ob eine Verbindung die Vorgabe noch erfüllt. Kippt der Stand auf passt nicht, zeigt die App eine neu gesuchte Alternative. Auslastung, deutschlandweite Verbünde und Push bei gesperrtem Telefon bleiben draußen, bis der Kern sitzt.

## Bestandteile

```text
PWA (Next.js, shadcn/ui, Tailwind)
  Anmeldung, Routen anlegen, heutiger Stand und Alternative anzeigen
        │
        ▼
Supabase
  Anmeldung, Routen, Stand, Zeilensicherheit, Cron als Uhr
        │
        ▼
Next.js auf Node
  Suche am Tag, Verbindung neu lesen, Stand schreiben
        │
        ▼
Fahrplanauskunft für Berlin-Brandenburg
  Suche, dieselbe Verbindung neu lesen, Störungstexte
```

Die PWA speichert keine Fahrplandaten und ruft die Fahrplanauskunft nicht selbst auf. Supabase hält Nutzer, Routen und den letzten Stand. Die Next-Route auf Node spricht mit der Auskunft, weil `vbb-hafas` dort läuft. Supabase Cron weckt diese Route. Siehe [ADR 0004](./adr/0004-nextjs-und-supabase.md).

Solange nur eine Person prüft, genügt die E-Mail-Anmeldung von Supabase. Web Push und ein Mail-Anbieter kommen dazu, wenn Meldungen bei geschlossener App dazugehören. Ein Free-Projekt pausiert nach etwa einer Woche ohne Datenbankaktivität.

## Ablauf eines Tages

1. Die Route nennt Start, Ziel, Vorgabe und die Tage, an denen sie gilt.
2. Am Tag der Route, eine Weile vor der relevanten Uhrzeit, sucht der Server Verbindungen und behält die Vorschläge, die die Vorgabe erfüllen.
3. Im Abstand weniger Minuten liest er diese Verbindungen neu (dieselben Fahrzeuge, neue Verspätungen und Ausfälle).
4. Er setzt den Stand neu:
   - **passt** — mindestens eine Verbindung erfüllt die Vorgabe
   - **passt nicht** — keine erfüllt sie; der Server sucht ab jetzt neu, bei einer schon angetretenen Fahrt ab dem nächsten Halt
   - **unklar** — die Echtzeit fehlt oder ist zu alt, um zu entscheiden
5. Die PWA zeigt den Stand, die betroffenen Abschnitte und, falls vorhanden, die Alternative.

Die Vorschläge vom Morgen sind der Ausgangspunkt der Prüfung. Die Alternative nach einem Bruch kommt aus der neuen Suche.

## Fahrplanauskunft

Zwei Zugänge, einer davon für den Prototyp:

| Zugang | Wann |
| --- | --- |
| `vbb-hafas` auf dem eigenen Server | Sofort ausprobierbar. Die Bibliothek spricht die mobile Schnittstelle; der Autor verlangt dafür streng genommen eine Erlaubnis. User-Agent mit Kontaktweg setzen. |
| Offizielle VBB-API | Tragfähig, sobald Testzugang und gelesene Nutzungsregeln da sind. Anfrage an `api@vbb.de`. Schlüssel nur auf dem Server. |

`v6.vbb.transport.rest` ist dieselbe mobile Schnittstelle, betrieben von jemand anderem, mit fremder Abrufgrenze. Sie taugt zum Gegencheck einer einzelnen Anfrage, nicht als Abhängigkeit des Prototyps.

GTFS-RT bleibt für einen späteren Schritt: ein Abruf auf dem Server, viele Routen, Kennungen aus demselben Sollfahrplan. Dafür muss die Auskunft GTFS-`trip_id`s liefern oder der Abgleich aus [der Machbarkeitsnotiz](./machbarkeit.md) gebaut sein. Der Feed hat seit dem 4. Juni 2026 Lücken; fehlende Echtzeit heißt unklar, nicht passt.

CC BY 4.0 verlangt eine Namensnennung, sobald GTFS- oder GTFS-RT-Inhalte in der Oberfläche auftauchen.

## Bewusst nicht im ersten Stand

- eigener Rechenweg auf GTFS Static (OpenTripPlanner oder SQL)
- Auslastung
- Verbünde außerhalb Berlin-Brandenburg
- Hintergrund-Abo des GTFS-RT-Feeds in der PWA
- Push, solange der Stand in der offenen App noch nicht stimmt

## Was vor dem ersten Code da sein muss

1. Gebiet ist Berlin-Brandenburg.
2. Die Vorgabe einer Route setzt nur, was sie verlangt: Ankunftsuhrzeit, Umstiegsminuten, Höchstzahl Umstiege, eine Linie, die heute gewählte Verbindung.
3. Fahrplanauskunft wählen. Für ein Ausprobieren diese Woche: `vbb-hafas` auf dem Server. Parallel die offizielle API beantragen.
4. Einen Host mit HTTPS, sobald die PWA das eigene Notebook verlässt.
