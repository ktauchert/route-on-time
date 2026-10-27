# MCPs

Geprüft am 27. Oktober 2026. In dieser Session ist kein externes MCP verbunden, nur die eingebauten Cursor-Werkzeuge. Im Projekt liegt keine `.cursor/mcp.json`. Auf diesem Rechner liegt für andere Projekte ein Sanity-Server. Der hat mit Routen und Fahrplänen nichts zu tun.

Es gibt keinen MCP für VBB, HAFAS oder GTFS. Die Auskunft bleibt eine Server-Bibliothek.

## Anschließen

### shadcn, ab Phase 0

Lädt Komponenten aus der shadcn-Registry in das Projekt, statt sie von Hand nachzubauen.

Sobald `components.json` existiert, in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

Das ist der Server aus der shadcn-Doku (`npx shadcn@latest mcp`). Der kostenpflichtige Server unter shadcn.io ist eine andere Quelle und bleibt aus.

Doku: <https://ui.shadcn.com/docs/mcp>

### Supabase, ab Phase 1

Legt Tabellen an, zeigt das Schema, erzeugt TypeScript-Typen und liest Logs. Das ist der Server, mit dem die App gebaut wird: `https://mcp.supabase.com/mcp`.

Erst anschließen, wenn das Projekt existiert. Dann auf dieses eine Projekt begrenzen und die Werkzeuggruppen auf das beschränken, was die Phasen brauchen: `database`, `debugging`, `development`, `docs`.

```text
https://mcp.supabase.com/mcp?project_ref=PROJEKT_REF&features=database,debugging,development,docs
```

`project_ref` schaltet die Konto-Werkzeuge ab, also auch das Anlegen weiterer Projekte. Edge Functions, Storage und Branching bleiben aus: die Prüfung läuft in Next.js, Datei-Speicher braucht der Prototyp nicht, Branching ist ein Bezahl-Tarif.

`execute_sql` und `apply_migration` können Daten löschen. Bestätigungen dafür nicht abschalten.

Schlüssel und das Datenbank-Passwort gehören nicht in den Chat und nicht in die MCP-URL. Die Anmeldung am Server läuft über den Browser-Login von Supabase.

Doku: <https://supabase.com/docs/guides/ai-tools/mcp>

Neben dem MCP gibt es Supabase Agent Skills (`npx skills add supabase/agent-skills`). Das sind Anleitungen für den Agenten, kein zweiter Server. Sinnvoll ab Phase 1, zusammen mit dem MCP.

## Nicht anschließen

- **Ein MCP, den die App selbst ihren Nutzern anbietet** (`@supabase/server`, Edge Function als MCP). Damit würde ein fremder Agent die gespeicherten Routen lesen. Das ist ein späteres Produkt, kein Bauwerkzeug.
- **Supabase Edge Functions über den MCP deployen.** Die Fahrplanprüfung liegt in Next.js auf Node. [ADR 0004](./adr/0004-nextjs-und-supabase.md)
- **Sanity.** Liegt in anderen Projekten auf diesem Rechner, hat hier keine Daten.
- **Konto-Werkzeuge von Supabase** (`create_project`, Pausieren, Organisationen). Das Projekt wird von Hand im Dashboard angelegt.

## Browser

Eine Oberflächen-Phase gilt erst als fertig, wenn der Ablauf im Browser durchgespielt ist. Dafür ist in dieser Session kein Browser-MCP verbunden. Solange das so bleibt, prüft der Durchgang über den laufenden Dev-Server und sagt, was er im Browser nicht selbst geklickt hat. Kommt später ein Browser-MCP dazu, nutzen ihn die Phasen 0 bis 6 und 8.
