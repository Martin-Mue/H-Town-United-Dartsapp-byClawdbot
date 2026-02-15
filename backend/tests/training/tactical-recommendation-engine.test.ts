import { describe, expect, it } from 'vitest';
import { TacticalRecommendationEngine } from '../../src/contexts/training/application/services/TacticalRecommendationEngine.js';

describe('TacticalRecommendationEngine', () => {
  it('builds opponent-aware tactical advice', () => {
    const recommendations = new TacticalRecommendationEngine().generateMatchPlan(
      {
        playerId: 'p1',
        averageHistory: [60, 62],
        checkoutHistory: [24, 28],
        pressurePerformanceIndex: 72,
        weaknessTags: ['TREBLE_20_CONSISTENCY'],
        strengthTags: ['DOUBLE_10'],
      },
      {
        playerId: 'p2',
        averageHistory: [58, 59],
        checkoutHistory: [20, 22],
        pressurePerformanceIndex: 50,
        weaknessTags: ['DOUBLE_16'],
        strengthTags: ['TREBLE_19'],
      },
    );

    expect(recommendations.length).toBeGreaterThan(0);
  });
});
