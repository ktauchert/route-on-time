# Später

Diese Punkte haben noch keine Phase. Der erste benutzbare Stand ist mit Phase 8 zu Ende. Was hier steht, ist bewusst danach.

| Thema | Wann es drankommt |
| --- | --- |
| Meldung bei gesperrtem Telefon | Nach Phase 8. Auf dem iPhone nur aus der installierten App, jede Nachricht muss sichtbar sein. Der erste Stand zeigt den Stand in der offenen App. |
| Offizielle VBB-API statt `vbb-hafas` | Sobald der Testzugang da ist und die Nutzungsregeln gelesen sind. Der Server-Aufruf bleibt, der Schlüssel wechselt. Das ist die noch offene Frage in [offene Fragen](../offene-fragen.md). |
| Weitere Personen | Wenn jemand außer dem Eigentümer sich anmelden soll. Konto löschen löscht die Routen. `vbb-hafas` ist dann die falsche Dauerlösung. |
| GTFS-RT als gemeinsame Echtzeitquelle | Wenn viele Routen dieselben Fahrten teilen und die Kennungen aus demselben Sollfahrplan kommen. Der Feed hat seit dem 4. Juni 2026 Lücken. Siehe [Machbarkeit](../machbarkeit.md) und [ADR 0002](../adr/0002-eine-auskunft-fuer-suche-und-echtzeit.md). |
| Andere Verbünde, Fernverkehr | Der erste Stand bleibt beim VBB. Jeder weitere Verbund ist eine weitere Auskunft. |
| Auslastung | Es gibt keine einheitliche Live-Quelle im VBB. Siehe [Machbarkeit](../machbarkeit.md). |
| Eigener Rechenweg auf GTFS Static | Wenn die Auskunft wegfällt. Siehe [Prototyp](../prototyp.md). |
| Weg zur Startstation und von der Zielstation | Nach dem ersten Alltag mit dem Aufbruch-Knopf. Der Nutzer gibt die Gehzeit von zu Hause oder vom Büro zur Haltestelle an, einmal pro Route. Die Suche ändert sich nicht, die Ankunftsuhrzeit bleibt die Grenze. Die Anzeige sagt, wann man losgehen muss: Abfahrt minus Gehzeit. Beim Aufbruch per Knopf suchen die Abfahrten erst ab jetzt plus Gehzeit. |
| Schnellste oder ruhigste Route, Auslastung | Wenn die Auskunft Auslastung liefert und der Alltag zeigt, was „ruhig“ heißt. „Entspannt“ ist der erste Schritt. |
| Adressen statt nur Haltestellen | Wenn Haltestellen-Routen sitzen. |

Ein MCP, über den Nutzer ihre eigenen Routen an einen Agenten geben, gehört ebenfalls hierher und nicht in den Bau. Siehe [MCP](../mcp.md).
