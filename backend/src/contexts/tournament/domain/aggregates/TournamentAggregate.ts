import { TournamentRound } from '../entities/TournamentRound.js';
import type { GameMode } from '../../../game/domain/value-objects/GameMode.js';

/** Handles tournament mode strategy and bracket progression state. */
export class TournamentAggregate {
  constructor(
    public readonly tournamentId: string,
    private readonly rounds: TournamentRound[],
    private readonly isRoundModeChangeAllowed: boolean,
  ) {}

  /** Returns all configured rounds in bracket order. */
  public getRounds(): ReadonlyArray<TournamentRound> {
    return this.rounds;
  }

  /** Changes one round mode when mode-switch strategy is enabled. */
  public setRoundMode(roundNumber: number, mode: GameMode): void {
    if (!this.isRoundModeChangeAllowed) {
      throw new Error('Round mode changes are disabled for this tournament.');
    }

    const round = this.rounds.find((entry) => entry.roundNumber === roundNumber);
    if (!round) throw new Error('Round was not found.');
    round.setMode(mode);
  }
}
