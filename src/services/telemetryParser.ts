/**
 * Telemetry Parser - Parses incoming telemetry packets
 * Expected format: 123,12:45:10,512.5,101325,28.4,4.1,17.3850,78.4867,510,9.2
 */

import { TelemetryPacket, ParsedTelemetry, ErrorCode } from '@/types/telemetry';
import { SAFE_DESCENT_RATE, SEPARATION_EVAL_SECONDS } from '@/utils/constants';
import {
  isValidAltitude,
  isValidDescentRate,
  isValidGPS,
  isValidPressure,
  isValidTemperature,
  isValidVoltage,
  isValidMissionTime,
} from '@/utils/validators';

/**
 * Parse a telemetry packet string into structured data
 */
export function parseTelemetry(packet: string): ParsedTelemetry {
  try {
    const fields = packet
      .trim()
      .split(',')
      .map((f) => f.trim());

    // Guard against missing/empty fields caused by malformed packets.
    const hasEmpty = fields.some((f) => f.length === 0);
    if (hasEmpty) {
      return { success: false, error: 'Invalid packet: one or more fields are empty' };
    }

    // Assignment base example has 10 fields.
    // Extended format appends payload telemetry + attitude + emergency parachute:
    // Fields (21 total):
    //  1 packetId
    //  2 missionTime(HH:MM:SS)
    //  3 altitude(m)
    //  4 pressure(Pa)
    //  5 temperature(C)
    //  6 voltage(V)
    //  7 gpsLatitude
    //  8 gpsLongitude
    //  9 gpsAltitude(m)
    // 10 descentRate(m/s)
    // 11 payloadAltitude(m)
    // 12 payloadTemperature(C)
    // 13 payloadVoltage(V)
    // 14 payloadGpsLatitude
    // 15 payloadGpsLongitude
    // 16 payloadGpsAltitude(m)
    // 17 payloadSeparationSuccess(1/0)
    // 18 roll(deg)
    // 19 pitch(deg)
    // 20 yaw(deg)
    // 21 emergencyParachuteActive(1/0)
    const expectedBaseLen = 10;
    const expectedExtendedLen = 21;

    if (fields.length !== expectedBaseLen && fields.length !== expectedExtendedLen) {
      return {
        success: false,
        error: `Invalid packet format. Expected ${expectedBaseLen} or ${expectedExtendedLen} fields, got ${fields.length}`,
      };
    }

    if (fields.length === expectedBaseLen) {
      const parsed = parseBaseFields(fields);
      if (!parsed.success) return parsed;

      const { warnings, data } = parsed;
      const augmented: TelemetryPacket = {
        ...data,
        payloadAltitude: data.altitude,
        payloadTemperature: data.temperature,
        payloadVoltage: data.voltage,
        payloadGpsLatitude: data.gpsLatitude,
        payloadGpsLongitude: data.gpsLongitude,
        payloadGpsAltitude: data.gpsAltitude,
        payloadSeparationSuccess: false,
        payloadStatus: 'Not Separated',
        roll: 0,
        pitch: 0,
        yaw: 0,
        emergencyParachuteActive: false,
      };

      return { success: true, data: augmented, warnings };
    }

    // Extended format.
    const parsed = parseExtendedFields(fields);
    if (!parsed.success) return parsed;
    return parsed;
  } catch (error) {
    return {
      success: false,
      error: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

type ParseBaseResult =
  | { success: true; data: TelemetryPacket; warnings: string[] }
  | { success: false; error: string; warnings: string[] };

function parseBaseFields(fields: string[]): ParseBaseResult {
  const warnings: string[] = [];

  const packetId = parseInt(fields[0], 10);
  if (Number.isNaN(packetId)) return { success: false, error: 'Invalid packet ID', warnings };

  const missionTime = fields[1];
  if (!isValidMissionTime(missionTime)) return { success: false, error: 'Invalid mission time format (expected HH:MM:SS)', warnings };

  const altitude = parseFloat(fields[2]);
  const pressure = parseFloat(fields[3]);
  const temperature = parseFloat(fields[4]);
  const voltage = parseFloat(fields[5]);
  const gpsLatitude = parseFloat(fields[6]);
  const gpsLongitude = parseFloat(fields[7]);
  const gpsAltitude = parseFloat(fields[8]);
  const descentRate = parseFloat(fields[9]);

  const fieldNaN = [
    ['altitude', altitude],
    ['pressure', pressure],
    ['temperature', temperature],
    ['voltage', voltage],
    ['gpsLatitude', gpsLatitude],
    ['gpsLongitude', gpsLongitude],
    ['gpsAltitude', gpsAltitude],
    ['descentRate', descentRate],
  ].some(([, v]) => Number.isNaN(v));

  if (fieldNaN) return { success: false, error: 'Invalid numeric field(s) in base packet', warnings };

  if (!isValidAltitude(altitude)) warnings.push('Altitude outside expected range');
  if (!isValidPressure(pressure)) warnings.push('Pressure outside expected range');
  if (!isValidTemperature(temperature)) warnings.push('Temperature outside expected range');
  if (!isValidVoltage(voltage)) warnings.push('Voltage outside expected range');
  if (!isValidGPS(gpsLatitude, gpsLongitude)) warnings.push('GPS lat/lon invalid');
  if (!isValidDescentRate(descentRate)) warnings.push('Descent rate outside expected range');

  const data: TelemetryPacket = {
    packetId,
    missionTime,
    altitude,
    pressure,
    temperature,
    voltage,
    gpsLatitude,
    gpsLongitude,
    gpsAltitude,
    descentRate,
    // Extended fields are augmented by caller (base->augmented).
    payloadAltitude: 0,
    payloadTemperature: 0,
    payloadVoltage: 0,
    payloadGpsLatitude: 0,
    payloadGpsLongitude: 0,
    payloadGpsAltitude: 0,
    payloadSeparationSuccess: false,
    payloadStatus: 'Not Separated',
    roll: 0,
    pitch: 0,
    yaw: 0,
    emergencyParachuteActive: false,
    timestamp: Date.now(),
  };

  return {
    success: true,
    data,
    warnings: warnings.length > 0 ? warnings : [],
  };
}

function parseExtendedFields(fields: string[]): ParsedTelemetry {
  const warnings: string[] = [];

  const packetId = parseInt(fields[0], 10);
  if (Number.isNaN(packetId)) return { success: false, error: 'Invalid packet ID', warnings };

  const missionTime = fields[1];
  if (!isValidMissionTime(missionTime)) return { success: false, error: 'Invalid mission time format (expected HH:MM:SS)', warnings };

  const altitude = parseFloat(fields[2]);
  const pressure = parseFloat(fields[3]);
  const temperature = parseFloat(fields[4]);
  const voltage = parseFloat(fields[5]);
  const gpsLatitude = parseFloat(fields[6]);
  const gpsLongitude = parseFloat(fields[7]);
  const gpsAltitude = parseFloat(fields[8]);
  const descentRate = parseFloat(fields[9]);

  const payloadAltitude = parseFloat(fields[10]);
  const payloadTemperature = parseFloat(fields[11]);
  const payloadVoltage = parseFloat(fields[12]);
  const payloadGpsLatitude = parseFloat(fields[13]);
  const payloadGpsLongitude = parseFloat(fields[14]);
  const payloadGpsAltitude = parseFloat(fields[15]);

  const payloadSeparationSuccessRaw = parseInt(fields[16], 10);
  const payloadSeparationSuccess =
    payloadSeparationSuccessRaw === 1 ? true : payloadSeparationSuccessRaw === 0 ? false : null;

  const roll = parseFloat(fields[17]);
  const pitch = parseFloat(fields[18]);
  const yaw = parseFloat(fields[19]);

  const emergencyParachuteActiveRaw = parseInt(fields[20], 10);
  const emergencyParachuteActive =
    emergencyParachuteActiveRaw === 1 ? true : emergencyParachuteActiveRaw === 0 ? false : null;

  const valuesNaN = [
    altitude,
    pressure,
    temperature,
    voltage,
    gpsLatitude,
    gpsLongitude,
    gpsAltitude,
    descentRate,
    payloadAltitude,
    payloadTemperature,
    payloadVoltage,
    payloadGpsLatitude,
    payloadGpsLongitude,
    payloadGpsAltitude,
    roll,
    pitch,
    yaw,
  ].some((v) => Number.isNaN(v));

  if (valuesNaN || payloadSeparationSuccess === null || emergencyParachuteActive === null) {
    return { success: false, error: 'Invalid numeric/boolean field(s) in extended packet' };
  }

  if (!isValidAltitude(altitude)) warnings.push('Container altitude outside expected range');
  if (!isValidPressure(pressure)) warnings.push('Container pressure outside expected range');
  if (!isValidTemperature(temperature)) warnings.push('Container temperature outside expected range');
  if (!isValidVoltage(voltage)) warnings.push('Container voltage outside expected range');
  if (!isValidGPS(gpsLatitude, gpsLongitude)) warnings.push('Container GPS lat/lon invalid');
  if (!isValidDescentRate(descentRate)) warnings.push('Descent rate outside expected range');

  if (!isValidAltitude(payloadAltitude)) warnings.push('Payload altitude outside expected range');
  if (!isValidTemperature(payloadTemperature)) warnings.push('Payload temperature outside expected range');
  if (!isValidVoltage(payloadVoltage)) warnings.push('Payload voltage outside expected range');
  if (!isValidGPS(payloadGpsLatitude, payloadGpsLongitude)) warnings.push('Payload GPS lat/lon invalid');

  const payloadStatus = payloadSeparationSuccess ? 'Separated' : 'Not Separated';

  const data: TelemetryPacket = {
    packetId,
    missionTime,
    altitude,
    pressure,
    temperature,
    voltage,
    gpsLatitude,
    gpsLongitude,
    gpsAltitude,
    descentRate,
    payloadAltitude,
    payloadTemperature,
    payloadVoltage,
    payloadGpsLatitude,
    payloadGpsLongitude,
    payloadGpsAltitude,
    payloadSeparationSuccess,
    payloadStatus,
    roll,
    pitch,
    yaw,
    emergencyParachuteActive,
    timestamp: Date.now(),
  };

  return {
    success: true,
    data,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * True when the vehicle is descending and descent-rate digit 1 applies.
 */
export function isDescendingPhase(descentRate: number): boolean {
  return descentRate < -0.5;
}

/**
 * Digit 3 applies only after the separation window (or explicit failure status).
 */
export function isSeparationFailure(packet: TelemetryPacket): boolean {
  const status = packet.payloadStatus.trim();
  if (status === 'Attached' || status === 'Pending') {
    return false;
  }
  if (status === 'Separation Failed') {
    return true;
  }
  if (packet.payloadSeparationSuccess) {
    return false;
  }
  return parseMissionTime(packet.missionTime) >= SEPARATION_EVAL_SECONDS;
}

/**
 * Calculate error codes based on telemetry values
 */
export function calculateErrorCode(packet: TelemetryPacket): ErrorCode {
  // Digit 1: Descent rate — only evaluated while descending (negative rate).
  const descentRateMag = Math.abs(packet.descentRate);
  const descentRateFault =
    isDescendingPhase(packet.descentRate) &&
    (descentRateMag < SAFE_DESCENT_RATE.MIN || descentRateMag > SAFE_DESCENT_RATE.MAX);

  // Digit 2: GPS Availability
  // Treat GPS as unavailable when it's explicitly invalid or (0,0) which is commonly used as "no fix".
  const gpsUnavailable =
    (packet.gpsLatitude === 0 && packet.gpsLongitude === 0) || !isValidGPS(packet.gpsLatitude, packet.gpsLongitude);

  // Digit 3: Payload Separation
  const separationFailure = isSeparationFailure(packet);

  // Digit 4: Emergency Parachute
  const parachuteActive = packet.emergencyParachuteActive;

  const code = [
    descentRateFault ? '1' : '0',
    gpsUnavailable ? '1' : '0',
    separationFailure ? '1' : '0',
    parachuteActive ? '1' : '0',
  ].join('');

  return {
    descentRateFault,
    gpsUnavailable,
    separationFailure,
    parachuteActive,
    code,
  };
}

/**
 * Format a time string from seconds elapsed
 */
export function formatMissionTime(secondsElapsed: number): string {
  const hours = Math.floor(secondsElapsed / 3600);
  const minutes = Math.floor((secondsElapsed % 3600) / 60);
  const seconds = secondsElapsed % 60;
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':');
}

/**
 * Parse mission time string to seconds
 */
export function parseMissionTime(timeStr: string): number {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}
