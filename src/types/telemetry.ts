/**
 * Telemetry type definitions for CanSat Ground Control Software
 */

export interface TelemetryPacket {
  packetId: number;
  missionTime: string; // HH:MM:SS format
  altitude: number; // meters
  pressure: number; // Pa
  temperature: number; // Celsius
  voltage: number; // Volts
  gpsLatitude: number;
  gpsLongitude: number;
  gpsAltitude: number; // meters
  descentRate: number; // m/s
  /**
   * Payload telemetry (from CanSat payload subsystem).
   * These fields are required by the assignment brief's payload cards.
   */
  payloadAltitude: number; // meters
  payloadTemperature: number; // Celsius
  payloadVoltage: number; // Volts
  payloadGpsLatitude: number;
  payloadGpsLongitude: number;
  payloadGpsAltitude: number; // meters
  /**
   * Payload separation state.
   * - true means payload separation succeeded
   * - false means separation failure / not yet separated
   */
  payloadSeparationSuccess: boolean;
  /**
   * String status shown in the UI payload card.
   */
  payloadStatus: string;

  /**
   * Attitude (roll/pitch/yaw) in degrees for orientation visualization.
   */
  roll: number;
  pitch: number;
  yaw: number;

  /**
   * Emergency parachute state.
   * - true means parachute activated
   */
  emergencyParachuteActive: boolean;
  timestamp: number; // Unix timestamp
}

export interface PayloadTelemetry {
  packetId: number;
  altitude: number;
  temperature: number;
  voltage: number;
  gpsLatitude: number;
  gpsLongitude: number;
  gpsAltitude: number;
  status: string;
  timestamp: number;
}

export interface TelemetryData {
  container: TelemetryPacket[];
  payload: PayloadTelemetry[];
}

export interface ParsedTelemetry {
  success: boolean;
  data?: TelemetryPacket;
  error?: string;
  warnings?: string[];
}

export interface TelemetryStats {
  totalPackets: number;
  packetLoss: number;
  lastUpdateTime: number;
  avgAltitude: number;
  maxAltitude: number;
  minAltitude: number;
  avgTemperature: number;
  avgPressure: number;
  avgVoltage: number;
  currentDescentRate: number;
}

export interface GPSData {
  latitude: number;
  longitude: number;
  altitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export interface GPSTrackPoint extends GPSData {
  timestamp: number;
  packetId: number;
}

export interface MissionPhase {
  name: 'launch' | 'ascent' | 'apogee' | 'separation' | 'descent' | 'landing';
  startTime: number;
  endTime?: number;
  description: string;
}

export interface Orientation {
  roll: number; // degrees
  pitch: number; // degrees
  yaw: number; // degrees
  timestamp: number;
}

export interface ErrorCode {
  descentRateFault: boolean;
  gpsUnavailable: boolean;
  separationFailure: boolean;
  parachuteActive: boolean;
  code: string; // 4-digit string like "0000"
}

export interface ChartDataPoint {
  time: number;
  missionTime: string;
  altitude?: number;
  pressure?: number;
  temperature?: number;
  descentRate?: number;
  voltage?: number;
}

export interface MissionCommand {
  id: string;
  name: string;
  description: string;
  timestamp: number;
  status: 'pending' | 'sent' | 'executed' | 'failed';
  responseTime?: number;
  ackReceived: boolean;
}

export interface MissionControlState {
  commands: MissionCommand[];
  lastCommandTime?: number;
  separationStatus: 'inactive' | 'armed' | 'executed' | 'failed';
  parachuteStatus: 'inactive' | 'armed' | 'deployed' | 'failed';
  isConnected: boolean;
}

export interface VideoStreamState {
  isStreaming: boolean;
  resolution?: string;
  fps?: number;
  cameraName?: string;
  error?: string;
}

export interface DataExportOptions {
  format: 'csv' | 'json';
  includePayload: boolean;
  startTime?: number;
  endTime?: number;
}

export interface MissionConfig {
  missionName: string;
  launchTime: number;
  targetAltitude: number;
  expectedDuration: number;
  location: {
    latitude: number;
    longitude: number;
  };
}
