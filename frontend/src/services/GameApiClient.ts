export type CheckoutMode = 'SINGLE_OUT' | 'DOUBLE_OUT' | 'MASTER_OUT';
export type GameMode = 'X01_301' | 'X01_501' | 'CRICKET' | 'CUSTOM';

export interface MatchCreationRequest {
  mode: GameMode;
  legsPerSet: number;
  setsToWin: number;
  startingPlayerId: string;
  players: Array<{ playerId: string; displayName: string; checkoutMode: CheckoutMode }>;
}

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

/** Provides strongly typed API methods for the game bounded context. */
export class GameApiClient {
  constructor(private readonly baseUrl: string) {}

  /** Creates a new match and returns initial state snapshot. */
  public async createMatch(payload: MatchCreationRequest): Promise<MatchStateDto> {
    const response = await fetch(`${this.baseUrl}/api/game/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create match.');
    return response.json();
  }

  /** Registers one turn and returns latest match state. */
  public async registerTurn(
    matchId: string,
    payload: { points: number; finalDartMultiplier: 1 | 2 | 3 },
  ): Promise<MatchStateDto> {
    const response = await fetch(`${this.baseUrl}/api/game/matches/${matchId}/turns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to register turn.');
    return response.json();
  }

  /** Loads one match state for live match continuation. */
  public async getMatch(matchId: string): Promise<MatchStateDto> {
    const response = await fetch(`${this.baseUrl}/api/game/matches/${matchId}`);
    if (!response.ok) throw new Error('Failed to fetch match.');
    return response.json();
  }
}
