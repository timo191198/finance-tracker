# Finance Tracker MVP

Eine einfache lokale Web-App zum manuellen Erfassen und Auswerten von Einnahmen und Ausgaben.

## Wie starte ich die App?

Öffne die Datei `index.html` direkt im Browser.

Alternativ kannst du im Projektordner einen einfachen lokalen Server starten, zum Beispiel:

```bash
python3 -m http.server 8000
```

Danach öffnest du `http://localhost:8000`.

## Wie benutze ich die App?

1. Im Tab **Neue Buchung** Betrag, Typ, Kategorie, Beschreibung und Datum eintragen.
2. Auf **Buchung speichern** klicken.
3. Im Tab **Dashboard** den Zeitraum über **Von** und **Bis** auswählen.
4. Die Übersicht zeigt Einnahmen, Ausgaben und Saldo.
5. Im Analysebereich kannst du zwischen Ausgaben und Einnahmen wechseln, Kategorien im Donut-Diagramm anklicken und einzelne Buchungen in der Detailkarte löschen.

## Backup und Import

Über den Bereich **Daten sichern** kannst du mit **Backup exportieren** eine JSON-Datei herunterladen. Sie enthält Buchungen, Kategorien und einfache App-Einstellungen.

Mit **Backup importieren** kannst du eine zuvor exportierte JSON-Datei wieder einlesen. Vor dem Import erscheint eine Sicherheitsabfrage, weil der Import die aktuellen lokalen Daten ersetzt.

## PDF-Report

Im Bereich **Daten sichern** erstellt **Report als PDF herunterladen** einen Bericht für den aktuell im Dashboard gewählten Zeitraum.

Der Report enthält Übersichtswerte, Einnahmen und Ausgaben nach Kategorie sowie alle Einzelbuchungen im Zeitraum. Er wird komplett im Browser erzeugt und als PDF-Datei heruntergeladen.

## Neue Kategorien hinzufügen

Im Tab **Neue Buchung** befindet sich neben dem Feld **Kategorie** ein kleiner `+`-Button. Darüber kannst du eine neue Kategorie anlegen.

Leere Namen werden nicht gespeichert, Leerzeichen am Anfang und Ende werden entfernt, und doppelte Kategorien werden verhindert. Neue Kategorien werden ebenfalls lokal im Browser gespeichert und sind nach einem Refresh weiter verfügbar.

## Wo werden die Daten gespeichert?

Die Daten werden lokal im Browser über `localStorage` gespeichert. Es gibt keinen Login, keine Cloud und keine Datenbank.

Wichtig: Die gespeicherten Daten gehören zu genau diesem Browser und dieser lokalen Adresse bzw. Datei. Wenn du Browserdaten löschst oder einen anderen Browser nutzt, sind dort keine Buchungen vorhanden.

Für zusätzliche Sicherheit kannst du regelmäßig ein Backup exportieren und die JSON-Datei separat speichern.
