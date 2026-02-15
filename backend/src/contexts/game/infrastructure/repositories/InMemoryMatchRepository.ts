import type { MatchRepository } from '../../domain/repositories/MatchRepository.js';
import type { DartsMatchAggregate } from '../../domain/aggregates/DartsMatchAggregate.js';

/** In-memory repository implementation for rapid prototyping and local tests. */
export class InMemoryMatchRepository implements MatchRepository {
  private readonly store = new Map<string, DartsMatchAggregate>();

  /** Saves or overwrites a match aggregate by id. */
  async save(match: DartsMatchAggregate): Promise<void> {
    this.store.set(match.matchId, match);
  }

  /** Returns a match by id from local memory. */
  async findById(matchId: string): Promise<DartsMatchAggregate | null> {
    return this.store.get(matchId) ?? null;
  }

  /** Returns all known matches from local in-memory store. */
  async findAll(): Promise<DartsMatchAggregate[]> {
    return [...this.store.values()];
  }
}
