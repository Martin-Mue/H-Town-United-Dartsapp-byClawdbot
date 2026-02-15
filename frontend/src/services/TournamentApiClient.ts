export type RoundMode = 'X01_301' | 'X01_501' | 'CRICKET' | 'CUSTOM';

export interface TournamentStateDto {
  tournamentId: string;
  name: string;
  rounds: Array<{
    roundNumber: number;
    mode: RoundMode;
    fixtures: Array<{ homePlayerId: string; awayPlayerId: string; winnerPlayerId?: string }>;
  }>;
}

/** API client for tournament create/list and bracket progression operations. */
export class TournamentApiClient {
  constructor(private readonly baseUrl: string) {}

  async listTournaments(): Promise<TournamentStateDto[]> {
    const response = await fetch(`${this.baseUrl}/api/tournaments`);
    if (!response.ok) throw new Error('Failed to list tournaments.');
    return response.json();
  }

  async createTournament(payload: { name: string; participants: string[]; roundModes: RoundMode[] }): Promise<TournamentStateDto> {
    const response = await fetch(`${this.baseUrl}/api/tournaments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create tournament.');
    return response.json();
  }

  async setRoundMode(tournamentId: string, roundNumber: number, mode: RoundMode): Promise<TournamentStateDto> {
    const response = await fetch(`${this.baseUrl}/api/tournaments/${tournamentId}/round-mode`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roundNumber, mode }),
    });
    if (!response.ok) throw new Error('Failed to set round mode.');
    return response.json();
  }

  async recordWinner(tournamentId: string, roundNumber: number, fixtureIndex: number, winnerPlayerId: string): Promise<TournamentStateDto> {
    const response = await fetch(`${this.baseUrl}/api/tournaments/${tournamentId}/winner`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roundNumber, fixtureIndex, winnerPlayerId }),
    });
    if (!response.ok) throw new Error('Failed to record winner.');
    return response.json();
  }
}
