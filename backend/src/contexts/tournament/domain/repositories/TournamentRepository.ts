import type { TournamentAggregate } from '../aggregates/TournamentAggregate.js';

/** Repository contract for tournament aggregate persistence and retrieval. */
export interface TournamentRepository {
  save(tournament: TournamentAggregate): Promise<void>;
  findById(tournamentId: string): Promise<TournamentAggregate | null>;
  findAll(): Promise<TournamentAggregate[]>;
}
