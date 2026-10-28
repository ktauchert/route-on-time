# Reise durch die Oberfläche

Stand der Gestaltung nach der Lesespalte. Die Entscheidung dazu steht in [ADR 0010](./adr/0010-lesespalte.md). Paper und Stone bleiben. Neu ist die Anordnung, nicht eine dritte Farbe.

## Was sich anfühlt

Eine Fahrplanauskunft ist ruhig, bis der Stand eine Farbe braucht. Passt ist ein gedämpftes Grün, passt nicht ein gedämpftes Rot, unklar ein gedämpftes Amber. Die Farbe sitzt in einer kleinen Pille, nicht als Flächenfüllung. Der einzige kräftige Knopf einer Ansicht ist die nächste Handlung: Anmelden, Speichern oder Jetzt prüfen. Löschen ist klein und liegt in derselben Reihe wie Speichern und Abbrechen.

Fortschritt und „Abfahrt in … Minuten“ entstehen beim Laden der Seite. Es gibt keine laufende Uhr im Browser.

## Reise

1. Gast öffnet `/`. Auf dem Handy stehen Satz und zwei Knöpfe. Auf dem Desktop kommt dazu, wofür die App da ist.
2. Registrieren oder Anmelden, jeweils eine schmale Spalte.
3. Die Liste zeigt jede Route als Karte: Name, Ankunft, Stand, und wenn eine Prüfung eine Abfahrt kennt, die Minuten bis dahin oder den Fortschritt der laufenden Fahrt.
4. Neue Route oder eine Karte öffnen. Die Prüfung steht oben, das Formular darunter, beide in der schmalen Spalte.
5. Jetzt prüfen. Vorschläge sind Karten. Eine gewählte Verbindung und eine Alternative sind bezeichnet. Läuft die Fahrt, liegt der Fortschritt über dem Stand.
6. Einstellungen bleiben eine kurze Seite für das Intervall.

Angemeldet öffnet `/` die Liste, nicht die Landing. Das gilt auch später für das Symbol auf dem Home-Bildschirm.

## Wireframes

Mobil, Landing:

```
Route on Time          English  Paper Stone

Sieh, ob deine
Verbindung noch zur
Vorgabe passt.

[ Anmelden ]  [ Registrieren ]
```

Desktop, Landing, innerhalb von 1280 px:

```
Route on Time                         English  Paper Stone

Sieh, ob deine Verbindung          Eine Richtung, eine Vorgabe.
noch zur Vorgabe passt.            Der Stand: passt, passt nicht, unklar.
[ Anmelden ] [ Registrieren ]      Unterwegs ab dem nächsten Halt.
```

Mobil und Desktop, Liste, Spalte etwa 42 rem:

```
Neue Route

┌─────────────────────────────────────┐
│ zur Arbeit                  Löschen │
│ Ankunft 19:00                       │
│ passt                               │
│ Abfahrt in 25 min                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Griebnitzsee → Spandau      Löschen │
│ Ankunft 19:00                       │
│ passt                               │
│ Unterwegs                      40%  │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────┘
```

Prüfung, Knopfleiste:

```
[ Speichern ]  [ Abbrechen ]  [ Löschen ]
```
