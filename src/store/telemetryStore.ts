/**
 * Telemetry Zustand Store - Real-time telemetry data management
 */

import { create } from 'zustand';
import { TelemetryPacket, TelemetryStats, GPSTrackPoint } from '@/types/telemetry';
import { CHART_SAMPLE_LIMIT } from '@/utils/constants';
import { telemetryStorage } from '@/services/telemetryStorage';

interface TelemetryState {
  // Data
  packets: TelemetryPacket[];
  gpsTrack: GPSTrackPoint[];
  lastPacket: TelemetryPacket | null;
  isReceiving: boolean;

  // Statistics
  stats: TelemetryStats;

  // Actions
  addPacket: (packet: TelemetryPacket) => void;
  addPackets: (packets: TelemetryPacket[]) => void;
  clearPackets: () => void;
  setReceiving: (isReceiving: boolean) => void;
  getPacketCount: () => number;
  getLastPacket: () => TelemetryPacket | null;
  getAllPackets: () => TelemetryPacket[];
  getGPSTrack: () => GPSTrackPoint[];
  getStats: () => TelemetryStats;
}

function calculateStats(packets: TelemetryPacket[]): TelemetryStats {
  if (packets.length === 0) {
    return {
      totalPackets: 0,
      packetLoss: 0,
      lastUpdateTime: 0,
      avgAltitude: 0,
      maxAltitude: 0,
      minAltitude: 0,
      avgTemperature: 0,
      avgPressure: 0,
      avgVoltage: 0,
      currentDescentRate: 0,
    };
  }

  const altitudes = packets.map((p) => p.altitude);
  const temperatures = packets.map((p) => p.temperature);
  const pressures = packets.map((p) => p.pressure);
  const voltages = packets.map((p) => p.voltage);

  const maxAltitude = Math.max(...altitudes);
  const minAltitude = Math.min(...altitudes);
  const avgAltitude = altitudes.reduce((a, b) => a + b, 0) / altitudes.length;

  const avgTemperature = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
  const avgPressure = pressures.reduce((a, b) => a + b, 0) / pressures.length;
  const avgVoltage = voltages.reduce((a, b) => a + b, 0) / voltages.length;

  // Detect packet loss (gaps in packet IDs)
   let packetLoss = 0;
  for (let i = 1; i < packets.length; i++) {
    const expectedId = packets[i - 1].packetId + 1;
    if (packets[i].packetId !== expectedId) {
      packetLoss += packets[i].packetId - expectedId;
    }
  }

  return {
    totalPackets: packets.length,
    packetLoss,
    lastUpdateTime: packets[packets.length - 1]?.timestamp || 0,
    avgAltitude,
    maxAltitude,
    minAltitude,
    avgTemperature,
    avgPressure,
    avgVoltage,
    currentDescentRate: packets[packets.length - 1]?.descentRate || 0,
  };
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  packets: [],
  gpsTrack: [],
  lastPacket: null,
  isReceiving: false,
  stats: {
    totalPackets: 0,
    packetLoss: 0,
    lastUpdateTime: 0,
    avgAltitude: 0,
    maxAltitude: 0,
    minAltitude: 0,
    avgTemperature: 0,
    avgPressure: 0,
    avgVoltage: 0,
    currentDescentRate: 0,
  },

  addPacket: (packet: TelemetryPacket) => {
    set((state) => {
      const newPackets = [...state.packets, packet];

      // Keep only last N packets
      if (newPackets.length > CHART_SAMPLE_LIMIT) {
        newPackets.shift();
      }

      // Update GPS track
      const newGpsTrack = [
        ...state.gpsTrack,
        {
          latitude: packet.gpsLatitude,
          longitude: packet.gpsLongitude,
          altitude: packet.gpsAltitude,
          timestamp: packet.timestamp,
          packetId: packet.packetId,
        },
      ];

      if (newGpsTrack.length > CHART_SAMPLE_LIMIT) {
        newGpsTrack.shift();
      }

      const stats = calculateStats(newPackets);

      return {
        packets: newPackets,
        gpsTrack: newGpsTrack,
        lastPacket: packet,
        stats,
      };
    });

    // Persist asynchronously; failures should not break the live UI.
    void telemetryStorage.savePacket(packet).catch(() => undefined);
  },

  addPackets: (packets: TelemetryPacket[]) => {
    set((state) => {
      const newPackets = [...state.packets, ...packets];

      if (newPackets.length > CHART_SAMPLE_LIMIT) {
        const startIndex = newPackets.length - CHART_SAMPLE_LIMIT;
        newPackets.splice(0, startIndex);
      }

      const gpsTrackPoints = packets.map((packet) => ({
        latitude: packet.gpsLatitude,
        longitude: packet.gpsLongitude,
        altitude: packet.gpsAltitude,
        timestamp: packet.timestamp,
        packetId: packet.packetId,
      }));

      const newGpsTrack = [...state.gpsTrack, ...gpsTrackPoints];
      if (newGpsTrack.length > CHART_SAMPLE_LIMIT) {
        const startIndex = newGpsTrack.length - CHART_SAMPLE_LIMIT;
        newGpsTrack.splice(0, startIndex);
      }

      const stats = calculateStats(newPackets);

      return {
        packets: newPackets,
        gpsTrack: newGpsTrack,
        lastPacket: packets[packets.length - 1],
        stats,
      };
    });

    void telemetryStorage.savePackets(packets).catch(() => undefined);
  },

  clearPackets: () => {
    set({
      packets: [],
      gpsTrack: [],
      lastPacket: null,
      stats: {
        totalPackets: 0,
        packetLoss: 0,
        lastUpdateTime: 0,
        avgAltitude: 0,
        maxAltitude: 0,
        minAltitude: 0,
        avgTemperature: 0,
        avgPressure: 0,
        avgVoltage: 0,
        currentDescentRate: 0,
      },
    });

    void telemetryStorage.clear().catch(() => undefined);
  },

  setReceiving: (isReceiving: boolean) => {
    set({ isReceiving });
  },

  getPacketCount: () => {
    return get().packets.length;
  },

  getLastPacket: () => {
    return get().lastPacket;
  },

  getAllPackets: () => {
    return get().packets;
  },

  getGPSTrack: () => {
    return get().gpsTrack;
  },

  getStats: () => {
    return get().stats;
  },
}));
