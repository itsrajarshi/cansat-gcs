import React, { useMemo } from 'react';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useMissionStore } from '@/store/missionStore';
import Card from '@/components/common/Card';
import {
  formatAltitude,
  formatPressure,
  formatTemperature,
  formatVoltage,
  formatDescentRate,
  formatTime,
} from '@/utils/formatters';
import { TelemetryPacket } from '@/types/telemetry';
import { calculateErrorCode } from '@/services/telemetryParser';
import type { MissionStage, SimulationScenarioKind } from '@/services/telemetrySimulator';
import { getScenarioDefinition } from '@/services/scenarioCatalog';

interface TelemetryCardProps {
  packet: TelemetryPacket | null;
  label?: string;
  activeScenario?: SimulationScenarioKind | null;
  missionStage?: MissionStage | null;
}

type HighlightKind = 'descent' | 'gps' | 'separation' | 'parachute' | 'voltage' | 'sensor' | null;

function tileHighlightClass(kind: HighlightKind, active: boolean): string {
  const base = 'border rounded p-2 bg-aerospace-dark/30';
  if (!active || !kind) return `${base} border-aerospace-secondary/20`;
  const map: Record<Exclude<HighlightKind, null>, string> = {
    descent: 'border-aerospace-warning/60 bg-aerospace-warning/10',
    gps: 'border-aerospace-danger/60 bg-aerospace-danger/10',
    separation: 'border-aerospace-danger/60 bg-aerospace-danger/10',
    parachute: 'border-aerospace-warning/60 bg-aerospace-warning/10',
    voltage: 'border-aerospace-warning/60 bg-aerospace-warning/10',
    sensor: 'border-aerospace-warning/60 bg-aerospace-warning/10',
  };
  return `${base} ${map[kind]}`;
}

