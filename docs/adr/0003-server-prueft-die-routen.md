---
status: proposed
---

# Der Server prüft die Routen

Ein Server sucht zu einer Route die Verbindungen des Tages, liest sie neu und speichert den Stand. Die PWA zeigt diesen Stand und legt Routen an.

Die mobile HAFAS-Schnittstelle lässt sich aus dem Browser nicht direkt aufrufen. Ein Schlüssel der offiziellen API darf nicht in der PWA liegen. Ein Service Worker kann bei geschlossener App nicht minütlich den Verbund prüfen. Web Push setzt einen Sender voraus, der auch dann läuft, wenn kein Tab offen ist; auf dem iPhone zusätzlich eine zum Home-Bildschirm hinzugefügte App. Der GTFS-RT-Feed erlaubt 60 Abrufe pro Minute für den ganzen Verbund, also einen Aufrufer, nicht ein Gerät pro Nutzer.

Solange die App offen ist, könnte das Telefon seine eigene Verbindung selbst neu lesen. Die gespeicherte Route, der Schlüssel und die spätere Meldung bei gesperrtem Telefon lägen dann trotzdem auf dem Server. Dieselbe Prüfung ein zweites Mal in der PWA zu bauen würde die Regeln verdoppeln.
