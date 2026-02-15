/** Represents manual correction input for low-confidence camera recognition. */
export interface ManualThrowCorrectionDto {
  matchId: string;
  turnId: string;
  correctedPoints: number;
  correctedMultiplier: 1 | 2 | 3;
  reason: string;
}
