import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createApp } from '../../src/app.js';

describe('TournamentController integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates tournament and records winner progression', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/tournaments',
      payload: { name: 'Test Cup', participants: ['A', 'B', 'C', 'D'], roundModes: ['X01_301', 'X01_501'] },
    });
    expect(created.statusCode).toBe(201);
    const tournament = created.json() as { tournamentId: string };

    const advanced = await app.inject({
      method: 'POST',
      url: `/api/tournaments/${tournament.tournamentId}/winner`,
      payload: { roundNumber: 1, fixtureIndex: 0, winnerPlayerId: 'A' },
    });

    expect(advanced.statusCode).toBe(200);
  });
});
