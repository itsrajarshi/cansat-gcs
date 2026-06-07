/**
 * WebSocket telemetry service
 * - Receives raw telemetry packet strings
 * - Pushes them to a consumer callback
 */

export type WebSocketMessageHandler = (message: string) => void;
export type WebSocketErrorHandler = (error: Error) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private onMessage: WebSocketMessageHandler | null = null;
  private onError: WebSocketErrorHandler | null = null;

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  public connect(url: string): Promise<void> {
    if (!url) return Promise.reject(new Error('WebSocket URL is empty'));
    if (this.isConnected()) return Promise.resolve();

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => resolve();
        this.socket.onmessage = (event) => {
          // Most telemetry messages will be raw packet strings.
          const data = typeof event.data === 'string' ? event.data : event.data?.toString?.() ?? '';
          if (data) this.onMessage?.(data);
        };
        this.socket.onerror = () => {
          const err = new Error('WebSocket error');
          this.onError?.(err);
          reject(err);
        };

        this.socket.onclose = () => {
          this.socket = null;
        };
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to connect WebSocket');
        reject(err);
      }
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
    }
    this.socket = null;
  }

  public setOnMessage(handler: WebSocketMessageHandler): void {
    this.onMessage = handler;
  }

  public setOnError(handler: WebSocketErrorHandler): void {
    this.onError = handler;
  }

  public send(message: string): void {
    if (!this.isConnected() || !this.socket) {
      throw new Error('WebSocket is not connected');
    }
    this.socket.send(message);
  }
}

export const webSocketService = new WebSocketService();

