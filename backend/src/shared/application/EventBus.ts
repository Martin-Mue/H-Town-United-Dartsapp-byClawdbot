import type { DomainEvent } from '../domain/DomainEvent.js';

/** Contract for asynchronous domain event delivery. */
export interface EventBus {
  /** Publishes one or more domain events to subscribers. */
  publish(events: DomainEvent[]): Promise<void>;
}