export const TelemetryDisplay: React.FC<TelemetryCardProps> = ({
  packet,
  label = 'Telemetry',
  activeScenario = null,
  missionStage = null,
}) => {
  const telemetryStore = useTelemetryStore();
  const missionStore = useMissionStore();

  const errorCode = useMemo(() => (packet ? calculateErrorCode(packet) : null), [packet]);

  const highlights = useMemo((): Record<string, HighlightKind> => {
    if (!packet || !errorCode) {
      return {};
    }
    return {
      descentRate: errorCode.descentRateFault ? 'descent' : null,
      gpsLatitude: errorCode.gpsUnavailable ? 'gps' : null,
      gpsLongitude: errorCode.gpsUnavailable ? 'gps' : null,
      payloadStatus: errorCode.separationFailure ? 'separation' : null,
      emergencyParachute: errorCode.parachuteActive ? 'parachute' : null,
      voltage: activeScenario === 'battery_failure' && packet.voltage < 10 ? 'voltage' : null,
      pressure: activeScenario === 'sensor_failure' && packet.pressure === 0 ? 'sensor' : null,
      temperature: activeScenario === 'sensor_failure' && packet.temperature >= 79 ? 'sensor' : null,
    };
  }, [packet, errorCode, activeScenario]);

  if (!packet) {
    return (
      <Card title={label} subtitle="Waiting for data...">
        <div className="grid grid-cols-2 gap-3 text-center py-4">
          <span className="text-gray-400">---</span>
        </div>
      </Card>
    );
  }

  const scenarioLabel = activeScenario ? getScenarioDefinition(activeScenario).label : null;
  const subtitleParts = [
    `Packet #${packet.packetId}`,
    `Mission ${packet.missionTime}`,
    errorCode ? `Code ${errorCode.code}` : null,
    missionStage ? `Stage ${missionStage}` : null,
    scenarioLabel ? `Scenario: ${scenarioLabel}` : null,
  ].filter(Boolean);

  const tile = (key: string, highlightKey: string, children: React.ReactNode, className = '') => (
    <div className={`${tileHighlightClass(highlights[highlightKey] ?? null, Boolean(highlights[highlightKey]))} ${className}`}>
      {children}
    </div>
  );

  return (
    <Card title={label} subtitle={subtitleParts.join(' · ')}>
      <div className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Container Telemetry</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {tile('packetCount', 'packetCount', (
              <>
                <div className="text-gray-400 text-xs mb-1">Packet Count</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{telemetryStore.getPacketCount()}</div>
              </>
            ))}

            {tile('packetLoss', 'packetLoss', (
              <>
                <div className="text-gray-400 text-xs mb-1">Packet Loss</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{telemetryStore.getStats().packetLoss}</div>
              </>
            ))}

            {tile('elapsed', 'elapsed', (
              <>
                <div className="text-gray-400 text-xs mb-1">Mission Elapsed</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{formatTime(missionStore.elapsedTime)}</div>
              </>
            ))}

            {tile('altitude', 'altitude', (
              <>
                <div className="text-gray-400 text-xs mb-1">Altitude</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{formatAltitude(packet.altitude)}</div>
              </>
            ))}

            {tile('pressure', 'pressure', (
              <>
                <div className="text-gray-400 text-xs mb-1">Pressure</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{formatPressure(packet.pressure, 0)}</div>
              </>
            ))}

            {tile('temperature', 'temperature', (
              <>
                <div className="text-gray-400 text-xs mb-1">Temperature</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{formatTemperature(packet.temperature)}</div>
              </>
            ))}

            {tile('voltage', 'voltage', (
              <>
                <div className="text-gray-400 text-xs mb-1">Voltage</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{formatVoltage(packet.voltage)}</div>
              </>
            ))}

            {tile('gpsLat', 'gpsLatitude', (
              <>
                <div className="text-gray-400 text-xs mb-1">GPS Latitude</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{packet.gpsLatitude.toFixed(6)}°</div>
              </>
            ))}

            {tile('gpsLon', 'gpsLongitude', (
              <>
                <div className="text-gray-400 text-xs mb-1">GPS Longitude</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{packet.gpsLongitude.toFixed(6)}°</div>
              </>
            ))}

            {tile('gpsAlt', 'gpsAlt', (
              <>
                <div className="text-gray-400 text-xs mb-1">GPS Altitude</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{formatAltitude(packet.gpsAltitude)}</div>
              </>
            ))}

            {tile('descent', 'descentRate', (
              <>
                <div className="text-gray-400 text-xs mb-1">Descent Rate</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{formatDescentRate(packet.descentRate)}</div>
              </>
            ), 'col-span-2 md:col-span-3')}
          </div>
        </div>

        <div className="border-t border-aerospace-secondary/20 pt-4">
          <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Payload Telemetry</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {tile('pAlt', 'pAlt', (
              <>
                <div className="text-gray-400 text-xs mb-1">Payload Altitude</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{formatAltitude(packet.payloadAltitude)}</div>
              </>
            ))}

            {tile('pTemp', 'pTemp', (
              <>
                <div className="text-gray-400 text-xs mb-1">Payload Temperature</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{formatTemperature(packet.payloadTemperature)}</div>
              </>
            ))}

            {tile('pVolt', 'pVolt', (
              <>
                <div className="text-gray-400 text-xs mb-1">Payload Voltage</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{formatVoltage(packet.payloadVoltage)}</div>
              </>
            ))}

            {tile('pLat', 'pLat', (
              <>
                <div className="text-gray-400 text-xs mb-1">Payload GPS Latitude</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{packet.payloadGpsLatitude.toFixed(6)}°</div>
              </>
            ))}

            {tile('pLon', 'pLon', (
              <>
                <div className="text-gray-400 text-xs mb-1">Payload GPS Longitude</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{packet.payloadGpsLongitude.toFixed(6)}°</div>
              </>
            ))}

            {tile('pGpsAlt', 'pGpsAlt', (
              <>
                <div className="text-gray-400 text-xs mb-1">Payload GPS Altitude</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{formatAltitude(packet.payloadGpsAltitude)}</div>
              </>
            ))}

            {tile('pStatus', 'payloadStatus', (
              <>
                <div className="text-gray-400 text-xs mb-1">Payload Status</div>
                <div className="text-aerospace-accent font-mono font-bold text-lg">{packet.payloadStatus}</div>
              </>
            ), 'col-span-2 md:col-span-3')}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TelemetryDisplay;
