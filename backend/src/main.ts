import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { createServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { InMemoryEventBus } from './shared/infrastructure/InMemoryEventBus.js';
import { InMemoryMatchRepository } from './contexts/game/infrastructure/repositories/InMemoryMatchRepository.js';
import { MatchApplicationService } from './contexts/game/application/services/MatchApplicationService.js';
import { GameController } from './contexts/game/infrastructure/controllers/GameController.js';
import { DartsMatchAggregate } from './contexts/game/domain/aggregates/DartsMatchAggregate.js';
import { PlayerLegState } from './contexts/game/domain/entities/PlayerLegState.js';

/** Bootstraps HTTP and WebSocket runtime for H-Town United platform. */
async function bootstrap(): Promise<void> {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'H-Town United Darts Platform API',
        version: '0.1.0',
      },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  const repository = new InMemoryMatchRepository();
  const eventBus = new InMemoryEventBus();
  const matchService = new MatchApplicationService(repository, eventBus);

  const sampleMatch = new DartsMatchAggregate('match-dev-001', 'X01_501', 501, [
    new PlayerLegState('p1', 'Player One', 'DOUBLE_OUT', 501),
    new PlayerLegState('p2', 'Player Two', 'DOUBLE_OUT', 501),
  ]);
  await repository.save(sampleMatch);

  new GameController(matchService).registerRoutes(app);

  app.get('/api/health', async () => ({ status: 'ok' }));

  const httpServer = createServer(app.server);
  const io = new SocketServer(httpServer, {
    cors: { origin: '*' },
    path: '/ws',
  });

  io.on('connection', (socket) => {
    app.log.info({ socketId: socket.id }, 'WebSocket client connected');
    socket.emit('system:ready', { timestamp: new Date().toISOString() });
  });

  await app.ready();
  httpServer.listen(8080, () => app.log.info('Backend listening on :8080'));
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
