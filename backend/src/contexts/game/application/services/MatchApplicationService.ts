import { randomUUID } from 'node:crypto';
import type { EventBus } from '../../../../shared/application/EventBus.js';
import { DartsMatchAggregate } from '../../domain/aggregates/DartsMatchAggregate.js';
import { PlayerLegState } from '../../domain/entities/PlayerLegState.js';
import type { MatchRepository } from '../../domain/repositories/MatchRepository.js';
import type { CreateMatchRequestDto } from '../dto/CreateMatchRequestDto.js';
import type { MatchStateDto } from '../dto/MatchStateDto.js';
import type { RegisterTurnRequestDto } from '../dto/RegisterTurnRequestDto.js';

/** Coordinates match use cases between API and domain layer. */
export class MatchApplicationService {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly eventBus: EventBus,
  ) {}

  /** Creates and persists a new match aggregate from setup payload. */
  public async createMatch(request: CreateMatchRequestDto): Promise<MatchStateDto> {
    const matchId = `match-${randomUUID()}`;

    const startingScore = request.mode === 'X01_301' ? 301 : 501;
    const players = request.players.map(
      (player) => new PlayerLegState(player.playerId, player.displayName, player.checkoutMode, startingScore),
    );

    const match = new DartsMatchAggregate(
      matchId,
      {
        mode: request.mode,
        legsPerSet: request.legsPerSet,
        setsToWin: request.setsToWin,
        startingPlayerId: request.startingPlayerId,
      },
      players,
    );

    await this.matchRepository.save(match);
    return this.toStateDto(match);
  }

  /** Registers a turn and emits resulting domain events. */
  public async registerTurn(request: RegisterTurnRequestDto): Promise<MatchStateDto> {
    const match = await this.matchRepository.findById(request.matchId);
    if (!match) throw new Error('Match was not found.');

    match.registerTurn(request.points, request.finalDartMultiplier);

    await this.matchRepository.save(match);
    await this.eventBus.publish(match.pullDomainEvents());

    return this.toStateDto(match);
  }

  /** Registers one cricket throw and emits resulting domain events. */
  public async registerCricketTurn(request: {
    matchId: string;
    targetNumber: number;
    multiplier: 1 | 2 | 3;
  }): Promise<MatchStateDto> {
    const match = await this.matchRepository.findById(request.matchId);
    if (!match) throw new Error('Match was not found.');

    match.registerCricketTurn(request.targetNumber, request.multiplier);

    await this.matchRepository.save(match);
    await this.eventBus.publish(match.pullDomainEvents());

    return this.toStateDto(match);
  }

  /** Returns current read model representation of one match by id. */
  public async getMatchState(matchId: string): Promise<MatchStateDto> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) throw new Error('Match was not found.');
    return this.toStateDto(match);
  }

  /** Returns compact listing of all in-memory matches. */
  public async listMatches(): Promise<MatchStateDto[]> {
    const matches = await this.matchRepository.findAll();
    return matches.map((match) => this.toStateDto(match));
  }

  /** Maps match aggregate to stable API response DTO. */
  private toStateDto(match: DartsMatchAggregate): MatchStateDto {
    const players = match.getPlayers();

    return {
      matchId: match.matchId,
      winnerPlayerId: match.getWinnerPlayerId(),
      activePlayerId: match.getActivePlayer().playerId,
      players: players.map((player) => ({
        playerId: player.playerId,
        displayName: player.displayName,
        score: player.score,
        cricketScore: match.getCricketScore(player.playerId),
        average: Number(player.getThreeDartAverage().toFixed(2)),
        checkoutPercentage: Number(player.getCheckoutPercentage().toFixed(2)),
        highestTurnScore: player.highestTurnScore,
        cricketMarks: {
          m15: match.getCricketMarks(player.playerId, 15),
          m16: match.getCricketMarks(player.playerId, 16),
          m17: match.getCricketMarks(player.playerId, 17),
          m18: match.getCricketMarks(player.playerId, 18),
          m19: match.getCricketMarks(player.playerId, 19),
          m20: match.getCricketMarks(player.playerId, 20),
          bull: match.getCricketMarks(player.playerId, 25),
        },
      })),
      scoreboard: players.map((player) => ({
        playerId: player.playerId,
        legs: match.getScoreboard().getLegs(player.playerId),
        sets: match.getScoreboard().getSets(player.playerId),
      })),
    };
  }
}
