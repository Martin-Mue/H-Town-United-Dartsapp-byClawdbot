import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { Server as SocketServer } from 'socket.io';
import { MatchApplicationService } from './contexts/game/application/services/MatchApplicationService.js';
import { GameController } from './contexts/game/infrastructure/controllers/GameController.js';
import { InMemoryMatchRepository } from './contexts/game/infrastructure/repositories/InMemoryMatchRepository.js';
import { JwtTokenService } from './contexts/identity/application/services/JwtTokenService.js';
import { CompositeEventBus } from './shared/infrastructure/CompositeEventBus.js';
import { InMemoryEventBus } from './shared/infrastructure/InMemoryEventBus.js';
import { SocketIoEventBus } from './shared/infrastructure/SocketIoEventBus.js';

/** Builds configured Fastify application with API routes, JWT and websocket event plumbing. */
export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await app.register(fastifyJwt, { secret: process.env.JWT_SECRET ?? 'dev-secret' });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'H-Town United Darts Platform API',
        version: '0.3.0',
      },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  const io = new SocketServer(app.server, {
    cors: { origin: '*' },
    path: '/ws',
  });

  io.on('connection', (socket) => {
    socket.on('match:subscribe', (matchId: string) => {
      socket.join(`match:${matchId}`);
      socket.emit('match:subscribed', { matchId });
    });

    app.log.info({ socketId: socket.id }, 'WebSocket client connected');
    socket.emit('system:ready', { timestamp: new Date().toISOString() });
  });

  const repository = new InMemoryMatchRepository();
  const eventBus = new CompositeEventBus([new InMemoryEventBus(), new SocketIoEventBus(io)]);
  const matchService = new MatchApplicationService(repository, eventBus);

  await matchService.createMatch({
    mode: 'X01_501',
    legsPerSet: 3,
    setsToWin: 2,
    startingPlayerId: 'p1',
    players: [
      { playerId: 'p1', displayName: 'Player One', checkoutMode: 'DOUBLE_OUT' },
      { playerId: 'p2', displayName: 'Player Two', checkoutMode: 'DOUBLE_OUT' },
    ],
  });

  const tokenService = new JwtTokenService(process.env.JWT_SECRET ?? 'dev-secret');

  app.post('/api/identity/token', async (request) => {
    const body = request.body as { userId?: string };
    const userId = body?.userId ?? 'local-dev-user';
    return { accessToken: tokenService.signAccessToken(userId) };
  });

  app.get('/api/health', async () => ({ status: 'ok' }));

  app.get('/api/analytics/dashboard-summary', async () => {
    const matches = await matchService.listMatches();
    const players = matches.flatMap((match) => match.players);
    const averageValues = players.map((player) => player.average).filter((value) => Number.isFinite(value));
    const checkoutValues = players.map((player) => player.checkoutPercentage).filter((value) => Number.isFinite(value));

    const clubAverage = averageValues.length > 0
      ? averageValues.reduce((acc, value) => acc + value, 0) / averageValues.length
      : 0;
    const checkoutAverage = checkoutValues.length > 0
      ? checkoutValues.reduce((acc, value) => acc + value, 0) / checkoutValues.length
      : 0;

    return {
      clubAverage: Number(clubAverage.toFixed(2)),
      checkoutAverage: Number(checkoutAverage.toFixed(2)),
      liveMatches: matches.filter((match) => !match.winnerPlayerId).length,
      topScore180Count: players.filter((player) => player.highestTurnScore >= 180).length,
      activeMatchIds: matches.filter((match) => !match.winnerPlayerId).map((match) => match.matchId),
    };
  });

  new GameController(matchService).registerRoutes(app);

  return app;
}
