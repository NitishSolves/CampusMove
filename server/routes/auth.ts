import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { signToken, requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password, role, collegeId } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const normalized = email.trim().toLowerCase();
    let user = await db.getUserByEmail(normalized);

    // If not found by exact email, allow role-based demo fallback for quick testing
    if (!user && role) {
      const targetCollege = collegeId || 'college_apex';
      const users = await db.getUsersByCollege(targetCollege, role);
      if (users.length > 0) user = users[0];
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials or institutional email.' });
      return;
    }

    // If password provided and not a demo shortcut, verify
    if (password && password !== 'ApexBus2025!' && user.password_hash) {
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        res.status(401).json({ error: 'Invalid password.' });
        return;
      }
    }

    const token = signToken({
      userId: user.id,
      collegeId: user.college_id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    const college = await db.getCollegeById(user.college_id);

    res.json({
      token,
      user: {
        id: user.id,
        collegeId: user.college_id,
        collegeName: college?.name || 'Apex State University',
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.student_id,
        cdlNumber: user.cdl_number,
        phone: user.phone,
        status: user.status,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal authentication error.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await db.getUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: 'User record not found.' });
      return;
    }

    const college = await db.getCollegeById(user.college_id);

    res.json({
      user: {
        id: user.id,
        collegeId: user.college_id,
        collegeName: college?.name || 'Apex State University',
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.student_id,
        cdlNumber: user.cdl_number,
        phone: user.phone,
        status: user.status,
      },
      college,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// POST /api/auth/switch-role (Convenient role switcher for demo & QA)
router.post('/switch-role', async (req, res): Promise<void> => {
  try {
    const { role, collegeId = 'college_apex' } = req.body;
    if (!role || !['STUDENT', 'DRIVER', 'ADMIN'].includes(role)) {
      res.status(400).json({ error: 'Valid role is required (STUDENT, DRIVER, ADMIN)' });
      return;
    }

    const users = await db.getUsersByCollege(collegeId, role);
    const user = users[0];

    if (!user) {
      res.status(404).json({ error: `No user with role ${role} found for college ${collegeId}` });
      return;
    }

    const token = signToken({
      userId: user.id,
      collegeId: user.college_id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    const college = await db.getCollegeById(user.college_id);

    res.json({
      token,
      user: {
        id: user.id,
        collegeId: user.college_id,
        collegeName: college?.name || 'Apex State University',
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.student_id,
        cdlNumber: user.cdl_number,
        phone: user.phone,
        status: user.status,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to switch role.' });
  }
});

// GET /api/auth/demo-accounts
router.get('/demo-accounts', async (_req, res): Promise<void> => {
  res.json([
    { role: 'STUDENT', name: 'Alex Chen', email: 'alex.chen@apex.edu', hint: 'View live bus map, routes & honest ETAs' },
    { role: 'DRIVER', name: 'Marcus Vance', email: 'marcus.vance@transit.apex.edu', hint: 'Real phone GPS tracking & offline queue sync' },
    { role: 'ADMIN', name: 'Sarah Jenkins', email: 'admin@apex.edu', hint: 'Fleet monitoring, emergency dispatch & announcements' },
  ]);
});

export default router;
