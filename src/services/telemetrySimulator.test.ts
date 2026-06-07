import { describe, expect, it } from 'vitest';
import { calculateErrorCode } from '@/services/telemetryParser';
import { TelemetrySimulator } from '@/services/telemetrySimulator';
import { MOCK_MISSION_DURATION_SEC } from '@/utils/constants';

describe('TelemetrySimulator scenarios', () => {
  const baseConfig = {
    targetAltitude: 3000,
    missionDuration: MOCK_MISSION_DURATION_SEC,
    startLatitude: 28.5355,
    startLongitude: 77.391,
  };

  it('produces distinct error codes per scenario at preview progress', () => {
    const scenarios = [
      { kind: 'normal' as const, progress: 0.5 },
      { kind: 'gps_failure' as const, progress: 0.55 },
      { kind: 'separation_failure' as const, progress: 0.48 },
      { kind: 'descent_rate_fault' as const, progress: 0.65 },
      { kind: 'parachute_deployment' as const, progress: 0.72 },
    ];

    const codes = scenarios.map(({ kind, progress }) => {
      const sim = new TelemetrySimulator({ ...baseConfig, scenarioKind: kind });
      sim.fastForwardToProgress(progress);
      const packet = sim.generatePacket();
      return calculateErrorCode(packet).code;
    });

    expect(new Set(codes).size).toBeGreaterThan(1);
    expect(codes).toContain('0100');
    expect(codes).toContain('0010');
    expect(codes).toContain('1000');
  });
});
