/** Builds tactical and adaptive training recommendations from player trends. */
export class TrainingRecommendationService {
  /** Generates a compact actionable plan based on checkout and pressure metrics. */
  public buildPlan(metrics: {
    checkoutPercentage: number;
    pressurePerformanceIndex: number;
    tendency: 'LEFT_BIAS' | 'RIGHT_BIAS' | 'HIGH' | 'LOW' | 'BALANCED';
  }): string[] {
    const recommendations: string[] = [];

    if (metrics.checkoutPercentage < 20) {
      recommendations.push('Run 20-minute double-out checkout ladder (D16, D10, D8).');
    }

    if (metrics.pressurePerformanceIndex < 50) {
      recommendations.push('Complete pressure drill blocks: 9 darts to finish 60+ under timer.');
    }

    if (metrics.tendency !== 'BALANCED') {
      recommendations.push(`Apply board correction drill to counter ${metrics.tendency.toLowerCase()} tendency.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current form with mixed doubles + cricket consistency block.');
    }

    return recommendations;
  }
}
