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
import { TournamentApplicationService } from './contexts/tournament/application/services/TournamentApplicationService.js';
import { TournamentController } from './contexts/tournament/infrastructure/controllers/TournamentController.js';
import { FileTournamentRepository } from './contexts/tournament/infrastructure/repositories/FileTournamentRepository.js';
import { CompositeEventBus } from './shared/infrastructure/CompositeEventBus.js';
import { InMemoryEventBus } from './shared/infrastructure/InMemoryEventBus.js';
import { SocketIoEventBus } from './shared/infrastructure/SocketIoEventBus.js';
import { CameraRecognitionReviewService } from './contexts/media-vision/application/services/CameraRecognitionReviewService.js';

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

  const pendingDetectedVisits = new Map<string, Array<{ points: number; multiplier: 1 | 2 | 3; targetNumber?: 15 | 16 | 17 | 18 | 19 | 20 | 25 }>>();

  io.on('connection', (socket) => {
    socket.on('match:subscribe', (matchId: string) => {
      socket.join(`match:${matchId}`);
      socket.emit('match:subscribed', { matchId });
    });

    socket.on('camera:join', (matchId: string) => {
      socket.join(`camera:${matchId}`);
      socket.emit('camera:joined', { matchId });
    });

    socket.on('webrtc:signal', (payload: { matchId: string; signal: unknown }) => {
      if (!payload?.matchId) return;
      socket.to(`camera:${payload.matchId}`).emit('webrtc:signal', { from: socket.id, signal: payload.signal });
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

  const tournamentService = new TournamentApplicationService(
    new FileTournamentRepository(process.env.TOURNAMENT_STORE_FILE ?? 'backend/data/tournaments.json'),
  );

  if ((await tournamentService.listTournaments()).length === 0) {
    await tournamentService.createTournament({
      name: 'H-Town Open',
      format: 'SINGLE_ELIMINATION',
      participants: ['Player A', 'Player B', 'Player C', 'Player D'],
      roundModes: ['X01_301', 'X01_501', 'CUSTOM'],
    });
  }

  const tokenService = new JwtTokenService(process.env.JWT_SECRET ?? 'dev-secret');
  const cameraReviewService = new CameraRecognitionReviewService();

  app.post('/api/identity/token', async (request) => {
    const body = request.body as { userId?: string };
    const userId = body?.userId ?? 'local-dev-user';
    return { accessToken: tokenService.signAccessToken(userId) };
  });

  app.get('/api/health', async () => ({ status: 'ok' }));

  app.get('/api/global-ranking', async () => ({
    ranking: matchService.getGlobalRanking(),
  }));

  app.get('/api/game/recent', async () => {
    const matches = await matchService.listMatches();
    return {
      matches: matches.slice(-6).reverse().map((match) => ({
        matchId: match.matchId,
        mode: match.mode,
        winnerPlayerId: match.winnerPlayerId,
        players: match.players.map((p) => p.displayName),
      })),
    };
  });

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


  app.post('/api/media-vision/calibrate-board', async (request, reply) => {
    const body = (request.body ?? {}) as { matchId?: string };
    if (!body.matchId) return reply.code(400).send({ message: 'matchId required' });

    const confidence = Number((0.72 + Math.random() * 0.25).toFixed(2));
    return {
      matchId: body.matchId,
      calibrationId: `cal-${Date.now()}`,
      confidence,
      quality: confidence > 0.88 ? 'HIGH' : confidence > 0.78 ? 'MEDIUM' : 'LOW',
    };
  });

  app.post('/api/media-vision/detect-visit', async (request, reply) => {
    const body = (request.body ?? {}) as { matchId?: string; mode?: 'X01_301' | 'X01_501' | 'CRICKET' | 'CUSTOM' };
    if (!body.matchId) return reply.code(400).send({ message: 'matchId required' });

    const pending = pendingDetectedVisits.get(body.matchId);
    if (pending && pending.length > 0) {
      pendingDetectedVisits.delete(body.matchId);
      return {
        matchId: body.matchId,
        boardState: 'DARTS_CLEARED',
        throws: pending,
        confidence: 0.9,
        requiresManualReview: false,
      };
    }

    const generated = body.mode === 'CRICKET'
      ? [{ targetNumber: 20, multiplier: 1 as const, points: 20 }, { targetNumber: 19, multiplier: 1 as const, points: 19 }, { targetNumber: 18, multiplier: 1 as const, points: 18 }]
      : [{ points: 60, multiplier: 3 as const }, { points: 45, multiplier: 3 as const }, { points: 20, multiplier: 1 as const }];

    const confidence = Number((0.68 + Math.random() * 0.29).toFixed(2));
    const requiresManualReview = confidence < 0.78;

    pendingDetectedVisits.set(body.matchId, generated);
    return {
      matchId: body.matchId,
      boardState: 'DARTS_PRESENT',
      throws: generated,
      confidence,
      requiresManualReview,
    };
  });


  app.post('/api/media-vision/detect-throw', async (request, reply) => {
    const body = (request.body ?? {}) as { matchId?: string; suggestedPoints?: number; suggestedMultiplier?: 1 | 2 | 3 };
    if (!body.matchId) return reply.code(400).send({ message: 'matchId required' });

    const suggestedPoints = Math.max(0, Math.min(180, Number(body.suggestedPoints ?? 0)));
    const suggestedMultiplier = body.suggestedMultiplier === 2 || body.suggestedMultiplier === 3 ? body.suggestedMultiplier : 1;
    const confidence = Number((0.58 + Math.random() * 0.4).toFixed(2));

    return {
      matchId: body.matchId,
      turnId: `vision-${Date.now()}`,
      points: suggestedPoints,
      multiplier: suggestedMultiplier,
      confidence,
      requiresManualReview: confidence < 0.78,
      source: 'camera-beta-assist',
    };
  });

  app.post('/api/media-vision/manual-correction', async (request, reply) => {
    const body = (request.body ?? {}) as { matchId?: string; turnId?: string; correctedPoints?: number; correctedMultiplier?: 1 | 2 | 3; reason?: string };
    if (!body.matchId || !body.turnId) return reply.code(400).send({ message: 'matchId and turnId required' });

    const normalized = cameraReviewService.applyManualCorrection({
      matchId: body.matchId,
      turnId: body.turnId,
      correctedPoints: Math.max(0, Math.min(180, Number(body.correctedPoints ?? 0))),
      correctedMultiplier: body.correctedMultiplier === 2 || body.correctedMultiplier === 3 ? body.correctedMultiplier : 1,
      reason: body.reason ?? 'manual-review',
    });

    return normalized;
  });

  new GameController(matchService).registerRoutes(app);
  new TournamentController(tournamentService).registerRoutes(app);

  return app;
}
