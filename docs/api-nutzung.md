# API-Nutzung

Was die Fahrplanauskunft kostet, wie viele Anfragen sie verträgt und was die Nutzungsregeln für Nutzer, Speicherung und Geld bedeuten. Geprüft am 29. Oktober 2026 gegen die öffentlichen Seiten des VBB, `hafas-client`, `vbb-rest` und `gtfs-rt-feed`.

Kurz: Für den Betrieb zu zweit reicht die heutige Lösung. Für fremde Nutzer, und erst recht gegen Geld, fehlen die entscheidenden Angaben. Der VBB veröffentlicht sie nicht. Sie kommen nur auf Anfrage an `api@vbb.de`.

## Was wir benutzen

| Zugang | Wer sie liefert | Stand im Bau |
| --- | --- | --- |
| `vbb-hafas` | Community-Bibliothek auf der mobilen HAFAS-Schnittstelle (`lib/auskunft.ts`) | Läuft heute. Suche, Neulesen einer Verbindung, frühere Verbindungen. |
| Offizielle VBB-API | VBB, nach Anmeldung | Nicht angefragt. Die Antwort auf die offene Frage 6 steht aus. |
| GTFS-RT, GTFS Static | VBB, offen | Nicht im Bau. Siehe [ADR 0002](./adr/0002-eine-auskunft-fuer-suche-und-echtzeit.md). |
| Öffentliche Instanz `v6.vbb.transport.rest` | Community | Nicht benutzt. Keine Grundlage für eine App. |

## Was der VBB schreibt

### Offizielle Fahrplan-API

