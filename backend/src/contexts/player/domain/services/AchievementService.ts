/** Evaluates milestone achievements for gamification and player motivation. */
export class AchievementService {
  /** Resolves unlocked achievement keys from player lifetime counters. */
  public evaluate(input: {
    total180s: number;
    highestCheckout: number;
    monthlyImprovementPercent: number;
    clutchWins: number;
  }): string[] {
    const achievements: string[] = [];

    if (input.total180s >= 1) achievements.push('FIRST_180');
    if (input.total180s >= 50) achievements.push('MAXIMUM_MACHINE');
    if (input.highestCheckout >= 170) achievements.push('BIG_FISH');
    if (input.monthlyImprovementPercent >= 10) achievements.push('MOST_IMPROVED');
    if (input.clutchWins >= 10) achievements.push('CLUTCH_PERFORMER');

    return achievements;
  }
}
