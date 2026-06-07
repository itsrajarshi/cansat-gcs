/**
 * Mission command protocol for CanSat GCS ↔ microcontroller communication.
 * Commands and ACKs use newline-terminated ASCII strings over Serial or WebSocket.
 */

import { serialService } from '@/services/webSerialService';
import { webSocketService } from '@/services/webSocketService';

export type MissionCommandType = 'separation' | 'parachute' | 'redundant_activation';
export type CommandTransport = 'serial' | 'websocket';

const COMMAND_PAYLOAD: Record<MissionCommandType, string> = {
  separation: 'CMD:SEPARATE',
  parachute: 'CMD:PARACHUTE',
  redundant_activation: 'CMD:REDUNDANT',
};

const ACK_PATTERNS: Record<MissionCommandType, RegExp> = {
  separation: /^ACK:SEPARATE$/i,
  parachute: /^ACK:PARACHUTE$/i,
  redundant_activation: /^ACK:REDUNDANT$/i,
};

const SYNC_TIME_ACK = /^ACK:SYNC_TIME$/i;

const pendingAckResolvers = new Map<MissionCommandType, () => void>();
let pendingSyncTimeResolver: (() => void) | null = null;

export function formatMissionCommand(type: MissionCommandType): string {
  return `${COMMAND_PAYLOAD[type]}\n`;
}

export function formatSyncTimeCommand(unixMs: number = Date.now()): string {
  return `CMD:SYNC_TIME:${unixMs}\n`;
}

/**
 * Returns true when the line was a command ACK (not telemetry).
 */
export function tryHandleCommandLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  for (const [type, pattern] of Object.entries(ACK_PATTERNS) as [MissionCommandType, RegExp][]) {
    if (pattern.test(trimmed)) {
      pendingAckResolvers.get(type)?.();
      pendingAckResolvers.delete(type);
      return true;
    }
  }

  if (SYNC_TIME_ACK.test(trimmed)) {
    pendingSyncTimeResolver?.();
    pendingSyncTimeResolver = null;
    return true;
  }

  return false;
}

export function waitForCommandAck(type: MissionCommandType, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingAckResolvers.delete(type);
      resolve(false);
    }, timeoutMs);

    pendingAckResolvers.set(type, () => {
      clearTimeout(timer);
      pendingAckResolvers.delete(type);
      resolve(true);
    });
  });
}

export function waitForSyncTimeAck(timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingSyncTimeResolver = null;
      resolve(false);
    }, timeoutMs);

    pendingSyncTimeResolver = () => {
      clearTimeout(timer);
      pendingSyncTimeResolver = null;
      resolve(true);
    };
  });
}

export async function sendMissionCommand(type: MissionCommandType, transport: CommandTransport): Promise<void> {
  const payload = formatMissionCommand(type);
  if (transport === 'serial') {
    await serialService.send(payload);
  } else {
    webSocketService.send(payload);
  }
}

export async function sendSyncTimeCommand(transport: CommandTransport): Promise<number> {
  const unixMs = Date.now();
  const payload = formatSyncTimeCommand(unixMs);
  if (transport === 'serial') {
    await serialService.send(payload);
  } else {
    webSocketService.send(payload);
  }
  return unixMs;
}
