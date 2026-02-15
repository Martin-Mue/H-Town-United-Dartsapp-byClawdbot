/** Produces anonymized global ranking records suitable for world leaderboard sync. */
export class GlobalRankingAggregationService {
  /** Aggregates player snapshots into normalized global performance index records. */
  public aggregate(input: Array<{ playerId: string; elo: number; average: number; checkout: number }>): Array<{
    anonymizedPlayerKey: string;
    elo: number;
    globalPerformanceIndex: number;
  }> {
    return input
      .map((entry) => ({
        anonymizedPlayerKey: `anon-${entry.playerId.slice(0, 6)}`,
        elo: entry.elo,
        globalPerformanceIndex: Number((entry.elo * 0.6 + entry.average * 2 + entry.checkout * 1.5).toFixed(2)),
      }))
      .sort((a, b) => b.globalPerformanceIndex - a.globalPerformanceIndex);
  }
}
