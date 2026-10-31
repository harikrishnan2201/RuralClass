import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const COOKIE_SECRET = process.env.COOKIE_SECRET || 'ruralclass-secret-passcode-key-2026';
export const AUTH_COOKIE_NAME = 'rc_teacher_session';

export function teacherAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const passcode = process.env.TEACHER_PASSCODE;
  // If no passcode is configured, run open for local evaluation
  if (!passcode || passcode.trim().length === 0) {
    return next();
  }

  // Exempt auth routes
  if (req.path.startsWith('/api/auth/')) {
    return next();
  }

  const signedCookie = req.signedCookies ? req.signedCookies[AUTH_COOKIE_NAME] : undefined;
  if (signedCookie === 'authenticated') {
    return next();
  }

  // Also accept header for API clients / tests: X-Teacher-Passcode
  const headerPasscode = req.headers['x-teacher-passcode'];
  if (headerPasscode === passcode) {
    return next();
  }

  throw new AppError('Teacher passcode required to access classroom data', 401, 'UNAUTHORIZED');
}

