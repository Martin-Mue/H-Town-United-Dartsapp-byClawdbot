import type { TournamentAggregate } from '../../domain/aggregates/TournamentAggregate.js';
import type { TournamentRepository } from '../../domain/repositories/TournamentRepository.js';

/** In-memory tournament repository for local and development environments. */
export class InMemoryTournamentRepository implements TournamentRepository {
  private readonly store = new Map<string, TournamentAggregate>();

  async save(tournament: TournamentAggregate): Promise<void> {
    this.store.set(tournament.tournamentId, tournament);
  }

  async findById(tournamentId: string): Promise<TournamentAggregate | null> {
    return this.store.get(tournamentId) ?? null;
  }

  async findAll(): Promise<TournamentAggregate[]> {
    return [...this.store.values()];
  }
}
