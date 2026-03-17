/** Tracks per-player legs and sets across a full match lifecycle. */
export class MatchScoreboard {
  private readonly legsWon = new Map<string, number>();
  private readonly setsWon = new Map<string, number>();
  private readonly totalLegsWon = new Map<string, number>();

  constructor(playerIds: string[]) {
    for (const playerId of playerIds) {
      this.legsWon.set(playerId, 0);
      this.setsWon.set(playerId, 0);
      this.totalLegsWon.set(playerId, 0);
    }
  }

  /** Increments leg count for one player and resolves set rollover. */
  public registerLegWinner(playerId: string, legsPerSet: number): void {
    const currentLegs = (this.legsWon.get(playerId) ?? 0) + 1;
    this.legsWon.set(playerId, currentLegs);
    this.totalLegsWon.set(playerId, (this.totalLegsWon.get(playerId) ?? 0) + 1);

    if (currentLegs >= legsPerSet) {
      this.legsWon.set(playerId, 0);
      this.setsWon.set(playerId, (this.setsWon.get(playerId) ?? 0) + 1);
    }
  }

  /** Returns legs currently won in active set by player id. */
  public getLegs(playerId: string): number {
    return this.legsWon.get(playerId) ?? 0;
  }

  /** Returns full sets won by player id. */
  public getSets(playerId: string): number {
    return this.setsWon.get(playerId) ?? 0;
  }

  /** Returns total legs won across all sets. */
  public getTotalLegs(playerId: string): number {
    return this.totalLegsWon.get(playerId) ?? 0;
  }
}
