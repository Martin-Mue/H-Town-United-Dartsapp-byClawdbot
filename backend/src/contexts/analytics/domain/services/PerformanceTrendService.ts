/** Produces trend metrics for averages, checkout and pressure performance. */
export class PerformanceTrendService {
  /** Calculates linear trend indicator and monthly improvement percentage. */
  public calculateMonthlyImprovement(series: number[]): {
    trend: 'UP' | 'DOWN' | 'STABLE';
    improvementPercent: number;
  } {
    if (series.length < 2) return { trend: 'STABLE', improvementPercent: 0 };

    const first = series[0];
    const last = series[series.length - 1];
    const delta = last - first;
    const percent = first === 0 ? 0 : (delta / first) * 100;

    if (Math.abs(percent) < 1) return { trend: 'STABLE', improvementPercent: Number(percent.toFixed(2)) };
    return {
      trend: percent > 0 ? 'UP' : 'DOWN',
      improvementPercent: Number(percent.toFixed(2)),
    };
  }
}
