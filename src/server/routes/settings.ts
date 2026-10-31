import { Router, Request, Response, NextFunction } from 'express';
import { SettingsRepository } from '../db/repositories';
import { UserSettingsSchema } from '../schemas';

export const settingsRouter = Router();

settingsRouter.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = SettingsRepository.get();
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

settingsRouter.put('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = UserSettingsSchema.parse(req.body);
    const updated = SettingsRepository.update(parsed);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

