import { CricketBoardState } from '../entities/CricketBoardState.js';

/** Resolves cricket turn outcomes including marks, over-scoring, and winner checks. */
export class CricketScoringService {
  constructor(private readonly boardState: CricketBoardState) {}

  /**
   * Applies a cricket hit and returns scored points if target is already closed by thrower
   * and not closed by all opponents.
   */
  public applyThrow(input: {
    playerId: string;
    opponentIds: string[];
    targetNumber: number;
    multiplier: 1 | 2 | 3;
  }): { awardedPoints: number; playerClosedBoard: boolean } {
    const effectiveMultiplier: 1 | 2 | 3 = input.targetNumber === 25 && input.multiplier === 3 ? 2 : input.multiplier;
    const beforeMarks = this.boardState.getMarks(input.playerId, input.targetNumber);
    this.boardState.applyMark(input.playerId, input.targetNumber, effectiveMultiplier);

    const overflowMarks = Math.max(0, beforeMarks + effectiveMultiplier - 3);
    const allOpponentsClosed = input.opponentIds.every((id) => this.boardState.getMarks(id, input.targetNumber) >= 3);
    const awardedPoints = allOpponentsClosed ? 0 : overflowMarks * input.targetNumber;

    return {
      awardedPoints,
      playerClosedBoard: this.boardState.isClosed(input.playerId),
    };
  }
}
