PROMILLE / 2.3 – Update für GitHub Pages

1. ZIP entpacken. Im bestehenden Repository unter Code > Add file > Upload files die Dateien aus dem ZIP hochladen, nicht den Ordner selbst. Commit changes. Die Pages-Konfiguration main / root bleibt gleich.
2. Nach abgeschlossenem Deployment App online erneut öffnen; gegebenenfalls zweimal neu laden. Die gleiche URL und Manifest-ID bleiben erhalten. Keine App-/Website-Daten löschen. Der Service Worker verwendet einen neuen Cache.
3. Bestehende V2.2-Daten werden aus demselben lokalen Speicher gelesen, V1-Daten bei Bedarf migriert. Beim ersten Öffnen werden die Shot-Einstellungen einmalig auf 2 und 4 cl gestellt. Historische Getränke behalten die tatsächlich gespeicherte Menge; sie werden nicht rückwirkend korrigiert. Alte Shot-Kategorien werden aus gespeicherter Menge bzw. Trinkdauer abgeleitet. Neue Getränke haben eine feste Typkennung.
4. Sitzung täglich 07:00–07:00 (lokale Zeit), Restalkohol wird weiterhin modelliert. Protokoll standardmässig eingeklappt. Prognosezeiten nur Median, Modellband weiterhin im Verlauf und bei Konzentrationsschätzungen.
5. Statistik: rollierende letzte 7/30 Tage einschliesslich Zeiten ohne Einträge; Durchschnitt in Bieräquivalenten (Referenz 500 ml, 5 Vol.-%). 7-Tage-Kurve zeigt den zeitabhängigen modellierten Median, nicht Tagesmittel oder Messwerte. Archiv zeigt Getränkezahlen. CSV enthält weiterhin die zugrundeliegenden Mengen.
6. Keine Schlafanalyse. Keine Freigabe zum Fahren. Modell nicht klinisch validiert. Details und Quellen in MODELL.md. Die voreingestellten Körperwerte sind im öffentlichen Quellcode sichtbar; neue Eingaben bleiben lokal.

Dateien MODELL.md und test-model.cjs sind Dokumentation bzw. lokale Tests; Upload optional.
