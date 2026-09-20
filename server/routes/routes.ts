import { Router, Response } from 'express';
import { db, RouteRecord } from '../db';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/routes
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const routes = await db.getRoutes(collegeId);
    const allStops = await db.getStops(collegeId);

    const enriched = routes.map((r) => ({
      id: r.id,
      collegeId: r.college_id,
      code: r.code,
      name: r.name,
      description: r.description,
      color: r.color,
      status: r.status,
      scheduleHours: r.schedule_hours,
      frequencyMinutes: r.frequency_minutes,
      pathCoordinates: r.path_coordinates,
      stops: allStops.filter((s) => s.route_id === r.id).sort((a, b) => a.sequence - b.sequence),
    }));

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch routes.' });
  }
});

// GET /api/routes/:id
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const route = await db.getRouteById(req.params.id, collegeId);

    if (!route) {
      res.status(404).json({ error: 'Route not found.' });
      return;
    }

    const stops = await db.getStops(collegeId, route.id);
    res.json({
      id: route.id,
      collegeId: route.college_id,
      code: route.code,
      name: route.name,
      description: route.description,
      color: route.color,
      status: route.status,
      scheduleHours: route.schedule_hours,
      frequencyMinutes: route.frequency_minutes,
      pathCoordinates: route.path_coordinates,
      stops,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch route.' });
  }
});

// POST /api/routes (Admin Only)
router.post('/', requireAuth, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const { code, name, description, color, frequencyMinutes, scheduleHours, pathCoordinates, stops } = req.body;

    if (!code || !name) {
      res.status(400).json({ error: 'Route code and name are required.' });
      return;
    }

    const newRoute: RouteRecord = {
      id: 'route_' + Date.now().toString(),
      college_id: collegeId,
      code: code.trim(),
      name: name.trim(),
      description: description?.trim(),
      color: color || '#2563EB',
      status: 'ACTIVE',
      schedule_hours: scheduleHours || '07:00 AM – 10:00 PM',
      frequency_minutes: Number(frequencyMinutes) || 10,
      path_coordinates: pathCoordinates || [],
      created_at: new Date().toISOString(),
    };

    const created = await db.createRoute(newRoute);

    if (Array.isArray(stops)) {
      for (let i = 0; i < stops.length; i++) {
        const s = stops[i];
        await db.createStop({
          id: 'stop_' + Date.now() + '_' + i,
          college_id: collegeId,
          route_id: created.id,
          code: s.code || `${created.code}-${i + 1}`,
          name: s.name,
          lat: s.lat,
          lng: s.lng,
          landmark: s.landmark,
          sequence: i + 1,
          created_at: new Date().toISOString(),
        });
      }
    }

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create route.' });
  }
});

// PUT /api/routes/:id (Admin Only)
router.put('/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const routeId = req.params.id;

    const updates: Partial<RouteRecord> = {};
    if (req.body.code) updates.code = req.body.code.trim();
    if (req.body.name) updates.name = req.body.name.trim();
    if (req.body.description !== undefined) updates.description = req.body.description?.trim();
    if (req.body.color) updates.color = req.body.color;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.scheduleHours) updates.schedule_hours = req.body.scheduleHours;
    if (req.body.frequencyMinutes) updates.frequency_minutes = Number(req.body.frequencyMinutes);
    if (req.body.pathCoordinates) updates.path_coordinates = req.body.pathCoordinates;

    const updated = await db.updateRoute(routeId, collegeId, updates);
    if (!updated) {
      res.status(404).json({ error: 'Route not found.' });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update route.' });
  }
});

// DELETE /api/routes/:id (Admin Only)
router.delete('/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const routeId = req.params.id;

    const deleted = await db.deleteRoute(routeId, collegeId);
    if (!deleted) {
      res.status(404).json({ error: 'Route not found.' });
      return;
    }

    res.json({ success: true, message: 'Route deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete route.' });
  }
});

// POST /api/routes/:id/stops (Admin Only - add stop to route)
router.post('/:id/stops', requireAuth, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const routeId = req.params.id;
    const { code, name, lat, lng, landmark, sequence } = req.body;

    if (!name || lat === undefined || lng === undefined) {
      res.status(400).json({ error: 'name, lat, and lng are required.' });
      return;
    }

    const route = await db.getRouteById(routeId, collegeId);
    if (!route) {
      res.status(404).json({ error: 'Route not found.' });
      return;
    }

    const stops = await db.getStops(collegeId, routeId);
    const newStop = await db.createStop({
      id: 'stop_' + Date.now().toString(),
      college_id: collegeId,
      route_id: routeId,
      code: code || `${route.code}-${stops.length + 1}`,
      name: name.trim(),
      lat: Number(lat),
      lng: Number(lng),
      landmark: landmark?.trim(),
      sequence: sequence !== undefined ? Number(sequence) : stops.length + 1,
      created_at: new Date().toISOString(),
    });

    res.status(201).json(newStop);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create stop.' });
  }
});

// DELETE /api/routes/:id/stops/:stopId (Admin Only)
router.delete('/:id/stops/:stopId', requireAuth, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const stopId = req.params.stopId;

    const deleted = await db.deleteStop(stopId, collegeId);
    if (!deleted) {
      res.status(404).json({ error: 'Stop not found.' });
      return;
    }

    res.json({ success: true, message: 'Stop deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete stop.' });
  }
});

export default router;
