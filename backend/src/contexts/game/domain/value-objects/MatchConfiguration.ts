import type { GameMode } from './GameMode.js';

/** Defines immutable match setup for legs, sets, mode, and first player. */
export interface MatchConfiguration {
  mode: GameMode;
  legsPerSet: number;
  setsToWin: number;
  startingPlayerId: string;
}
