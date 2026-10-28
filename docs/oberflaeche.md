# Oberfläche

Zwei Layouts und zwei Farbthemen. Das Mobil-Layout ist keine dritte Farbgebung. Es ist die Ansicht unter 768 px Breite. Ab 768 px gilt das Desktop-Layout. Beide nutzen shadcn/ui und Tailwind. Die Bausteine sind dieselben, die Anordnung nicht.

Einzelheiten der Phasen bleiben in den Phasendateien. Diese Seite hält, was jede Phase einhält.

## Layouts

**Mobil.** Eine Spalte. Die Routenliste ist eine eigene Ansicht, eine Route eine weitere. Der Sprach- und der Themenschalter liegen oben.

**Desktop.** Die Übersicht zeigt die Routen als Liste. Anlegen und Bearbeiten sind eigene Seiten und nutzen dasselbe Formular. Anmeldung bleibt eine einzelne Spalte in der Mitte.

Eine Phase, die eine Ansicht verändert, liefert beide Layouts mit.

## Themen

Zwei Themen, eine shadcn-Basis: `stone`. Paper und Stone sind die Namen der beiden Modi, keine zweite Bibliothek.

**Paper** ist der helle Modus. Der Grund ist das helle Ende der Stone-Skala, ein warmes Off-White. Die Schrift ist dunkle Tinte aus derselben Skala.

**Stone** ist der dunkle Modus. Der Grund ist das dunkle Ende derselben Skala.

Beim ersten Öffnen folgt die App der Einstellung des Geräts. Ein Schalter neben dem Sprachschalter setzt Paper oder Stone fest. Die Wahl bleibt auf dem Gerät, im selben Sinne wie die Sprache, und ist kein Feld am Nutzer. Anders als die Sprache darf die Geräteeinstellung den ersten Blick bestimmen.

## Schnellstart

Nur im Mobil-Layout, über der unteren rechten Ecke. Ein Tipp öffnet:

- **Neue Route**
- jede Route, die heute gilt, mit Name oder Start und Ziel

Ein Tipp auf eine heutige Route öffnet sie. Ab Phase 4 startet derselbe Eintrag „Jetzt prüfen“ für diese Route. Gilt heute keine Route, bleibt nur Neue Route.

Das Desktop-Layout hat keinen Schnellstart. Liste und geöffnete Route liegen nebeneinander.
