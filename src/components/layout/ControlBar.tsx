import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Download, Image } from 'lucide-react';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import Card from '@/components/common/Card';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useMissionStore } from '@/store/missionStore';
import { downloadCSV, generateExportFilename } from '@/services/dataExport';
import { formatTime } from '@/utils/formatters';
import { serialService } from '@/services/webSerialService';

export type TelemetrySourceKind = 'mock' | 'websocket' | 'serial';

interface ControlBarProps {
  onStartTelemetry?: () => void;
  onStopTelemetry?: () => void;  
  onResetPackets?: () => void;
  telemetrySource: TelemetrySourceKind;
  onTelemetrySourceChange: (source: TelemetrySourceKind) => void;
  onSyncPCTime?: () => void;
  onExportGraphPNG?: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  onStartTelemetry,
  onStopTelemetry,
  onResetPackets,
  telemetrySource,
  onTelemetrySourceChange,
  onSyncPCTime,
  onExportGraphPNG,
}) => {
  const telemetry = useTelemetryStore();
  const mission = useMissionStore();
  const [isExporting, setIsExporting] = useState(false);
  const serialSupported = serialService.isSupported();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const packets = telemetry.getAllPackets();
      downloadCSV(packets, generateExportFilename('csv'));
      mission.addLog('success', 'CSV export completed', {
        packetCount: packets.length,
      });
    } catch (error) {
      mission.addLog('error', 'CSV export failed', { error });
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    telemetry.clearPackets();
    mission.addLog('info', 'Packets reset');
    onResetPackets?.();
  };

  return (
    <Card className="rounded-none border-0 shadow-none bg-transparent">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Section: Status */}
        <div className="flex items-center gap-3">
          <StatusBadge
            status={mission.systemStatus.connectionStatus as any}
            label={`Packet Count: ${telemetry.getPacketCount()}`}
          />
          <div className="h-6 w-px bg-aerospace-secondary/20" />
          <span className="text-sm text-gray-300">
            Mission Time: <span className="text-aerospace-accent font-mono font-bold">{formatTime(mission.elapsedTime)}</span>
          </span>
        </div>

        {/* Middle Section: Control Buttons */}
        <div className="flex items-center gap-2">
          <select
            value={telemetrySource}
            onChange={(e) => onTelemetrySourceChange(e.target.value as TelemetrySourceKind)}
            className="px-3 py-1 bg-aerospace-dark border border-aerospace-secondary/30 rounded text-sm text-gray-200"
            disabled={telemetry.isReceiving}
            title={telemetry.isReceiving ? 'Stop telemetry to change source' : 'Select telemetry source'}
          >
            <option value="mock">Mock</option>
            <option value="websocket">WebSocket</option>
            <option value="serial" disabled={!serialSupported}>
              Serial
            </option>
          </select>

          {!telemetry.isReceiving ? (
            <Button
              size="sm"
              variant="success"
              onClick={onStartTelemetry}
            >
              <Play className="w-4 h-4" />
              Start Telemetry
            </Button>
          ) : (
            <Button
              size="sm"
              variant="danger"
              onClick={onStopTelemetry}
            >
              <Pause className="w-4 h-4" />
              Stop Telemetry
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4" />
            Reset Packet
          </Button>

          <Button size="sm" variant="outline" onClick={onSyncPCTime} disabled={!onSyncPCTime}>
            Sync PC Time
          </Button>
        </div>

        {/* Right Section: Export Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExport}
            loading={isExporting}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={onExportGraphPNG}
            disabled={!onExportGraphPNG}
            title="Export graphs as PNG"
          >
            <Image className="w-4 h-4" />
            Export Graph
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ControlBar;
