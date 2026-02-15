/** Assigns player skill tiers from bronze to master based on performance index. */
export class SkillLevelService {
  /** Returns named rank bracket for an aggregated skill score. */
  public resolveSkillLevel(score: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'MASTER' {
    if (score >= 90) return 'MASTER';
    if (score >= 75) return 'PLATINUM';
    if (score >= 60) return 'GOLD';
    if (score >= 40) return 'SILVER';
    return 'BRONZE';
  }
}
