import type { GameMode } from '../../../game/domain/value-objects/GameMode.js';

export type TournamentFixture = {
  homePlayerId: string;
  awayPlayerId: string;
  winnerPlayerId?: string;
  resultLabel?: string;
  linkedMatchId?: string;
};

/** Represents one tournament round with game mode and fixtures. */
export class TournamentRound {
  constructor(
    public readonly roundNumber: number,
    public mode: GameMode,
    public fixtures: TournamentFixture[],
  ) {}

  /** Updates mode for this round when tournament policy allows switching. */
  public setMode(mode: GameMode): void {
    this.mode = mode;
  }
}
