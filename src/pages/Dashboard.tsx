import React, { useCallback, useEffect, useState } from 'react';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useMissionStore } from '@/store/missionStore';
import { MissionStage, SimulationScenarioKind, TelemetrySimulator } from '@/services/telemetrySimulator';
import { parseMissionTime, parseTelemetry } from '@/services/telemetryParser';
import { SCENARIO_PREVIEW_PROGRESS } from '@/services/scenarioCatalog';
import { MOCK_MISSION_DURATION_SEC } from '@/utils/constants';

import ControlBar, { TelemetrySourceKind } from '@/components/layout/ControlBar';
import Footer from '@/components/layout/Footer';
import TelemetryDisplay from '@/components/telemetry/TelemetryDisplay';
import ErrorCodeDisplay from '@/components/telemetry/ErrorCodeDisplay';
import TelemetryScenariosPanel from '@/components/telemetry/TelemetryScenariosPanel';
import { AltitudeChart, TemperatureChart, VoltageChart, PressureChart, DescentRateChart } from '@/components/charts/Charts';
import GPSMap from '@/components/map/GPSMap';
import OrientationIndicator from '@/components/orientation/OrientationIndicator';
import MissionControlPanel from '@/components/mission/MissionControlPanel';
import VideoStream from '@/components/video/VideoStream';
import { webSocketService } from '@/services/webSocketService';
import { serialService } from '@/services/webSerialService';
import {
  CommandTransport,
  MissionCommandType,
  sendMissionCommand,
  sendSyncTimeCommand,
  tryHandleCommandLine,
  waitForSyncTimeAck,
} from '@/services/missionCommandService';
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
  const [missionStage, setMissionStage] = useState<MissionStage | null>(null);

  const getActiveTransport = useCallback((): CommandTransport | null => {
    if (telemetrySource === 'serial' && serialService.getConnectionStatus()) return 'serial';
    if (telemetrySource === 'websocket' && webSocketService.isConnected()) return 'websocket';
    return null;
  }, [telemetrySource]);

  const handleInboundLine = useCallback((raw: string, source: 'WebSocket' | 'Serial') => {
    if (tryHandleCommandLine(raw)) return;

    const parsed = parseTelemetry(raw);
    if (!parsed.success || !parsed.data) {
      missionStore.addLog('error', `Telemetry parse failed (${source})`, { error: parsed.error, raw });
      return;
    }
    telemetryStore.addPacket(parsed.data);
    missionStore.updateElapsedTime(parseMissionTime(parsed.data.missionTime));
    missionStore.updateSystemStatus({
      lastHeartbeat: Date.now(),
      signalStrength: source === 'Serial' ? 70 : 80,
      latency: source === 'Serial' ? 10 + Math.random() * 20 : 20 + Math.random() * 40,
      systemHealth: 97 - Math.random() * 6,
    });
  }, []);

  const handleExecuteMissionCommand = useCallback(
    async (type: MissionCommandType): Promise<'hardware' | 'simulated'> => {
      const transport = getActiveTransport();
      if (!transport) return 'simulated';

      await sendMissionCommand(type, transport);
      return 'hardware';
    },
    [getActiveTransport]
  );

  const createSimulator = useCallback(
    (kind: SimulationScenarioKind) =>
      new TelemetrySimulator({
        targetAltitude: 3000,
        missionDuration: MOCK_MISSION_DURATION_SEC,
        startLatitude: 28.5355,
        startLongitude: 77.391,
        scenarioKind: kind,
      }),
    []
  );

  // Initialize simulator
  useEffect(() => {
    setSimulator(createSimulator(scenarioKind));
    missionStore.addLog('info', 'Dashboard initialized');
  }, [createSimulator]);

  const handleScenarioChange = (kind: SimulationScenarioKind) => {
    setScenarioKind(kind);
    if (telemetrySource !== 'mock' || telemetryStore.isReceiving) return;

    const sim = createSimulator(kind);
    setSimulator(sim);
    telemetryStore.clearPackets();
    setMissionStage(null);
    missionStore.addLog('info', `Mock scenario set to ${kind}`);
  };

  const handlePreviewScenarioPacket = () => {
    if (!simulator || telemetrySource !== 'mock' || telemetryStore.isReceiving) return;

    const previewSim = createSimulator(scenarioKind);
    previewSim.fastForwardToProgress(SCENARIO_PREVIEW_PROGRESS[scenarioKind]);
    const packet = previewSim.generatePacket();
    telemetryStore.addPacket(packet);
    setMissionStage(previewSim.getStage());
    missionStore.updateElapsedTime(previewSim.getElapsedTime());
    missionStore.addLog('info', `Preview packet for scenario ${scenarioKind}`, {
      errorCode: packet.payloadStatus,
      stage: previewSim.getStage(),
    });
  };

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

        simulator.setScenarioKind(scenarioKind);

        const interval = setInterval(() => {
          if (!simulator) return;

          const packet = simulator.generatePacket();
          telemetryStore.addPacket(packet);
          setMissionStage(simulator.getStage());

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
          handleInboundLine(raw, 'WebSocket');
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
          handleInboundLine(raw, 'Serial');
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
    void (async () => {
      const transport = getActiveTransport();
      const pcTime = Date.now();

      if (!transport) {
        missionStore.addLog('success', 'PC time synced (local only)', { pcTime });
        missionStore.updateSystemStatus({ lastHeartbeat: pcTime });
        return;
      }

      try {
        const sentAt = await sendSyncTimeCommand(transport);
        missionStore.addLog('info', 'Sync PC Time command sent', { pcTime: sentAt, transport });
        const ackReceived = await waitForSyncTimeAck(5000);

        if (ackReceived) {
          missionStore.addLog('success', 'PC time synced (ACK received)', { pcTime: sentAt, transport });
        } else {
          missionStore.addLog('warning', 'Sync PC Time sent — no ACK within timeout', { pcTime: sentAt, transport });
        }
        missionStore.updateSystemStatus({ lastHeartbeat: Date.now() });
      } catch (error) {
        missionStore.addLog('error', 'Sync PC Time failed', { error });
      }
    })();
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
      simulator.setScenarioKind(scenarioKind);
    }
    setMissionStage(null);
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
    <div className="flex h-screen flex-col overflow-hidden bg-aerospace-darker text-gray-100">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 shrink-0 border-b border-aerospace-secondary/20 bg-aerospace-darker/90 backdrop-blur-md supports-[backdrop-filter]:bg-aerospace-darker/75">
        <ControlBar
          onStartTelemetry={handleStartTelemetry}
          onStopTelemetry={handleStopTelemetry}
          onResetPackets={handleResetPackets}
          telemetrySource={telemetrySource}
          onTelemetrySourceChange={setTelemetrySource}
          onSyncPCTime={handleSyncPCTime}
          onExportGraphPNG={isExportingGraphs ? undefined : handleExportGraphPNG}
        />
      </header>

      {/* Scrollable main content */}
      <main className="flex-1 overflow-y-auto overscroll-y-contain p-4 space-y-4">
        <TelemetryScenariosPanel
          scenarioKind={scenarioKind}
          onScenarioChange={handleScenarioChange}
          disabled={telemetryStore.isReceiving || telemetrySource !== 'mock'}
          isReceiving={telemetryStore.isReceiving}
          lastPacket={lastPacket}
          onPreviewPacket={
            telemetrySource === 'mock' && !telemetryStore.isReceiving ? handlePreviewScenarioPacket : undefined
          }
        />

        {/* Top Section: Telemetry & Error Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <TelemetryDisplay
              packet={lastPacket}
              label="Live Telemetry"
              activeScenario={telemetrySource === 'mock' ? scenarioKind : null}
              missionStage={missionStage}
            />
          </div>
          <ErrorCodeDisplay
            packet={lastPacket}
            activeScenario={telemetrySource === 'mock' ? scenarioKind : null}
          />
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
          <MissionControlPanel onExecuteCommand={handleExecuteMissionCommand} />
        </div>

        {/* Video Stream */}
        <VideoStream />
      </main>

      {/* Sticky footer */}
      <Footer />
    </div>
  );
};

export default Dashboard;
