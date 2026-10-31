import { Router, Request, Response, NextFunction } from 'express';
import { ClassroomRepository } from '../db/repositories';
import { ClassroomConfigSchema } from '../schemas';

export const classroomRouter = Router();

classroomRouter.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const config = ClassroomRepository.get();
    res.json(config);
  } catch (err) {
    next(err);
  }
});

classroomRouter.put('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ClassroomConfigSchema.parse(req.body);
    const updated = ClassroomRepository.update(parsed);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

