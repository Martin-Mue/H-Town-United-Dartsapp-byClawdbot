import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { MatchApplicationService } from '../../application/services/MatchApplicationService.js';

/** Registers game-related REST endpoints and request validation. */
export class GameController {
  constructor(private readonly matchApplicationService: MatchApplicationService) {}

  /** Binds all game routes into Fastify app. */
  public registerRoutes(app: FastifyInstance): void {
    app.post('/api/game/matches', async (request, reply) => {
      const schema = z.object({
        mode: z.enum(['X01_301', 'X01_501', 'CRICKET', 'CUSTOM']),
        legsPerSet: z.number().int().min(1).max(15),
        setsToWin: z.number().int().min(1).max(9),
        startingPlayerId: z.string().min(1),
        players: z
          .array(
            z.object({
              playerId: z.string().min(1),
              displayName: z.string().min(1),
              checkoutMode: z.enum(['SINGLE_OUT', 'DOUBLE_OUT', 'MASTER_OUT']),
            }),
          )
          .min(2)
          .max(8),
      });

      const payload = schema.parse(request.body);
      const state = await this.matchApplicationService.createMatch(payload);
      return reply.code(201).send(state);
    });

    app.get('/api/game/matches', async () => this.matchApplicationService.listMatches());

    app.get('/api/game/matches/:matchId', async (request) => {
      const params = z.object({ matchId: z.string() }).parse(request.params);
      return this.matchApplicationService.getMatchState(params.matchId);
    });

    app.post('/api/game/matches/:matchId/turns', async (request, reply) => {
      const params = z.object({ matchId: z.string() }).parse(request.params);
      const body = z
        .object({
          points: z.number().int().min(0).max(180),
          finalDartMultiplier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        })
        .parse(request.body);

      const state = await this.matchApplicationService.registerTurn({
        matchId: params.matchId,
        points: body.points,
        finalDartMultiplier: body.finalDartMultiplier,
      });
      return reply.code(200).send(state);
    });
  }
}
