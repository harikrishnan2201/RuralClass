import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { helmetMiddleware, corsMiddleware, generalApiLimiter, aiAndUploadLimiter } from './middleware/security';
import { teacherAuthMiddleware, COOKIE_SECRET } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { classroomRouter } from './routes/classroom';
import { settingsRouter } from './routes/settings';
import { topicsRouter } from './routes/topics';
import { studentsRouter } from './routes/students';
import { conceptNodesRouter } from './routes/conceptNodes';
import { activitiesRouter } from './routes/activities';
import { plansRouter } from './routes/plans';
import { resetRouter } from './routes/reset';
import { authRouter } from './routes/auth';
import { aiRouter } from './routes/ai';
import { importRouter } from './routes/import';
import { exportRouter } from './routes/export';

export function createApp(): Express {
  const app = express();

  // Security headers & CORS
  app.use(helmetMiddleware);
  app.use(corsMiddleware);

  // Parsers & Cookies
  app.use(cookieParser(COOKIE_SECRET));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate Limiting
  app.use('/api', generalApiLimiter);
  app.use('/api/ai', aiAndUploadLimiter);
  app.use('/api/import', aiAndUploadLimiter);

  // Authentication (Optional teacher passcode)
  app.use('/api', teacherAuthMiddleware);

  // REST API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/classroom', classroomRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/topics', topicsRouter);
  app.use('/api/students', studentsRouter);
  app.use('/api/concept-nodes', conceptNodesRouter);
  app.use('/api/activities', activitiesRouter);
  app.use('/api/plans', plansRouter);
  app.use('/api/reset', resetRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/import', importRouter);
  app.use('/api/export', exportRouter);
  app.use('/api/templates', (req, res, next) => {
    req.url = '/templates' + req.url;
    exportRouter(req, res, next);
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}

