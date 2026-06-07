import { describe, expect, it } from 'vitest';
import {
  formatMissionCommand,
  formatSyncTimeCommand,
  tryHandleCommandLine,
} from '@/services/missionCommandService';

describe('missionCommandService', () => {
  it('formats mission commands with newline terminator', () => {
    expect(formatMissionCommand('separation')).toBe('CMD:SEPARATE\n');
    expect(formatMissionCommand('parachute')).toBe('CMD:PARACHUTE\n');
    expect(formatMissionCommand('redundant_activation')).toBe('CMD:REDUNDANT\n');
  });

  it('formats sync time command', () => {
    expect(formatSyncTimeCommand(1710000000000)).toBe('CMD:SYNC_TIME:1710000000000\n');
  });

  it('recognizes command ACK lines', () => {
    expect(tryHandleCommandLine('ACK:SEPARATE')).toBe(true);
    expect(tryHandleCommandLine('ack:parachute')).toBe(true);
    expect(tryHandleCommandLine('ACK:SYNC_TIME')).toBe(true);
    expect(tryHandleCommandLine('123,12:45:10,512.5,101325,28.4,4.1,17.3850,78.4867,510,9.2')).toBe(false);
  });
});
