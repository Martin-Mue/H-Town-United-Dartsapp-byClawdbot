import { describe, expect, it } from 'vitest';
import { CameraRecognitionReviewService } from '../../src/contexts/media-vision/application/services/CameraRecognitionReviewService.js';

describe('CameraRecognitionReviewService', () => {
  it('returns corrected throw payload with manual flag', () => {
    const service = new CameraRecognitionReviewService();
    const output = service.applyManualCorrection({
      matchId: 'm1',
      turnId: 't1',
      correctedPoints: 60,
      correctedMultiplier: 3,
      reason: 'low confidence',
    });

    expect(output.manuallyCorrected).toBe(true);
    expect(output.points).toBe(60);
  });
});
