# Offene Fragen

Beantwortet am 27. Oktober 2026, bis auf die Nutzungsregeln.

1. **Gebiet.** Der erste Stand bleibt beim VBB.
2. **Vorgabe.** Eine Route kann davon setzen, was sie braucht: Ankunft vor einer Uhrzeit, Mindestzeit beim Umstieg, höchstens eine Zahl Umstiege, eine bestimmte Linie, die heute gewählte Verbindung. Ohne Ankunftsuhrzeit und ohne heutige Verbindung weiß die Uhr nicht, wann sie prüfen soll.
3. **Unterwegs.** Die Prüfung sucht neu ab dem nächsten Halt, sobald eine Fahrt angetreten ist.
4. **Meldungen.** Zuerst die offene App. Push auf das gesperrte Telefon kommt später.
5. **Wer sich anmelden darf.** Die App hat Anmeldung und Registrierung. Die Mail-Bestätigung bleibt aus, solange das im Supabase-Projekt so eingestellt ist. Ein vergessenes Passwort setzt das Dashboard zurück.

Offen, weil die Unterlage noch fehlt:

6. **Nutzungsregeln.** Sobald `api@vbb.de` den Testzugang schickt, entscheiden die Regeln, ob Antworten der API gespeichert werden dürfen und ob eine Namensnennung in der Oberfläche genügt. Bis dahin spricht der Prototyp über `vbb-hafas` auf dem eigenen Server. Was öffentlich bekannt ist, wie viele Anfragen die App macht und welche Fragen an den VBB gehen, steht in [API-Nutzung](./api-nutzung.md). Kosten, Limits, Nutzerzahl und kommerzielle Nutzung nennt der VBB nicht öffentlich. Das ist die Voraussetzung für fremde Nutzer und für Geld.

Neu, noch nicht entschieden:

7. **Aufbruch vom Büro.** Abends passt „Ankunft vor Uhrzeit“ schlecht, weil der Aufbruch ungenau ist. Eine Person meldet „ich gehe jetzt“, und die Prüfung sucht ab diesem Moment bis zur Ankunft. Zu klären: Ersetzt das die Ankunftsuhrzeit auf der Rückroute oder ergänzt es sie? Welche Vorgabe gilt dann (so früh wie möglich zu Hause, oder ein spätester Zeitpunkt)? Wie sieht die Uhr aus, wenn niemand tippt? Die Idee senkt die Zahl der Anfragen am Abend, siehe [API-Nutzung](./api-nutzung.md).
8. **Eine Uhrzeit pro Wochentag.** Freitags fährt die Tour früher. Heute hat eine Route eine Ankunftsuhrzeit für alle gewählten Tage. Eine Ausnahme pro Tag oder eine Uhrzeit pro Wochentag ändert das Modell und die Fälligkeit der Uhr.
