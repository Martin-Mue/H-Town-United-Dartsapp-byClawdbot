import type { GameMode } from '../../../game/domain/value-objects/GameMode.js';

export type TournamentFormat = 'SINGLE_ELIMINATION' | 'ROUND_ROBIN';

/** Request payload for creating one tournament bracket. */
export interface CreateTournamentRequestDto {
  name: string;
  format: TournamentFormat;
  participants: string[];
  roundModes: GameMode[];
}
