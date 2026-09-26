import { Router, Response } from 'express';
import { db, ScheduleRecord } from '../db';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/schedules - List schedules (filtered by college, optional: bus, route, day)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const busId = req.query.busId as string | undefined;
    const routeId = req.query.routeId as string | undefined;
    const operatingDay = req.query.operatingDay as string | undefined;

    const schedules = await db.getSchedules(collegeId, busId, routeId, operatingDay);
    res.json(schedules);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch schedules.' });
  }
});

// GET /api/schedules/:id - Get single schedule
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const schedule = await db.getScheduleById(req.params.id, collegeId);

    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found.' });
      return;
    }

    res.json(schedule);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch schedule.' });
  }
});

// POST /api/schedules - Create schedule (ADMIN only)
router.post('/', requireAuth, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const { busId, routeId, departureTime, arrivalTime, operatingDays, notes } = req.body;

    // Validate required fields
    if (!busId || !routeId || !departureTime || !operatingDays || operatingDays.length === 0) {
      res.status(400).json({ error: 'Missing required fields: busId, routeId, departureTime, operatingDays[].' });
      return;
    }

    // Verify bus and route belong to this college (prevent IDOR)
    const bus = await db.getBusById(busId, collegeId);
    if (!bus) {
      res.status(404).json({ error: 'Bus not found or does not belong to your college.' });
      return;
    }

    const route = await db.getRouteById(routeId, collegeId);
    if (!route) {
      res.status(404).json({ error: 'Route not found or does not belong to your college.' });
      return;
    }

    const schedule: ScheduleRecord = {
      id: 'sch_' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
      college_id: collegeId,
      bus_id: busId,
      route_id: routeId,
      departure_time: departureTime, // HH:mm format
      arrival_time: arrivalTime || undefined,
      operating_days: operatingDays, // Array of day names
      status: 'ACTIVE',
      notes: notes || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const created = await db.createSchedule(schedule);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create schedule.' });
  }
});

// PUT /api/schedules/:id - Update schedule (ADMIN only)
router.put('/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const { departureTime, arrivalTime, operatingDays, status, notes } = req.body;

    // Verify schedule belongs to this college
    const existing = await db.getScheduleById(req.params.id, collegeId);
    if (!existing) {
      res.status(404).json({ error: 'Schedule not found.' });
      return;
    }

    const updates: Partial<ScheduleRecord> = {};
    if (departureTime !== undefined) updates.departure_time = departureTime;
    if (arrivalTime !== undefined) updates.arrival_time = arrivalTime;
    if (operatingDays !== undefined && operatingDays.length > 0) updates.operating_days = operatingDays;
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const updated = await db.updateSchedule(req.params.id, collegeId, updates);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update schedule.' });
  }
});

// DELETE /api/schedules/:id - Delete schedule (ADMIN only)
router.delete('/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;

    // Verify schedule belongs to this college
    const existing = await db.getScheduleById(req.params.id, collegeId);
    if (!existing) {
      res.status(404).json({ error: 'Schedule not found.' });
      return;
    }

    const deleted = await db.deleteSchedule(req.params.id, collegeId);
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(500).json({ error: 'Failed to delete schedule.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete schedule.' });
  }
});

export default router;
