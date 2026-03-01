import { TournamentRound } from '../entities/TournamentRound.js';
import type { GameMode } from '../../../game/domain/value-objects/GameMode.js';
import type { TournamentFormat, TournamentSettingsDto } from '../../application/dto/CreateTournamentRequestDto.js';

/** Handles tournament mode strategy and bracket progression state. */
export class TournamentAggregate {
  private updatedAtIso: string;

  constructor(
    public readonly tournamentId: string,
    public readonly name: string,
    public readonly format: TournamentFormat,
    public readonly settings: TournamentSettingsDto,
    private readonly rounds: TournamentRound[],
    private readonly isRoundModeChangeAllowed: boolean,
    updatedAtIso?: string,
  ) {
    this.updatedAtIso = updatedAtIso ?? new Date().toISOString();
  }

  public get updatedAt(): string {
    return this.updatedAtIso;
  }

  public getRounds(): ReadonlyArray<TournamentRound> {
    return this.rounds;
  }

  public setRoundMode(roundNumber: number, mode: GameMode): void {
    if (!this.isRoundModeChangeAllowed) {
      throw new Error('Round mode changes are disabled for this tournament.');
    }

    const round = this.rounds.find((entry) => entry.roundNumber === roundNumber);
    if (!round) throw new Error('Round was not found.');
    round.setMode(mode);
    this.touch();
  }

  public linkFixtureMatch(roundNumber: number, fixtureIndex: number, matchId: string): void {
    const currentRound = this.rounds.find((entry) => entry.roundNumber === roundNumber);
    if (!currentRound) throw new Error('Round was not found.');
    const fixture = currentRound.fixtures[fixtureIndex];
    if (!fixture) throw new Error('Fixture was not found.');
    if (fixture.linkedMatchId) throw new Error('Fixture already linked to a match.');
    if (fixture.winnerPlayerId) throw new Error('Fixture already completed.');
    if ([fixture.homePlayerId, fixture.awayPlayerId].some((p) => p === 'TBD' || p === 'BYE')) {
      throw new Error('Fixture is not start-ready.');
    }
    fixture.linkedMatchId = matchId;
    this.touch();
  }

  public recordFixtureWinner(roundNumber: number, fixtureIndex: number, winnerPlayerId: string, resultLabel?: string): void {
    const currentRound = this.rounds.find((entry) => entry.roundNumber === roundNumber);
    if (!currentRound) throw new Error('Round was not found.');

    const fixture = currentRound.fixtures[fixtureIndex];
    if (!fixture) throw new Error('Fixture was not found.');
    if (fixture.winnerPlayerId) throw new Error('Fixture already has a winner.');

    const participants = [fixture.homePlayerId, fixture.awayPlayerId];
    const hasBye = participants.includes('BYE');
    const hasTbd = participants.includes('TBD');

    if (hasTbd) throw new Error('Fixture not ready.');

    if (hasBye) {
      const isFreilos = resultLabel === 'Freilos';
      const validByeWinner = participants.includes(winnerPlayerId) && winnerPlayerId !== 'BYE';
      if (!isFreilos || !validByeWinner) throw new Error('BYE fixtures are auto-resolved only.');
    } else if (!participants.includes(winnerPlayerId)) {
      throw new Error('Winner must be one of fixture participants.');
    }

    fixture.winnerPlayerId = winnerPlayerId;
    fixture.resultLabel = resultLabel;

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
    return finalRound?.fixtures[0]?.winnerPlayerId ?? null;
  }

  public isCompleted(): boolean {
    return this.rounds.every((round) => round.fixtures.every((fixture) => Boolean(fixture.winnerPlayerId)));
  }

  private touch(): void {
    this.updatedAtIso = new Date().toISOString();
  }
}
