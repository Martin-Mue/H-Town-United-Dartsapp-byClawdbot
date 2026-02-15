import type { CheckoutMode } from '../value-objects/CheckoutMode.js';

/** Tracks one player's leg state and high-performance metrics. */
export class PlayerLegState {
  public score: number;
  public totalScored = 0;
  public dartsThrown = 0;
  public successfulCheckouts = 0;
  public checkoutAttempts = 0;
  public highestTurnScore = 0;

  constructor(
    public readonly playerId: string,
    public readonly displayName: string,
    public readonly checkoutMode: CheckoutMode,
    initialScore: number,
  ) {
    this.score = initialScore;
  }

  /** Applies a valid non-bust turn result to leg state metrics. */
  public applyTurn(points: number): void {
    this.score -= points;
    this.totalScored += points;
    this.dartsThrown += 3;
    this.highestTurnScore = Math.max(this.highestTurnScore, points);
  }

  /** Calculates the player's current three-dart average. */
  public getThreeDartAverage(): number {
    if (this.dartsThrown === 0) return 0;
    return (this.totalScored / this.dartsThrown) * 3;
  }

  /** Calculates checkout percentage from tracked attempts. */
  public getCheckoutPercentage(): number {
    if (this.checkoutAttempts === 0) return 0;
    return (this.successfulCheckouts / this.checkoutAttempts) * 100;
  }
}
