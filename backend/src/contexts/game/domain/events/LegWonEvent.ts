import type { DomainEvent } from '../../../../shared/domain/DomainEvent.js';

/** Raised when one player closes a leg. */
export class LegWonEvent implements DomainEvent {
  public readonly eventName = 'game.leg_won';
  public readonly occurredOn = new Date();

  constructor(
    public readonly matchId: string,
    public readonly winnerPlayerId: string,
    public readonly legNumber: number,
  ) {}
}
