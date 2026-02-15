/** Request payload for registering one player's turn. */
export interface RegisterTurnRequestDto {
  matchId: string;
  points: number;
  finalDartMultiplier: 1 | 2 | 3;
}
