import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createApp } from '../../src/app.js';

describe('Global ranking integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns ranking list payload', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/global-ranking' });
    expect(response.statusCode).toBe(200);
    const payload = response.json() as { ranking: Array<{ playerId: string; rating: number }> };
    expect(Array.isArray(payload.ranking)).toBe(true);
  });
});
