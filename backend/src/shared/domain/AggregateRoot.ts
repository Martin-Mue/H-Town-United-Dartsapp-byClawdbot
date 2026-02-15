import type { DomainEvent } from './DomainEvent.js';

/** Base aggregate root with domain event buffering support. */
export abstract class AggregateRoot {
  private readonly domainEvents: DomainEvent[] = [];

  /** Adds a domain event to the aggregate local event queue. */
  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  /** Pulls and clears pending events after transaction boundaries. */
  public pullDomainEvents(): DomainEvent[] {
    const snapshot = [...this.domainEvents];
    this.domainEvents.length = 0;
    return snapshot;
  }
}
