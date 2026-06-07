import type { SimulationScenarioKind } from '@/services/telemetrySimulator';

export interface ScenarioDefinition {
  kind: SimulationScenarioKind;
  label: string;
  description: string;
  /** Typical error-code pattern once the scenario is in its fault window (digits 1–4). */
  expectedCodeHint: string;
}

export const SCENARIO_CATALOG: ScenarioDefinition[] = [
  {
    kind: 'normal',
    label: 'Normal Mission',
    description: 'Nominal ascent, separation, descent (~9 m/s), and landing parachute.',
    expectedCodeHint: '0000 → 0001 near landing',
  },
  {
    kind: 'gps_failure',
    label: 'GPS Failure',
    description: 'Container GPS drops to (0,0) mid-mission, then recovers.',
    expectedCodeHint: '0100 during outage',
  },
  {
    kind: 'separation_failure',
    label: 'Separation Failure',
    description: 'Payload fails to separate after apogee.',
    expectedCodeHint: '0010 after separation window',
  },
  {
    kind: 'parachute_deployment',
    label: 'Parachute Deployment',
    description: 'Emergency parachute deploys early during descent.',
    expectedCodeHint: '0001 when chute active',
  },
  {
    kind: 'descent_rate_fault',
    label: 'Descent Rate Fault',
    description: 'Descent velocity outside the safe 8–10 m/s band during descent.',
    expectedCodeHint: '1000 during descent',
  },
  {
    kind: 'battery_failure',
    label: 'Battery Failure',
    description: 'Accelerated voltage sag in late mission (telemetry only).',
    expectedCodeHint: '0000 (voltage not in error code)',
  },
  {
    kind: 'sensor_failure',
    label: 'Sensor Failure',
    description: 'Pressure stuck at 0 Pa and temperature at 80 °C.',
    expectedCodeHint: '0000 (sensors not in error code)',
  },
  {
    kind: 'packet_loss',
    label: 'Packet Loss',
    description: 'Skips one packet ID every 11 packets.',
    expectedCodeHint: 'Varies with live packet state',
  },
];

export function getScenarioDefinition(kind: SimulationScenarioKind): ScenarioDefinition {
  return SCENARIO_CATALOG.find((s) => s.kind === kind) ?? SCENARIO_CATALOG[0];
}

/** Mission progress (0–1) used when previewing a single mock packet. */
export const SCENARIO_PREVIEW_PROGRESS: Record<SimulationScenarioKind, number> = {
  normal: 0.5,
  gps_failure: 0.55,
  separation_failure: 0.48,
  parachute_deployment: 0.72,
  descent_rate_fault: 0.65,
  battery_failure: 0.82,
  sensor_failure: 0.62,
  packet_loss: 0.5,
};
