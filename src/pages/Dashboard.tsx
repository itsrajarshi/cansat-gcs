import React, { useEffect, useState } from 'react';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useMissionStore } from '@/store/missionStore';
import { SimulationScenarioKind, TelemetrySimulator } from '@/services/telemetrySimulator';
import { parseMissionTime, parseTelemetry } from '@/services/telemetryParser';

import ControlBar, { TelemetrySourceKind } from '@/components/layout/ControlBar';
import Card from '@/components/common/Card';
import TelemetryDisplay from '@/components/telemetry/TelemetryDisplay';
import ErrorCodeDisplay from '@/components/telemetry/ErrorCodeDisplay';
import { AltitudeChart, TemperatureChart, VoltageChart, PressureChart, DescentRateChart } from '@/components/charts/Charts';
import GPSMap from '@/components/map/GPSMap';
import OrientationIndicator from '@/components/orientation/OrientationIndicator';
import MissionControlPanel from '@/components/mission/MissionControlPanel';
import VideoStream from '@/components/video/VideoStream';
import { webSocketService } from '@/services/webSocketService';
import { serialService } from '@/services/webSerialService';
import { exportSvgToPNG, generateExportFilename } from '@/services/dataExport';
import { telemetryStorage } from '@/services/telemetryStorage';
import { CHART_SAMPLE_LIMIT } from '@/utils/constants';

