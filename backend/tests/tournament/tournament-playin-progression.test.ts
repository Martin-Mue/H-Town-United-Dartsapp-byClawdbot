import { describe, expect, it } from 'vitest';
import { TournamentApplicationService } from '../../src/contexts/tournament/application/services/TournamentApplicationService.js';
import { InMemoryTournamentRepository } from '../../src/contexts/tournament/infrastructure/repositories/InMemoryTournamentRepository.js';

describe('Tournament Play-In progression', () => {
  it('propagates winners from play-in to semifinal and final consistently', async () => {
    const service = new TournamentApplicationService(new InMemoryTournamentRepository());

    const created = await service.createTournament({
      name: 'Play-In Progression',
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

    // Play-In round has 4 fixtures: two direct qualifiers via BYE + two qualification matches.
    expect(created.rounds[0].fixtures.length).toBe(4);

    // Determine the two non-BYE fixtures and set winners.
    const playInFixtures = created.rounds[0].fixtures;
    const realFixtureIndexes = playInFixtures
      .map((fixture, index) => ({ fixture, index }))
      .filter(({ fixture }) => fixture.homePlayerId !== 'BYE' && fixture.awayPlayerId !== 'BYE')
      .map(({ index }) => index);

    expect(realFixtureIndexes.length).toBe(2);

    const firstQualiWinner = playInFixtures[realFixtureIndexes[0]].homePlayerId;
    const secondQualiWinner = playInFixtures[realFixtureIndexes[1]].awayPlayerId;

    const afterFirst = await service.recordWinner(created.tournamentId, 1, realFixtureIndexes[0], firstQualiWinner);
    const afterSecond = await service.recordWinner(afterFirst.tournamentId, 1, realFixtureIndexes[1], secondQualiWinner);

    const semifinal = afterSecond.rounds[1];
    expect(semifinal.fixtures.length).toBe(2);
    expect(semifinal.fixtures.every((f) => f.homePlayerId !== 'TBD' && f.awayPlayerId !== 'TBD')).toBe(true);

    const semi1Winner = semifinal.fixtures[0].homePlayerId;
    const semi2Winner = semifinal.fixtures[1].awayPlayerId;

    const afterSemi1 = await service.recordWinner(afterSecond.tournamentId, 2, 0, semi1Winner);
    const afterSemi2 = await service.recordWinner(afterSemi1.tournamentId, 2, 1, semi2Winner);

    const finalRound = afterSemi2.rounds[2];
    expect(finalRound.fixtures.length).toBe(1);
    expect(finalRound.fixtures[0].homePlayerId).toBe(semi1Winner);
    expect(finalRound.fixtures[0].awayPlayerId).toBe(semi2Winner);
  });
});
