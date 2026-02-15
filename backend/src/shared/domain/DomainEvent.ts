/** Represents a domain event emitted by an aggregate root. */
export interface DomainEvent {
  readonly eventName: string;
  readonly occurredOn: Date;
}
