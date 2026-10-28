# Phase 1 — Anmeldung

**Ergebnis:** Der Eigentümer kann sich mit E-Mail und Passwort registrieren, anmelden und abmelden. Ohne Sitzung ist die geschützte Seite nicht erreichbar.

**Voraussetzung:** [Phase 0](./00-geruest.md) ist fertig. Ein Supabase-Projekt in Frankfurt (eu-central-1) existiert. URL und öffentlicher Schlüssel liegen in `.env.local`. Der Supabase-MCP ist auf dieses Projekt beschränkt, mit den Gruppen `database`, `debugging`, `development`, `docs`. Siehe [MCP](../mcp.md).

## Aufgaben

1. `@supabase/supabase-js` und `@supabase/ssr` so einbinden, dass die Sitzung über Cookies in Server Components ankommt.
2. Seiten zur Anmeldung und zur Registrierung, auf Deutsch und Englisch. Die Registrierung verlangt E-Mail, Passwort und eine Wiederholung.
3. Eine geschützte Seite, die nur zeigt, dass eine Sitzung besteht, plus Abmelden und den Sprachschalter. Ohne Sitzung führt der Weg zur Anmeldung.
4. Abmelden beendet die Sitzung und führt zur Anmeldung zurück.
5. Eine fehlgeschlagene Anmeldung sagt nur, dass E-Mail oder Passwort nicht stimmt, auf beiden Sprachen. Sie verrät nicht, ob die Adresse existiert.
6. In Supabase die E-Mail-Anmeldung einschalten und die Mail-Bestätigung aus lassen. Ein vergessenes Passwort wird im Dashboard zurückgesetzt, nicht in der App.

## Fertig, wenn

- Anmelden, Registrieren und Abmelden funktionieren, sobald das Supabase-Projekt verbunden ist.
- Die geschützte Seite ohne Sitzung auf die Anmeldung führt und noch keine Route anbietet.
- Eine falsche Anmeldung verrät nicht, ob die E-Mail bekannt ist.
- Ein zweiter Browser ohne Sitzung dieselbe geschützte Seite nicht sieht.
- Im Client-Bundle liegt nur der öffentliche Schlüssel, nicht der Service-Role-Schlüssel.

## Anmerkungen

- Noch keine Tabelle für Routen. Zeilensicherheit kommt mit den Daten in Phase 2.
- Passwort zurücksetzen und Magic Link gibt es in der App nicht. Beides bleibt auch dann draußen, wenn später weitere Personen dazukommen. Bis dahin setzt das Dashboard das Passwort zurück.

## Bleibt liegen

Routen, Auskunft, Stand, Cron, Push.
