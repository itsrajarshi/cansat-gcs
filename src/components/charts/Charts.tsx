import React, { useMemo, useState } from 'react';
import Card from '@/components/common/Card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTelemetryStore } from '@/store/telemetryStore';

const ZOOM_OPTIONS = [100, 250, 500] as const;
const DEFAULT_ZOOM = 500;

function ZoomControl({ windowSize, onChange }: { windowSize: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between mb-2 gap-3">
      <div className="text-xs text-gray-400">Zoom</div>
      <select
        value={windowSize}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-2 py-1 bg-aerospace-dark border border-aerospace-secondary/30 rounded text-xs text-gray-200"
      >
        {ZOOM_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            Last {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export const AltitudeChart: React.FC = () => {
  const { packets } = useTelemetryStore();
  const [windowSize, setWindowSize] = useState<number>(DEFAULT_ZOOM);

  const data = useMemo(
    () =>
      packets.slice(-windowSize).map((p, i) => ({
        id: i + (packets.length - windowSize),
        time: p.missionTime,
        altitude: Math.round(p.altitude),
      })),
    [packets, windowSize]
  );

  return (
    <Card title="Altitude Profile" subtitle="Real-time altitude tracking">
      <ZoomControl windowSize={windowSize} onChange={setWindowSize} />
      <div data-export-key="altitude" className="w-full">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" stroke="#888" style={{ fontSize: '12px' }} />
            <YAxis stroke="#888" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #00d9ff' }}
              formatter={(value) => [`${value} m`, 'Altitude']}
            />
            <Line
              type="monotone"
              dataKey="altitude"
              stroke="#00ff88"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export const TemperatureChart: React.FC = () => {
  const { packets } = useTelemetryStore();
  const [windowSize, setWindowSize] = useState<number>(DEFAULT_ZOOM);

  const data = useMemo(
    () =>
      packets.slice(-windowSize).map((p, i) => ({
        id: i,
        time: p.missionTime,
        temperature: Math.round(p.temperature * 10) / 10,
      })),
    [packets, windowSize]
  );

  return (
    <Card title="Temperature Monitoring" subtitle="Thermal profile">
      <ZoomControl windowSize={windowSize} onChange={setWindowSize} />
      <div data-export-key="temperature" className="w-full">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" stroke="#888" style={{ fontSize: '12px' }} />
            <YAxis stroke="#888" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #00d9ff' }}
              formatter={(value) => [`${value}°C`, 'Temperature']}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#ffaa00"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export const VoltageChart: React.FC = () => {
  const { packets } = useTelemetryStore();
  const [windowSize, setWindowSize] = useState<number>(DEFAULT_ZOOM);

  const data = useMemo(
    () =>
      packets.slice(-windowSize).map((p, i) => ({
        id: i,
        time: p.missionTime,
        voltage: Math.round(p.voltage * 100) / 100,
      })),
    [packets, windowSize]
  );

  return (
    <Card title="Battery Status" subtitle="Voltage discharge profile">
      <ZoomControl windowSize={windowSize} onChange={setWindowSize} />
      <div data-export-key="voltage" className="w-full">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" stroke="#888" style={{ fontSize: '12px' }} />
            <YAxis stroke="#888" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #00d9ff' }}
              formatter={(value) => [`${value}V`, 'Voltage']}
            />
            <Line
              type="monotone"
              dataKey="voltage"
              stroke="#00d9ff"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export const PressureChart: React.FC = () => {
  const { packets } = useTelemetryStore();
  const [windowSize, setWindowSize] = useState<number>(DEFAULT_ZOOM);

  const data = useMemo(
    () =>
      packets.slice(-windowSize).map((p, i) => ({
        id: i,
        time: p.missionTime,
        pressure: Math.round(p.pressure),
      })),
    [packets, windowSize]
  );

  return (
    <Card title="Atmospheric Pressure" subtitle="Barometric profile">
      <ZoomControl windowSize={windowSize} onChange={setWindowSize} />
      <div data-export-key="pressure" className="w-full">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" stroke="#888" style={{ fontSize: '12px' }} />
            <YAxis stroke="#888" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #00d9ff' }}
              formatter={(value) => [`${value} Pa`, 'Pressure']}
            />
            <Line
              type="monotone"
              dataKey="pressure"
              stroke="#6366f1"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export const DescentRateChart: React.FC = () => {
  const { packets } = useTelemetryStore();
  const [windowSize, setWindowSize] = useState<number>(DEFAULT_ZOOM);

  const data = useMemo(
    () =>
      packets.slice(-windowSize).map((p, i) => ({
        id: i,
        time: p.missionTime,
        descentRate: Math.round(p.descentRate * 100) / 100,
      })),
    [packets, windowSize]
  );

  return (
    <Card title="Descent Rate Analysis" subtitle="Velocity profile (negative = descending)">
      <ZoomControl windowSize={windowSize} onChange={setWindowSize} />
      <div data-export-key="descentRate" className="w-full">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" stroke="#888" style={{ fontSize: '12px' }} />
            <YAxis stroke="#888" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #00d9ff' }}
              formatter={(value) => [`${value} m/s`, 'Rate']}
            />
            <Line
              type="monotone"
              dataKey="descentRate"
              stroke="#ff3333"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default AltitudeChart;
