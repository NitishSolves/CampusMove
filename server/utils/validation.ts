export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  error?: string;
}

/**
 * Validates WGS-84 latitude and longitude coordinates.
 * Latitude must be between -90 and +90.
 * Longitude must be between -180 and +180.
 */
export function validateCoordinates(lat: any, lng: any): ValidationResult<{ lat: number; lng: number }> {
  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    return { valid: false, error: 'Both latitude (lat) and longitude (lng) are required.' };
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return { valid: false, error: 'Latitude and longitude must be valid finite numbers.' };
  }

  if (latNum < -90 || latNum > 90) {
    return { valid: false, error: `Invalid latitude: ${latNum}. Must be between -90 and +90 degrees.` };
  }

  if (lngNum < -180 || lngNum > 180) {
    return { valid: false, error: `Invalid longitude: ${lngNum}. Must be between -180 and +180 degrees.` };
  }

  return { valid: true, data: { lat: latNum, lng: lngNum } };
}

/**
 * Validates GPS telemetry breadcrumb attributes.
 */
export function validateTelemetry(data: any): ValidationResult<{
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}> {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Telemetry data must be a non-null object.' };
  }

  const coordResult = validateCoordinates(data.lat, data.lng);
  if (!coordResult.valid || !coordResult.data) {
    return { valid: false, error: coordResult.error };
  }

  let speed: number | undefined = undefined;
  if (data.speed !== undefined && data.speed !== null) {
    const speedNum = Number(data.speed);
    if (!Number.isFinite(speedNum) || speedNum < 0 || speedNum > 200) {
      return { valid: false, error: `Speed must be a number between 0 and 200 km/h (received: ${data.speed}).` };
    }
    speed = speedNum;
  }

  let heading: number | undefined = undefined;
  if (data.heading !== undefined && data.heading !== null) {
    const headingNum = Number(data.heading);
    if (!Number.isFinite(headingNum) || headingNum < 0 || headingNum > 360) {
      return { valid: false, error: `Heading must be a number between 0 and 360 degrees (received: ${data.heading}).` };
    }
    heading = headingNum;
  }

  let accuracy: number | undefined = undefined;
  if (data.accuracy !== undefined && data.accuracy !== null) {
    const accuracyNum = Number(data.accuracy);
    if (!Number.isFinite(accuracyNum) || accuracyNum < 0 || accuracyNum > 10000) {
      return { valid: false, error: `Accuracy must be a non-negative number <= 10000m (received: ${data.accuracy}).` };
    }
    accuracy = accuracyNum;
  }

  return {
    valid: true,
    data: {
      lat: coordResult.data.lat,
      lng: coordResult.data.lng,
      speed,
      heading,
      accuracy,
    },
  };
}

/**
 * Validates trip start parameters.
 */
export function validateTripStart(data: any): ValidationResult<{ busId: string; routeId: string }> {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be an object.' };
  }

  const busId = typeof data.busId === 'string' ? data.busId.trim() : '';
  const routeId = typeof data.routeId === 'string' ? data.routeId.trim() : '';

  if (!busId) {
    return { valid: false, error: 'busId is required and must be a non-empty string.' };
  }

  if (!routeId) {
    return { valid: false, error: 'routeId is required and must be a non-empty string.' };
  }

  return { valid: true, data: { busId, routeId } };
}

/**
 * Validates passenger occupancy updates.
 */
export function validateOccupancyInput(data: any): ValidationResult<{ delta?: number; absoluteCount?: number }> {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be an object.' };
  }

  const { delta, absoluteCount } = data;

  if (delta === undefined && absoluteCount === undefined) {
    return { valid: false, error: 'Either delta or absoluteCount must be provided.' };
  }

  let validDelta: number | undefined = undefined;
  if (delta !== undefined) {
    const deltaNum = Number(delta);
    if (!Number.isInteger(deltaNum)) {
      return { valid: false, error: 'delta must be an integer.' };
    }
    if (deltaNum < -100 || deltaNum > 100) {
      return { valid: false, error: 'delta must be between -100 and +100.' };
    }
    validDelta = deltaNum;
  }

  let validAbsolute: number | undefined = undefined;
  if (absoluteCount !== undefined) {
    const absNum = Number(absoluteCount);
    if (!Number.isInteger(absNum) || absNum < 0 || absNum > 2000) {
      return { valid: false, error: 'absoluteCount must be an integer between 0 and 2000.' };
    }
    validAbsolute = absNum;
  }

  return { valid: true, data: { delta: validDelta, absoluteCount: validAbsolute } };
}
