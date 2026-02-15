import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { TournamentAggregate } from '../../domain/aggregates/TournamentAggregate.js';
import { TournamentRound } from '../../domain/entities/TournamentRound.js';
import type { TournamentRepository } from '../../domain/repositories/TournamentRepository.js';
import type { TournamentFormat } from '../../application/dto/CreateTournamentRequestDto.js';

type TournamentSnapshot = {
  tournamentId: string;
  name: string;
  format: TournamentFormat;
  updatedAt: string;
  rounds: Array<{
    roundNumber: number;
    mode: 'X01_301' | 'X01_501' | 'CRICKET' | 'CUSTOM';
    fixtures: Array<{ homePlayerId: string; awayPlayerId: string; winnerPlayerId?: string }>;
  }>;
};

/** File-backed repository to persist tournaments + history across restarts. */
export class FileTournamentRepository implements TournamentRepository {
  private readonly store = new Map<string, TournamentAggregate>();
  private hydrated = false;

  constructor(private readonly filePath: string) {}

  async save(tournament: TournamentAggregate): Promise<void> {
    await this.hydrate();
    this.store.set(tournament.tournamentId, tournament);
    await this.flush();
  }

  async findById(tournamentId: string): Promise<TournamentAggregate | null> {
    await this.hydrate();
    return this.store.get(tournamentId) ?? null;
  }

  async findAll(): Promise<TournamentAggregate[]> {
    await this.hydrate();
    return [...this.store.values()];
  }

  private async hydrate(): Promise<void> {
    if (this.hydrated) return;
    this.hydrated = true;

    try {
      const raw = await readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as TournamentSnapshot[];
      for (const entry of parsed) {
        const rounds = entry.rounds.map((round) => new TournamentRound(round.roundNumber, round.mode, round.fixtures));
        const aggregate = new TournamentAggregate(entry.tournamentId, entry.name, entry.format, rounds, true, entry.updatedAt);
        this.store.set(entry.tournamentId, aggregate);
      }
    } catch {
      // no persisted file yet
    }
  }

  private async flush(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const snapshots: TournamentSnapshot[] = [...this.store.values()].map((tournament) => ({
      tournamentId: tournament.tournamentId,
      name: tournament.name,
      format: tournament.format,
      updatedAt: tournament.updatedAt,
      rounds: tournament.getRounds().map((round) => ({
        roundNumber: round.roundNumber,
        mode: round.mode,
        fixtures: round.fixtures,
      })),
    }));

    await writeFile(this.filePath, JSON.stringify(snapshots, null, 2), 'utf-8');
  }
}
