# Route on Time

Die App entsteht phasenweise. Die Reihenfolge steht in `docs/roadmap.md`, das Verhalten in `docs/phasen/`, die Wörter in `GLOSSARY.md`. Eine Phase pro Durchgang. Der Bau einer Phase startet nur, wenn er ausdrücklich verlangt wird.

## Tickets und Branches

Jede Phase hat genau ein GitHub-Issue. Der Branch heißt wie die Phase, von `main`:

| Issue | Branch |
| --- | --- |
| [#1](https://github.com/ktauchert/route-on-time/issues/1) | `phase-0-geruest` |
| [#2](https://github.com/ktauchert/route-on-time/issues/2) | `phase-1-anmeldung` |
| [#3](https://github.com/ktauchert/route-on-time/issues/3) | `phase-2-route-anlegen` |
| [#4](https://github.com/ktauchert/route-on-time/issues/4) | `phase-3-vorschlaege` |
| [#5](https://github.com/ktauchert/route-on-time/issues/5) | `phase-4-stand` |
| [#6](https://github.com/ktauchert/route-on-time/issues/6) | `phase-5-alternative` |
| [#7](https://github.com/ktauchert/route-on-time/issues/7) | `phase-6-unterwegs` |
| [#8](https://github.com/ktauchert/route-on-time/issues/8) | `phase-7-uhr` |
| [#9](https://github.com/ktauchert/route-on-time/issues/9) | `phase-8-pwa` |

Ein Durchgang bearbeitet ein Issue auf seinem Branch. Der Pull Request geht nach `main` und nennt die Issue-Nummer. Der nächste Branch entsteht erst, wenn der vorherige in `main` ist. Kein zweites Issue auf demselben Branch.

## Gerüste

Ein neues Werkzeug beginnt mit seinem offiziellen Create- oder Init-Befehl. `package.json` wird nicht von Hand angelegt, und die Abhängigkeiten werden nicht zuerst mit einem nackten `npm install` hereingeholt. Die Befehle fragen die Entscheidungen ab und legen die Dateien an, die das Werkzeug erwartet.

Die App liegt in diesem Repo, nicht in einem Unterordner. Der Ordner enthält schon Docs. Trotzdem startet Next.js mit `npx create-next-app@latest .`. Danach shadcn mit `npx shadcn@latest init`, Basis `stone`. Vitest mit `npm create vitest@latest`. Spätere Werkzeuge genauso: Supabase über die CLI, shadcn-Komponenten über `npx shadcn@latest add`.

## TDD

Produktionscode entsteht aus einem fehlschlagenden Test.

1. Einen Test schreiben, der das Verhalten der Aufgabe beschreibt und rot ist.
2. Den kleinsten Code schreiben, der ihn grün macht.
3. Aufräumen, ohne das Verhalten zu ändern.

Kein Produktionscode ohne einen Test, der ihn verlangt hat. Ein Test prüft Verhalten: Stand, Vorgabe, Suche, Zeilensicherheit, Texte. Er prüft keine Klassenstruktur.

Die Fahrplanauskunft wird im Test durch eine eingesetzte Stellvertreterin ersetzt, nicht durch einen nachgebauten HAFAS-Server. `vbb-hafas` spricht die mobile Schnittstelle. Die ist kein Vertrag, den wir nachbauen. Der Browser ruft sie ohnehin nicht auf. Die Stellvertreterin liefert feste Fälle: pünktlich zur Ankunftsuhrzeit, Verspätung über die Uhrzeit hinaus, Ausfall, leere Liste, Fehler. Dieselben Fälle prüft der Stand. Ein Aufruf der echten Auskunft gehört in keinen Testlauf und nicht in die CI.

Werkzeug ist Vitest. `npm test` führt die Tests aus. `npm run lint` muss daneben grün sein.

Oberflächen prüft der Test, wo das Verhalten im Code liegt. Mobil- und Desktop-Layout, Paper und Stone, prüft danach der Browser, wie die Phase es unter „Fertig, wenn“ verlangt.

## CI

GitHub Actions liegt in `.github/workflows/ci.yml` und läuft bei Push und Pull Request. Sobald `package.json` existiert, führt der Lauf `npm ci`, `npm test` und `npm run lint` aus. Rot heißt, die Änderung ist nicht fertig.

Das Remote ist `https://github.com/ktauchert/route-on-time.git`. `main` ist der Stand, von dem die Phasen-Branches abgehen.
