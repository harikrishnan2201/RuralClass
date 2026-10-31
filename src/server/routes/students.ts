import { Router, Request, Response, NextFunction } from 'express';
import { StudentsRepository } from '../db/repositories';
import { StudentSchema, UpdateScoreSchema } from '../schemas';
import { AppError } from '../middleware/errorHandler';

export const studentsRouter = Router();

studentsRouter.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const students = StudentsRepository.getAll();
    res.json(students);
  } catch (err) {
    next(err);
  }
});

studentsRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = StudentsRepository.getById(req.params.id);
    if (!student) {
      throw new AppError(`Student ${req.params.id} not found`, 404, 'NOT_FOUND');
    }
    res.json(student);
  } catch (err) {
    next(err);
  }
});

studentsRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = StudentSchema.parse(req.body);
    const newStudent = {
      ...parsed,
      id: parsed.id || `stud-${Date.now()}`,
      topicScores: parsed.topicScores || {},
      averageScore: 0,
      needsCheckin: false,
      peerRole: 'Steady Learner' as const
    };
    const created = StudentsRepository.create(newStudent);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

studentsRouter.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = StudentSchema.partial().parse(req.body);
    const updated = StudentsRepository.update(req.params.id, parsed);
    if (!updated) {
      throw new AppError(`Student ${req.params.id} not found`, 404, 'NOT_FOUND');
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

studentsRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = StudentsRepository.delete(req.params.id);
    if (!deleted) {
      throw new AppError(`Student ${req.params.id} not found`, 404, 'NOT_FOUND');
    }
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/students/:id/scores (updates one score and recomputes average, needsCheckin, peerRole and topic averages on the server)
studentsRouter.patch('/:id/scores', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topicId, score } = UpdateScoreSchema.parse(req.body);
    const result = StudentsRepository.updateScore(req.params.id, topicId, score);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

