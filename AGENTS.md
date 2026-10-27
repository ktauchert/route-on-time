# Route on Time

Die App entsteht phasenweise. Die Reihenfolge steht in `docs/roadmap.md`, das Verhalten in `docs/phasen/`, die Wörter in `GLOSSARY.md`. Eine Phase pro Durchgang. Der Bau einer Phase startet nur, wenn er ausdrücklich verlangt wird.

## TDD

Produktionscode entsteht aus einem fehlschlagenden Test.

1. Einen Test schreiben, der das Verhalten der Aufgabe beschreibt und rot ist.
2. Den kleinsten Code schreiben, der ihn grün macht.
3. Aufräumen, ohne das Verhalten zu ändern.

Kein Produktionscode ohne einen Test, der ihn verlangt hat. Ein Test prüft Verhalten: Stand, Vorgabe, Suche, Zeilensicherheit, Texte. Er prüft keine Klassenstruktur. Auskunftsaufrufe im Test sind gestellt, nicht das echte HAFAS.

Werkzeug ist Vitest. `npm test` führt die Tests aus. `npm run lint` muss daneben grün sein.

Oberflächen prüft der Test, wo das Verhalten im Code liegt. Mobil- und Desktop-Layout, Paper und Stone, prüft danach der Browser, wie die Phase es unter „Fertig, wenn“ verlangt.

## CI

GitHub Actions liegt in `.github/workflows/ci.yml` und läuft bei Push und Pull Request. Sobald `package.json` existiert, führt der Lauf `npm ci`, `npm test` und `npm run lint` aus. Rot heißt, die Änderung ist nicht fertig.

Das Remote wird nicht hier angelegt. Die Adresse des GitHub-Repos kommt extra.
