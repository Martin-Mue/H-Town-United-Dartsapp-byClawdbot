import type { GameMode } from '../../../game/domain/value-objects/GameMode.js';

/** Defines mode assignment strategy for tournament rounds. */
export interface TournamentRoundMode {
  roundNumber: number;
  mode: GameMode;
}
