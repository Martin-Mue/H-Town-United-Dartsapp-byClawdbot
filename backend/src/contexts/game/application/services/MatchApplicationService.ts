import { randomUUID } from 'node:crypto';
import type { EventBus } from '../../../../shared/application/EventBus.js';
import { EloRatingService } from '../../../global-ranking/domain/services/EloRatingService.js';
import { DartsMatchAggregate } from '../../domain/aggregates/DartsMatchAggregate.js';
import { PlayerLegState } from '../../domain/entities/PlayerLegState.js';
import type { MatchRepository } from '../../domain/repositories/MatchRepository.js';
import type { CreateMatchRequestDto } from '../dto/CreateMatchRequestDto.js';
import type { MatchStateDto } from '../dto/MatchStateDto.js';
import type { RegisterTurnRequestDto } from '../dto/RegisterTurnRequestDto.js';

/** Coordinates match use cases between API and domain layer. */
export class MatchApplicationService {
  private readonly eloRatingService = new EloRatingService();
  private readonly ratings = new Map<string, number>();

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

    for (const player of players) {
      if (!this.ratings.has(player.playerId)) this.ratings.set(player.playerId, 1200);
    }

    await this.matchRepository.save(match);
    return this.toStateDto(match);
  }

  /** Registers a turn and emits resulting domain events. */
  public async registerTurn(request: RegisterTurnRequestDto): Promise<MatchStateDto> {
    const match = await this.matchRepository.findById(request.matchId);
    if (!match) throw new Error('Match was not found.');

    const previousWinner = match.getWinnerPlayerId();
    match.registerTurn(request.points, request.finalDartMultiplier);
    this.applyEloIfMatchCompleted(match, previousWinner);

    await this.matchRepository.save(match);
    await this.eventBus.publish(match.pullDomainEvents());

    return this.toStateDto(match);
  }

  /** Registers one full cricket visit (up to 3 darts) and emits resulting domain events. */
  public async registerCricketVisit(request: {
    matchId: string;
    throws: Array<{ targetNumber: number; multiplier: 1 | 2 | 3 }>;
  }): Promise<MatchStateDto> {
    const match = await this.matchRepository.findById(request.matchId);
    if (!match) throw new Error('Match was not found.');

    const previousWinner = match.getWinnerPlayerId();
    match.registerCricketVisit(request.throws);
    this.applyEloIfMatchCompleted(match, previousWinner);

    await this.matchRepository.save(match);
    await this.eventBus.publish(match.pullDomainEvents());

    return this.toStateDto(match);
  }

  /** Backward-compatible single throw route. */
  public async registerCricketTurn(request: {
    matchId: string;
    targetNumber: number;
    multiplier: 1 | 2 | 3;
  }): Promise<MatchStateDto> {
    return this.registerCricketVisit({
      matchId: request.matchId,
      throws: [{ targetNumber: request.targetNumber, multiplier: request.multiplier }],
    });
  }


  /** Resolves match by bull-off winner selection and applies ELO once. */
  public async registerBullOffWinner(request: { matchId: string; winnerPlayerId: string }): Promise<MatchStateDto> {
    const match = await this.matchRepository.findById(request.matchId);
    if (!match) throw new Error('Match was not found.');

    const previousWinner = match.getWinnerPlayerId();
    match.resolveBullOffWinner(request.winnerPlayerId);
    this.applyEloIfMatchCompleted(match, previousWinner);

    await this.matchRepository.save(match);
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

  /** Returns global ranking table derived from tracked player ELO ratings. */
  public getGlobalRanking(): Array<{ playerId: string; rating: number }> {
    return [...this.ratings.entries()]
      .map(([playerId, rating]) => ({ playerId, rating }))
      .sort((a, b) => b.rating - a.rating);
  }

  /** Applies ELO rating changes once when a match reaches terminal winner state. */
  private applyEloIfMatchCompleted(match: DartsMatchAggregate, previousWinner: string | null): void {
    const winner = match.getWinnerPlayerId();
    if (!winner || previousWinner === winner) return;

    const loser = match.getPlayers().find((player) => player.playerId !== winner)?.playerId;
    if (!loser) return;

    const winnerRating = this.ratings.get(winner) ?? 1200;
    const loserRating = this.ratings.get(loser) ?? 1200;
    const updated = this.eloRatingService.calculateNewRatings(winnerRating, loserRating);

    this.ratings.set(winner, updated.winner);
    this.ratings.set(loser, updated.loser);
  }

  /** Maps match aggregate to stable API response DTO. */
  private toStateDto(match: DartsMatchAggregate): MatchStateDto {
    const players = match.getPlayers();

    return {
      matchId: match.matchId,
      mode: match.getMode(),
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
