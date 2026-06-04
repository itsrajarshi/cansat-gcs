import { describe, expect, it } from 'vitest';
import { calculateErrorCode, parseTelemetry } from '@/services/telemetryParser';
import { TelemetryPacket } from '@/types/telemetry';

function makePacket(overrides: Partial<TelemetryPacket>): TelemetryPacket {
  return {
    packetId: 1,
    missionTime: '12:00:00',
    altitude: 500,
    pressure: 101325,
    temperature: 25,
    voltage: 4.2,
    gpsLatitude: 17,
    gpsLongitude: 78,
    gpsAltitude: 520,
    descentRate: -9,
    payloadAltitude: 480,
    payloadTemperature: 24,
    payloadVoltage: 3.9,
    payloadGpsLatitude: 17.0001,
    payloadGpsLongitude: 78.0001,
    payloadGpsAltitude: 490,
    payloadSeparationSuccess: true,
    payloadStatus: 'Separated',
    roll: 0,
    pitch: 0,
    yaw: 0,
    emergencyParachuteActive: false,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('telemetryParser.parseTelemetry', () => {
  it('parses extended 21-field packet', () => {
    const raw =
      '123,12:45:10,512.5,101325,28.4,4.1,17.3850,78.4867,510,9.2,' +
      '100,20,3.7,17.38,78.48,100,1,10,5,90,1';

    const parsed = parseTelemetry(raw);
    expect(parsed.success).toBe(true);
    if (!parsed.success || !parsed.data) throw new Error('expected success');

    expect(parsed.data.packetId).toBe(123);
    expect(parsed.data.payloadSeparationSuccess).toBe(true);
    expect(parsed.data.payloadStatus).toBe('Separated');
    expect(parsed.data.roll).toBe(10);
    expect(parsed.data.pitch).toBe(5);
    expect(parsed.data.yaw).toBe(90);
    expect(parsed.data.emergencyParachuteActive).toBe(true);
  });

  it('parses base 10-field packet and augments missing payload fields', () => {
    const raw = '123,12:45:10,512.5,101325,28.4,4.1,17.3850,78.4867,510,9.2';
    const parsed = parseTelemetry(raw);
    expect(parsed.success).toBe(true);
    if (!parsed.success || !parsed.data) throw new Error('expected success');

    expect(parsed.data.payloadSeparationSuccess).toBe(false);
    expect(parsed.data.payloadStatus).toBe('Not Separated');
    expect(parsed.data.roll).toBe(0);
    expect(parsed.data.pitch).toBe(0);
    expect(parsed.data.yaw).toBe(0);
    expect(parsed.data.emergencyParachuteActive).toBe(false);
  });

  it('rejects invalid field counts', () => {
    const raw = '1,12:45:10,512.5';
    const parsed = parseTelemetry(raw);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toMatch(/Expected/i);
  });
});

describe('telemetryParser.calculateErrorCode', () => {
  it('returns 0000 for normal conditions', () => {
    const packet = makePacket({
      descentRate: -9,
      gpsLatitude: 17,
      gpsLongitude: 78,
      payloadSeparationSuccess: true,
      emergencyParachuteActive: false,
    });

    const code = calculateErrorCode(packet);
    expect(code.code).toBe('0000');
  });

  it('returns 0100 for GPS failure only', () => {
    const packet = makePacket({
      descentRate: -9,
      gpsLatitude: 0,
      gpsLongitude: 0,
      payloadSeparationSuccess: true,
      emergencyParachuteActive: false,
    });

    const code = calculateErrorCode(packet);
    expect(code.code).toBe('0100');
  });

  it('returns 1111 for all fault conditions', () => {
    const packet = makePacket({
      descentRate: -12,
      gpsLatitude: 0,
      gpsLongitude: 0,
      payloadSeparationSuccess: false,
      emergencyParachuteActive: true,
    });

    const code = calculateErrorCode(packet);
    expect(code.code).toBe('1111');
  });
});

