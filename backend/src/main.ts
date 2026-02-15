import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { Server as SocketServer } from 'socket.io';
import { MatchApplicationService } from './contexts/game/application/services/MatchApplicationService.js';
import { PlayerLegState } from './contexts/game/domain/entities/PlayerLegState.js';
import { GameController } from './contexts/game/infrastructure/controllers/GameController.js';
import { InMemoryMatchRepository } from './contexts/game/infrastructure/repositories/InMemoryMatchRepository.js';
import { JwtTokenService } from './contexts/identity/application/services/JwtTokenService.js';
import { CompositeEventBus } from './shared/infrastructure/CompositeEventBus.js';
import { InMemoryEventBus } from './shared/infrastructure/InMemoryEventBus.js';
import { SocketIoEventBus } from './shared/infrastructure/SocketIoEventBus.js';

/** Bootstraps HTTP and WebSocket runtime for H-Town United platform. */
async function bootstrap(): Promise<void> {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await app.register(fastifyJwt, { secret: process.env.JWT_SECRET ?? 'dev-secret' });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'H-Town United Darts Platform API',
        version: '0.2.0',
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

  new GameController(matchService).registerRoutes(app);

  await app.listen({ port: 8080, host: '0.0.0.0' });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
