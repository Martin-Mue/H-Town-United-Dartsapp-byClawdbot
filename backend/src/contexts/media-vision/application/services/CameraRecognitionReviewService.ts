import type { ManualThrowCorrectionDto } from '../dto/ManualThrowCorrectionDto.js';

/** Handles manual review workflow for low-confidence throw detection. */
export class CameraRecognitionReviewService {
  /** Accepts a manual correction request and returns normalized correction result. */
  public applyManualCorrection(input: ManualThrowCorrectionDto): {
    matchId: string;
    turnId: string;
    points: number;
    multiplier: 1 | 2 | 3;
    confidence: number;
    manuallyCorrected: true;
  } {
    return {
      matchId: input.matchId,
      turnId: input.turnId,
      points: input.correctedPoints,
      multiplier: input.correctedMultiplier,
      confidence: 1,
      manuallyCorrected: true,
    };
  }
}
