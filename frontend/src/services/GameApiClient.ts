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
  mode: GameMode;
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
    dartsUsedByWinner: number;
    turnsByWinner: number;
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

  /** Registers one x01 turn and returns latest match state. */
  public async registerTurn(
    matchId: string,
    payload: { points: number; finalDartMultiplier: 1 | 2 | 3; dartsUsed?: 1 | 2 | 3 },
  ): Promise<MatchStateDto> {
    const response = await fetch(`${this.baseUrl}/api/game/matches/${matchId}/turns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to register turn.');
    return response.json();
  }

  /** Registers one cricket hit and returns latest match state. */
  public async registerCricketTurn(
    matchId: string,
    payload: { targetNumber: 15 | 16 | 17 | 18 | 19 | 20 | 25; multiplier: 1 | 2 | 3 },
  ): Promise<MatchStateDto> {
    const response = await fetch(`${this.baseUrl}/api/game/matches/${matchId}/turns/cricket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to register cricket turn.');
    return response.json();
  }

  /** Registers up to 3 cricket darts as one visit for the active player. */
  public async registerCricketVisit(
    matchId: string,
    payload: { throws: Array<{ targetNumber: 15 | 16 | 17 | 18 | 19 | 20 | 25; multiplier: 1 | 2 | 3 }> },
  ): Promise<MatchStateDto> {
    const response = await fetch(`${this.baseUrl}/api/game/matches/${matchId}/turns/cricket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to register cricket visit.');
    return response.json();
  }



  public async detectThrowWithCamera(payload: { matchId: string; suggestedPoints: number; suggestedMultiplier: 1 | 2 | 3 }): Promise<{
    matchId: string;
    turnId: string;
    points: number;
    multiplier: 1 | 2 | 3;
    confidence: number;
    requiresManualReview: boolean;
    source: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/media-vision/detect-throw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to detect throw via camera.');
    return response.json();
  }

  public async applyManualCameraCorrection(payload: {
    matchId: string;
    turnId: string;
    correctedPoints: number;
    correctedMultiplier: 1 | 2 | 3;
    reason: string;
  }): Promise<{ points: number; multiplier: 1 | 2 | 3; confidence: number; manuallyCorrected: true }> {
    const response = await fetch(`${this.baseUrl}/api/media-vision/manual-correction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to apply manual correction.');
    return response.json();
  }

  /** Resolves a match winner after bull-off decision. */
  public async registerBullOffWinner(matchId: string, payload: { winnerPlayerId: string }): Promise<MatchStateDto> {
    const response = await fetch(`${this.baseUrl}/api/game/matches/${matchId}/bull-off-winner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to register bull-off winner.');
    return response.json();
  }

  /** Loads one match state for live match continuation. */
  public async getMatch(matchId: string): Promise<MatchStateDto> {
    const response = await fetch(`${this.baseUrl}/api/game/matches/${matchId}`);
    if (!response.ok) throw new Error('Failed to fetch match.');
    return response.json();
  }
}
