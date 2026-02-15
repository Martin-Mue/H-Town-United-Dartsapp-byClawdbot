import type { GameMode } from '../../../game/domain/value-objects/GameMode.js';

export type TournamentFormat = 'SINGLE_ELIMINATION' | 'ROUND_ROBIN';
export type ByePlacement = 'ROUND_1' | 'DISTRIBUTED' | 'PLAY_IN';
export type SeedingMode = 'RANDOM' | 'MANUAL' | 'RANKING';

export interface TournamentSettingsDto {
  byePlacement: ByePlacement;
  seedingMode: SeedingMode;
  defaultLegsPerSet: number;
  defaultSetsToWin: number;
  allowRoundModeSwitch: boolean;
}

/** Request payload for creating one tournament bracket. */
export interface CreateTournamentRequestDto {
  name: string;
  format: TournamentFormat;
  participants: string[];
  roundModes: GameMode[];
  settings?: TournamentSettingsDto;
}
