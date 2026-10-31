import { Router, Request, Response, NextFunction } from 'express';
import { ActivitiesRepository } from '../db/repositories';
import { ActivitySchema } from '../schemas';
import { AppError } from '../middleware/errorHandler';

export const activitiesRouter = Router();

activitiesRouter.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const activities = ActivitiesRepository.getAll();
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

activitiesRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const act = ActivitiesRepository.getById(req.params.id);
    if (!act) {
      throw new AppError(`Activity ${req.params.id} not found`, 404, 'NOT_FOUND');
    }
    res.json(act);
  } catch (err) {
    next(err);
  }
});

activitiesRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ActivitySchema.parse(req.body);
    const newActivity = {
      ...parsed,
      id: parsed.id || `act-${Date.now()}`
    };
    const created = ActivitiesRepository.create(newActivity);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

activitiesRouter.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ActivitySchema.partial().parse(req.body);
    const updated = ActivitiesRepository.update(req.params.id, parsed);
    if (!updated) {
      throw new AppError(`Activity ${req.params.id} not found`, 404, 'NOT_FOUND');
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

activitiesRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = ActivitiesRepository.delete(req.params.id);
    if (!deleted) {
      throw new AppError(`Activity ${req.params.id} not found`, 404, 'NOT_FOUND');
    }
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

