import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { TournamentApplicationService } from '../../application/services/TournamentApplicationService.js';

/** Registers tournament API routes for create, list, mode updates, and winner progression. */
export class TournamentController {
  constructor(private readonly service: TournamentApplicationService) {}

  public registerRoutes(app: FastifyInstance): void {
    app.get('/api/tournaments', async () => this.service.listTournaments());

    app.post('/api/tournaments', async (request, reply) => {
      const body = z.object({
        name: z.string().min(1),
        participants: z.array(z.string().min(1)).min(2),
        roundModes: z.array(z.enum(['X01_301', 'X01_501', 'CRICKET', 'CUSTOM'])).min(1),
      }).parse(request.body);

      const created = await this.service.createTournament(body);
      return reply.code(201).send(created);
    });

    app.post('/api/tournaments/:tournamentId/round-mode', async (request) => {
      const params = z.object({ tournamentId: z.string() }).parse(request.params);
      const body = z.object({ roundNumber: z.number().int().min(1), mode: z.enum(['X01_301', 'X01_501', 'CRICKET', 'CUSTOM']) }).parse(request.body);
      return this.service.setRoundMode(params.tournamentId, body.roundNumber, body.mode);
    });

    app.post('/api/tournaments/:tournamentId/winner', async (request) => {
      const params = z.object({ tournamentId: z.string() }).parse(request.params);
      const body = z.object({ roundNumber: z.number().int().min(1), fixtureIndex: z.number().int().min(0), winnerPlayerId: z.string().min(1) }).parse(request.body);
      return this.service.recordWinner(params.tournamentId, body.roundNumber, body.fixtureIndex, body.winnerPlayerId);
    });
  }
}
