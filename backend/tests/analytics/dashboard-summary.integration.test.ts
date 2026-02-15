import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createApp } from '../../src/app.js';

describe('Dashboard summary endpoint', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns analytics summary payload', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/analytics/dashboard-summary' });
    expect(response.statusCode).toBe(200);
    const payload = response.json() as { clubAverage: number; liveMatches: number };
    expect(typeof payload.clubAverage).toBe('number');
    expect(typeof payload.liveMatches).toBe('number');
  });
});
