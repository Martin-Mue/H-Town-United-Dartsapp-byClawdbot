import type { Server } from 'socket.io';
import type { EventBus } from '../application/EventBus.js';
import type { DomainEvent } from '../domain/DomainEvent.js';

/** Publishes domain events to websocket channels for live client synchronization. */
export class SocketIoEventBus implements EventBus {
  constructor(private readonly io: Server) {}

  /** Emits each domain event globally and, when possible, to match-specific rooms. */
  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      this.io.emit('domain:event', event);

      const maybeMatchId = (event as { matchId?: string }).matchId;
      if (maybeMatchId) {
        this.io.to(`match:${maybeMatchId}`).emit('match:event', event);
      }
    }
  }
}
