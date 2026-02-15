import type { EventBus } from '../application/EventBus.js';
import type { DomainEvent } from '../domain/DomainEvent.js';

/** Minimal in-memory event bus for local development and tests. */
export class InMemoryEventBus implements EventBus {
  /** Publishes events by logging them; replace with broker for production. */
  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      console.log(`[DomainEvent] ${event.eventName}`, event);
    }
  }
}
