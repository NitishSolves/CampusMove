import { Router, Response } from 'express';
import { db, LocationRecord, EmergencyAlertRecord } from '../db';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { broadcastBusLocation, broadcastBusUpdate, broadcastEmergencyAlert } from '../socket';
import { determineConfidence, calculateRouteETAs } from '../utils/eta';

const router = Router();

// POST /api/driver/location (Single real-time breadcrumb from browser GPS)
router.post('/location', requireAuth, requireRole(['DRIVER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { tripId, busId, lat, lng, speed, heading, accuracy, timestamp, isSimulated, id } = req.body;

    if (lat === undefined || lng === undefined) {
      res.status(400).json({ error: 'lat and lng are required.' });
      return;
    }

    const recordedAt = timestamp || new Date().toISOString();
    const speedKmh = speed ? Math.round(speed * 3.6) : (speed === 0 ? 0 : 22);

    // 1. Persist breadcrumb in locations log
    const locRecord: LocationRecord = {
      id: id || ('loc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
      trip_id: tripId || 'no_trip',
      bus_id: busId,
      college_id: user.collegeId,
      lat: Number(lat),
      lng: Number(lng),
      speed: speed !== undefined ? Number(speed) : undefined,
      heading: heading !== undefined ? Number(heading) : undefined,
      accuracy: accuracy !== undefined ? Number(accuracy) : undefined,
      recorded_at: recordedAt,
      is_offline_queued: false,
      created_at: new Date().toISOString(),
    };

    await db.saveLocation(locRecord);

    // 2. Update Bus vehicle state
    const confidence = determineConfidence(recordedAt, 'ACTIVE', Boolean(isSimulated));
    const updatedBus = await db.updateBus(busId, user.collegeId, {
      last_location_lat: Number(lat),
      last_location_lng: Number(lng),
      speed_kmh: speedKmh,
      heading: heading !== undefined ? Number(heading) : 0,
      gps_status: 'GPS_ACTIVE',
      network_status: 'NETWORK_ONLINE',
      eta_confidence: confidence,
      is_simulated: Boolean(isSimulated),
      last_sync_timestamp: recordedAt,
    });

    // 3. Compute honest upcoming ETAs for real-time broadcast
    if (updatedBus) {
      const stops = await db.getStops(user.collegeId, updatedBus.current_route_id);
      const upcomingEtas = calculateRouteETAs(
        Number(lat),
        Number(lng),
        speedKmh,
        stops,
        confidence
      );

      const payload = {
        busId,
        tripId,
        lat: Number(lat),
        lng: Number(lng),
        speedKmh,
        heading: heading || 0,
        accuracy: accuracy || 10,
        timestamp: recordedAt,
        gpsStatus: 'GPS_ACTIVE',
        networkStatus: 'NETWORK_ONLINE',
        etaConfidence: confidence,
        isSimulated: Boolean(isSimulated),
        upcomingEtas,
        nextStop: upcomingEtas[0]
          ? {
              stopName: upcomingEtas[0].stopName,
              etaMinutes: upcomingEtas[0].etaMinutes,
              distanceKm: upcomingEtas[0].distanceKm,
            }
          : undefined,
      };

      broadcastBusLocation(user.collegeId, payload);
      broadcastBusUpdate(user.collegeId, {
        ...updatedBus,
        upcomingEtas,
        nextStop: payload.nextStop,
      });
    }

    res.json({
      success: true,
      syncedAt: recordedAt,
      confidence,
    });
  } catch (err: any) {
    console.error('Error saving driver location:', err);
    res.status(500).json({ error: 'Failed to record location breadcrumb.' });
  }
});

// POST /api/driver/location/sync (Batch upload of offline queued locations)
router.post('/location/sync', requireAuth, requireRole(['DRIVER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { tripId, busId, locations } = req.body;

    if (!Array.isArray(locations) || locations.length === 0) {
      res.status(400).json({ error: 'locations must be a non-empty array of queued points.' });
      return;
    }

    // Sort chronologically
    const sorted = [...locations].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const recordsToInsert: LocationRecord[] = sorted.map((item, idx) => ({
      id: item.id || `sync_${Date.now()}_${idx}`,
      trip_id: tripId || item.tripId || 'no_trip',
      bus_id: busId || item.busId,
      college_id: user.collegeId,
      lat: Number(item.lat),
      lng: Number(item.lng),
      speed: item.speed !== undefined ? Number(item.speed) : undefined,
      heading: item.heading !== undefined ? Number(item.heading) : undefined,
      accuracy: item.accuracy !== undefined ? Number(item.accuracy) : undefined,
      recorded_at: item.timestamp,
      is_offline_queued: true,
      created_at: new Date().toISOString(),
    }));

    const savedCount = await db.saveLocationBatch(recordsToInsert);

    // Update bus state with latest point
    const latest = sorted[sorted.length - 1];
    const latestSpeedKmh = latest.speed ? Math.round(latest.speed * 3.6) : 22;
    const confidence = determineConfidence(latest.timestamp, 'ACTIVE', false);

    const targetBusId = busId || latest.busId;
    let updatedBus = null;
    if (targetBusId) {
      updatedBus = await db.updateBus(targetBusId, user.collegeId, {
        last_location_lat: Number(latest.lat),
        last_location_lng: Number(latest.lng),
        speed_kmh: latestSpeedKmh,
        heading: latest.heading !== undefined ? Number(latest.heading) : 0,
        gps_status: 'GPS_ACTIVE',
        network_status: 'NETWORK_ONLINE',
        eta_confidence: confidence,
        last_sync_timestamp: new Date().toISOString(),
      });
    }

    if (tripId) {
      const trip = (await db.getTrips(user.collegeId, user.userId)).find((t) => t.id === tripId);
      if (trip) {
        await db.updateTrip(trip.id, user.collegeId, {
          total_locations_logged: trip.total_locations_logged + savedCount,
          synced_locations_count: trip.synced_locations_count + savedCount,
        });
      }
    }

    if (updatedBus) {
      broadcastBusLocation(user.collegeId, {
        busId: targetBusId,
        tripId,
        lat: Number(latest.lat),
        lng: Number(latest.lng),
        speedKmh: latestSpeedKmh,
        heading: latest.heading || 0,
        timestamp: new Date().toISOString(),
        gpsStatus: 'GPS_ACTIVE',
        networkStatus: 'NETWORK_ONLINE',
        etaConfidence: confidence,
      });
      broadcastBusUpdate(user.collegeId, updatedBus);
    }

    res.json({
      success: true,
      savedCount,
      syncedPointsCount: savedCount,
      latestLocation: {
        lat: latest.lat,
        lng: latest.lng,
      },
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error syncing queued locations:', err);
    res.status(500).json({ error: 'Failed to synchronize queued locations.' });
  }
});

// POST /api/driver/emergency (Emergency Alert)
router.post('/emergency', requireAuth, requireRole(['DRIVER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { tripId, busId, reason, description, type, lat, lng } = req.body;

    const alertReason = (reason || description || type || 'Emergency Protocol Triggered').trim();

    const bus = busId ? await db.getBusById(busId, user.collegeId) : null;
    const route = bus?.current_route_id ? await db.getRouteById(bus.current_route_id, user.collegeId) : null;

    const alertRecord: EmergencyAlertRecord = {
      id: 'alert_' + Date.now().toString(),
      college_id: user.collegeId,
      trip_id: tripId || undefined,
      bus_id: busId || undefined,
      driver_id: user.userId,
      bus_number: bus?.bus_number || 'BUS-UNKNOWN',
      route_name: route?.name || 'In-Service Route',
      driver_name: user.name,
      reason: alertReason,
      location_lat: Number(lat || bus?.last_location_lat || 34.0537),
      location_lng: Number(lng || bus?.last_location_lng || -118.2570),
      timestamp: new Date().toISOString(),
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    const created = await db.createEmergencyAlert(alertRecord);
    broadcastEmergencyAlert(user.collegeId, created);

    // Also post high-priority campus notification
    await db.createNotification({
      id: 'notif_emg_' + Date.now().toString(),
      college_id: user.collegeId,
      route_id: bus?.current_route_id,
      title: `Emergency Protocol: ${bus?.bus_number || 'Campus Bus'}`,
      message: `Emergency signal received from ${user.name} on ${bus?.bus_number}: "${reason}". Campus dispatch notified.`,
      category: 'EMERGENCY',
      priority: 'URGENT',
      timestamp: new Date().toISOString(),
      is_read: false,
      created_at: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      alert: created,
    });
  } catch (err: any) {
    console.error('Error triggering emergency alert:', err);
    res.status(500).json({ error: 'Failed to record emergency alert.' });
  }
});

export default router;
