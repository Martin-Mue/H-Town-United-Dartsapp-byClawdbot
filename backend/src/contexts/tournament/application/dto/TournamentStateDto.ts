import type { GameMode } from '../../../game/domain/value-objects/GameMode.js';
import type { TournamentFormat, TournamentSettingsDto } from './CreateTournamentRequestDto.js';

/** Read model for tournament bracket and mode configuration. */
export interface TournamentStateDto {
  tournamentId: string;
  name: string;
  format: TournamentFormat;
  championPlayerId: string | null;
  isCompleted: boolean;
  updatedAt: string;
  settings: TournamentSettingsDto;
  rounds: Array<{
    roundNumber: number;
    mode: GameMode;
    fixtures: Array<{
      homePlayerId: string;
      awayPlayerId: string;
      winnerPlayerId?: string;
      resultLabel?: string;
      linkedMatchId?: string;
    }>;
  }>;
}
