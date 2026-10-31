import { Router, Request, Response, NextFunction } from 'express';
import { ConceptNodesRepository } from '../db/repositories';
import { ConceptNodeSchema } from '../schemas';
import { AppError } from '../middleware/errorHandler';

export const conceptNodesRouter = Router();

conceptNodesRouter.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const nodes = ConceptNodesRepository.getAll();
    res.json(nodes);
  } catch (err) {
    next(err);
  }
});

conceptNodesRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const node = ConceptNodesRepository.getById(req.params.id);
    if (!node) {
      throw new AppError(`Concept node ${req.params.id} not found`, 404, 'NOT_FOUND');
    }
    res.json(node);
  } catch (err) {
    next(err);
  }
});

conceptNodesRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ConceptNodeSchema.parse(req.body);
    const newNode = {
      ...parsed,
      id: parsed.id || `node-${Date.now()}`
    };
    const created = ConceptNodesRepository.create(newNode);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

conceptNodesRouter.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ConceptNodeSchema.partial().parse(req.body);
    const updated = ConceptNodesRepository.update(req.params.id, parsed);
    if (!updated) {
      throw new AppError(`Concept node ${req.params.id} not found`, 404, 'NOT_FOUND');
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

conceptNodesRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = ConceptNodesRepository.delete(req.params.id);
    if (!deleted) {
      throw new AppError(`Concept node ${req.params.id} not found`, 404, 'NOT_FOUND');
    }
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

