import { Router, Request, Response, NextFunction } from 'express';
import { ResetSchema } from '../schemas';
import { seedDatabase } from '../db/seed';
import { getDb } from '../db/database';

export const resetRouter = Router();

resetRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    ResetSchema.parse(req.body);
    const db = getDb();
    seedDatabase(db, true);
    res.json({
      success: true,
      message: 'All application data reset to initial demo curriculum state'
    });
  } catch (err) {
    next(err);
  }
});

