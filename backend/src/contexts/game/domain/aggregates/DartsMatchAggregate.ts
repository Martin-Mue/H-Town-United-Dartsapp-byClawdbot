import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';
import { LegWonEvent } from '../events/LegWonEvent.js';
import { MatchScoreboard } from '../entities/MatchScoreboard.js';
import { PlayerLegState } from '../entities/PlayerLegState.js';
import type { MatchConfiguration } from '../value-objects/MatchConfiguration.js';

/**
 * Aggregate root handling full match flow for x01 modes.
 * Encapsulates bust logic, final-dart checkout constraints, leg/set progression and match winner resolution.
 */
export class DartsMatchAggregate extends AggregateRoot {
  private players: PlayerLegState[];
  private readonly playerOrder: string[];
  private activePlayerIndex = 0;
  private legNumber = 1;
  private winnerPlayerId: string | null = null;
  private readonly scoreboard: MatchScoreboard;

  constructor(
    public readonly matchId: string,
    private readonly configuration: MatchConfiguration,
    players: PlayerLegState[],
  ) {
    super();
    this.players = players;
    this.playerOrder = players.map((p) => p.playerId);
    this.activePlayerIndex = this.playerOrder.findIndex((id) => id === configuration.startingPlayerId);
    if (this.activePlayerIndex < 0) this.activePlayerIndex = 0;
    this.scoreboard = new MatchScoreboard(this.playerOrder);
  }

  /** Returns immutable player leg states. */
  public getPlayers(): ReadonlyArray<PlayerLegState> {
    return this.players;
  }

  /** Returns currently active player state. */
  public getActivePlayer(): PlayerLegState {
    return this.players[this.activePlayerIndex];
  }

  /** Returns running match scoreboard containing legs and sets. */
  public getScoreboard(): MatchScoreboard {
    return this.scoreboard;
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

    if (remaining === 0) player.checkoutAttempts += 1;

    player.applyTurn(points);

    if (remaining === 0) {
      player.successfulCheckouts += 1;
      this.scoreboard.registerLegWinner(player.playerId, this.configuration.legsPerSet);
      this.addDomainEvent(new LegWonEvent(this.matchId, player.playerId, this.legNumber));

      if (this.scoreboard.getSets(player.playerId) >= this.configuration.setsToWin) {
        this.winnerPlayerId = player.playerId;
        return;
      }

      this.startNextLeg();
      return;
    }

    this.moveToNextPlayer();
  }

  /** Returns winner id when match has reached terminal state. */
  public getWinnerPlayerId(): string | null {
    return this.winnerPlayerId;
  }

  /** Produces compact post-match summary for analytics and reporting exports. */
  public getMatchSummary(): {
    winnerPlayerId: string | null;
    legNumber: number;
    scoreboard: Array<{ playerId: string; legs: number; sets: number }>;
    personalRecords: Array<{ playerId: string; highestTurnScore: number; average: number }>;
  } {
    return {
      winnerPlayerId: this.winnerPlayerId,
      legNumber: this.legNumber,
      scoreboard: this.playerOrder.map((playerId) => ({
        playerId,
        legs: this.scoreboard.getLegs(playerId),
        sets: this.scoreboard.getSets(playerId),
      })),
      personalRecords: this.players.map((player) => ({
        playerId: player.playerId,
        highestTurnScore: player.highestTurnScore,
        average: Number(player.getThreeDartAverage().toFixed(2)),
      })),
    };
  }

  /** Validates final throw against configured checkout mode. */
  private isValidCheckout(remaining: number, finalDartMultiplier: 1 | 2 | 3, mode: PlayerLegState['checkoutMode']): boolean {
    if (remaining !== 0) return true;
    if (mode === 'SINGLE_OUT') return true;
    if (mode === 'DOUBLE_OUT') return finalDartMultiplier === 2;
    return finalDartMultiplier === 2 || finalDartMultiplier === 3;
  }

  /** Advances active player index in round-robin order. */
  private moveToNextPlayer(): void {
    this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
  }

  /** Resets leg scores and rotates starting player between legs. */
  private startNextLeg(): void {
    this.legNumber += 1;
    this.players = this.players.map((player) => {
      const next = new PlayerLegState(
        player.playerId,
        player.displayName,
        player.checkoutMode,
        this.configuration.mode === 'X01_301' ? 301 : 501,
      );
      next.totalScored = player.totalScored;
      next.dartsThrown = player.dartsThrown;
      next.checkoutAttempts = player.checkoutAttempts;
      next.successfulCheckouts = player.successfulCheckouts;
      next.highestTurnScore = player.highestTurnScore;
      return next;
    });

    this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
  }
}
