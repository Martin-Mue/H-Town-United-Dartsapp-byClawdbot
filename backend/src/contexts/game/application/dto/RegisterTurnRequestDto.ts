/** Request payload for registering one player's turn. */
export interface RegisterTurnRequestDto {
  matchId: string;
  points: number;
  finalDartMultiplier: 1 | 2 | 3;
  dartsUsed?: 1 | 2 | 3;
}
