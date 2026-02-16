import { describe, expect, it } from 'vitest';
import { DartsMatchAggregate } from '../src/contexts/game/domain/aggregates/DartsMatchAggregate.js';
import { PlayerLegState } from '../src/contexts/game/domain/entities/PlayerLegState.js';

describe('DartsMatchAggregate', () => {
  it('rejects invalid double-out checkout and switches player', () => {
    const match = new DartsMatchAggregate(
      'm1',
      { mode: 'X01_301', legsPerSet: 1, setsToWin: 1, startingPlayerId: 'p1' },
      [
        new PlayerLegState('p1', 'One', 'DOUBLE_OUT', 40),
        new PlayerLegState('p2', 'Two', 'DOUBLE_OUT', 40),
      ],
    );

    match.registerTurn(40, 1);

    expect(match.getPlayers()[0].score).toBe(40);
    expect(match.getActivePlayer().playerId).toBe('p2');
  });

  it('wins with valid double-out and produces winner', () => {
    const match = new DartsMatchAggregate(
      'm2',
      { mode: 'X01_301', legsPerSet: 1, setsToWin: 1, startingPlayerId: 'p1' },
      [new PlayerLegState('p1', 'One', 'DOUBLE_OUT', 40), new PlayerLegState('p2', 'Two', 'DOUBLE_OUT', 40)],
    );

    match.registerTurn(40, 2);

    expect(match.getWinnerPlayerId()).toBe('p1');
    expect(match.pullDomainEvents()).toHaveLength(1);
  });

  it('keeps all 3 darts of a cricket visit on the same active player', () => {
    const match = new DartsMatchAggregate(
      'm3',
      { mode: 'CRICKET', legsPerSet: 1, setsToWin: 1, startingPlayerId: 'p1' },
      [new PlayerLegState('p1', 'One', 'DOUBLE_OUT', 0), new PlayerLegState('p2', 'Two', 'DOUBLE_OUT', 0)],
    );

    match.registerCricketVisit([
      { targetNumber: 20, multiplier: 3 },
      { targetNumber: 20, multiplier: 3 },
      { targetNumber: 20, multiplier: 3 },
    ]);

    expect(match.getCricketMarks('p1', 20)).toBe(3);
    expect(match.getCricketMarks('p2', 20)).toBe(0);
    expect(match.getActivePlayer().playerId).toBe('p2');
  });
});
