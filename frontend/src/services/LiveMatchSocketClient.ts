/** Contract for live synchronization between devices and clubs. */
export interface LiveMatchSocketClient {
  /** Connects to backend websocket endpoint. */
  connect(): Promise<void>;

  /** Subscribes to one match room for live score and event updates. */
  subscribeToMatch(matchId: string): void;

  /** Disconnects and releases active subscriptions. */
  disconnect(): void;
}
