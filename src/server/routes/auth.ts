import { Router, Request, Response, NextFunction } from 'express';
import { LoginSchema } from '../schemas';
import { AUTH_COOKIE_NAME } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const authRouter = Router();

authRouter.get('/status', (req: Request, res: Response) => {
  const passcode = process.env.TEACHER_PASSCODE;
  const isRequired = Boolean(passcode && passcode.trim().length > 0);
  const isAuthenticated = !isRequired || (req.signedCookies && req.signedCookies[AUTH_COOKIE_NAME] === 'authenticated');

  res.json({
    passcodeRequired: isRequired,
    authenticated: isAuthenticated
  });
});

authRouter.post('/login', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { passcode } = LoginSchema.parse(req.body);
    const configuredPasscode = process.env.TEACHER_PASSCODE;

    if (!configuredPasscode || configuredPasscode.trim().length === 0) {
      return res.json({ success: true, message: 'No passcode required' });
    }

    if (passcode !== configuredPasscode) {
      throw new AppError('Incorrect teacher passcode', 401, 'INVALID_PASSCODE');
    }

    res.cookie(AUTH_COOKIE_NAME, 'authenticated', {
      httpOnly: true,
      signed: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ success: true, message: 'Authentication successful' });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME);
  res.json({ success: true, message: 'Logged out successfully' });
});

