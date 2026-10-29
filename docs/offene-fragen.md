# Offene Fragen

Beantwortet am 27. Oktober 2026, bis auf die Nutzungsregeln.

1. **Gebiet.** Der erste Stand bleibt beim VBB.
2. **Vorgabe.** Eine Route kann davon setzen, was sie braucht: Ankunft vor einer Uhrzeit, Mindestzeit beim Umstieg, höchstens eine Zahl Umstiege, eine bestimmte Linie, die heute gewählte Verbindung. Ohne Ankunftsuhrzeit und ohne heutige Verbindung weiß die Uhr nicht, wann sie prüfen soll.
3. **Unterwegs.** Die Prüfung sucht neu ab dem nächsten Halt, sobald eine Fahrt angetreten ist.
4. **Meldungen.** Zuerst die offene App. Push auf das gesperrte Telefon kommt später.
5. **Wer sich anmelden darf.** Die App hat Anmeldung und Registrierung. Die Mail-Bestätigung bleibt aus, solange das im Supabase-Projekt so eingestellt ist. Ein vergessenes Passwort setzt das Dashboard zurück.

Offen, weil die Unterlage noch fehlt:

6. **Nutzungsregeln.** Sobald `api@vbb.de` den Testzugang schickt, entscheiden die Regeln, ob Antworten der API gespeichert werden dürfen und ob eine Namensnennung in der Oberfläche genügt. Bis dahin spricht der Prototyp über `vbb-hafas` auf dem eigenen Server. Was öffentlich bekannt ist, wie viele Anfragen die App macht und welche Fragen an den VBB gehen, steht in [API-Nutzung](./api-nutzung.md). Kosten, Limits, Nutzerzahl und kommerzielle Nutzung nennt der VBB nicht öffentlich. Das ist die Voraussetzung für fremde Nutzer und für Geld.

Entschieden am 29. Oktober 2026:

7. **Aufbruch vom Büro.** Der Knopf „Ich verlasse das Büro“ ersetzt die Ankunftsuhrzeit auf einer Route. Eine Route hat entweder eine Ankunftsuhrzeit oder den Aufbruch per Knopf. Nach dem Tippen sucht die Prüfung ab diesem Moment die nächsten Abfahrten, die die Vorgabe erfüllen, und nimmt die erste als heutige Verbindung. Fällt sie aus, sucht die nächste Prüfung neu und die nächste passende Abfahrt wird die Alternative. Ohne Tippen prüft die Uhr nicht. Siehe [Aufbruch im Glossar](../GLOSSARY.md). Später, wenn die Datenlage es hergibt: schnellste oder ruhigste Route wählen (Auslastung, Regionalbahn vor S-Bahn). Der Weg vom Büro zur Haltestelle ist noch nicht eingerechnet. Wer ihn braucht, tippt später oder bekommt später eine Gehzeit pro Route.
8. **Eine Uhrzeit pro Wochentag.** Bleibt wie bisher. Wer freitags früher fährt, legt eine zweite Route für Freitag an und wählt bei der ersten nur Mo–Do. Kein neuer Code.
