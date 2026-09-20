// Honest ETA and Confidence calculation based on real telemetry & route topology
// No AI/ML hype: uses geometric path projection, live GPS velocity, and stop dwell times.

export type ETAConfidence = 'LIVE' | 'DEGRADED' | 'STALE' | 'OFFLINE' | 'SCHEDULED';

export interface CalculatedETA {
  stopId: string;
  stopName: string;
  etaMinutes: number;
  distanceKm: number;
  confidence: ETAConfidence;
}

// Haversine distance in kilometers
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determine honest GPS confidence based on telemetry freshness and vehicle status
 */
export function determineConfidence(
  lastSyncTimestamp: string | Date,
  busStatus: string,
  isSimulated: boolean = false
): ETAConfidence {
  if (busStatus === 'MAINTENANCE' || busStatus === 'OUT_OF_SERVICE') {
    return 'OFFLINE';
  }

  if (busStatus !== 'ACTIVE') {
    return 'SCHEDULED';
  }

  const lastTime = new Date(lastSyncTimestamp).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, (now - lastTime) / 1000);

  if (diffSec <= 30) {
    return 'LIVE';
  }
  if (diffSec <= 120) {
    return 'DEGRADED';
  }
  if (diffSec <= 300) {
    return 'STALE';
  }
  return 'OFFLINE';
}

/**
 * Calculate honest ETAs to stops along a route
 */
export function calculateRouteETAs(
  busLat: number,
  busLng: number,
  speedKmh: number,
  stops: { id: string; name: string; lat: number; lng: number; sequence: number }[],
  confidence: ETAConfidence
): CalculatedETA[] {
  if (stops.length === 0) return [];

  // Effective transit travel speed: clamp between 15 km/h (traffic/lights) and 45 km/h
  const effectiveSpeed = speedKmh > 5 ? Math.min(Math.max(speedKmh, 15), 45) : 22;
  const dwellTimePerStopHours = 0.75 / 60; // 45 seconds per stop

  // Sort stops by sequence
  const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);

  // Find nearest stop to current location
  let nearestIdx = 0;
  let minDistance = Infinity;

  sortedStops.forEach((stop, idx) => {
    const dist = haversineKm(busLat, busLng, stop.lat, stop.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestIdx = idx;
    }
  });

  const results: CalculatedETA[] = [];
  let cumulativeDist = 0;

  for (let i = 0; i < sortedStops.length; i++) {
    // Relative sequence position ahead of current location
    const stopIdx = (nearestIdx + i) % sortedStops.length;
    const stop = sortedStops[stopIdx];

    if (i === 0) {
      cumulativeDist = minDistance;
    } else {
      const prevStop = sortedStops[(nearestIdx + i - 1) % sortedStops.length];
      cumulativeDist += haversineKm(prevStop.lat, prevStop.lng, stop.lat, stop.lng);
    }

    const driveTimeHours = cumulativeDist / effectiveSpeed;
    const dwellHours = i * dwellTimePerStopHours;
    const totalMinutes = Math.max(1, Math.round((driveTimeHours + dwellHours) * 60));

    results.push({
      stopId: stop.id,
      stopName: stop.name,
      etaMinutes: totalMinutes,
      distanceKm: parseFloat(cumulativeDist.toFixed(2)),
      confidence,
    });
  }

  return results;
}
