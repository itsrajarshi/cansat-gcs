/**
 * Utility functions for formatting and validation
 */

/**
 * Format altitude to readable string
 */
export function formatAltitude(altitude: number, precision: number = 1): string {
  return `${altitude.toFixed(precision)} m`;
}

/**
 * Format pressure to readable string
 */
export function formatPressure(pressure: number, precision: number = 0): string {
  return `${pressure.toFixed(precision)} Pa`;
}

/**
 * Format temperature to readable string
 */
export function formatTemperature(temperature: number, precision: number = 1): string {
  return `${temperature.toFixed(precision)} °C`;
}

/**
 * Format voltage to readable string
 */
export function formatVoltage(voltage: number, precision: number = 2): string {
  return `${voltage.toFixed(precision)} V`;
}

/**
 * Format descent rate to readable string
 */
export function formatDescentRate(rate: number, precision: number = 2): string {
  return `${rate.toFixed(precision)} m/s`;
}

/**
 * Format GPS coordinates
 */
export function formatGPS(latitude: number, longitude: number, precision: number = 4): string {
  return `${latitude.toFixed(precision)}°, ${longitude.toFixed(precision)}°`;
}

/**
 * Format distance in kilometers
 */
export function formatDistance(meters: number, precision: number = 2): string {
  if (meters < 1000) {
    return `${meters.toFixed(0)} m`;
  }
  return `${(meters / 1000).toFixed(precision)} km`;
}

/**
 * Format speed (m/s to km/h)
 */
export function formatSpeed(metersPerSecond: number, precision: number = 1): string {
  const kmh = metersPerSecond * 3.6;
  return `${kmh.toFixed(precision)} km/h`;
}

/**
 * Format mission time from seconds
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Format timestamp to readable date/time
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Format timestamp with date
 */
export function formatTimestampWithDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate bearing between two GPS coordinates
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  let bearing = Math.atan2(y, x);
  bearing = ((bearing * 180) / Math.PI + 360) % 360;

  return bearing;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  return (value / total) * 100;
}
