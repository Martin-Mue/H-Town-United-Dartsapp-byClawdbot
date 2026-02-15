import type { GameMode } from '../../../game/domain/value-objects/GameMode.js';

/** Request payload for creating one tournament bracket. */
export interface CreateTournamentRequestDto {
  name: string;
  participants: string[];
  roundModes: GameMode[];
}
