import { describe, expect, it } from 'vitest';
import { CricketBoardState } from '../../src/contexts/game/domain/entities/CricketBoardState.js';
import { CricketScoringService } from '../../src/contexts/game/domain/services/CricketScoringService.js';

describe('CricketScoringService', () => {
  it('awards overflow points when opponents have not closed target number', () => {
    const board = new CricketBoardState(['p1', 'p2']);
    const service = new CricketScoringService(board);

    board.applyMark('p1', 20, 3);
    const result = service.applyThrow({
      playerId: 'p1',
      opponentIds: ['p2'],
      targetNumber: 20,
      multiplier: 2,
    });

    expect(result.awardedPoints).toBe(40);
  });

  it('awards zero points when all opponents already closed target number', () => {
    const board = new CricketBoardState(['p1', 'p2']);
    const service = new CricketScoringService(board);

    board.applyMark('p1', 20, 3);
    board.applyMark('p2', 20, 3);

    const result = service.applyThrow({
      playerId: 'p1',
      opponentIds: ['p2'],
      targetNumber: 20,
      multiplier: 1,
    });

    expect(result.awardedPoints).toBe(0);
  });
});
