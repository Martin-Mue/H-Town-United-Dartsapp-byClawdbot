/** Captures and recognizes dart throws from device camera frames. */
export interface DartRecognitionService {
  /** Calibrates board geometry before match start. */
  calibrateBoard(frame: Buffer): Promise<{ calibrationId: string; confidence: number }>;

  /** Detects throw result with confidence and optional manual correction requirement. */
  detectThrow(frame: Buffer): Promise<{
    points: number;
    multiplier: 1 | 2 | 3;
    confidence: number;
    requiresManualReview: boolean;
  }>;
}
