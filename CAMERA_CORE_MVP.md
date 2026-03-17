# Kamera als Kernfunktion – Umsetzungsplan (MVP -> produktiv)

Stand: 2026-03-01

## Zielbild
Automatisiertes Spiel mit Kamera:
1. Kamera bereits beim Spielstart aktivierbar
2. Live-Bild im Match für beide Spieler sichtbar (lokal + remote)
3. Darts werden automatisch erkannt
4. Nach Dart-Entnahme wird Score automatisch übernommen und Turn fortgeführt

---

## Phase 1 (sofort, UI/Flow)
- [ ] Spielstart: globaler Toggle `Kamera-Assist aktiv`
- [ ] MatchLive: persistenter Kamera-Panel-Bereich immer sichtbar
- [ ] Lokaler Split-View (Player A/B Feed) mit Platzhalter für Remote-Feed
- [ ] Session-Status (connected / calibrating / detecting / waiting_for_pull)

## Phase 2 (Remote-Livebild)
- [ ] WebRTC Signaling über Backend Socket-Kanal
- [ ] Match-Raum pro `matchId`
- [ ] Sender/Receiver Rollen für beide Spieler
- [ ] Fallback: kein Remote-Feed -> manuelle Eingabe bleibt verfügbar

## Phase 3 (Automatische Erkennung)
- [ ] Board-Kalibrierung vor Matchstart
- [ ] Throw-Detektion (1-3 Darts) mit Confidence
- [ ] Removal-Detektion: Score wird erst nach Dart-Entnahme gebucht
- [ ] Auto-Commit eines Visits bei stabilem Zustand

## Phase 4 (Match-Automation stabil)
- [ ] Vollautomatischer Turn-Loop
- [ ] Review nur bei geringer Confidence
- [ ] Persistente Speicherung (Frames-Metadaten + erkannte Throws + Korrekturen)
- [ ] Statistik-Integration (Kameraquelle vs. manuelle Quelle)

---

## Harte DoD-Kriterien
- [ ] Lokales x01 Match ohne manuelle Punkteingabe spielbar
- [ ] Lokales Cricket Match ohne manuelle Punkteingabe spielbar
- [ ] Remote-Match mit Livefeeds beidseitig sichtbar
- [ ] <5% manuelle Korrekturen bei normalem Licht (Testserie)
- [ ] Kein Score-Commit vor Dart-Entnahme

---

## Reihenfolge ab jetzt
1. Kamera-Flow und UI zuerst (sofort sichtbar)
2. Remote-Feed (WebRTC)
3. CV/Auto-Commit Härtung
4. Statistik/Review-Polish
