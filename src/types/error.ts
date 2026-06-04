/**
 * Error code and system error type definitions
 */

export interface ErrorCodeBreakdown {
  digit1: {
    value: boolean;
    label: 'Descent Rate';
    status: 'safe' | 'fault';
  };
  digit2: {
    value: boolean;
    label: 'GPS Availability';
    status: 'available' | 'unavailable';
  };
  digit3: {
    value: boolean;
    label: 'Payload Separation';
    status: 'successful' | 'failure';
  };
  digit4: {
    value: boolean;
    label: 'Emergency Parachute';
    status: 'inactive' | 'active';
  };
}

export interface SystemError {
  code: string; // 4-digit error code
  severity: 'critical' | 'warning' | 'info';
  breakdown: ErrorCodeBreakdown;
  timestamp: number;
  description: string;
}

export interface AlertConfig {
  colorNormal: string;
  colorWarning: string;
  colorCritical: string;
  flashingEnabled: boolean;
  flashDuration: number; // milliseconds
}

export type ErrorSeverity = 'normal' | 'warning' | 'critical';

export interface ParseError {
  code: string;
  message: string;
  packetData?: string;
  fieldName?: string;
}
