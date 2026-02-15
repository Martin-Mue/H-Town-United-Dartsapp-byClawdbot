import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';
import { LegWonEvent } from '../events/LegWonEvent.js';
import { PlayerLegState } from '../entities/PlayerLegState.js';
import type { GameMode } from '../value-objects/GameMode.js';

/**
 * Aggregate root handling full match flow for x01 and future game modes.
 * Encapsulates bust logic, turn order, and winner detection.
 */
export class DartsMatchAggregate extends AggregateRoot {
  private readonly players: PlayerLegState[];
  private activePlayerIndex = 0;
  private completedLegs = 0;
  private winnerPlayerId: string | null = null;

  constructor(
    public readonly matchId: string,
    public readonly mode: GameMode,
    public readonly startingScore: number,
    players: PlayerLegState[],
  ) {
    super();
    this.players = players;
  }

  /** Returns an immutable snapshot of all players in this match. */
  public getPlayers(): ReadonlyArray<PlayerLegState> {
    return this.players;
  }

  /** Returns currently active player state. */
  public getActivePlayer(): PlayerLegState {
    return this.players[this.activePlayerIndex];
  }

  /** Applies one turn and enforces bust/final-dart checkout constraints. */
  public registerTurn(points: number, finalDartMultiplier: 1 | 2 | 3): void {
    if (this.winnerPlayerId) return;

    const player = this.getActivePlayer();
    const remaining = player.score - points;

    if (remaining < 0 || !this.isValidCheckout(remaining, finalDartMultiplier, player.checkoutMode)) {
      this.moveToNextPlayer();
      return;
    }

    player.applyTurn(points);

    if (remaining === 0) {
      this.completedLegs += 1;
      player.checkoutAttempts += 1;
      player.successfulCheckouts += 1;
      this.winnerPlayerId = player.playerId;
      this.addDomainEvent(new LegWonEvent(this.matchId, player.playerId, this.completedLegs));
      return;
    }

    this.moveToNextPlayer();
  }

  /** Returns winner id when match has reached terminal state. */
  public getWinnerPlayerId(): string | null {
    return this.winnerPlayerId;
  }

  /** Validates final throw against configured checkout mode. */
  private isValidCheckout(remaining: number, finalDartMultiplier: 1 | 2 | 3, mode: PlayerLegState['checkoutMode']): boolean {
    if (remaining !== 0) return true;
    if (mode === 'SINGLE_OUT') return true;
    if (mode === 'DOUBLE_OUT') return finalDartMultiplier === 2;
    return finalDartMultiplier === 2 || finalDartMultiplier === 3;
  }

  /** Advances active player turn index in round-robin order. */
  private moveToNextPlayer(): void {
    this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
  }
}
