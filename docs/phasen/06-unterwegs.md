# Phase 6 — Unterwegs

**Ergebnis:** Ist eine Fahrt der geprüften Verbindung schon angetreten, sucht ein erneutes Prüfen ab dem nächsten Halt dieser Fahrt, nicht wieder am Start der Route.

**Voraussetzung:** [Phase 5](./05-alternative.md) ist fertig. Eine Verbindung mit mindestens zwei Abschnitten lässt sich auf passt nicht bringen, zum Beispiel durch eine Ankunftsuhrzeit, die nur der Restweg noch halten kann.

## Aufgaben

1. Liegt die aktuelle Zeit in Europe/Berlin nach der Abfahrt eines Abschnitts und vor seiner Ankunft, gilt er als angetreten. Die App fragt nicht, ob die Fahrt erreicht wurde.
2. Die neue Suche beginnt am nächsten Halt dieses Abschnitts. Ist die eine Fahrt schon angekommen und die nächste noch nicht abgefahren, beginnt sie am Umstiegsort. Der Start der Route bleibt gespeichert.
3. Der Restweg endet am Ziel der Route und hält dieselbe Ankunftsuhrzeit. Vorgabe und Alternative gelten dafür wie in Phase 4 und 5.
4. Vor der Abfahrt beginnt die Suche weiter am Start.

## Fertig, wenn

- Vor der Abfahrt sucht „Jetzt prüfen“ vom Start.
- Nach der Abfahrt des ersten Abschnitts und vor seiner Ankunft sucht derselbe Knopf vom nächsten Halt und zeigt eine Alternative nur für den Restweg, wenn der Stand auf passt nicht kippt.
- Zwischen zwei Abschnitten sucht derselbe Knopf vom Umstiegsort. Der Restweg endet am Ziel der Route und hält die Ankunftsuhrzeit.
- Der gespeicherte Start der Route bleibt unverändert.

## Anmerkungen

- Ohne heutige Verbindung nimmt die Prüfung die Verbindung, die den letzten Stand trägt.
- Liegt die Zeit nach der Ankunft des letzten Abschnitts, sucht diese Phase nicht mehr. Der Stand des Tages bleibt stehen.
- Die Uhr in Phase 7 benutzt dieselbe Regel.

## Bleibt liegen

Cron, Push, Standort des Telefons. Der nächste Halt kommt aus der Verbindung, nicht aus dem GPS.
