import type { GameMode } from '../../../game/domain/value-objects/GameMode.js';

/** Read model for tournament bracket and mode configuration. */
export interface TournamentStateDto {
  tournamentId: string;
  name: string;
  rounds: Array<{
    roundNumber: number;
    mode: GameMode;
    fixtures: Array<{ homePlayerId: string; awayPlayerId: string; winnerPlayerId?: string }>;
  }>;
}
