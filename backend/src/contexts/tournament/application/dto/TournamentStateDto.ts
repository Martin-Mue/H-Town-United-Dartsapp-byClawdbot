import type { GameMode } from '../../../game/domain/value-objects/GameMode.js';
import type { TournamentFormat } from './CreateTournamentRequestDto.js';

/** Read model for tournament bracket and mode configuration. */
export interface TournamentStateDto {
  tournamentId: string;
  name: string;
  format: TournamentFormat;
  championPlayerId: string | null;
  isCompleted: boolean;
  updatedAt: string;
  rounds: Array<{
    roundNumber: number;
    mode: GameMode;
    fixtures: Array<{ homePlayerId: string; awayPlayerId: string; winnerPlayerId?: string }>;
  }>;
}
