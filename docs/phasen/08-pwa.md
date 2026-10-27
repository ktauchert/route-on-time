# Phase 8 — PWA

**Ergebnis:** Die App lässt sich auf den Home-Bildschirm legen und öffnet sich ohne Browser-Leiste.

**Voraussetzung:** [Phase 1](./01-anmeldung.md) ist fertig, damit nach dem Start die Sitzung noch da ist. Die Uhr aus Phase 7 ist dafür nicht nötig. HTTPS ist nötig, sobald das Ausprobieren das eigene Notebook verlässt. Lokal reicht der Dev-Server für die Manifest-Prüfung.

## Aufgaben

1. Icons in den Größen, die Android und iOS für den Home-Bildschirm verlangen. Das Zeichen sind die Buchstaben RO.
2. Manifest und der iOS-Meta-Eintrag aus Phase 0 zeigen auf diese Icons, den Namen und `display: standalone`.
3. Ein kurzer Hinweis auf der angemeldeten Seite, wie man die App auf den Home-Bildschirm legt. Er lässt sich wegklicken, bleibt dann auf dem Gerät weg und verdeckt die Routen nicht. iOS hat keinen Installationsdialog.
4. Die Sitzung übersteht das Öffnen vom Home-Bildschirm. Besteht sie, öffnet sich die Routenliste. Sonst die Anmeldung.

## Fertig, wenn

- Auf einem Telefon liegt die App auf dem Home-Bildschirm und öffnet sich als eigene App.
- Anmeldung bleibt erhalten. Mit Sitzung öffnet sich die Routenliste, ohne sie die Anmeldung.
- Eine gespeicherte Route ist in dieser Ansicht sichtbar, sobald Phase 2 fertig ist.
- Der Hinweis lässt sich wegklicken, ohne die Liste zu verdecken, und nach einem Neuladen weg bleibt.
- Das Icon die Buchstaben RO zeigt.

## Anmerkungen

- Push wird hier nicht eingebaut. Auf dem iPhone wäre die Voraussetzung dafür genau diese Installation, der Versand kommt erst unter [Später](./spaeter.md).
- Ein Service Worker ist für das Icon nicht nötig. Er kommt mit dem Push, nicht vorher.
- Das Icon ist ein einfaches Zeichen aus dem Namen, keine eigene Illustration.

## Bleibt liegen

Push, Offline-Fahrplan, Hintergrund-Abruf im Service Worker.
