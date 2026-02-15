import { randomUUID } from 'node:crypto';
import { TournamentAggregate } from '../../domain/aggregates/TournamentAggregate.js';
import { TournamentRound } from '../../domain/entities/TournamentRound.js';
import type { TournamentRepository } from '../../domain/repositories/TournamentRepository.js';
import type { CreateTournamentRequestDto, TournamentSettingsDto } from '../dto/CreateTournamentRequestDto.js';
import type { TournamentStateDto } from '../dto/TournamentStateDto.js';

/** Coordinates tournament use-cases between API and domain. */
export class TournamentApplicationService {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  public async createTournament(request: CreateTournamentRequestDto): Promise<TournamentStateDto> {
    const tournamentId = `tournament-${randomUUID()}`;
    const settings = this.resolveSettings(request.settings);
    const rounds = request.format === 'ROUND_ROBIN'
      ? this.buildRoundRobinRounds(request.participants, request.roundModes)
      : this.buildSingleEliminationRounds(request.participants, request.roundModes);

    const tournament = new TournamentAggregate(
      tournamentId,
      request.name,
      request.format,
      settings,
      rounds,
      settings.allowRoundModeSwitch,
    );

    this.autoResolveByes(tournament);
    await this.tournamentRepository.save(tournament);
    return this.toDto(tournament);
  }

  public async listTournaments(): Promise<TournamentStateDto[]> {
    return (await this.tournamentRepository.findAll())
      .map((entry) => this.toDto(entry))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  public async setRoundMode(tournamentId: string, roundNumber: number, mode: 'X01_301' | 'X01_501' | 'CRICKET' | 'CUSTOM'): Promise<TournamentStateDto> {
    const tournament = await this.requireTournament(tournamentId);
    tournament.setRoundMode(roundNumber, mode);
    await this.tournamentRepository.save(tournament);
    return this.toDto(tournament);
  }

  public async linkFixtureMatch(tournamentId: string, roundNumber: number, fixtureIndex: number, matchId: string): Promise<TournamentStateDto> {
    const tournament = await this.requireTournament(tournamentId);
    tournament.linkFixtureMatch(roundNumber, fixtureIndex, matchId);
    await this.tournamentRepository.save(tournament);
    return this.toDto(tournament);
  }

  public async recordWinner(
    tournamentId: string,
    roundNumber: number,
    fixtureIndex: number,
    winnerPlayerId: string,
    resultLabel?: string,
  ): Promise<TournamentStateDto> {
    const tournament = await this.requireTournament(tournamentId);
    tournament.recordFixtureWinner(roundNumber, fixtureIndex, winnerPlayerId, resultLabel);
    this.autoResolveByes(tournament);
    await this.tournamentRepository.save(tournament);
    return this.toDto(tournament);
  }

  private resolveSettings(settings?: CreateTournamentRequestDto['settings']): TournamentSettingsDto {
    return {
      byePlacement: settings?.byePlacement ?? 'ROUND_1',
      seedingMode: settings?.seedingMode ?? 'RANDOM',
      defaultLegsPerSet: settings?.defaultLegsPerSet ?? 3,
      defaultSetsToWin: settings?.defaultSetsToWin ?? 2,
      allowRoundModeSwitch: settings?.allowRoundModeSwitch ?? true,
    };
  }

  private buildSingleEliminationRounds(participantsInput: string[], roundModes: CreateTournamentRequestDto['roundModes']): TournamentRound[] {
    const participants = [...participantsInput];
    const targetSize = Math.max(2, 2 ** Math.ceil(Math.log2(Math.max(2, participants.length))));
    while (participants.length < targetSize) participants.push('BYE');

    const rounds: TournamentRound[] = [];
    let currentSize = participants.length;
    let roundNumber = 1;
    while (currentSize >= 2) {
      const fixtureCount = currentSize / 2;
      const fixtures = Array.from({ length: fixtureCount }, (_, index) => ({
        homePlayerId: roundNumber === 1 ? participants[index * 2] ?? 'TBD' : 'TBD',
        awayPlayerId: roundNumber === 1 ? participants[index * 2 + 1] ?? 'TBD' : 'TBD',
      }));

      rounds.push(new TournamentRound(roundNumber, roundModes[roundNumber - 1] ?? 'X01_501', fixtures));
      currentSize = fixtureCount;
      roundNumber += 1;
    }

    return rounds;
  }

  private buildRoundRobinRounds(participantsInput: string[], roundModes: CreateTournamentRequestDto['roundModes']): TournamentRound[] {
    const participants = [...participantsInput];
    const fixtures: Array<{ homePlayerId: string; awayPlayerId: string; winnerPlayerId?: string; resultLabel?: string; linkedMatchId?: string }> = [];

    for (let i = 0; i < participants.length; i += 1) {
      for (let j = i + 1; j < participants.length; j += 1) {
        fixtures.push({ homePlayerId: participants[i], awayPlayerId: participants[j] });
      }
    }

    return [new TournamentRound(1, roundModes[0] ?? 'X01_501', fixtures)];
  }

  private autoResolveByes(tournament: TournamentAggregate): void {
    let changed = true;
    while (changed) {
      changed = false;
      for (const round of tournament.getRounds()) {
        round.fixtures.forEach((fixture, fixtureIndex) => {
          if (fixture.winnerPlayerId) return;
          const validHome = fixture.homePlayerId !== 'BYE' && fixture.homePlayerId !== 'TBD';
          const validAway = fixture.awayPlayerId !== 'BYE' && fixture.awayPlayerId !== 'TBD';
          if (validHome && fixture.awayPlayerId === 'BYE') {
            tournament.recordFixtureWinner(round.roundNumber, fixtureIndex, fixture.homePlayerId, 'Freilos');
            changed = true;
          }
          if (validAway && fixture.homePlayerId === 'BYE') {
            tournament.recordFixtureWinner(round.roundNumber, fixtureIndex, fixture.awayPlayerId, 'Freilos');
            changed = true;
          }
        });
      }
    }
  }

  private async requireTournament(tournamentId: string): Promise<TournamentAggregate> {
    const tournament = await this.tournamentRepository.findById(tournamentId);
    if (!tournament) throw new Error('Tournament was not found.');
    return tournament;
  }

  private toDto(tournament: TournamentAggregate): TournamentStateDto {
    return {
      tournamentId: tournament.tournamentId,
      name: tournament.name,
      format: tournament.format,
      championPlayerId: tournament.isCompleted() ? tournament.resolveChampion() : null,
      isCompleted: tournament.isCompleted(),
      updatedAt: tournament.updatedAt,
      settings: tournament.settings,
      rounds: tournament.getRounds().map((round) => ({
        roundNumber: round.roundNumber,
        mode: round.mode,
        fixtures: round.fixtures,
      })),
    };
  }
}
