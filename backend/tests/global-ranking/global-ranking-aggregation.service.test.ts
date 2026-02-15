import { describe, expect, it } from 'vitest';
import { GlobalRankingAggregationService } from '../../src/contexts/global-ranking/application/services/GlobalRankingAggregationService.js';

describe('GlobalRankingAggregationService', () => {
  it('returns sorted global performance index ranking', () => {
    const ranking = new GlobalRankingAggregationService().aggregate([
      { playerId: 'player-a', elo: 1550, average: 68, checkout: 32 },
      { playerId: 'player-b', elo: 1620, average: 62, checkout: 28 },
    ]);

    expect(ranking.length).toBe(2);
    expect(ranking[0].globalPerformanceIndex).toBeGreaterThanOrEqual(ranking[1].globalPerformanceIndex);
  });
});
