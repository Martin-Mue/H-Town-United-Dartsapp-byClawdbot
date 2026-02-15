import { io, type Socket } from 'socket.io-client';

/** Contract for live synchronization between devices and clubs. */
export interface LiveMatchSocketClient {
  /** Connects to backend websocket endpoint. */
  connect(): Promise<void>;

  /** Subscribes to one match room for live score and event updates. */
  subscribeToMatch(matchId: string): void;

  /** Disconnects and releases active subscriptions. */
  disconnect(): void;
}

/** Socket.IO client implementation for live match synchronization. */
export class SocketIoLiveMatchClient implements LiveMatchSocketClient {
  private socket: Socket | null = null;

  constructor(private readonly baseUrl: string) {}

  /** Connects to backend websocket endpoint. */
  async connect(): Promise<void> {
    this.socket = io(this.baseUrl, { path: '/ws' });
    await new Promise<void>((resolve) => {
      this.socket?.on('connect', () => resolve());
    });
  }

  /** Subscribes to one match room for live score and event updates. */
  subscribeToMatch(matchId: string): void {
    this.socket?.emit('match:subscribe', matchId);
  }

  /** Disconnects and releases active subscriptions. */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
