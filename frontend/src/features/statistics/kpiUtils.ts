import type { HistoryEntry } from './rankingUtils';

export type UnifiedPlayerKpi = {
  playerId: string;
  displayName: string;
  matchCount: number;
  threeDartAverage: number;
  first9Average: number;
  checkoutRate: number;
  bestLegDarts: number | null;
  worstLegDarts: number | null;
};

export function computeUnifiedPlayerKpis(history: HistoryEntry[]): UnifiedPlayerKpi[] {
  const perPlayer = new Map<string, {
    displayName: string;
    matches: number;
    turns: number[];
    first9Samples: number[];
    checkoutAttempts: number;
    checkoutHits: number;
    legDarts: number[];
  }>();

  for (const match of history) {
    for (const player of match.players) {
      const key = player.id;
      const current = perPlayer.get(key) ?? {
        displayName: player.name,
        matches: 0,
        turns: [],
        first9Samples: [],
        checkoutAttempts: 0,
        checkoutHits: 0,
        legDarts: [],
      };

      current.matches += 1;
      const turns = match.playerTurnScores?.[key] ?? [];
      current.turns.push(...turns);
      current.first9Samples.push(...turns.slice(0, 3));

      const report = match.playerMatchStats?.find((row) => row.playerId === key);
      if (report) {
        current.checkoutAttempts += report.checkoutAttempts;
        current.checkoutHits += report.successfulCheckouts;
        if (report.bestLegDarts) current.legDarts.push(report.bestLegDarts);
        if (report.worstLegDarts) current.legDarts.push(report.worstLegDarts);
      }

      perPlayer.set(key, current);
    }
  }

  return [...perPlayer.entries()].map(([playerId, data]) => {
    const threeDartAverage = data.turns.length > 0 ? Number((data.turns.reduce((a, b) => a + b, 0) / data.turns.length).toFixed(1)) : 0;
    const first9Average = data.first9Samples.length > 0 ? Number((data.first9Samples.reduce((a, b) => a + b, 0) / data.first9Samples.length).toFixed(1)) : 0;
    const checkoutRate = data.checkoutAttempts > 0 ? Number(((data.checkoutHits / data.checkoutAttempts) * 100).toFixed(1)) : 0;

    return {
      playerId,
      displayName: data.displayName,
      matchCount: data.matches,
      threeDartAverage,
      first9Average,
      checkoutRate,
      bestLegDarts: data.legDarts.length > 0 ? Math.min(...data.legDarts) : null,
      worstLegDarts: data.legDarts.length > 0 ? Math.max(...data.legDarts) : null,
    };
  });
}

export function computeClubKpiSnapshot(history: HistoryEntry[]): {
  clubAverage: number;
  first9Average: number;
  checkoutRate: number;
  totalMatches: number;
} {
  const rows = computeUnifiedPlayerKpis(history);
  if (rows.length === 0) return { clubAverage: 0, first9Average: 0, checkoutRate: 0, totalMatches: 0 };

  const clubAverage = Number((rows.reduce((a, r) => a + r.threeDartAverage, 0) / rows.length).toFixed(1));
  const first9Average = Number((rows.reduce((a, r) => a + r.first9Average, 0) / rows.length).toFixed(1));
  const checkoutRate = Number((rows.reduce((a, r) => a + r.checkoutRate, 0) / rows.length).toFixed(1));
  return { clubAverage, first9Average, checkoutRate, totalMatches: history.length };
}
