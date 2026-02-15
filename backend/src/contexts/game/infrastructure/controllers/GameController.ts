import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { MatchApplicationService } from '../../application/services/MatchApplicationService.js';

/** Registers game-related REST endpoints and request validation. */
export class GameController {
  constructor(private readonly matchApplicationService: MatchApplicationService) {}

  /** Binds all game routes into Fastify app. */
  public registerRoutes(app: FastifyInstance): void {
    app.post('/api/game/register-turn', async (request, reply) => {
      const schema = z.object({
        matchId: z.string().min(1),
        points: z.number().int().min(0).max(180),
        finalDartMultiplier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      });

      const payload = schema.parse(request.body);
      await this.matchApplicationService.registerTurn(payload);
      return reply.code(204).send();
    });
  }
}
