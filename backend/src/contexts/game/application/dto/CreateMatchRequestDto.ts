import type { CheckoutMode } from '../../domain/value-objects/CheckoutMode.js';
import type { GameMode } from '../../domain/value-objects/GameMode.js';

/** Request payload for creating a new darts match. */
export interface CreateMatchRequestDto {
  mode: GameMode;
  legsPerSet: number;
  setsToWin: number;
  startingPlayerId: string;
  players: Array<{
    playerId: string;
    displayName: string;
    checkoutMode: CheckoutMode;
  }>;
}