Quellen: [API-Seite](https://unternehmen.vbb.de/digitale-services/api/), [Anmeldung Produktivsystem](https://unternehmen.vbb.de/en/vbb-services/api-open-data/api/registration-for-productive-environment/).

| Punkt | Angabe | Quelle sagt |
| --- | --- | --- |
| Zugang | Kurze Projektbeschreibung an `api@vbb.de`, dann Testserver. Das Produktivsystem folgt nach Zustimmung zu den Nutzungsregeln. | Ja |
| Testsystem | Höhere Latenz und veränderte Fahrplandaten möglich. Nicht für den Betrieb. | Ja |
| Anmeldeformular | Fragt nach Name oder Firma, E-Mail, Kennung, Datenstand, Ausfalltoleranz, erwartetem Anfragevolumen und Datenquelle. | Ja |
| Verfügbarkeit | Kein Anspruch auf Nutzung. Keine Zusage, dass die API durchgehend läuft. | Ja |
| Datenqualität | Keine Gewähr für richtige, vollständige oder aktuelle Daten. | Ja |
| Last | Anfragen sollen effizient sein. Belastet eine Kennung das System zu stark, kann der VBB sie zeitweise sperren. | Ja |
| Namensnennung | Der VBB muss als Quelle der Fahrplandaten genannt werden, zum Beispiel in den Nutzungsbedingungen oder im Impressum. | Ja |
| Kosten | Nicht genannt. | Nein |
| Anfragen pro Tag oder Minute | Keine Zahl genannt. Das Formular fragt nach dem erwarteten Volumen, also wird es vermutlich pro Kennung vereinbart. | Nein |
| Zahl der Nutzer | Nicht genannt. | Nein |
| Kommerzielle Nutzung | Nicht genannt. Das Formular spricht von Anwendungen, die privat oder öffentlich genutzt werden. | Nein |
| Speichern von Antworten | Nicht genannt. Die Regeln selbst stehen nicht öffentlich. | Nein |

Wichtig für uns: Die App speichert den Stand, die Vorschläge und die Alternative einer Prüfung in der Datenbank (`route_checks`). Ob das erlaubt ist, steht in den Regeln, die wir nicht kennen.

### Offene Datensätze: GTFS, GTFS-RT

Quelle: [Datensätze](https://unternehmen.vbb.de/digitale-services/datensaetze/).

- Lizenz CC BY 4.0. Namensnennung ist nötig. Kommerzielle Nutzung ist damit grundsätzlich erlaubt.
- Keine Kosten, keine Anmeldung.
- Keine Haftung und keine Gewähr, die Daten können Fehler und Lücken haben.
- GTFS Static wird zweimal pro Woche aktualisiert.
- Für den GTFS-RT-Feed nennt die Seite keine eigenen Regeln. In [Machbarkeit](./machbarkeit.md) steht: höchstens 60 Abrufe pro Minute, aussagekräftiger `User-Agent`. Das habe ich am 29. Oktober nicht erneut auf einer VBB-Seite gefunden. Das Repository `gtfs-rt-feed` nennt weder ein Limit noch eine Lizenz für die Ausgabedaten.
- Seit dem 4. Juni 2026 hat der Feed Lücken. Am 30. Oktober 2026, 12:30–13:30 Uhr, ist Wartung angekündigt.

## Was wir heute nutzen: `vbb-hafas`

Quelle: [hafas-client](https://github.com/public-transport/hafas-client/blob/master/readme.md).

- Die Bibliothek spricht die mobile HAFAS-Schnittstelle. Der Autor schreibt: Streng genommen ist dafür eine Erlaubnis nötig. Die Bibliothek räumt nur die technische Hürde.
- Der `User-Agent` soll einen Link oder eine E-Mail-Adresse enthalten, damit die Betreiber bei zu viel Verkehr Kontakt aufnehmen können. Die App setzt `HAFAS_USER_AGENT` oder einen Standardwert mit dem GitHub-Link.
- Zu Limits, Kosten und kommerzieller Nutzung sagt die Seite nichts. Es gibt keinen Vertrag und keine Zusage.
- Aus dem Browser lässt sich die Schnittstelle nicht aufrufen. Die App ruft sie vom Server aus.

Die öffentliche Instanz `v6.vbb.transport.rest` hat laut [Startseite](https://v6.vbb.transport.rest/) 100 Anfragen pro Minute ohne Schlüssel. Zu Fair Use und kommerzieller Nutzung steht in der Kurzfassung nichts. Sie ist eine Gefälligkeit der Community und kein Unterbau für eine App. Wer sie braucht, hostet [vbb-rest](https://github.com/derhuerst/vbb-rest) selbst (ISC-Lizenz), mit Redis als Zwischenspeicher. Das ändert nichts an der Erlaubnis für die mobile Schnittstelle dahinter.

## Wie andere Apps es machen: Öffi

Öffi nutzt die Bibliothek [public-transport-enabler](https://github.com/schildbach/public-transport-enabler) (GPL-3.0). Ihr `VbbProvider` zeigt auf `https://fahrinfo.vbb.de/` und der `BvgProvider` auf `https://bvg.hafas.cloud/apps/`. Beide sind HAFAS-Zugänge des Verbunds und ein anderer Weg als `vbb-hafas`. Beide verlangen vom Aufrufer einen Schlüssel (`apiAuthorization`), den die Bibliothek nicht mitliefert. Die Bibliothek schreibt, dass man solche Schlüssel beim Anbieter anfragen muss.

Welchen Schlüssel die fertige Öffi-App benutzt und unter welchen Bedingungen er ausgestellt wurde, steht nicht im Code und nicht auf den Seiten, die ich gelesen habe. Auch ob Öffi kommerziell ist, habe ich nicht geprüft. Ich glaube, die App ist kostenlos und lebt von Spenden, aber das ist mein Wissen und kein Beleg.

Was daraus folgt:

- Der übliche Weg einer verbreiteten App ist ein eigener Schlüssel vom Verbund, nicht die mobile Schnittstelle ohne Erlaubnis.
- Ein Schlüssel gehört zu einer Person oder einem Projekt. Die Bedingungen verhandelt der Inhaber mit dem Verbund. Wir können sie von Öffi nicht übernehmen.

## „Buy me a coffee“: zählt das als kommerziell?

Ich kann das nicht verbindlich beantworten, und es ist keine Rechtsberatung. Nach den öffentlichen VBB-Seiten entscheidet nicht der Gesetzestext, sondern der Wortlaut der Nutzungsregeln. Der ist nicht öffentlich.

Die Lage in drei Sätzen:

- **Freiwillige Spende ohne Gegenleistung** ist üblicherweise kein Entgelt für die App. Viele Anbieter sehen das als nicht kommerziell an. Sicher ist das nicht, weil Regeln oft von Einnahmen oder Gewinnabsicht sprechen und nicht nur von Verkauf.
- **Sobald es eine Gegenleistung gibt** (Funktionen nur für Zahler, Abo, Werbung, „Pro“), ist es kommerziell.
- **Steuerlich** sind Einnahmen auch bei Spenden meldepflichtig, unabhängig davon, was der VBB sagt. Das ist ein eigenes Thema.

Das Risiko ist klein, wenn man fragt, bevor man den Knopf einbaut. Es ist größer, wenn man es einbaut und danach feststellt, dass die Regeln es ausschließen. Die Frage kommt deshalb in die Liste an den VBB (Nr. 10). Die Antwort gilt dann für die Kennung, die ihr bekommt.

## Wie viele Anfragen die App macht

Das ist eine Schätzung aus `lib/check.ts`, `lib/clock.ts` und `supabase/clock.sql`, keine Messung.

- Eine Prüfung ruft die Auskunft ein- bis dreimal auf: das Neulesen der gewählten Verbindung oder eine Suche; bei „passt nicht“ dazu die Suche nach einer früheren Verbindung. Unterwegs kommt die Suche ab dem nächsten Halt dazu.
- Die Uhr prüft eine Route im gewählten Intervall, standardmäßig alle 5 Minuten, ab 3 Stunden vor der Ankunftsuhrzeit bis zur Ankunft. Das sind etwa 36 Prüfungen pro Route und Tag.
- Eine Tour Mo–Fr (hin und zurück) sind zwei Routen am Tag.

| Nutzer | Prüfungen pro Tag | Anfragen pro Tag (1–3 je Prüfung) | Spitze pro Minute |
| --- | --- | --- | --- |
| 2 (wir) | 144 | 144–430 | 1–2 |
| 10 | 720 | 720–2.200 | 4–12 |
| 100 | 7.200 | 7.200–21.600 | 40–120 |
| 1.000 | 72.000 | 72.000–216.000 | 400–1.200 |

Die Spitze nimmt an, dass alle Nutzer dieselbe Morgenzeit haben und das Intervall 5 Minuten ist (Nutzer geteilt durch 5, mal 1 bis 3 Anfragen). Das trifft den Berufsverkehr, weil alle um dieselbe Zeit prüfen. An einem Störungstag steigt der Anteil mit Alternativen auf drei Anfragen je Prüfung.

Einordnung:

- **Zu zweit** liegt die App weit unter dem, was eine mobile Schnittstelle üblicherweise duldet. Kein Handlungsbedarf.
- **Ab etwa 100 Nutzern** liegt die Spitze über 100 Anfragen pro Minute. Das ist die Zahl, bei der die öffentliche Instanz bremst, und eine Größenordnung, bei der der VBB eine Kennung als Last einstuft. Ohne offizielle Kennung und Absprache sollte die App vorher nicht dort ankommen.
- **Ab einigen Hundert Nutzern** trägt ein Aufruf pro Prüfung nicht mehr. Dann lohnt der gemeinsame Abruf des GTFS-RT-Feeds (siehe [Später](./phasen/spaeter.md)), weil ein Abruf alle Routen mit denselben Fahrten versorgt.

Was die Zahl senkt, ohne die Verlässlichkeit zu mindern:

- Nur prüfen, wenn jemand die Route braucht. Der Abend ist der Fall: Die Uhr muss nicht drei Stunden vorher prüfen, wenn der Aufbruch vom Büro erst gemeldet wird (siehe unten).
- Das Intervall dichter an der Abfahrt kürzer, weit davor länger.
- Prüfungen mehrerer Nutzer mit gleichem Start, Ziel und gleicher Zeit zusammenlegen.
- Gleiche Fragen kurz zwischenspeichern.

## Idee: der Aufbruch vom Büro als Auslöser

Abends ist die Ankunftsuhrzeit kein guter Anker. Der Aufbruch vom Büro ist ungenau, weil etwas dazwischenkommt. Die Idee: Die Person meldet in der App, dass sie jetzt losgeht. Die Prüfung sucht ab diesem Moment, nicht ab einer Uhrzeit.

Für die Anfragen heißt das:

- Die Uhr prüft die Rückfahrt nicht drei Stunden lang vorab. Sie prüft ab dem Tippen bis zur Ankunft. Bei etwa einer Stunde Weg sind das rund 12 statt 36 Prüfungen.
- Der Abend kostet dann etwa ein Drittel der Anfragen. Gerechnet auf zwei Routen am Tag sinkt die Zahl um rund ein Drittel.
- Die Prüfung nach dem Tippen sollte sofort laufen, nicht erst beim nächsten Takt der Uhr. Das ist eine Anfrage mehr, aber genau die, die zählt.

Entschieden und gebaut: Der Knopf ersetzt die Ankunftsuhrzeit auf der Route. Siehe [offene Fragen](./offene-fragen.md), Frage 7.

## Kosten

| Posten | Heute | Bei fremden Nutzern |
| --- | --- | --- |
| Auskunft über `vbb-hafas` | 0 € | Nicht tragfähig. Es gibt keinen Vertrag. |
| Offizielle VBB-API | Unbekannt | Unbekannt. Muss angefragt werden. |
| GTFS, GTFS-RT | 0 €, CC BY 4.0 | 0 €, aber der Aufwand für einen eigenen Abgleich ist groß. |
| Supabase, Vercel | Nicht geprüft | Nicht geprüft. Vercel Hobby ist nach meinem Wissen nicht für kommerzielle Nutzung gedacht. Das ist nicht gegen die aktuellen Bedingungen geprüft. |

## Was das für die Pläne heißt

| Vorhaben | Reicht `vbb-hafas`? | Offen |
| --- | --- | --- |
| Wir zwei, privat | Ja | Der `User-Agent` zeigt auf eine erreichbare Adresse. |
| Weitere Personen, kostenlos | Nein, spätestens bei der ersten fremden Person | Offizielle Kennung, Impressum mit Namensnennung des VBB, Datenschutz. |
| Mit Bezahlung | Nein | Ob die Regeln kommerzielle Nutzung erlauben, was sie kostet, ob Speichern erlaubt ist. |

## Zu klären mit `api@vbb.de`

Schicken, bevor etwas anderes gebaut wird. Die Antwort entscheidet über die Richtung.

1. Ist kommerzielle Nutzung erlaubt (Abo, Werbung)? Wenn ja: zu welchen Bedingungen?
2. Was kostet das Produktivsystem?
3. Gibt es ein Limit pro Tag oder Minute? Wie läuft die Vereinbarung des Volumens?
4. Gibt es eine Obergrenze für Endnutzer hinter einer Kennung?
5. Darf die App Antworten speichern, zum Beispiel Verbindungen und Stand für 24 Stunden oder länger? Darf sie sie anzeigen, wenn die Auskunft gerade nicht antwortet?
6. Wie muss der VBB genannt werden? Reicht das Impressum, oder muss es in der Oberfläche stehen?
7. Welche Ausfallzeiten sind üblich? Die Anmeldung fragt nach der Toleranz.
8. Darf die App mehrere Prüfungen mit demselben Start und Ziel für verschiedene Nutzer zusammenlegen?
9. Ist die mobile HAFAS-Schnittstelle, die `vbb-hafas` benutzt, für den Probebetrieb zu zweit geduldet?
10. Gilt ein freiwilliger Spendenlink („Buy me a coffee“) ohne Gegenleistung als kommerzielle Nutzung? Wo liegt die Grenze (Spende, Werbung, bezahlte Funktionen)?
11. Wie läuft die Ausstellung eines Schlüssels für eine App mit mehreren Nutzern, und wie ist das bei Apps wie Öffi geregelt?

Eine Beschreibung für die Anfrage: Eine Web-App für Pendler mit festen Strecken, die eine gewählte Verbindung neu liest und bei Ausfall eine Alternative sucht. Erwartet sind zunächst zwei Nutzer mit je zwei Routen und etwa 150 bis 450 Anfragen pro Tag.

## Rechtliches bei fremden Nutzern

- Impressum und Datenschutzerklärung. Die App speichert Start, Ziel und Fahrzeiten einer Person, also Bewegungsdaten.
- Der VBB als Quelle wird im Impressum genannt, wenn die Regeln es so verlangen.
- Konto löschen löscht die Routen und alle Stände dazu.
- Ein Auftragsverarbeitungsvertrag mit Supabase und dem Hoster. Das ist ein Datenschutzthema, nicht Teil dieser Prüfung.

## Was nicht geprüft ist

- Die Nutzungsregeln des Produktivsystems selbst. Sie stehen nicht öffentlich.
- Preise von Supabase und Vercel.
- Ob die mobile HAFAS-Schnittstelle Limits oder Sperren pro IP hat. Der Betreiber nennt keine.
- Wie viele Anfragen die App in der Praxis macht. Die Tabelle oben ist gerechnet, nicht gemessen. Messen lässt sich das, sobald die Uhr auf einem echten Server läuft.
