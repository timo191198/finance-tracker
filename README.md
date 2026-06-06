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
3. Im Tab **Dashboard** Zeitraum, Kategorie und Typ filtern.
4. Die Übersicht zeigt Einnahmen, Ausgaben und Saldo.
5. Einzelne Buchungen können in der Tabelle gelöscht werden.

## Neue Kategorien hinzufügen

Im Tab **Neue Buchung** befindet sich neben dem Feld **Kategorie** ein kleiner `+`-Button. Darüber kannst du eine neue Kategorie anlegen.

Leere Namen werden nicht gespeichert, Leerzeichen am Anfang und Ende werden entfernt, und doppelte Kategorien werden verhindert. Neue Kategorien werden ebenfalls lokal im Browser gespeichert und sind nach einem Refresh weiter verfügbar.

## Wo werden die Daten gespeichert?

Die Daten werden lokal im Browser über `localStorage` gespeichert. Es gibt keinen Login, keine Cloud und keine Datenbank.

Wichtig: Die gespeicherten Daten gehören zu genau diesem Browser und dieser lokalen Adresse bzw. Datei. Wenn du Browserdaten löschst oder einen anderen Browser nutzt, sind dort keine Buchungen vorhanden.
