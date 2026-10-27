# Phase 0 — Gerüst

**Ergebnis:** Lokal läuft eine Next.js-App mit Tailwind, shadcn/ui und einem PWA-Manifest. Eine Seite zeigt den Namen der App. Es gibt noch keine Anmeldung und keine Auskunft.

**Voraussetzung:** Node auf dem Rechner. Kein Supabase-Konto nötig.

## Aufgaben

1. Next.js mit `npx create-next-app@latest` anlegen, in diesem Ordner. Vitest nach seiner Doku, nicht über `npm create vitest`. Der erste Test ist rot, bevor die Startseite den Namen zeigt. `npm test` und `npm run lint` erfüllen `.github/workflows/ci.yml`.
2. shadcn/ui mit `npx shadcn@latest init` einrichten, Basis `stone`, und eine erste Komponente mit `npx shadcn@latest add` einsetzen. Den shadcn-MCP erst danach anschließen, siehe [MCP](../mcp.md).
3. Eine Startseite mit dem Namen „Route on Time“.
4. Ein Web-App-Manifest mit diesem Namen, `start_url` und `display: standalone`, plus den Meta-Eintrag, den iOS für eine eigene App braucht. Icons folgen in [Phase 8](./08-pwa.md).
5. Oberflächensprache Deutsch und Englisch, beide in dieser Phase. Beim ersten Öffnen ist Deutsch aktiv. Ein Schalter liegt auf der Seite und wechselt die Sprache. Die Browsersprache ändert daran nichts. Die Wahl steht in einem Cookie auf dem Gerät und übersteht ein Neuladen. Sichtbarer Text liegt nicht fest verdrahtet in den Komponenten.
6. Die Themen Paper und Stone, wie in der [Oberfläche](../oberflaeche.md). Basis ist shadcn `stone`. Paper ist der helle Modus, Stone der dunkle. Beim ersten Öffnen folgt die Farbe dem Gerät. Ein Schalter neben der Sprache setzt sie fest. Dieselbe Startseite hat ein Mobil-Layout und ein Desktop-Layout.
7. `.env.example` mit leeren Namen für die späteren Supabase-Werte. `.env.local` steht in `.gitignore`.

## Fertig, wenn

- `npm run dev` die Startseite mit „Route on Time“ zeigt.
- Der Schalter stellt dieselbe Seite auf Englisch und wieder auf Deutsch.
- Nach einem Neuladen bleibt die gewählte Sprache. Eine englische Browsersprache stellt sie nicht zurück.
- Das Manifest vom Browser geladen wird.
- Die Seite Tailwind- und shadcn-Klassen wirklich nutzt, nicht nur die Pakete installiert hat.
- Unter 768 px und ab 768 px zwei verschiedene Anordnungen zu sehen sind.
- Paper und Stone sich umschalten lassen und ein Neuladen die Wahl behält.

## Anmerkungen

- Das Supabase-Projekt wird von Hand im Dashboard angelegt, nicht über ein MCP-Konto-Werkzeug. URL und öffentlicher Schlüssel werden für Phase 1 gebraucht.
- Der User-Agent heißt bis zum ersten Auskunftsaufruf nur `route-on-time`. Die Kontaktadresse kommt vor Phase 2 dazu. Versendet wird er dort.
- Die Bausteine bleiben shadcn. Anordnung und die beiden Themen stehen in der [Oberfläche](../oberflaeche.md). Der Schnellstart kommt mit den Routen in Phase 2.

## Bleibt liegen

Anmeldung, Datenbank, Haltestellensuche, Vorschläge, Stand, Cron, Icons, Push.
