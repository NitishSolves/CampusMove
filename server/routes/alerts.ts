import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { broadcastEmergencyStatus } from '../socket';

const router = Router();

// GET /api/alerts (Admin & Safety Dispatch)
router.get('/', requireAuth, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const alerts = await db.getEmergencyAlerts(collegeId);
    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch emergency alerts.' });
  }
});

// PUT /api/alerts/:id/acknowledge (Admin Only)
router.put('/:id/acknowledge', requireAuth, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const user = req.user!;
    const { notes } = req.body;

    const updated = await db.updateEmergencyAlert(req.params.id, collegeId, {
      status: 'ACKNOWLEDGED',
      acknowledged_by: `${user.name} (Admin Dispatch)`,
      notes: notes || 'Acknowledged by campus transit dispatch desk.',
    });

    if (!updated) {
      res.status(404).json({ error: 'Alert not found.' });
      return;
    }

    broadcastEmergencyStatus(collegeId, updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to acknowledge alert.' });
  }
});

// PUT /api/alerts/:id/resolve (Admin Only)
router.put('/:id/resolve', requireAuth, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const user = req.user!;
    const { notes } = req.body;

    const updated = await db.updateEmergencyAlert(req.params.id, collegeId, {
      status: 'RESOLVED',
      resolved_by: `${user.name} (Safety Dispatch)`,
      notes: notes || 'Emergency incident resolved. Vehicle cleared.',
    });

    if (!updated) {
      res.status(404).json({ error: 'Alert not found.' });
      return;
    }

    broadcastEmergencyStatus(collegeId, updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to resolve alert.' });
  }
});

export default router;
