import React from 'react';
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

interface TelemetryCardProps {
  packet: TelemetryPacket | null;
  label?: string;
}

export const TelemetryDisplay: React.FC<TelemetryCardProps> = ({
  packet,
  label = 'Telemetry',
}) => {
  const telemetryStore = useTelemetryStore();
  const missionStore = useMissionStore();

  if (!packet) {
    return (
      <Card title={label} subtitle="Waiting for data...">
        <div className="grid grid-cols-2 gap-3 text-center py-4">
          <span className="text-gray-400">---</span>
        </div>
      </Card>
    );
  }

  const tileClass = 'border border-aerospace-secondary/20 rounded p-2 bg-aerospace-dark/30';

  return (
    <Card title={label} subtitle={`Packet #${packet.packetId} | Mission Time: ${packet.missionTime}`}>
      <div className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Container Telemetry</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className={tileClass}>
              <div className="text-gray-400 text-xs mb-1">Packet Count</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{telemetryStore.getPacketCount()}</div>
            </div>

            <div className={tileClass}>
              <div className="text-gray-400 text-xs mb-1">Packet Loss</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{telemetryStore.getStats().packetLoss}</div>
            </div>

            <div className={tileClass}>
              <div className="text-gray-400 text-xs mb-1">Mission Elapsed</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{formatTime(missionStore.elapsedTime)}</div>
            </div>

            <div className={tileClass}>
              <div className="text-gray-400 text-xs mb-1">Altitude</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{formatAltitude(packet.altitude)}</div>
            </div>

            <div className={tileClass}>
              <div className="text-gray-400 text-xs mb-1">Pressure</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{formatPressure(packet.pressure, 0)}</div>
            </div>

            <div className={tileClass}>
              <div className="text-gray-400 text-xs mb-1">Temperature</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{formatTemperature(packet.temperature)}</div>
            </div>

            <div className={tileClass}>
              <div className="text-gray-400 text-xs mb-1">Voltage</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{formatVoltage(packet.voltage)}</div>
            </div>

            <div className={tileClass}>
              <div className="text-gray-400 text-xs mb-1">GPS Latitude</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{packet.gpsLatitude.toFixed(6)}°</div>
            </div>

            <div className={tileClass}>
              <div className="text-gray-400 text-xs mb-1">GPS Longitude</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{packet.gpsLongitude.toFixed(6)}°</div>
            </div>

            <div className={tileClass}>
              <div className="text-gray-400 text-xs mb-1">GPS Altitude</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{formatAltitude(packet.gpsAltitude)}</div>
            </div>

            <div className={tileClass + ' col-span-2 md:col-span-3'}>
              <div className="text-gray-400 text-xs mb-1">Descent Rate</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{formatDescentRate(packet.descentRate)}</div>
            </div>
          </div>
        </div>

        <div className="border-t border-aerospace-secondary/20 pt-4">
          <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Payload Telemetry</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className={tileClass}>
              <div className="text-gray-400 text-xs mb-1">Payload Altitude</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{formatAltitude(packet.payloadAltitude)}</div>
            </div>

            <div className={tileClass}>
              <div className="text-gray-400 text-xs mb-1">Payload Temperature</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{formatTemperature(packet.payloadTemperature)}</div>
            </div>

            <div className={tileClass}>
              <div className="text-gray-400 text-xs mb-1">Payload Voltage</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{formatVoltage(packet.payloadVoltage)}</div>
            </div>

            <div className={tileClass}>
              <div className="text-gray-400 text-xs mb-1">Payload GPS Latitude</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{packet.payloadGpsLatitude.toFixed(6)}°</div>
            </div>

            <div className={tileClass}>
              <div className="text-gray-400 text-xs mb-1">Payload GPS Longitude</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{packet.payloadGpsLongitude.toFixed(6)}°</div>
            </div>

            <div className={tileClass}>
              <div className="text-gray-400 text-xs mb-1">Payload GPS Altitude</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{formatAltitude(packet.payloadGpsAltitude)}</div>
            </div>

            <div className={tileClass + ' col-span-2 md:col-span-3'}>
              <div className="text-gray-400 text-xs mb-1">Payload Status</div>
              <div className="text-aerospace-accent font-mono font-bold text-lg">{packet.payloadStatus}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TelemetryDisplay;
