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
});
