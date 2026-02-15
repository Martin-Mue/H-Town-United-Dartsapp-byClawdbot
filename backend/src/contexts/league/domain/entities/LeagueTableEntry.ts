/** Stores one team's league statistics and points. */
export class LeagueTableEntry {
  public played = 0;
  public wins = 0;
  public draws = 0;
  public losses = 0;
  public legDifference = 0;
  public points = 0;

  constructor(public readonly teamId: string, public readonly teamName: string) {}

  /** Applies one fixture result to cumulative team statistics. */
  public applyResult(input: { legsFor: number; legsAgainst: number }): void {
    this.played += 1;
    this.legDifference += input.legsFor - input.legsAgainst;

    if (input.legsFor > input.legsAgainst) {
      this.wins += 1;
      this.points += 3;
      return;
    }

    if (input.legsFor === input.legsAgainst) {
      this.draws += 1;
      this.points += 1;
      return;
    }

    this.losses += 1;
  }
}
