import type { DartsMatchAggregate } from '../aggregates/DartsMatchAggregate.js';

/** Repository contract for match aggregate persistence and retrieval. */
export interface MatchRepository {
  /** Persists the full aggregate state. */
  save(match: DartsMatchAggregate): Promise<void>;

  /** Finds a match aggregate by id or returns null when not found. */
  findById(matchId: string): Promise<DartsMatchAggregate | null>;

  /** Returns all known matches, primarily for local admin and debugging endpoints. */
  findAll(): Promise<DartsMatchAggregate[]>;
}
