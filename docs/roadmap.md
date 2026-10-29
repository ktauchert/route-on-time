# Roadmap

Jede Zeile ist eine Phase. Der Durchgang liest die verlinkte Datei und baut nur diese Phase. Stand 29. Oktober 2026: Phasen 0 bis 7 sind in `main`. Phase 8 ist im Bau, Teile A, B, C und E sind fertig, F entfällt, D (Ausfälle verständlich) ist offen.

| Phase | Ergebnis | Datei | Issue |
| --- | --- | --- | --- |
| 0 | Die App läuft lokal, mit Tailwind, shadcn/ui und einem PWA-Manifest. | [00 Gerüst](./phasen/00-geruest.md) | [#1](https://github.com/ktauchert/route-on-time/issues/1) |
| 1 | Anmeldung, Abmeldung, geschützte Seiten. | [01 Anmeldung](./phasen/01-anmeldung.md) | [#2](https://github.com/ktauchert/route-on-time/issues/2) |
| 2 | Eine Route mit Start, Ziel, Vorgabe und Wochentagen lässt sich speichern und löschen. | [02 Route anlegen](./phasen/02-route-anlegen.md) | [#3](https://github.com/ktauchert/route-on-time/issues/3) |
| 3 | Ein Knopf zeigt die Vorschläge der Auskunft für heute. | [03 Vorschläge](./phasen/03-vorschlaege.md) | [#4](https://github.com/ktauchert/route-on-time/issues/4) |
| 4 | Ein Knopf setzt den Stand: passt, passt nicht oder unklar. | [04 Stand](./phasen/04-stand.md) | [#5](https://github.com/ktauchert/route-on-time/issues/5) |
| 5 | Bei passt nicht erscheint eine neu gesuchte Alternative. | [05 Alternative](./phasen/05-alternative.md) | [#6](https://github.com/ktauchert/route-on-time/issues/6) |
| 6 | Eine angetretene Fahrt wird ab dem nächsten Halt neu gesucht. | [06 Unterwegs](./phasen/06-unterwegs.md) | [#7](https://github.com/ktauchert/route-on-time/issues/7) |
| 7 | Supabase Cron prüft fällige Routen, auch bei geschlossenem Tab. | [07 Uhr](./phasen/07-uhr.md) | [#8](https://github.com/ktauchert/route-on-time/issues/8) |
| 8 | Die App lässt sich auf den Home-Bildschirm legen, prüft beim Öffnen und behält bei Fehlern den letzten guten Stand. | [08 PWA](./phasen/08-pwa.md) | [#9](https://github.com/ktauchert/route-on-time/issues/9) |

Danach, erst wenn die Fragen dazu beantwortet sind: [Später](./phasen/spaeter.md).

Reihenfolge ist bindend. Phase 4 braucht gespeicherte Routen und funktionierende Vorschläge. Phase 7 braucht einen Stand, der von Hand schon stimmt, und eine erreichbare Next.js-URL. Phase 8 kann vor Phase 7 liegen, wenn das Ausprobieren auf dem Telefon vor der Uhr kommen soll. Dafür die Abhängigkeit in Phase 8 beachten: sie braucht keine Uhr.
