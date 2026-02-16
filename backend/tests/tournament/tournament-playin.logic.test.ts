import { describe, expect, it } from 'vitest';
import { TournamentApplicationService } from '../../src/contexts/tournament/application/services/TournamentApplicationService.js';
import { InMemoryTournamentRepository } from '../../src/contexts/tournament/infrastructure/repositories/InMemoryTournamentRepository.js';

describe('Tournament Play-In logic', () => {
  it('creates explicit play-in fixtures and direct qualifiers for 6 players', async () => {
    const service = new TournamentApplicationService(new InMemoryTournamentRepository());

    const tournament = await service.createTournament({
      name: 'Play-In Check',
      format: 'SINGLE_ELIMINATION',
      participants: ['A', 'B', 'C', 'D', 'E', 'F'],
      roundModes: ['X01_501', 'X01_501', 'X01_501'],
      settings: {
        byePlacement: 'PLAY_IN',
        seedingMode: 'RANDOM',
        defaultLegsPerSet: 3,
        defaultSetsToWin: 2,
        allowRoundModeSwitch: true,
      },
    });

    expect(tournament.rounds[0]?.fixtures.length).toBe(4);

    const firstRoundFixtures = tournament.rounds[0].fixtures.map((f) => `${f.homePlayerId}|${f.awayPlayerId}`);

    // For 6 players in play-in mode, two players should directly qualify via BYE,
    // and two fixtures should be real qualification matches.
    const byeFixtures = firstRoundFixtures.filter((f) => f.includes('|BYE') || f.startsWith('BYE|'));
    const realFixtures = firstRoundFixtures.filter((f) => !f.includes('BYE'));

    expect(byeFixtures.length).toBe(2);
    expect(realFixtures.length).toBe(2);
  });
});
