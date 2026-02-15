import { describe, expect, it } from 'vitest';
import { LeagueStandingsService } from '../../src/contexts/league/domain/services/LeagueStandingsService.js';

describe('LeagueStandingsService', () => {
  it('orders table by points then leg difference', () => {
    const service = new LeagueStandingsService();

    const table = service.calculateTable({
      teams: [
        { teamId: 'a', teamName: 'A' },
        { teamId: 'b', teamName: 'B' },
        { teamId: 'c', teamName: 'C' },
      ],
      fixtures: [
        { homeTeamId: 'a', awayTeamId: 'b', homeLegs: 8, awayLegs: 4, isFinished: true },
        { homeTeamId: 'c', awayTeamId: 'a', homeLegs: 7, awayLegs: 7, isFinished: true },
      ],
    });

    expect(table[0].teamId).toBe('a');
  });
});
