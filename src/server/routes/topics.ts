import { Router, Request, Response, NextFunction } from 'express';
import { TopicsRepository } from '../db/repositories';
import { TopicSchema } from '../schemas';
import { AppError } from '../middleware/errorHandler';

export const topicsRouter = Router();

topicsRouter.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const topics = TopicsRepository.getAll();
    res.json(topics);
  } catch (err) {
    next(err);
  }
});

topicsRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const topic = TopicsRepository.getById(req.params.id);
    if (!topic) {
      throw new AppError(`Topic ${req.params.id} not found`, 404, 'NOT_FOUND');
    }
    res.json(topic);
  } catch (err) {
    next(err);
  }
});

topicsRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = TopicSchema.parse(req.body);
    const newTopic = {
      ...parsed,
      id: parsed.id || `t-${Date.now()}`
    };
    const created = TopicsRepository.create(newTopic);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

topicsRouter.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = TopicSchema.partial().parse(req.body);
    const updated = TopicsRepository.update(req.params.id, parsed);
    if (!updated) {
      throw new AppError(`Topic ${req.params.id} not found`, 404, 'NOT_FOUND');
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

topicsRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = TopicsRepository.delete(req.params.id);
    if (!deleted) {
      throw new AppError(`Topic ${req.params.id} not found`, 404, 'NOT_FOUND');
    }
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

