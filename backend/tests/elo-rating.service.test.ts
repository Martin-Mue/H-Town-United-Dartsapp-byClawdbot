import { describe, expect, it } from 'vitest';
import { EloRatingService } from '../src/contexts/global-ranking/domain/services/EloRatingService.js';

describe('EloRatingService', () => {
  it('increases winner rating and decreases loser rating', () => {
    const service = new EloRatingService();
    const result = service.calculateNewRatings(1200, 1200);

    expect(result.winner).toBeGreaterThan(1200);
    expect(result.loser).toBeLessThan(1200);
  });
});
