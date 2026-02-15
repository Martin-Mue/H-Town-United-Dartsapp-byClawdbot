export type ModeRule = {
  id: string;
  title: string;
  kind: 'game' | 'training';
  rules: string;
  trains: string;
};

export const MODE_RULES: ModeRule[] = [
  { id: 'x01-501', title: '501 / 301 (Double Out)', kind: 'game', rules: 'Start bei 501 oder 301. Auf exakt 0 herunterspielen. Letzter Wurf muss ein Double sein.', trains: 'Matchsimulation, Rechenfähigkeit, Finishing unter Druck.' },
  { id: 'cricket', title: 'Cricket', kind: 'game', rules: 'Zahlen 20–15 und Bull jeweils dreimal treffen, um sie zu schließen. Punkte zählen nur, wenn der Gegner die Zahl noch nicht geschlossen hat.', trains: 'Taktik, gezieltes Scoring, Boardkontrolle.' },
  { id: 'around-clock', title: 'Around the Clock', kind: 'training', rules: 'Zahlen 1 bis 20 der Reihe nach treffen, am Ende Bull.', trains: 'Präzision auf alle Felder, Sicherheit auf schwächeren Segmenten.' },
  { id: 'shanghai', title: 'Shanghai', kind: 'training', rules: 'Pro Runde eine feste Zahl. Single, Double und Triple zählen. Wer in einer Runde S, D und T derselben Zahl trifft, gewinnt sofort.', trains: 'Feldkontrolle, Multiplikatoren.' },
  { id: 'checkout-121', title: '121 Checkout Game', kind: 'training', rules: 'Start bei 121. Mit maximal 9 Darts checken. Bei Erfolg nächste Zahl hochzählen.', trains: 'Checkwege, Finishing unter Limit.' },
  { id: 'challenge-170', title: '170 Challenge', kind: 'training', rules: '170 mit drei Darts auschecken (T20, T20, Bull).', trains: 'High-Finish, Triple-Präzision.' },
  { id: 'bobs27', title: 'Bob’s 27', kind: 'training', rules: 'Start bei 27 Punkten. Doubles 1–20 der Reihe nach werfen. Treffer addieren, Fehlversuch subtrahieren.', trains: 'Doublesicherheit.' },
  { id: 'killer', title: 'Killer (ab 3 Spielern)', kind: 'game', rules: 'Jeder erhält eine Zahl. Erst dreimal eigene Zahl treffen, danach Gegner durch Treffen ihrer Zahl „Leben“ abziehen.', trains: 'Drucksituationen, taktisches Spiel.' },
  { id: 'split-score', title: 'Split Score', kind: 'training', rules: 'Pro Runde vorgegebene Zielzahl. Kein Treffer bedeutet Halbierung des Punktestands.', trains: 'Konstanz, Konzentration.' },
  { id: 't20-100', title: '100 Darts auf T20', kind: 'training', rules: '100 Würfe ausschließlich auf Triple 20, Gesamtpunktzahl zählen.', trains: 'Scoring-Konstanz.' },
  { id: 'doubles-world', title: 'Doubles Around the World', kind: 'training', rules: 'Doubles 1 bis 20 der Reihe nach treffen.', trains: 'Alle Match-Doubles.' },
  { id: 'bull-challenge', title: 'Bull Challenge', kind: 'training', rules: 'Festgelegte Anzahl Würfe nur auf Bull. Treffer getrennt auswerten.', trains: 'Zentrumskontrolle, Finish-Vorbereitung.' },
  { id: '20-training', title: '20er-Training', kind: 'training', rules: 'Jede Aufnahme ausschließlich auf die 20 werfen. Ziel sind konstante 60+ Aufnahmen.', trains: 'Standardscoring.' },
  { id: '19-training', title: '19er-Training', kind: 'training', rules: 'Analog zum 20er-Training, aber auf 19.', trains: 'Alternative Scoring-Route.' },
  { id: 'finish-61-100', title: 'Finish 61–100', kind: 'training', rules: 'Zufällige Restpunkte zwischen 61 und 100 in maximal drei Darts checken.', trains: 'Checkout-Routen.' },
  { id: '40-game', title: '40-Punkte-Spiel', kind: 'training', rules: 'Nur D20 zählt. Wer zuerst 40 Punkte über D20 erreicht, gewinnt.', trains: 'Wichtigstes Match-Double.' },
  { id: 'highscore', title: 'Highscore (z. B. 10 Runden)', kind: 'training', rules: 'Feste Anzahl Aufnahmen, alle Punkte zählen. Höchste Gesamtsumme gewinnt.', trains: 'Freies Scoring.' },
  { id: 'halve-it', title: 'Halve-It', kind: 'training', rules: 'Jede Runde neue Zielzahl (z. B. 20, 19, 18, 17, 16, 15, Bull). Kein Treffer führt zur Halbierung des Punktestands.', trains: 'Druckresistenz, Konstanz.' },
  { id: 'catch-40', title: 'Catch 40', kind: 'training', rules: 'Start bei 40 Rest. Mit drei Darts checken, sonst Punktabzug.', trains: 'Standardfinish unter Druck.' },
  { id: '3dart-checkout', title: '3-Dart-Checkout-Wettbewerb', kind: 'training', rules: 'Alle Spieler starten mit gleicher Restzahl. Wer zuerst checkt, gewinnt die Runde.', trains: 'Wettkampfsimulation.' },
];
