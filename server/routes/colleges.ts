import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// GET /api/colleges
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const colleges = await db.getColleges();
    res.json(colleges);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch colleges.' });
  }
});

// GET /api/colleges/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const college = await db.getCollegeById(req.params.id);
    if (!college) {
      res.status(404).json({ error: 'College not found.' });
      return;
    }
    res.json(college);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch college details.' });
  }
});

export default router;
