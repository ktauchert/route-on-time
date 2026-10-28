# Reise durch die Oberfläche

Stand der Gestaltung nach Issue [#18](https://github.com/ktauchert/route-on-time/issues/18). Die Entscheidungen stehen in [ADR 0010](./adr/0010-lesespalte.md) (Spalte) und [ADR 0011](./adr/0011-signalfarbe.md) (Signalfarbe). Paper und Stone bleiben die beiden Themen. Neu sind Anordnung, Hierarchie und eine einzige Akzentfarbe.

## Ausgangslage

- Auf dem Desktop lief der Inhalt über die ganze Fensterbreite.
- Löschen war auf der Bearbeiten-Seite größer als Speichern und Abbrechen.
- „Du bist angemeldet.“ stand als Satz über jeder Seite und schob den Inhalt nach unten. Abmelden und Einstellungen hatten keinen festen Ort.
- Fast alles war gleich gewichtet: Text, Knöpfe und Karten in derselben Schriftgröße, derselben Farbe, ohne Überschriften.
- `/` schickte Gäste sofort zur Anmeldung, ohne zu sagen, wofür die App da ist.
- Eine Verbindung war eine Folge von Zeilen. Abfahrt, Ankunft und Dauer waren nicht auf einen Blick zu sehen.

## Vorbilder

Angesehen wurden gängige Muster aktueller Verkehrs- und Produkt-Apps, keine einzelne App als Vorlage:

- **Zeit zuerst.** Auskunfts-Apps setzen Abfahrt → Ankunft groß und in gleich breiten Ziffern, die Abschnitte klein darunter. Das übernehmen wir.
- **Ruhige Oberfläche, ein Akzent.** Warme Neutraltöne, eine einzige Akzentfarbe für die nächste Handlung und für den Fortschritt. Status bekommt eigene, gedämpfte Farben in kleinen Pillen, keine Flächen.
- **Karten mit weichem Rand.** Großer Radius, feiner Rand, kaum Schatten. Die ganze Karte ist anklickbar.
- **Kopfzeile, die bleibt.** Schmal, oben angeheftet, leicht durchscheinend. Marke links, Navigation und Schalter rechts.
- **Landing mit Hero.** Große, ausgeglichene Überschrift, ein Satz darunter, zwei Knöpfe, daneben eine Vorschau der App selbst statt einer Illustration. Darunter drei Schritte und ein Abschluss mit derselben Handlung.

## Grundsätze

1. **Eine Handlung pro Ansicht ist kräftig.** Registrieren auf der Landing, Anmelden auf der Anmeldung, Jetzt prüfen auf der Route, Speichern im Formular, Neue Route in der Liste. Alles andere ist umrandet oder ein Geisterknopf.
2. **Löschen ist leise.** Ein Geisterknopf in Grau, der erst beim Zeigen rot wird, am Ende der Reihe. Die Rückfrage erscheint in derselben Reihe und bietet Behalten und Wirklich löschen.
3. **Der Stand spricht zuerst.** Auf der Karte und auf der Route steht die Stand-Pille oben rechts beziehungsweise ganz oben, vor allem anderen.
4. **Zeiten sind Ziffern gleicher Breite.** `tabular-nums` überall, wo Uhrzeiten oder Minuten stehen, damit Spalten nicht springen.
5. **Nichts läuft im Browser.** Fortschritt und „Abfahrt in … min“ entstehen beim Laden der Seite. Ab einer Stunde heißt es „Abfahrt in 10 h 10 min“.
6. **Lesbare Breite.** Höchstens 1280 px für den Rahmen, darin schmalere Spalten für Text und Formulare.

## Gestaltung

### Farben

Die shadcn-Basis `stone` bleibt. Dazu kommt eine Signalfarbe, ein ruhiges Blau, siehe ADR 0011.

| Rolle | Paper | Stone | Wofür |
| --- | --- | --- | --- |
| `signal` | Blau, dunkel genug für weiße Schrift | Blau, hell genug auf dunklem Grund | Hauptknopf, Fortschritt, Fokusring, nächste Abfahrt, heutige Verbindung, Marke |
| `fits` | gedämpftes Grün | helles Grün | passt |
| `miss` | gedämpftes Rot | helles Rot | passt nicht |
| `unclear` | gedämpftes Amber | helles Amber | unklar, Alternative |
| `destructive` | aus `stone` | aus `stone` | Löschen |

Die Standfarben stehen als Text auf 15 % ihrer eigenen Farbe. Ein Punkt in voller Farbe steht vor dem Wort. Farbe ist nie das einzige Zeichen: das Wort steht immer daneben.

### Schrift

Geist für alles. Überschriften `font-semibold tracking-tight`, Seitenüberschrift `text-2xl`, Abschnitte `text-base`. Hilfstexte `text-sm text-muted-foreground`. Uhrzeiten in Vorschlägen `text-lg font-semibold tabular-nums`.

### Flächen und Abstände

- Grund: `background` (Paper: warmes Off-White, Stone: dunkles Ende).
- Karten: `bg-card`, `rounded-2xl`, `border`, `shadow-xs`, Innenabstand 1 rem, ab 768 px 1.25 rem.
- Abstand zwischen Abschnitten 2 rem, innerhalb eines Abschnitts 0.75–1 rem.
- Kopfzeile: `sticky top-0`, `border-b`, `bg-background/80` mit `backdrop-blur`.

### Bausteine

| Baustein | Aussehen |
| --- | --- |
| Kopfzeile | Marke mit kleinem Signalpunkt. Angemeldet: Routen, Einstellungen, Abmelden. Daneben English/Deutsch und ein Paar Paper/Stone. |
| Stand-Pille | Punkt + Wort, `rounded-full`, `text-xs font-medium`. |
| Fortschritt | Beschriftung „Unterwegs“ links, Prozent rechts, Balken in `signal` auf `muted`. |
| Routenkarte | Name, Stand-Pille rechts. Darunter Ankunft und Wochentage. Darunter Abfahrt in … min oder Fortschritt. Löschen klein unten rechts. |
| Vorschlagskarte | `07:58 → 08:41` groß, Dauer und Umstiege daneben, Abschnitte darunter mit Linie als kleiner Plakette. |
| Heutige Verbindung | Karte mit Signalrand und Plakette „Heutige Verbindung“. |
| Alternative | Karte mit Amberrand und Überschrift „Alternative“. |
| Formular | Abschnitte „Strecke“, „Vorgabe“, „Wochentage“. Knopfreihe darunter: Speichern, Abbrechen, Löschen. |
| Schnellstart | Runder Knopf unten rechts, nur unter 768 px, mit Schatten. Das Menü öffnet darüber als Karte. |

## User-Journeys

### 1. Gast lernt die App kennen

1. Öffnet `/` auf dem Handy. Sieht Marke, Überschrift, einen Satz und zwei große Knöpfe untereinander, wie ein Startbildschirm.
2. Auf dem Desktop sieht er daneben eine Vorschau einer Routenkarte mit Stand und Fortschritt, darunter drei Schritte und einen Abschluss.
3. Tippt Registrieren. Die Anmeldeseiten sind eine schmale Karte in der Mitte, mit Überschrift und dem Weg zur jeweils anderen Seite.

### 2. Pendlerin legt ihre erste Route an

1. Nach der Anmeldung: Liste mit Überschrift „Routen“ und einem leeren Zustand, der direkt zu Neue Route führt. Auf dem Handy auch über den Schnellstart.
2. Formular in drei Abschnitten. Start und Ziel suchen, Treffer erscheinen als Liste, die Auswahl als Häkchen-Zeile.
3. Speichern führt zur Liste. Die Karte zeigt Name, Ankunft und Wochentage.

### 3. Morgens vor dem Losgehen

1. Öffnet die App, `/` führt angemeldet direkt zur Liste.
2. Die Karte mit der nächsten Abfahrt ist mit Signalrand markiert und sagt „Nächste Abfahrt“ und „Abfahrt in 12 min“. Die Pille sagt passt.
3. Bei passt nicht öffnet sie die Route. Oben stehen Stand und Grund, darunter die Alternative mit Amberrand. Sie wählt sie als heutige Verbindung.

### 4. Unterwegs

1. Die Karte in der Liste zeigt statt der Minuten den Fortschritt der laufenden Verbindung.
2. Auf der Route liegt der Fortschritt direkt unter dem Stand. „Restweg ab …“ nennt den Halt, ab dem neu gesucht wurde.

### 5. Einstellungen

Über die Kopfzeile erreichbar. Eine Karte mit dem Intervall und einem Satz dazu.

## Wireframes

### Landing

Mobil, unter 768 px:

```
┌──────────────────────────────┐
│ ● Route on Time   EN  P│S    │
├──────────────────────────────┤
│                              │
│  FÜR BAHN UND BUS IM VBB     │
│                              │
│  Kommst du noch              │
│  rechtzeitig an?             │
│                              │
│  Route on Time prüft deine   │
│  Routen gegen die Echtzeit.  │
│                              │
│                              │
│ ┌──────────────────────────┐ │
│ │       Registrieren       │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │         Anmelden         │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

Desktop, ab 768 px, innerhalb von 1280 px:

```
┌───────────────────────────────────────────────────────────────────┐
│ ● Route on Time                                English  Paper│Stone│
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  FÜR BAHN UND BUS IM VBB          ┌─────────────────────────────┐ │
│                                   │ Zur Arbeit          ● passt │ │
│  Kommst du noch                   │ Ankunft 08:45 · Mo–Fr       │ │
│  rechtzeitig an?                  │ Abfahrt in 12 min           │ │
│                                   ├─────────────────────────────┤ │
│  Route on Time prüft deine        │ Heimweg       ● passt nicht │ │
│  Routen gegen die Echtzeit …      │ Unterwegs              40 % │ │
│                                   │ █████████░░░░░░░░░░░░░░░░░░ │ │
│  [ Registrieren ]  [ Anmelden ]   └─────────────────────────────┘ │
│                                                                   │
│  So funktioniert es                                               │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐            │
│  │ 1 Route       │ │ 2 Stand       │ │ 3 Unterwegs   │            │
│  │ anlegen       │ │ prüfen        │ │ weiter        │            │
│  └───────────────┘ └───────────────┘ └───────────────┘            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Leg deine erste Route an.                  [ Registrieren ] │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

### Anmelden und Registrieren

```
┌──────────────────────────────┐
│ ● Route on Time   EN  P│S    │
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │ Anmelden               │  │
│  │ Schön, dass du da bist.│  │
│  │ E-Mail                 │  │
│  │ [                    ] │  │
│  │ Passwort               │  │
│  │ [                    ] │  │
│  │ [      Anmelden      ] │  │
│  │ Registrieren           │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### Routenliste

Mobil und Desktop, Spalte etwa 42 rem:

```
┌────────────────────────────────────────────────────────────┐
│ ● Route on Time   Routen  Einstellungen  Abmelden  EN  P│S │
├────────────────────────────────────────────────────────────┤
│  Routen                                    [ Neue Route ]  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ NÄCHSTE ABFAHRT                                      │  │
│  │ Zur Arbeit                                 ● passt   │  │  ← Signalrand
│  │ Ankunft 09:00 · Mo Di Mi Do Fr                       │  │
│  │ Abfahrt in 25 min                          Löschen   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Griebnitzsee → Spandau               ● passt nicht   │  │
│  │ Ankunft 19:00 · Mo Di Mi Do Fr                       │  │
│  │ Unterwegs                                     40 %   │  │
│  │ ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  │
│  │                                            Löschen   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                              ( Schnellstart )  ← nur mobil
└────────────────────────────────────────────────────────────┘
```

Leer:

```
┌──────────────────────────────────────────────────────┐
│ Noch keine Route.                                    │
│ Leg eine Route an, dann prüft die App sie für dich.  │
│ [ Neue Route ]                                       │
└──────────────────────────────────────────────────────┘
```

### Route

Mobil, eine Spalte: zuerst Prüfung, dann Formular.

```
← Routen
Zur Arbeit
Alex → Zoo · Ankunft 09:00

┌────────────────────────────┐
│ ● passt      [Jetzt prüfen]│
│ Gesucht für Montag, …      │
│ Geprüft um 07:00           │
│ Unterwegs             40 % │
│ ███████░░░░░░░░░░░░░░░░░░░ │
└────────────────────────────┘
┌────────────────────────────┐  ← Signalrand
│ HEUTIGE VERBINDUNG         │
│ 07:58 → 08:41   43 min · 1×│
│ S7  07:58 → 08:20  Alex → …│
│ Umstieg 4 min              │
│ U2  08:24 → 08:41  …       │
└────────────────────────────┘
┌────────────────────────────┐
│ 08:08 → 08:51   43 min · 1×│
│ …                          │
│ [Als heutige Verbindung]   │
└────────────────────────────┘

Route bearbeiten
┌────────────────────────────┐
│ Strecke · Vorgabe · Tage   │
└────────────────────────────┘
[Speichern] [Abbrechen] [Löschen]
```

Desktop, ab 1024 px, zwei Spalten in 1280 px: links die Prüfung, rechts das Formular.

```
┌───────────────────────────────────────────────────────────────────┐
│ ← Routen                                                          │
│ Zur Arbeit                                                        │
│ Alex → Zoo · Ankunft 09:00                                        │
│                                                                   │
│ ┌────────────────────────────────────┐  ┌───────────────────────┐ │
│ │ ● passt             [Jetzt prüfen] │  │ Route bearbeiten      │ │
│ │ Gesucht für … · Geprüft um 07:00   │  │ Strecke               │ │
│ └────────────────────────────────────┘  │  Name, Start, Ziel    │ │
│ ┌────────────────────────────────────┐  │ Vorgabe               │ │
│ │ Alternative            (Amberrand) │  │  Ankunft, Umstieg …   │ │
│ └────────────────────────────────────┘  │ Wochentage            │ │
│ ┌────────────────────────────────────┐  │ [Speichern][Abbrechen]│ │
│ │ 07:58 → 08:41   43 min · 1 Umstieg │  │            [Löschen]  │ │
│ └────────────────────────────────────┘  └───────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### Knopfreihe im Formular

```
[ Speichern ]  [ Abbrechen ]                    Löschen
                                 nach Tipp:  Diese Route löschen? [ Wirklich löschen ]
```

### Einstellungen

```
Einstellungen
┌────────────────────────────┐
│ Intervall                  │
│ [ 15 ]                     │
│ Minuten zwischen den …     │
│ [Speichern] [Routen]       │
└────────────────────────────┘
```

## Entscheidungen

| Frage | Entscheidung | Warum |
| --- | --- | --- |
| Breite | Rahmen 1280 px, Text und Liste etwa 42 rem | lesbare Zeilen, siehe ADR 0010 |
| Akzent | eine Signalfarbe, Blau | grenzt sich von Grün, Rot und Amber des Stands ab, siehe ADR 0011 |
| Angemeldet-Hinweis | entfällt, Navigation in der Kopfzeile | die Kopfzeile mit Abmelden zeigt die Sitzung |
| Landing | Gast sieht Hero und zwei Knöpfe, Desktop zusätzlich Vorschau, drei Schritte, Abschluss | auf dem Handy ein Startbildschirm, auf dem Desktop Platz für den Zweck |
| Hauptknopf Landing | Registrieren | wer `/` als Gast öffnet, hat meist noch keinen Zugang |
| Nächste Abfahrt | die Karte mit den wenigsten Minuten bis zur Abfahrt bekommt Signalrand und Plakette | der Morgenblick sucht genau diese eine Route |
| Route auf dem Desktop | zwei Spalten ab 1024 px | Prüfung und Formular gleichzeitig, ohne Scrollen, wie ADR 0009 nebeneinander beschreibt |
| Vorschläge | Zeiten zuerst, Abschnitte darunter | so lesen Auskunfts-Apps |
| Löschen | Geisterknopf, grau, beim Zeigen rot, am Ende der Reihe; die Rückfrage bietet Behalten | gefährliche Handlung ohne Gewicht, Rückfrage bleibt |
| Sprachschalter | lädt die Seite vom Server neu | vorher wechselte nur der Schalter selbst die Sprache |
| Laufende Zeit | keine | Fortschritt und Minuten werden beim Laden berechnet |
