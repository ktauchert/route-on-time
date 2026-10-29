# Route on Time

Eine Person speichert Routen. Die App prüft, ob eine Verbindung an diesem Tag noch zur Vorgabe passt, und sucht bei einer Störung neu.

## Language

**Nutzer**:
Eine Person mit eigenem Zugang. Ihre Routen gehören nur ihr.
_Avoid_: User, Account

**Route**:
Die gespeicherte Strecke in einer Richtung, von einem Start zu einem Ziel, an bestimmten Wochentagen, mit einer Vorgabe. Der Rückweg ist eine eigene Route. Ein Feiertag gilt als sein Wochentag.
_Avoid_: Wache, Fahrt, Linie, Favorit, Trip, Hin- und Rückfahrt

**Vorgabe**:
Was auf dieser Route stimmen muss, damit sie passt. Eine Route setzt davon nur, was sie verlangt: Ankunft vor einer Uhrzeit, Mindestzeit beim Umstieg, Höchstzahl der Umstiege, eine bestimmte Linie, die heute gewählte Verbindung.
_Avoid_: Anspruch, Präferenz, Filter

**heutige Verbindung**:
Die Verbindung, die an diesem Tag für eine Route gewählt ist und weitergelesen wird.
_Avoid_: Trip, Fahrt

**Ort**:
Eine Haltestelle oder eine Adresse. Start und Ziel einer Route sind Orte.
_Avoid_: Stop

**Verbindung**:
Ein konkreter Weg von Start nach Ziel an einem Tag, zusammengesetzt aus Abschnitten.
_Avoid_: Journey, Itinerary

**Abschnitt**:
Ein Stück einer Verbindung, entweder ein Fußweg oder die Mitfahrt auf einer Fahrt. Er gilt als angetreten, solange die Uhr zwischen seiner Abfahrt und seiner Ankunft liegt.
_Avoid_: Leg, Teilstrecke

**Restweg**:
Der Teil einer Verbindung vom nächsten Halt oder vom Umstiegsort bis zum Ziel der Route, mit derselben Ankunftsuhrzeit.
_Avoid_: Teilstrecke, Rückweg

**Fahrt**:
Eine konkrete Durchführung eines Fahrzeugs auf einer Linie, mit eigenen Sollzeiten.
_Avoid_: Trip, Zug, Linie

**Linie**:
Ein benanntes Angebot wie die S2 oder der M29, über viele Fahrten hinweg.
_Avoid_: Route, Fahrt

**Vorschlag**:
Eine Verbindung, die die Suche für die Ankunftsuhrzeit einer Route geliefert hat. Liegt die Uhrzeit heute noch voraus, ist das heute. Sonst der nächste Wochentag, an dem die Route gilt.
_Avoid_: Kandidat, Treffer, Option

**Stand**:
Wie die Route gerade dasteht: passt, passt nicht oder unklar.
_Avoid_: Bewertung, Status, Alert

**passt**:
Die Verbindung, die für die Route zählt, erfüllt die Vorgabe. Das ist die heutige Verbindung, sonst der erste Vorschlag, der sie erfüllt.
_Avoid_: brauchbar, pünktlich, verfügbar

**passt nicht**:
Die Auskunft hat geantwortet, und keine Verbindung, die für die Route zählt, erfüllt die Vorgabe. Ist keine heutige Verbindung gewählt, zeigt die Liste dann ihren ersten Vorschlag und den Grund.
_Avoid_: nicht brauchbar, Verspätung, ausgefallen

**unklar**:
Die Echtzeitdaten reichen nicht, um zu entscheiden, ob die Route passt.
_Avoid_: nicht beurteilbar, unbekannt

**Störung**:
Eine Abweichung vom Fahrplan auf einer Fahrt oder an einem Ort: Verspätung, Ausfall, anderes Gleis, entfallener Halt, gesperrte Haltestelle.
_Avoid_: Alert, Meldung

**Aufbruch**:
Der Moment, in dem eine Person per Knopf meldet, dass sie jetzt losgeht. Eine Route mit Aufbruch hat keine Ankunftsuhrzeit. Die Suche beginnt mit der Abfahrt ab diesem Moment und gilt nur für diesen Tag.
_Avoid_: Start, Abfahrt, Check-in

**Alternative**:
Eine weitere Verbindung zur selben Ankunftsuhrzeit, nach den schon gesehenen Vorschlägen, die die Vorgabe erfüllt. Sie wird die heutige Verbindung.
_Avoid_: zweiter Vorschlag, Ausweichroute

**Auslastung**:
Wie voll ein Fahrzeug ist.
_Avoid_: Störung, Verspätung
