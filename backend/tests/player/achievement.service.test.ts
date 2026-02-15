import { describe, expect, it } from 'vitest';
import { AchievementService } from '../../src/contexts/player/domain/services/AchievementService.js';
import { SkillLevelService } from '../../src/contexts/player/domain/services/SkillLevelService.js';

describe('Player Gamification Services', () => {
  it('returns correct skill level', () => {
    const level = new SkillLevelService().resolveSkillLevel(91);
    expect(level).toBe('MASTER');
  });

  it('returns major achievements', () => {
    const achievements = new AchievementService().evaluate({
      total180s: 52,
      highestCheckout: 170,
      monthlyImprovementPercent: 12,
      clutchWins: 11,
    });

    expect(achievements).toContain('MAXIMUM_MACHINE');
    expect(achievements).toContain('BIG_FISH');
  });
});
