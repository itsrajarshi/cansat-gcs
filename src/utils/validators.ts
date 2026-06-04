/**
 * Validator functions
 */

/**
 * Validate if value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Validate if GPS coordinates are valid
 */
export function isValidGPS(latitude: number, longitude: number): boolean {
  return (
    isValidNumber(latitude) &&
    isValidNumber(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Validate altitude range
 */
export function isValidAltitude(altitude: number): boolean {
  return isValidNumber(altitude) && altitude >= -1000 && altitude <= 50000;
}

/**
 * Validate temperature range
 */
export function isValidTemperature(temperature: number): boolean {
  return isValidNumber(temperature) && temperature >= -100 && temperature <= 80;
}

/**
 * Validate pressure range
 */
export function isValidPressure(pressure: number): boolean {
  return isValidNumber(pressure) && pressure >= 0 && pressure <= 150000;
}

/**
 * Validate voltage range
 */
export function isValidVoltage(voltage: number): boolean {
  return isValidNumber(voltage) && voltage >= 0 && voltage <= 15;
}

/**
 * Validate descent rate range
 */
export function isValidDescentRate(rate: number): boolean {
  return isValidNumber(rate) && rate >= -50 && rate <= 50;
}

/**
 * Validate mission time format HH:MM:SS
 */
export function isValidMissionTime(timeStr: string): boolean {
  const regex = /^(\d{1,2}):(\d{2}):(\d{2})$/;
  const match = timeStr.match(regex);

  if (!match) return false;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);

  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60 && seconds >= 0 && seconds < 60;
}

/**
 * Validate 4-digit error code format
 */
export function isValidErrorCode(code: string): boolean {
  return /^\d{4}$/.test(code);
}

/**
 * Validate error code is not all zeros (would be invalid)
 */
export function isValidNonZeroErrorCode(code: string): boolean {
  return isValidErrorCode(code) && code !== '0000';
}
