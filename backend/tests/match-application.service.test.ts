import { describe, expect, it } from 'vitest';
import { MatchApplicationService } from '../src/contexts/game/application/services/MatchApplicationService.js';
import { InMemoryMatchRepository } from '../src/contexts/game/infrastructure/repositories/InMemoryMatchRepository.js';
import { InMemoryEventBus } from '../src/shared/infrastructure/InMemoryEventBus.js';

describe('MatchApplicationService', () => {
  it('creates, updates and returns match state', async () => {
    const service = new MatchApplicationService(new InMemoryMatchRepository(), new InMemoryEventBus());

    const created = await service.createMatch({
      mode: 'X01_301',
      legsPerSet: 3,
      setsToWin: 2,
      startingPlayerId: 'p1',
      players: [
        { playerId: 'p1', displayName: 'One', checkoutMode: 'DOUBLE_OUT' },
        { playerId: 'p2', displayName: 'Two', checkoutMode: 'DOUBLE_OUT' },
      ],
    });

    const updated = await service.registerTurn({
      matchId: created.matchId,
      points: 60,
      finalDartMultiplier: 1,
    });

    expect(updated.players.find((player) => player.playerId === 'p1')?.score).toBe(241);
    expect(updated.activePlayerId).toBe('p2');

    const fetched = await service.getMatchState(created.matchId);
    expect(fetched.matchId).toBe(created.matchId);
  });
});
