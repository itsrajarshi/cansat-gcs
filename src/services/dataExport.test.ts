import { describe, expect, it } from 'vitest';
import { exportTelemetryCSV } from '@/services/dataExport';
import { TelemetryPacket } from '@/types/telemetry';

const samplePacket: TelemetryPacket = {
  packetId: 1,
  missionTime: '00:01:00',
  altitude: 512.5,
  pressure: 101325,
  temperature: 28.4,
  voltage: 4.1,
  gpsLatitude: 17.385,
  gpsLongitude: 78.4867,
  gpsAltitude: 510,
  descentRate: 9.2,
  payloadAltitude: 490,
  payloadTemperature: 27.1,
  payloadVoltage: 4.0,
  payloadGpsLatitude: 17.384,
  payloadGpsLongitude: 78.486,
  payloadGpsAltitude: 488,
  payloadSeparationSuccess: true,
  payloadStatus: '0000',
  roll: 1.2,
  pitch: -2.4,
  yaw: 90,
  emergencyParachuteActive: false,
  timestamp: 1710000000000,
};

describe('exportTelemetryCSV', () => {
  it('includes container, payload, and error code columns', () => {
    const csv = exportTelemetryCSV([samplePacket]);
    const [headerLine, dataLine] = csv.split('\n');

    expect(headerLine).toContain('ErrorCode');
    expect(headerLine).toContain('PayloadGpsLatitude');
    expect(headerLine).toContain('EmergencyParachuteActive');
    expect(dataLine).toContain('0000');
    expect(dataLine).toContain('17.384000');
    expect(dataLine).toContain('490.00');
  });
});
