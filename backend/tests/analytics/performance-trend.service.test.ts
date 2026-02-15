import { describe, expect, it } from 'vitest';
import { PerformanceTrendService } from '../../src/contexts/analytics/domain/services/PerformanceTrendService.js';

describe('PerformanceTrendService', () => {
  it('detects upward monthly trend', () => {
    const result = new PerformanceTrendService().calculateMonthlyImprovement([50, 53, 57, 61]);
    expect(result.trend).toBe('UP');
    expect(result.improvementPercent).toBeGreaterThan(0);
  });
});
