/**
 * Telemetry Simulator - Generates realistic mock telemetry data for testing
 */

import { TelemetryPacket } from '@/types/telemetry';
import { formatMissionTime } from './telemetryParser';

export type MissionStage = 'launch' | 'ascent' | 'apogee' | 'separation' | 'descent' | 'landing';

export type SimulationScenarioKind =
  | 'normal'
  | 'gps_failure'
  | 'separation_failure'
  | 'parachute_deployment'
  | 'battery_failure'
  | 'sensor_failure'
  | 'packet_loss';

interface SimulationConfig {
  targetAltitude: number; // meters
  missionDuration: number; // seconds
  startLatitude: number;
  startLongitude: number;
  scenarioKind?: SimulationScenarioKind;
}

export class TelemetrySimulator {
  private packetCount: number = 0;
  private elapsedTime: number = 0;
  private currentStage: MissionStage = 'launch';
  private baseAltitude: number = 0;
  private currentAltitude: number = 0;
  private baseLatitude: number;
  private baseLongitude: number;
  private targetAltitude: number;
  private config: SimulationConfig;
  private scenarioKind: SimulationScenarioKind = 'normal';

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = {
      targetAltitude: 3000,
      missionDuration: 600,
      startLatitude: 28.5355,
      startLongitude: 77.391,
      ...config,
    };

