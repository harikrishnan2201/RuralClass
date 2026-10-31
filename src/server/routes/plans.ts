import { Router, Request, Response, NextFunction } from 'express';
import { PlansRepository, ClassroomRepository, TopicsRepository, ConceptNodesRepository } from '../db/repositories';
import { WeeklyPlanSchema, GeneratePlanOptionsSchema } from '../schemas';
import { generateWeeklyPlan } from '../../lib/plannerEngine';
import { AppError } from '../middleware/errorHandler';

export const plansRouter = Router();

plansRouter.get('/active', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const active = PlansRepository.getActive();
    if (!active) {
      throw new AppError('No active weekly plan found', 404, 'NOT_FOUND');
    }
    res.json(active);
  } catch (err) {
    next(err);
  }
});

plansRouter.put('/active', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = WeeklyPlanSchema.parse(req.body);
    const updated = PlansRepository.setActive(parsed);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

plansRouter.get('/saved', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const saved = PlansRepository.getSaved();
    res.json(saved);
  } catch (err) {
    next(err);
  }
});

plansRouter.post('/saved', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = WeeklyPlanSchema.parse(req.body);
    const saved = PlansRepository.savePlan(parsed);
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

plansRouter.delete('/saved/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = PlansRepository.deleteSaved(req.params.id);
    if (!deleted) {
      throw new AppError(`Saved plan ${req.params.id} not found`, 404, 'NOT_FOUND');
    }
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

// POST /api/plans/generate (runs the planner engine server-side)
plansRouter.post('/generate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const options = GeneratePlanOptionsSchema.parse(req.body);
    const classroom = ClassroomRepository.get();
    const topics = TopicsRepository.getAll();
    const conceptNodes = ConceptNodesRepository.getAll();

    const plan = generateWeeklyPlan({
      classroom,
      topics,
      conceptNodes,
      totalWeeklyHours: options.totalWeeklyHours,
      focusTopicId: options.focusTopicId,
      focusGrade: options.focusGrade,
      planName: options.planName
    });

    res.json(plan);
  } catch (err) {
    next(err);
  }
});

