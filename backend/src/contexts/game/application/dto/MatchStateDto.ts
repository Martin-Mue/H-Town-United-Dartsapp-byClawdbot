/** Read model for returning complete match state to API clients. */
export interface MatchStateDto {
  matchId: string;
  mode: 'X01_301' | 'X01_501' | 'CRICKET' | 'CUSTOM';
  winnerPlayerId: string | null;
  activePlayerId: string;
  players: Array<{
    playerId: string;
    displayName: string;
    score: number;
    cricketScore: number;
    average: number;
    checkoutPercentage: number;
    highestTurnScore: number;
    cricketMarks: {
      m15: number;
      m16: number;
      m17: number;
      m18: number;
      m19: number;
      m20: number;
      bull: number;
    };
  }>;
  scoreboard: Array<{
    playerId: string;
    legs: number;
    sets: number;
  }>;
  legResults: Array<{
    legNumber: number;
    winnerPlayerId: string;
    winnerDisplayName: string;
    setsAfterLeg: number;
    totalLegsWonAfterLeg: number;
  }>;
}
