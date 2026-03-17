import { io, type Socket } from 'socket.io-client';

/** Contract for live synchronization between devices and clubs. */
export interface LiveMatchSocketClient {
  /** Connects to backend websocket endpoint. */
  connect(): Promise<void>;

  /** Subscribes to one match room for live score and event updates. */
  subscribeToMatch(matchId: string): void;

  /** Joins camera room for remote feed signaling. */
  joinCameraRoom(matchId: string): void;

  /** Relays webrtc signaling payload to remote peer. */
  sendWebRtcSignal(matchId: string, signal: unknown): void;

  /** Subscribes to incoming webrtc signal packets. */
  onWebRtcSignal(handler: (payload: { from: string; signal: unknown }) => void): void;

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

  joinCameraRoom(matchId: string): void {
    this.socket?.emit('camera:join', matchId);
  }

  sendWebRtcSignal(matchId: string, signal: unknown): void {
    this.socket?.emit('webrtc:signal', { matchId, signal });
  }

  onWebRtcSignal(handler: (payload: { from: string; signal: unknown }) => void): void {
    this.socket?.on('webrtc:signal', handler);
  }

  /** Disconnects and releases active subscriptions. */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
