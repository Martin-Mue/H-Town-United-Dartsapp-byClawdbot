import type { EventBus } from '../../../../shared/application/EventBus.js';
import type { MatchRepository } from '../../domain/repositories/MatchRepository.js';
import type { RegisterTurnRequestDto } from '../dto/RegisterTurnRequestDto.js';

/** Coordinates match use cases between API and domain layer. */
export class MatchApplicationService {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly eventBus: EventBus,
  ) {}

  /** Registers a turn and emits resulting domain events. */
  public async registerTurn(request: RegisterTurnRequestDto): Promise<void> {
    const match = await this.matchRepository.findById(request.matchId);
    if (!match) throw new Error('Match was not found.');

    match.registerTurn(request.points, request.finalDartMultiplier);

    await this.matchRepository.save(match);
    await this.eventBus.publish(match.pullDomainEvents());
  }
}
