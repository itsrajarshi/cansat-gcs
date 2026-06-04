/**
 * Web Serial API Service - Communication with microcontroller via serial port
 */

export interface SerialOptions {
  baudRate?: number;
  dataBits?: number;
  stopBits?: number;
  parity?: 'none' | 'even' | 'odd';
  flowControl?: 'none' | 'hardware';
}

export class SerialService {
  private port: SerialPort | null = null;
  private reader:
  ReadableStreamDefaultReader<string> | null = null;
  private isConnected: boolean = false;
  private onDataCallback: ((data: string) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  /**
   * Check if Web Serial API is supported
   */
  public isSupported(): boolean {
    return 'serial' in navigator;
  }

  /**
   * Connect to serial port
   */
  public async connect(options: SerialOptions = {}): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Web Serial API is not supported in this browser');
    }

    try {
      this.port = await navigator.serial.requestPort();
      const opts: SerialOptions = {
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
        ...options,
      };

      await this.port.open({
  baudRate: opts.baudRate ?? 9600,
});
      this.isConnected = true;
      this.startReading();
    } catch (error) {
      throw new Error(`Failed to connect to serial port: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disconnect from serial port
   */
  public async disconnect(): Promise<void> {
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }

    if (this.port) {
      await this.port.close();
      this.port = null;
    }

    this.isConnected = false;
  }

  /**
   * Start reading data from port
   */
  private async startReading(): Promise<void> {
    if (!this.port) return;

    try {
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed =
  (this.port.readable as any)?.pipeTo(
    textDecoder.writable as any
  );
      this.reader = textDecoder.readable.getReader();

      let lineBuffer = '';

      while (true) {
        if (!this.reader) break;
        const { value, done } = await this.reader.read();

        if (done) {
          break;
        }

        lineBuffer += value;
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine) {
            this.onDataCallback?.(trimmedLine);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        this.onErrorCallback?.(error as Error);
      }
    }
  }

  /**
   * Send data to serial port
   */
  public async send(data: string): Promise<void> {
    if (!this.port || !this.isConnected) {
      throw new Error('Serial port is not connected');
    }

    try {
      const writer = this.port.writable?.getWriter();
      if (!writer) throw new Error('Cannot get writer');

      const encoder = new TextEncoder();
      await writer.write(encoder.encode(data));
      writer.releaseLock();
    } catch (error) {
      throw new Error(`Failed to send data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set data callback
   */
  public onData(callback: (data: string) => void): void {
    this.onDataCallback = callback;
  }

  /**
   * Set error callback
   */
  public onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * List available serial ports
   */
  public async getAvailablePorts(): Promise<SerialPort[]> {
    if (!this.isSupported()) {
      return [];
    }

    try {
      return await navigator.serial.getPorts();
    } catch (error) {
      return [];
    }
  }
}

export const serialService = new SerialService();
