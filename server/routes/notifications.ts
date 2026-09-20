import { Router, Response } from 'express';
import { db, NotificationRecord } from '../db';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { broadcastNotification } from '../socket';

const router = Router();

// GET /api/notifications
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const routeId = req.query.routeId as string | undefined;
    const notifications = await db.getNotifications(collegeId, routeId);
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// POST /api/notifications/broadcast (Admin Only)
router.post('/broadcast', requireAuth, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const { title, message, category, priority, routeId } = req.body;

    if (!title || !message) {
      res.status(400).json({ error: 'Title and message are required.' });
      return;
    }

    const notif: NotificationRecord = {
      id: 'notif_' + Date.now().toString(),
      college_id: collegeId,
      route_id: routeId || undefined,
      title: title.trim(),
      message: message.trim(),
      category: category || 'ANNOUNCEMENT',
      priority: priority || 'NORMAL',
      timestamp: new Date().toISOString(),
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const created = await db.createNotification(notif);
    broadcastNotification(collegeId, created);

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to broadcast notification.' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const collegeId = req.user!.collegeId;
    const success = await db.markNotificationRead(req.params.id, collegeId);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to mark notification read.' });
  }
});

export default router;
