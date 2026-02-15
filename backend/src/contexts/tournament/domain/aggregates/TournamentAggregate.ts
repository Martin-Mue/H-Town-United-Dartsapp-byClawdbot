import { TournamentRound } from '../entities/TournamentRound.js';
import type { GameMode } from '../../../game/domain/value-objects/GameMode.js';
import type { TournamentFormat } from '../../application/dto/CreateTournamentRequestDto.js';

/** Handles tournament mode strategy and bracket progression state. */
export class TournamentAggregate {
  private updatedAtIso: string;

  constructor(
    public readonly tournamentId: string,
    public readonly name: string,
    public readonly format: TournamentFormat,
    private readonly rounds: TournamentRound[],
    private readonly isRoundModeChangeAllowed: boolean,
    updatedAtIso?: string,
  ) {
    this.updatedAtIso = updatedAtIso ?? new Date().toISOString();
  }

  public get updatedAt(): string {
    return this.updatedAtIso;
  }

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
    this.touch();
  }

  /** Stores winner for one fixture and auto-progresses winners into next round when available. */
  public recordFixtureWinner(roundNumber: number, fixtureIndex: number, winnerPlayerId: string): void {
    const currentRound = this.rounds.find((entry) => entry.roundNumber === roundNumber);
    if (!currentRound) throw new Error('Round was not found.');

    const fixture = currentRound.fixtures[fixtureIndex];
    if (!fixture) throw new Error('Fixture was not found.');
    fixture.winnerPlayerId = winnerPlayerId;

    if (this.format === 'SINGLE_ELIMINATION') {
      const nextRound = this.rounds.find((entry) => entry.roundNumber === roundNumber + 1);
      if (!nextRound) {
        this.touch();
        return;
      }

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

    this.touch();
  }

  public resolveChampion(): string | null {
    if (this.format === 'ROUND_ROBIN') {
      const scores = new Map<string, number>();
      for (const fixture of this.rounds[0]?.fixtures ?? []) {
        if (fixture.homePlayerId !== 'BYE') scores.set(fixture.homePlayerId, scores.get(fixture.homePlayerId) ?? 0);
        if (fixture.awayPlayerId !== 'BYE') scores.set(fixture.awayPlayerId, scores.get(fixture.awayPlayerId) ?? 0);
        if (fixture.winnerPlayerId && fixture.winnerPlayerId !== 'BYE') {
          scores.set(fixture.winnerPlayerId, (scores.get(fixture.winnerPlayerId) ?? 0) + 2);
        }
      }

      const ranking = [...scores.entries()].sort((a, b) => b[1] - a[1]);
      return ranking[0]?.[0] ?? null;
    }

    const finalRound = this.rounds[this.rounds.length - 1];
    const finalFixture = finalRound?.fixtures[0];
    return finalFixture?.winnerPlayerId ?? null;
  }

  public isCompleted(): boolean {
    return this.rounds.every((round) => round.fixtures.every((fixture) => Boolean(fixture.winnerPlayerId)));
  }

  private touch(): void {
    this.updatedAtIso = new Date().toISOString();
  }
}
