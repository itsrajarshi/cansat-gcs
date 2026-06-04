/**
 * Mission and mission control type definitions
 */

export interface MissionState {
  isActive: boolean;
  phase: MissionPhaseType;
  startTime: number;
  elapsedTime: number; // seconds
  isPaused: boolean;
}

export type MissionPhaseType = 'pre-launch' | 'launch' | 'ascent' | 'apogee' | 'separation' | 'descent' | 'landing' | 'post-mission';

export interface MissionCommand {
  id: string;
  type: 'separation' | 'parachute' | 'emergency' | 'redundant_activation' | 'reset' | 'sync';
  name: string;
  description: string;
  timestamp: number;
  status: 'pending' | 'sent' | 'executing' | 'completed' | 'failed';
  responseTime?: number;
  acknowledged: boolean;
  error?: string;
}

export interface MissionLog {
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: unknown;
}

export interface SystemStatus {
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  lastHeartbeat: number;
  signalStrength: number; // 0-100
  latency: number; // milliseconds
  systemHealth: number; // 0-100
}

export interface AlertState {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: number;
  dismissed: boolean;
  actionable?: boolean;
  action?: () => void;
}
