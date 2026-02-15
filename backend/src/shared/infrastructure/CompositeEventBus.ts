import type { EventBus } from '../application/EventBus.js';
import type { DomainEvent } from '../domain/DomainEvent.js';

/** Fan-out event bus that forwards events to multiple bus implementations. */
export class CompositeEventBus implements EventBus {
  constructor(private readonly buses: EventBus[]) {}

  /** Publishes events to all configured event buses in parallel. */
  async publish(events: DomainEvent[]): Promise<void> {
    await Promise.all(this.buses.map((bus) => bus.publish(events)));
  }
}
