/** Read model for returning complete match state to API clients. */
export interface MatchStateDto {
  matchId: string;
  winnerPlayerId: string | null;
  activePlayerId: string;
  players: Array<{
    playerId: string;
    displayName: string;
    score: number;
    average: number;
    checkoutPercentage: number;
    highestTurnScore: number;
  }>;
  scoreboard: Array<{
    playerId: string;
    legs: number;
    sets: number;
  }>;
}
