# Phase 5 — Alternative

**Ergebnis:** Steht der Stand auf passt nicht, zeigt die App eine andere Verbindung, die die Vorgabe erfüllt. Die kommt aus einer neuen Suche, nicht aus dem zweiten Treffer der ersten Liste.

**Voraussetzung:** [Phase 4](./04-stand.md) ist fertig, und der Stand passt nicht lässt sich an einer echten oder einer eng gesetzten Ankunftsuhrzeit sehen.

## Aufgaben

1. Wenn die fünf Vorschläge die Vorgabe nicht erfüllen, weitere Verbindungen zur selben Ankunftsuhrzeit holen, nach diesen fünf. Nicht ab jetzt und ohne die Uhrzeit. Ist die erste Liste leer, gibt es keine weitere Seite und keine Alternative.
2. Den ersten Treffer dieser weiteren Verbindungen, der die gesetzten Punkte der Vorgabe erfüllt, als Alternative zeigen: Linien, Abfahrt, Ankunft, Fußwege. Eine gesetzte Linie und eine Höchstzahl der Umstiege gelten dabei mit. Was die fünf schon verfehlt hat, ist kein Treffer.
3. Die Alternative wird die heutige Verbindung. Erfüllt auch die weitere Suche nichts, den Stand passt nicht lassen und sagen, dass keine Alternative da ist.
4. Die Alternative neben dem Stand speichern, in derselben Kurzfassung wie in Phase 4.

## Fertig, wenn

- Eine Route, deren erste Vorschläge die Ankunft verfehlen, eine Alternative zeigt, deren Ankunft die Uhrzeit hält, sofern die Auskunft eine solche Verbindung hat.
- Die gezeigte Alternative nicht einfach der zweite Eintrag der ersten Liste ist, wenn dieser die Vorgabe ebenfalls verfehlt.
- Bei passt keine Alternative gesucht wird.
- Die gezeigte Alternative danach die heutige Verbindung ist.

## Anmerkungen

- Beide Suchen können dieselben ausgefallenen Linien treffen. Dann ist „keine Alternative“ die richtige Auskunft.
- Diese Phase sucht weitere Verbindungen vom Start der Route zur selben Ankunftsuhrzeit. Den nächsten Halt einer angetretenen Fahrt nimmt Phase 6.

## Bleibt liegen

Suche ab dem nächsten Halt, Cron, Push.
