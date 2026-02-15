/** Captures Cricket marks and closed-number state for each player. */
export class CricketBoardState {
  private readonly marksByPlayer = new Map<string, Map<number, number>>();
  private static readonly validNumbers = [15, 16, 17, 18, 19, 20, 25];

  constructor(playerIds: string[]) {
    for (const playerId of playerIds) {
      const marks = new Map<number, number>();
      for (const number of CricketBoardState.validNumbers) marks.set(number, 0);
      this.marksByPlayer.set(playerId, marks);
    }
  }

  /** Applies one hit to a cricket segment while capping marks at three. */
  public applyMark(playerId: string, targetNumber: number, multiplier: 1 | 2 | 3): void {
    if (!CricketBoardState.validNumbers.includes(targetNumber)) return;

    const playerMarks = this.marksByPlayer.get(playerId);
    if (!playerMarks) return;

    const current = playerMarks.get(targetNumber) ?? 0;
    playerMarks.set(targetNumber, Math.min(3, current + multiplier));
  }

  /** Returns marks count of one target number for one player. */
  public getMarks(playerId: string, targetNumber: number): number {
    return this.marksByPlayer.get(playerId)?.get(targetNumber) ?? 0;
  }

  /** Returns true when player has closed every cricket number. */
  public isClosed(playerId: string): boolean {
    const playerMarks = this.marksByPlayer.get(playerId);
    if (!playerMarks) return false;

    for (const number of CricketBoardState.validNumbers) {
      if ((playerMarks.get(number) ?? 0) < 3) return false;
    }
    return true;
  }
}
