import { describe, expect, it } from 'vitest';
import { TournamentAggregate } from '../../src/contexts/tournament/domain/aggregates/TournamentAggregate.js';
import { TournamentRound } from '../../src/contexts/tournament/domain/entities/TournamentRound.js';

describe('Tournament integrity guardrails', () => {
  it('rejects winner not part of fixture', () => {
    const tournament = new TournamentAggregate(
      't1',
      'Integrity',
      'SINGLE_ELIMINATION',
      {
        byePlacement: 'ROUND_1',
        seedingMode: 'RANDOM',
        defaultLegsPerSet: 3,
        defaultSetsToWin: 2,
        allowRoundModeSwitch: true,
      },
      [new TournamentRound(1, 'X01_501', [{ homePlayerId: 'A', awayPlayerId: 'B' }])],
      true,
    );

    expect(() => tournament.recordFixtureWinner(1, 0, 'C')).toThrow('Winner must be one of fixture participants.');
  });

  it('rejects linking non-ready or already linked fixtures', () => {
    const tournament = new TournamentAggregate(
      't2',
      'Integrity',
      'SINGLE_ELIMINATION',
      {
        byePlacement: 'ROUND_1',
        seedingMode: 'RANDOM',
        defaultLegsPerSet: 3,
        defaultSetsToWin: 2,
        allowRoundModeSwitch: true,
      },
      [new TournamentRound(1, 'X01_501', [{ homePlayerId: 'A', awayPlayerId: 'B' }, { homePlayerId: 'A', awayPlayerId: 'BYE' }])],
      true,
    );

    tournament.linkFixtureMatch(1, 0, 'm-1');
    expect(() => tournament.linkFixtureMatch(1, 0, 'm-2')).toThrow('Fixture already linked to a match.');
    expect(() => tournament.linkFixtureMatch(1, 1, 'm-3')).toThrow('Fixture is not start-ready.');
  });
});
