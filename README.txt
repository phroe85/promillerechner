PROMILLE / 2.5 – Scientific Model Update

Update: ZIP entpacken. Im bestehenden GitHub-Repository die Dateien index.html, app.js, model.js, worker.js, sw.js, manifest.webmanifest, icon-192.png und icon-512.png direkt im Root hochladen und ersetzen. Commit changes. MODELL.md, README.txt, test-model.cjs, stress-test.cjs und synthetic-30days.json sind optional (Dokumentation/Tests). Die URL und Manifest-ID bleiben unverändert. Nach erfolgreichem Pages-Deployment online öffnen; Versionsnummer 2.5 kontrollieren. App-Daten nicht löschen. Bei CDN-Verzögerungen kann ein weiterer Start nötig sein. Offline bleibt der zuletzt vollständig installierte Stand verfügbar; Versionsprüfung schützt vor gemischten Skripten.

Daten: gleiche lokale Speicherstruktur wie 2.4. Getränke und Einstellungen bleiben unverändert. Historische BAK-Werte werden mit dem neuen Modell berechnet und können deutlich höher oder tiefer ausfallen. Bieräquivalente bleiben gleich. Keine Schlafanalyse.

Modell: siehe MODELL.md. Tests: node test-model.cjs; TZ=Europe/Zurich node stress-test.cjs synthetic-30days.json stress-results.json. Testdaten sind rein synthetisch. Die App ist keine Messung, nicht klinisch validiert und keine Freigabe zum Fahren. Grundwerte sind im öffentlichen Code sichtbar.
