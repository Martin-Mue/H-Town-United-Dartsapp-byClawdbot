import { TournamentRound } from '../entities/TournamentRound.js';
import type { GameMode } from '../../../game/domain/value-objects/GameMode.js';

/** Handles tournament mode strategy and bracket progression state. */
export class TournamentAggregate {
  constructor(
    public readonly tournamentId: string,
    public readonly name: string,
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

  /** Stores winner for one fixture and auto-progresses winners into next round when available. */
  public recordFixtureWinner(roundNumber: number, fixtureIndex: number, winnerPlayerId: string): void {
    const currentRound = this.rounds.find((entry) => entry.roundNumber === roundNumber);
    if (!currentRound) throw new Error('Round was not found.');

    const fixture = currentRound.fixtures[fixtureIndex];
    if (!fixture) throw new Error('Fixture was not found.');
    fixture.winnerPlayerId = winnerPlayerId;

    const nextRound = this.rounds.find((entry) => entry.roundNumber === roundNumber + 1);
    if (!nextRound) return;

    const winners = currentRound.fixtures
      .map((entry) => entry.winnerPlayerId)
      .filter((entry): entry is string => Boolean(entry));

    for (let index = 0; index < nextRound.fixtures.length; index += 1) {
      const homeWinner = winners[index * 2];
      const awayWinner = winners[index * 2 + 1];
      if (homeWinner) nextRound.fixtures[index].homePlayerId = homeWinner;
      if (awayWinner) nextRound.fixtures[index].awayPlayerId = awayWinner;
    }
  }
}
