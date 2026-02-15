import type { PlayerPerformanceProfile } from '../../domain/entities/PlayerPerformanceProfile.js';

/** Generates opponent-aware tactical recommendations before important matches. */
export class TacticalRecommendationEngine {
  /** Returns tactical advice against an opponent profile. */
  public generateMatchPlan(player: PlayerPerformanceProfile, opponent: PlayerPerformanceProfile): string[] {
    const plan: string[] = [];

    if (opponent.pressurePerformanceIndex < player.pressurePerformanceIndex) {
      plan.push('Increase pace in deciding legs to apply scoreboard pressure.');
    }

    if (opponent.weaknessTags.includes('DOUBLE_16')) {
      plan.push('Steer finishes toward D16 pressure scenarios when possible.');
    }

    if (player.weaknessTags.includes('TREBLE_20_CONSISTENCY')) {
      plan.push('Open with stabilizing 60-target rhythm for first three visits.');
    }

    return plan.length > 0 ? plan : ['Play standard match plan with balanced scoring and checkout focus.'];
  }
}
