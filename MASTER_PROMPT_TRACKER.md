# H-Town United Darts Platform — Master Prompt Tracker

Stand: 2026-02-16
Owner: Martin
Arbeitsmodus: iterativ mit Live-Feedback

## Legende
- ✅ Fertig
- 🟡 In Arbeit / teilweise
- 🔴 Offen

---

## A) Core Product / UX
- 🟡 Mobile-first Navigation + Flows
- 🟡 Premium UX-Konsistenz (Dartsmind + DartCounter Best-of)
- 🟡 H-Town Branding konsequent/poliert

## B) Spielmodi & Spiellogik (Block 1)
- ✅ x01 (301/501) Grundlogik inkl. Bust/Checkout-Basis
- 🟡 x01 Kantenfälle komplett durchvalidieren (pro Turn/Leg/Set)
- ✅ Cricket Grundlogik + Visit-Refactor (3 Darts bleiben beim aktiven Spieler)
- ✅ Bull/Bullseye-Restriktionen (kein Triple-Bull)
- 🔴 Random Cricket Modus
- 🔴 Weitere Spielmodi (ausbauen)
- 🟡 Individuelle Modi visuell/logisch final abstimmen

## C) Turniere (Block 2)
- ✅ Bracket + Ergebnisrückfluss
- ✅ Freilos/Seed-Optionen + Legenden
- 🟡 Bracket-Linien/Anbindung final pixelgenau
- ✅ Turniermatch kann gestartet werden
- 🟡 Turniermatch mit voller Einzelspiel-Parität (Stats/Gegenüberstellung)
- 🟡 Cricket-Turnieransicht praxisnah (Tabelle/Marks/Status)
- 🔴 Turniermodi tiefer funktional (Szenarien je Runde robust)

## D) Kamera / Vision (Block 3)
- 🟡 Assisted Detection + Confidence + Manual Review (v1)
- 🔴 Kamera-Modus in Spiel, Training, Turnier durchgängig final
- 🔴 Präzise Erkennung (Miss/Board-State/Bust-Finaldart) auf hohem Niveau
- 🔴 Analyse aus Kameraerkennung in Statistiken integriert

## E) Training & Coaching
- 🟡 Trainingsmodi vorhanden + teils stricter
- 🔴 Alle Drills vollständig regelhart
- 🔴 Jede Trainingsansicht strikt modus-adaptiv
- 🔴 Coaching-Bereich vertiefen (individuelle Trainingspläne, Taktikempfehlungen)

## F) Statistik / Analytics (Kernstück)
- 🟡 Spieler- und Matchstats gute Basis
- ✅ Scoring-Klassen 45+ bis 180 persistent integriert
- 🔴 Deutlich tiefere Auswertung/Visuals (Detailreports beider Spieler, Trends, Vergleiche)
- 🔴 Turnier-/Liga-/Training-Statistik konsistent zusammenführen

## G) Spieler/Club/Identity
- ✅ Vereinsmitglieder + lokale Spieler grundsätzlich möglich
- 🟡 Lokale Stats -> vollständige Übernahme bei Mitgliedswechsel in allen Pfaden
- ✅ Profilfelder erweitert (Nickname, Wurfarm, etc.)
- 🟡 Ansage/Aussprache-Flow final polieren
- 🟡 Login/Register-Flows stabilisieren

## H) Gamification
- 🟡 Erste Badges/Ehrungen vorhanden
- 🔴 Skill-Level-System voll ausbauen
- 🔴 Challenges + Monats-/Jahressieger + Hall of Fame
- 🔴 Rekord-/Awardsystem vollständig und konsistent

## I) Liga / Team / Cross-Club
- 🟡 Erste Grundlagen vorhanden
- 🔴 Teammodus final
- 🔴 Ligastruktur + Spielplan + Rangliste final
- 🔴 Cross-Club Sync & Sichtbarkeit sauber umgesetzt

---

## Aktive Reihenfolge (neu priorisiert)
1. Statistik-Sprint (DartCounter-Gap 1–5 vollständig)
2. Kamera-Sprint (Dartsmind-Gap 1–5 vollständig)
3. Block 1: Spiellogik final strict
4. Block 2: Turnier-UX + Bracket + Turnierparität

---

## Nächste konkreten Arbeitspakete

### Statistik-Sprint (DartCounter 1–5)
- [ ] Tiefe Matchreports: First-9, Avg je Leg/Set, Checkout Attempts/Hits, Best/Worst Leg
- [ ] Trend- und Vergleichsansichten: Player-vs-Player, Modus-spezifische Formkurven
- [ ] Segment-/Doppel-Heatmaps statt nur Score-Buckets
- [ ] KPI-Harmonisierung über Match/Turnier/Profil/Training
- [ ] Export/Share-Reports (strukturiert, inkl. Leg-Details)

### Kamera-Sprint (Dartsmind 1–5)
- [ ] Auto-Loop: Detect -> Confirm/Auto -> Dart-Entnahme -> Turn Commit
- [ ] Board-Kalibrierung pro Session inkl. Qualitätsanzeige
- [ ] Visit-Erkennung (1–3 Darts) als Block
- [ ] Robustheit bei Licht/Occlusion + Confidence-Regeln
- [ ] Remote-Livefeeds (WebRTC) inkl. Latenz-/Verbindungsstatus

### Danach
- [ ] Block 1: restliche Spiellogik-Edgecases finalisieren
- [ ] Block 2: Turnier-UX/Bracket-Parität finalisieren

---

## Feedback-Loop
Martin testet zwischendurch live.
Bei jedem Feedback:
1) Punkt zuordnen (A–I)
2) Status aktualisieren
3) konkret fixen
4) Commit + kurzer Statusbericht
