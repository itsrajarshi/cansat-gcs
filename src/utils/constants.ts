/**
 * Constants for CanSat GCS
 */

export const MISSION_PHASES = {
  PRE_LAUNCH: 'pre-launch',
  LAUNCH: 'launch',
  ASCENT: 'ascent',
  APOGEE: 'apogee',
  SEPARATION: 'separation',
  DESCENT: 'descent',
  LANDING: 'landing',
  POST_MISSION: 'post-mission',
} as const;

export const TELEMETRY_REFRESH_INTERVAL = 100; // milliseconds
export const CHART_SAMPLE_LIMIT = 500;
export const MAP_AUTO_CENTER_ZOOM = 15;
export const DEFAULT_LATITUDE = 28.5355; // New Delhi
export const DEFAULT_LONGITUDE = 77.3910;

export const ERROR_CODES = {
  NORMAL: '0000',
  DESCENT_FAULT: '1000',
  GPS_UNAVAILABLE: '0100',
  SEPARATION_FAILURE: '0010',
  PARACHUTE_ACTIVE: '0001',
  CRITICAL: '1111',
} as const;

export const PHASE_ALTITUDE_THRESHOLDS = {
  LAUNCH: 50, // m
  ASCENT: 1000, // m
  APOGEE: 2000, // m
  SEPARATION: 1800, // m
  DESCENT: 100, // m
  LANDING: 10, // m
} as const;

export const SAFE_DESCENT_RATE = { MIN: 8, MAX: 10 }; // m/s

export const COLOR_SCHEME = {
  NORMAL: '#00ff88',
  WARNING: '#ffaa00',
  CRITICAL: '#ff3333',
  ACCENT: '#00d9ff',
  BACKGROUND: '#0a0e27',
  PANEL: '#1a1f3a',
} as const;

export const VIDEO_RESOLUTION_OPTIONS = [
  { label: '1080p', value: '1920x1080' },
  { label: '720p', value: '1280x720' },
  { label: '480p', value: '640x480' },
  { label: '360p', value: '480x360' },
] as const;

export const MOCK_TELEMETRY_INTERVAL = 500; // milliseconds

export const STORAGE_KEYS = {
  TELEMETRY_HISTORY: 'cansat_telemetry_history',
  MISSION_LOG: 'cansat_mission_log',
  COMMANDS_HISTORY: 'cansat_commands_history',
  USER_PREFERENCES: 'cansat_user_preferences',
} as const;