export const Dashboard: React.FC = () => {
  const telemetryStore = useTelemetryStore();
  const missionStore = useMissionStore();
  const [telemetrySource, setTelemetrySource] = useState<TelemetrySourceKind>('mock');
  const [scenarioKind, setScenarioKind] = useState<SimulationScenarioKind>('normal');
  const [simulator, setSimulator] = useState<TelemetrySimulator | null>(null);
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null);
  const [isExportingGraphs, setIsExportingGraphs] = useState(false);

  // Initialize simulator
  useEffect(() => {
    const sim = new TelemetrySimulator({
      targetAltitude: 3000,
      missionDuration: 600,
      startLatitude: 28.5355,
      startLongitude: 77.391,
      scenarioKind,
    });
    setSimulator(sim);

    missionStore.addLog('info', 'Dashboard initialized');
  }, []);

  // Apply scenario changes to the simulator (mock telemetry only).
  useEffect(() => {
  if (!simulator) return;
  if (telemetrySource !== 'mock') return;
  if (telemetryStore.isReceiving) return;

  simulator.setScenarioKind(scenarioKind);
}, [scenarioKind, simulator, telemetrySource, telemetryStore.isReceiving]);

  // Hydrate telemetry history from local IndexedDB/LocalStorage.
  useEffect(() => {
    let cancelled = false;
    void telemetryStorage
      .loadLatestPackets(CHART_SAMPLE_LIMIT)
      .then((packets) => {
        if (cancelled) return;
        if (packets.length > 0) {
          telemetryStore.addPackets(packets);
          missionStore.addLog('info', `Hydrated ${packets.length} telemetry packets from storage`);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        missionStore.addLog('error', 'Failed to hydrate telemetry storage', { error: e });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleStartTelemetry = () => {
    void (async () => {
      telemetryStore.setReceiving(true);
      missionStore.updateSystemStatus({
        connectionStatus: 'connecting',
        lastHeartbeat: Date.now(),
      });

      missionStore.addLog('info', `Telemetry reception started via ${telemetrySource}`);

      if (simulationInterval) {
        clearInterval(simulationInterval);
        setSimulationInterval(null);
      }

      if (telemetrySource === 'mock') {
        if (!simulator) return;

        missionStore.updateSystemStatus({ connectionStatus: 'connected' });

        const interval = setInterval(() => {
          if (!simulator) return;

          const packet = simulator.generatePacket();
          telemetryStore.addPacket(packet);

          // Update mission elapsed time
          missionStore.updateElapsedTime(simulator.getElapsedTime());

          // Simulate signal (mock only)
          missionStore.updateSystemStatus({
            lastHeartbeat: Date.now(),
            signalStrength: 75 + Math.random() * 25,
            latency: 50 + Math.random() * 100,
            systemHealth: 95 - Math.random() * 10,
          });
        }, 500);

        setSimulationInterval(interval);
        return;
      }

      if (telemetrySource === 'websocket') {
        const wsUrl = import.meta.env.VITE_WEBSOCKET_URL as string | undefined;
        if (!wsUrl) {
          missionStore.addLog('error', 'VITE_WEBSOCKET_URL is not set');
          telemetryStore.setReceiving(false);
          missionStore.updateSystemStatus({ connectionStatus: 'error' as any });
          return;
        }

        webSocketService.setOnMessage((raw) => {
          const parsed = parseTelemetry(raw);
          if (!parsed.success || !parsed.data) {
            missionStore.addLog('error', 'Telemetry parse failed (WebSocket)', { error: parsed.error, raw });
            return;
          }
          telemetryStore.addPacket(parsed.data);
          missionStore.updateElapsedTime(parseMissionTime(parsed.data.missionTime));
          missionStore.updateSystemStatus({
            lastHeartbeat: Date.now(),
            signalStrength: 80,
            latency: 20 + Math.random() * 40,
            systemHealth: 98 - Math.random() * 6,
          });
        });

        webSocketService.setOnError((err) => {
          missionStore.addLog('error', 'WebSocket error', { message: err.message });
        });

        try {
          await webSocketService.connect(wsUrl);
          missionStore.updateSystemStatus({ connectionStatus: 'connected', lastHeartbeat: Date.now() });
        } catch {
          telemetryStore.setReceiving(false);
          missionStore.updateSystemStatus({ connectionStatus: 'disconnected' });
        }

        return;
      }

      // Serial (optional, only if supported)
      if (telemetrySource === 'serial') {
        if (!serialService.isSupported()) {
          missionStore.addLog('error', 'Web Serial API not supported in this browser');
          telemetryStore.setReceiving(false);
          missionStore.updateSystemStatus({ connectionStatus: 'error' as any });
          return;
        }

        serialService.onData((raw: string) => {
          const parsed = parseTelemetry(raw);
          if (!parsed.success || !parsed.data) {
            missionStore.addLog('error', 'Telemetry parse failed (Serial)', { error: parsed.error, raw });
            return;
          }
          telemetryStore.addPacket(parsed.data);
          missionStore.updateElapsedTime(parseMissionTime(parsed.data.missionTime));
          missionStore.updateSystemStatus({
            lastHeartbeat: Date.now(),
            signalStrength: 70,
            latency: 10 + Math.random() * 20,
            systemHealth: 97 - Math.random() * 6,
          });
        });

        try {
          await serialService.connect({ baudRate: 9600 });
          missionStore.updateSystemStatus({ connectionStatus: 'connected', lastHeartbeat: Date.now() });
        } catch (e) {
          telemetryStore.setReceiving(false);
          missionStore.updateSystemStatus({ connectionStatus: 'disconnected' });
          missionStore.addLog('error', 'Serial connect failed', { error: e });
        }
      }
    })();
  };

  const handleStopTelemetry = () => {
    void (async () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
        setSimulationInterval(null);
      }

      if (telemetrySource === 'websocket') {
        webSocketService.disconnect();
      }

      if (telemetrySource === 'serial') {
        try {
          await serialService.disconnect();
        } catch {
          // ignore
        }
      }

      telemetryStore.setReceiving(false);
      missionStore.updateSystemStatus({ connectionStatus: 'disconnected' });
      missionStore.addLog('info', 'Telemetry reception stopped');
    })();
  };

  const handleSyncPCTime = () => {
    missionStore.addLog('success', 'PC time synced', { pcTime: Date.now() });
    missionStore.updateSystemStatus({ lastHeartbeat: Date.now() });
  };

  const handleExportGraphPNG = async () => {
    if (isExportingGraphs) return;
    setIsExportingGraphs(true);

    try {
      const keys = ['altitude', 'temperature', 'voltage', 'pressure', 'descentRate'] as const;
      const base = generateExportFilename('png');

      for (const key of keys) {
        const container = document.querySelector(`[data-export-key="${key}"]`);
        const svg = container?.querySelector('svg') as SVGSVGElement | null;
        if (!svg) continue;

        const filename = base.replace('.png', `_${key}.png`);
        await exportSvgToPNG(svg, filename);
      }

      missionStore.addLog('success', 'Graph PNG export completed');
    } catch (e) {
      missionStore.addLog('error', 'Graph PNG export failed', { error: e });
    } finally {
      setIsExportingGraphs(false);
    }
  };

  const handleResetPackets = () => {
    if (simulator) {
      simulator.reset();
    }
    missionStore.addLog('info', 'Mission reset - packets cleared');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
      // Stop any active source (avoid relying on the latest telemetrySource closure).
      webSocketService.disconnect();
      void serialService.disconnect().catch(() => undefined);
      telemetryStore.setReceiving(false);
      missionStore.updateSystemStatus({ connectionStatus: 'disconnected' });
    };
  }, []);

  const lastPacket = telemetryStore.getLastPacket();

  return (
    <div className="min-h-screen bg-aerospace-darker text-gray-100">
      {/* Control Bar */}
      <ControlBar
        onStartTelemetry={handleStartTelemetry}
        onStopTelemetry={handleStopTelemetry}
        onResetPackets={handleResetPackets}
        telemetrySource={telemetrySource}
        onTelemetrySourceChange={setTelemetrySource}
        onSyncPCTime={handleSyncPCTime}
        onExportGraphPNG={isExportingGraphs ? undefined : handleExportGraphPNG}
      />

      {/* Main Content */}
      <div className="p-4 space-y-4">
        <Card title="Telemetry Scenarios" subtitle="Mock-only scenario injection for testing">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={scenarioKind}
              onChange={(e) => setScenarioKind(e.target.value as SimulationScenarioKind)}
              disabled={telemetryStore.isReceiving || telemetrySource !== 'mock'}
              className="px-3 py-2 bg-aerospace-dark border border-aerospace-secondary/30 rounded text-sm text-gray-200"
            >
              <option value="normal">Normal Mission</option>
              <option value="gps_failure">GPS Failure</option>
              <option value="separation_failure">Separation Failure</option>
              <option value="parachute_deployment">Parachute Deployment</option>
              <option value="battery_failure">Battery Failure</option>
              <option value="sensor_failure">Sensor Failure</option>
              <option value="packet_loss">Packet Loss</option>
            </select>

            <div className="text-xs text-gray-400">
              Switch scenarios to verify fault digits, map tracking, charts, and command behaviors.
            </div>
          </div>
        </Card>

        {/* Top Section: Telemetry & Error Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <TelemetryDisplay packet={lastPacket} label="Live Telemetry" />
          </div>
          <ErrorCodeDisplay packet={lastPacket} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AltitudeChart />
          <TemperatureChart />
          <VoltageChart />
          <PressureChart />
          <DescentRateChart />
        </div>

        {/* GPS Map */}
        <GPSMap />

        {/* Orientation & Mission Control */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <OrientationIndicator
            roll={lastPacket ? lastPacket.roll : 0}
            pitch={lastPacket ? lastPacket.pitch : 0}
            yaw={lastPacket ? lastPacket.yaw : 0}
          />
          <MissionControlPanel />
        </div>

        {/* Video Stream */}
        <VideoStream />
      </div>
    </div>
  );
};

export default Dashboard;