    this.baseLatitude = this.config.startLatitude;
    this.baseLongitude = this.config.startLongitude;
    this.targetAltitude = this.config.targetAltitude;
    this.scenarioKind = this.config.scenarioKind ?? 'normal';
  }

  /**
   * Generate next telemetry packet
   */
  public generatePacket(): TelemetryPacket {
    this.packetCount++;

    // Simulate packet loss by creating gaps in packet IDs.
    // Deterministic approach: inject a gap every N packets once the scenario is enabled.
    if (this.scenarioKind === 'packet_loss' && this.packetCount % 11 === 0) {
      this.packetCount++; // skip one packet ID
    }

    this.updateStage();

    const altitude = this.calculateAltitude();
    const pressure = this.calculatePressure(altitude);
    const temperature = this.calculateTemperature(altitude);
    const voltage = this.calculateVoltage();
    const [lat, lon] = this.calculateGPS();
    const descentRate = this.calculateDescentRate();

    const payloadAltitude = Math.max(0, altitude + (Math.random() - 0.5) * 25);
    const payloadTemperature = Math.max(-100, Math.min(80, temperature + (Math.random() - 0.5) * 4));
    const payloadVoltage = Math.max(0, voltage - 0.2 + (Math.random() - 0.5) * 0.2);
    const [payloadLat, payloadLon] = this.calculatePayloadGPS();
    const payloadGpsAltitude = payloadAltitude + (Math.random() - 0.5) * 5;

    const payloadSeparationSuccess = this.calculatePayloadSeparationSuccess();
    const payloadStatus = payloadSeparationSuccess ? 'Separated' : 'Not Separated';

    const { roll, pitch, yaw } = this.calculateAttitude();
    const emergencyParachuteActive = this.calculateEmergencyParachuteActive(payloadSeparationSuccess);

    const packet: TelemetryPacket = {
      packetId: this.packetCount,
      missionTime: formatMissionTime(this.elapsedTime),
      altitude,
      pressure,
      temperature,
      voltage,
      gpsLatitude: lat,
      gpsLongitude: lon,
      gpsAltitude: altitude,
      descentRate,
      payloadAltitude,
      payloadTemperature,
      payloadVoltage,
      payloadGpsLatitude: payloadLat,
      payloadGpsLongitude: payloadLon,
      payloadGpsAltitude,
      payloadSeparationSuccess,
      payloadStatus,
      roll,
      pitch,
      yaw,
      emergencyParachuteActive,
      timestamp: Date.now(),
    };

    this.elapsedTime += 0.5; // Increment by 500ms simulation time
    return packet;
  }

  /**
   * Generate multiple packets
   */
  public generatePackets(count: number): TelemetryPacket[] {
    return Array.from({ length: count }, () => this.generatePacket());
  }

  /**
   * Reset simulator to initial state
   */
  public reset(): void {
    this.packetCount = 0;
    this.elapsedTime = 0;
    this.currentStage = 'launch';
    this.currentAltitude = 0;
  }

  public setScenarioKind(kind: SimulationScenarioKind): void {
    this.scenarioKind = kind;
    this.reset();
  }

  /**
   * Update mission stage based on elapsed time and altitude
   */
  private updateStage(): void {
    const progress = this.elapsedTime / this.config.missionDuration;

    if (this.currentAltitude < 50) {
      this.currentStage = 'launch';
    } else if (progress < 0.3) {
      this.currentStage = 'ascent';
    } else if (progress < 0.4) {
      this.currentStage = 'apogee';
    } else if (progress < 0.5) {
      this.currentStage = 'separation';
    } else if (progress < 0.9) {
      this.currentStage = 'descent';
    } else {
      this.currentStage = 'landing';
    }
  }

  private calculatePayloadGPS(): [number, number] {
    // Payload typically lags slightly behind container GPS as separation occurs.
    const separationProgress = this.elapsedTime / this.config.missionDuration;
    const lagFactor = this.currentStage === 'launch' || this.currentStage === 'ascent' ? 1 : 0.2;
    const driftMagnitude = 0.001 * lagFactor * (1 + separationProgress * 1.2);

    const latDrift = (Math.random() - 0.5) * driftMagnitude;
    const lonDrift = (Math.random() - 0.5) * driftMagnitude;
    return [this.baseLatitude + latDrift, this.baseLongitude + lonDrift];
  }

  private calculatePayloadSeparationSuccess(): boolean {
    // Default behavior: separation succeeds when entering/descenting after the separation phase.
    if (this.scenarioKind === 'separation_failure' && this.currentStage !== 'launch' && this.currentStage !== 'ascent' && this.currentStage !== 'apogee') {
      return false;
    }

    return this.currentStage === 'separation' || this.currentStage === 'descent' || this.currentStage === 'landing';
  }

  private calculateAttitude(): { roll: number; pitch: number; yaw: number } {
    const progress = this.elapsedTime / this.config.missionDuration;

    // Keep attitude relatively stable during launch/ascent, then increase perturbations.
    const stability =
      this.currentStage === 'launch' || this.currentStage === 'ascent' ? 0.35 : this.currentStage === 'apogee' ? 0.6 : 1.0;

    const roll = (Math.random() - 0.5) * 60 * stability;
    const pitch = (Math.random() - 0.5) * 30 * stability;

    // Yaw slowly changes with mission progress plus noise.
    const yaw = (progress * 360 + (Math.random() - 0.5) * 25) % 360;

    return { roll, pitch, yaw };
  }

  private calculateEmergencyParachuteActive(payloadSeparationSuccess: boolean): boolean {
    // Default behavior: parachute "activates" near landing if separation succeeded.
    // (Scenarios that trigger early/failed activation will be added later.)
    const progress = this.elapsedTime / this.config.missionDuration;
    const altitudeNow = this.currentAltitude;
    if (!payloadSeparationSuccess) return false;
    if (this.scenarioKind === 'parachute_deployment') {
      // Deploy earlier for demo clarity: once descending is underway and altitude is low.
      return this.currentStage === 'descent' ? altitudeNow < 250 : this.currentStage === 'landing';
    }

    return this.currentStage === 'landing' || (progress > 0.88 && altitudeNow < 120);
  }

  /**
   * Calculate altitude based on mission stage
   */
  private calculateAltitude(): number {
    const progress = this.elapsedTime / this.config.missionDuration;
    let altitude = 0;

    if (progress < 0.35) {
      // Ascent phase: quadratic increase to target
      altitude = this.targetAltitude * Math.pow(progress / 0.35, 1.5);
    } else if (progress < 0.45) {
      // Apogee: slight variation at peak
      const peakVariation = Math.sin((progress - 0.35) * Math.PI / 0.1) * 100;
      altitude = this.targetAltitude + peakVariation;
    } else {
      // Descent phase: linear decrease
      const descentProgress = (progress - 0.45) / 0.55;
      altitude = this.targetAltitude * (1 - Math.pow(descentProgress, 1.2));
    }

    this.currentAltitude = Math.max(0, altitude);
    return this.currentAltitude;
  }

  /**
   * Calculate atmospheric pressure based on altitude
   */
  private calculatePressure(altitude: number): number {
    const progress = this.elapsedTime / this.config.missionDuration;
    if (this.scenarioKind === 'sensor_failure' && progress > 0.55) {
      // Sensor stuck at 0 Pa to emulate failure mode.
      return 0;
    }

    // Barometric formula approximation
    const seaLevelPressure = 101325;
    const temperature = 288.15;
    const gasConstant = 8.314;
    const molarMass = 0.029;
    const gravity = 9.81;

    const exponent =
      (-gravity * molarMass * altitude) /
      (gasConstant * temperature);

    return seaLevelPressure * Math.exp(exponent);
  }

  /**
   * Calculate temperature based on altitude
   */
  private calculateTemperature(altitude: number): number {
    const progress = this.elapsedTime / this.config.missionDuration;
    if (this.scenarioKind === 'sensor_failure' && progress > 0.55) {
      // Thermal sensor stuck at max reading.
      return 80;
    }

    // Simple linear approximation: -6.5°C per 1000m
    const seaLevelTemp = 28;
    const tempGradient = -0.0065;
    let temp = seaLevelTemp + tempGradient * altitude;

    // Add small random fluctuation
    temp += (Math.random() - 0.5) * 2;

    return Math.max(-100, Math.min(80, temp));
  }

  /**
   * Calculate battery voltage with gradual discharge
   */
  private calculateVoltage(): number {
    const progress = this.elapsedTime / this.config.missionDuration;
    const baseVoltage = 12;
    const dischargeCurve = this.scenarioKind === 'battery_failure' ? 0.25 * progress * progress : 0.05 * progress * progress;
    const noise = (Math.random() - 0.5) * 0.1;

    const raw = baseVoltage - dischargeCurve + noise;
    // Battery failure scenario should reach low voltage earlier.
    if (this.scenarioKind === 'battery_failure' && progress > 0.75) {
      return Math.max(0.2, raw * 0.6);
    }
    return Math.max(0, raw);
  }

  /**
   * Calculate GPS coordinates with slight drift
   */
  private calculateGPS(): [number, number] {
    const progress = this.elapsedTime / this.config.missionDuration;

    // Scenario: GPS failure -> force loss of fix (0,0) during late mission.
    if (this.scenarioKind === 'gps_failure' && progress > 0.6 && progress < 0.92) {
      return [0, 0];
    }

    // Simulate GPS drift based on mission progress
    const driftMagnitude = 0.001 * (1 + this.elapsedTime / 100);
    const latDrift = (Math.random() - 0.5) * driftMagnitude;
    const lonDrift = (Math.random() - 0.5) * driftMagnitude;

    const lat = this.baseLatitude + latDrift;
    const lon = this.baseLongitude + lonDrift;

    return [lat, lon];
  }

  /**
   * Calculate descent rate based on altitude change
   */
  private calculateDescentRate(): number {
    const progress = this.elapsedTime / this.config.missionDuration;

    if (progress < 0.45) {
      // Ascent: positive rate
      return Math.abs(
        (this.targetAltitude / (0.35 * this.config.missionDuration)) *
        (Math.random() * 0.2 + 0.9)
      );
    } else {
      // Descent: negative rate, around 8-10 m/s (safe range)
      const targetRate = 9;
      const randomVariation = (Math.random() - 0.5) * 2;
      return -Math.abs(targetRate + randomVariation);
    }
  }

  /**
   * Get current mission stage
   */
  public getStage(): MissionStage {
    return this.currentStage;
  }

  /**
   * Get elapsed time in seconds
   */
  public getElapsedTime(): number {
    return this.elapsedTime;
  }

  /**
   * Get packet count
   */
  public getPacketCount(): number {
    return this.packetCount;
  }
}

/**
 * Create a pre-configured simulator for rapid testing
 */
export function createTestSimulator(): TelemetrySimulator {
  return new TelemetrySimulator({
    targetAltitude: 3000,
    missionDuration: 600,
    startLatitude: 28.5355,
    startLongitude: 77.391,
  });
}

/**
 * Generate a complete mission dataset
 */
export function generateMissionDataset(durationSeconds: number, intervalMs: number = 500): TelemetryPacket[] {
  const simulator = createTestSimulator();
  const packets: TelemetryPacket[] = [];
  const packetCount = Math.ceil(durationSeconds * 1000 / intervalMs);

  for (let i = 0; i < packetCount; i++) {
    packets.push(simulator.generatePacket());
  }

  return packets;
}
