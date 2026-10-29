# Phase 8 — PWA und Verlässlichkeit unterwegs

**Ergebnis:** Die App lässt sich auf den Home-Bildschirm legen und öffnet sich ohne Browser-Leiste. Wer sie öffnet, sieht den aktuellen Stand, nicht den von vorhin. Ein Funkloch löscht den letzten guten Stand nicht.

**Voraussetzung:** [Phase 1](./01-anmeldung.md) ist fertig, damit nach dem Start die Sitzung noch da ist. Die Uhr aus Phase 7 ist dafür nicht nötig. HTTPS ist nötig, sobald das Ausprobieren das eigene Notebook verlässt. Lokal reicht der Dev-Server für die Manifest-Prüfung.

**Warum die Phase breiter ist als „nur PWA“:** Der Alltagsfall ist eine feste Tour Mo–Fr, morgens und abends, im Winter mit Ausfällen. Die App wird auf dem Telefon kurz geöffnet und muss dann stimmen. Das hängt weniger an der Uhr als daran, dass beim Öffnen geprüft wird und dass ein Fehler nichts Gutes überschreibt. Siehe [API-Nutzung](../api-nutzung.md): ohne Uhr bleiben die Anfragen klein.

## Aufgaben

### A. PWA

1. Icons in den Größen, die Android und iOS für den Home-Bildschirm verlangen. Das Zeichen sind die Buchstaben RO.
2. Manifest und der iOS-Meta-Eintrag aus Phase 0 zeigen auf diese Icons, den Namen und `display: standalone`.
3. Ein kurzer Hinweis auf der angemeldeten Seite, wie man die App auf den Home-Bildschirm legt. Er lässt sich wegklicken, bleibt dann auf dem Gerät weg und verdeckt die Routen nicht. iOS hat keinen Installationsdialog.
4. Die Sitzung übersteht das Öffnen vom Home-Bildschirm. Besteht sie, öffnet sich die Routenliste. Sonst die Anmeldung.

### B. Beim Öffnen prüfen

5. Öffnet jemand eine Route, deren heutiger Stand älter ist als das Intervall (Standard 5 Minuten) und deren Zeitfenster gerade läuft, prüft die App einmal von selbst. Dasselbe Fenster wie bei der Uhr aus Phase 7.
6. Solange die Seite sichtbar ist, prüft sie im Intervall weiter. Sobald der Tab verdeckt ist oder das Telefon sperrt, hört sie auf. Beim Zurückkehren prüft sie sofort, wenn der Stand älter ist als das Intervall.
7. „Jetzt prüfen“ bleibt. Es prüft immer, auch im Intervall.
8. Die Anzeige sagt, wie alt der Stand ist („geprüft vor 3 min“) und dass gerade geprüft wird.

### C. Ein Fehler löscht nichts

9. Antwortet die Auskunft nicht oder ist die Echtzeit veraltet, bleibt der letzte gute Stand desselben Tages sichtbar, mit seiner Uhrzeit und dem Hinweis, dass die neue Prüfung nicht geklappt hat.
10. Ein neuer guter Stand ersetzt ihn. Ein Stand eines anderen Tages wird nie fortgeschrieben.

### D. Ausfälle verständlich machen (Folgeschritt, Entscheidung offen)

11. Bei „passt nicht“ steht der konkrete Grund: welcher Abschnitt ausfällt, welcher Anschluss reißt, um wie viele Minuten.
12. Statt einer Alternative bis zu drei, mit den Folgen (spätere Ankunft, mehr Umstiege).
13. Gibt es keine, die passt, steht die nächstbeste Verbindung mit ihrer Ankunft da, auch wenn sie die Vorgabe reißt.

### E. „Ich verlasse das Büro“

14. Eine Route hat entweder eine Ankunftsuhrzeit oder den Aufbruch per Knopf. Im Formular gibt es dafür eine Wahl.
15. Der Knopf „Ich verlasse das Büro“ steht auf der Route und im Schnellstart. Er speichert den Moment, sucht ab dann die nächsten Abfahrten und macht die erste, die passt, zur heutigen Verbindung.
16. Die Vorgabe prüft Umstiegszeit, Höchstzahl der Umstiege und Linie, nicht die Ankunft. Fällt die gewählte Fahrt aus, sucht die nächste Prüfung neu und die nächste passende wird die Alternative.
17. Vor dem Tippen prüft weder die App noch die Uhr diese Route. Ein Tippen von gestern gilt nicht.

Entscheidung dazu: [offene Fragen](../offene-fragen.md), Frage 7. Nicht hier: schnellste oder ruhigste Route, Weg zur Haltestelle.

### F. Eine Ankunftsuhrzeit pro Wochentag

Entfällt. Wer freitags früher fährt, legt eine eigene Route für Freitag an. Siehe [offene Fragen](../offene-fragen.md), Frage 8.

D ändert Texte und Alternativen und ist noch nicht gebaut. Es braucht echte Ausfall-Antworten der Auskunft.

## Fertig, wenn

- Auf einem Telefon liegt die App auf dem Home-Bildschirm und öffnet sich als eigene App.
- Anmeldung bleibt erhalten. Mit Sitzung öffnet sich die Routenliste, ohne sie die Anmeldung.
- Eine gespeicherte Route ist in dieser Ansicht sichtbar.
- Der Hinweis lässt sich wegklicken, ohne die Liste zu verdecken, und nach einem Neuladen weg bleibt.
- Das Icon die Buchstaben RO zeigt.
- Das Öffnen einer Route im Zeitfenster mit altem Stand löst eine Prüfung aus. Mit frischem Stand, außerhalb des Fensters oder an einem ausgelassenen Wochentag löst es keine aus.
- Bei verdeckter Seite läuft keine Prüfung. Beim Zurückkehren mit altem Stand eine.
- Eine fehlgeschlagene Prüfung lässt den letzten guten Stand desselben Tages stehen und zeigt, dass sie fehlschlug.
- Eine Route mit Aufbruch sucht erst nach dem Tippen, mit den Abfahrten ab diesem Moment, und prüft danach wie jede andere.

## Anmerkungen

- Push wird hier nicht eingebaut. Auf dem iPhone wäre die Voraussetzung dafür genau diese Installation, der Versand kommt erst unter [Später](./spaeter.md).
- Ein Service Worker ist für das Icon nicht nötig. Er kommt mit dem Push, nicht vorher. Das Prüfen im Sichtbaren (Aufgabe 6) läuft in der Seite, nicht im Service Worker.
- Das Icon ist ein einfaches Zeichen aus dem Namen, keine eigene Illustration.
- Die Uhr (Cron) ist für den Alltag nicht nötig, solange keine Meldung bei gesperrtem Telefon gebraucht wird. Der Code bleibt unverändert liegen.

## Bleibt liegen

Push, Offline-Fahrplan, Hintergrund-Abruf im Service Worker, Cron auf Vercel und Supabase.
