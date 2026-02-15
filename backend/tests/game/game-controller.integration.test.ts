import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createApp } from '../../src/app.js';

describe('GameController integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates match and registers one turn through REST endpoints', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/game/matches',
      payload: {
        mode: 'X01_301',
        legsPerSet: 3,
        setsToWin: 2,
        startingPlayerId: 'p1',
        players: [
          { playerId: 'p1', displayName: 'One', checkoutMode: 'DOUBLE_OUT' },
          { playerId: 'p2', displayName: 'Two', checkoutMode: 'DOUBLE_OUT' },
        ],
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json() as { matchId: string };

    const turnResponse = await app.inject({
      method: 'POST',
      url: `/api/game/matches/${created.matchId}/turns`,
      payload: { points: 60, finalDartMultiplier: 1 },
    });

    expect(turnResponse.statusCode).toBe(200);
    const state = turnResponse.json() as { activePlayerId: string };
    expect(state.activePlayerId).toBe('p2');
  });
});
