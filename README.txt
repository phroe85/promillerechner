PROMILLE / 2.2 – Aktualisierung für GitHub Pages

1. ZIP entpacken. Im bestehenden Repository (promille-app) unter Code > Add file > Upload files alle Dateien aus dem ZIP hochladen, nicht den Ordner selbst. Commit changes. Die Pages-Konfiguration main / root bleibt unverändert.
2. Nach erfolgreichem Deployment dieselbe URL in Chrome öffnen. Bei alter Anzeige App schliessen, online neu öffnen und ggf. erneut laden. Service Worker aktualisiert den Cache; keine Website-Daten löschen, sonst gehen Protokolle verloren. Installation auf dem Pixel bleibt grundsätzlich bestehen (gleiche URL/Manifest-ID).
3. Statistik & Archiv zeigt 7/30 Tage, Tagesmengen und Sitzungen; CSV-Export. Kein nachträgliches Erfassen. Bei 18 h Pause beginnt eine neue Sitzung; das Modell berechnet Restalkohol über diese Grenze hinweg. Die 07:00-Prognose bleibt während der Sitzung auch nach 07:00 erhalten. Danach gilt die nächste Prognosezeit. Die Prognosezeit ist in Einstellungen veränderbar und wird je Sitzung eingefroren.
4. V1-Daten (promille01-v1) werden bei gleichem Browser/Origin automatisch nach V2 übertragen, ohne ursprüngliche Getränkedaten zu ändern. Da V1 kein historisches Körperprofil/Nahrungsaufnahme speicherte, wird bei Migration das letzte gespeicherte Profil und Nahrung Normal verwendet. V1-Speicher bleibt als Rückfallkopie bestehen, wird nicht weiter synchronisiert. Daten nicht löschen, wenn du sie behalten willst.
5. Die original angegebenen Shotgrössen 0,2 und 0,4 cl bleiben als Voreinstellung (2 und 4 ml); ggf. auf 2 und 4 cl korrigieren. Die voreingestellten Körperwerte (41 J., 95 kg, 180 cm, männlich) sind wie bisher im öffentlich sichtbaren Quellcode enthalten. Neue Eingaben verbleiben lokal. Keine externen Dienste/APIs.
6. Keine Schlafparameter oder Schlafbewertungen. Keine Fahrtüchtigkeitsfreigabe. Ein errechneter Wert <0,01 ‰ ist kein Beweis für Nüchternheit. Bei Bewusstlosigkeit/auffälliger Atmung 144/112.

Dateien: index.html, app.js, model.js, worker.js, sw.js, manifest.webmanifest, icon-192.png, icon-512.png, README.txt, MODELL.md, test-model.cjs.
Die Dateien MODELL.md und test-model.cjs sind Dokumentation und lokale Modelltests; sie müssen nicht hochgeladen werden.

Technische Details, Annahmen, Referenzen und Grenzen: MODELL.md.
