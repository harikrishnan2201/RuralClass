import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});

export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Vite development and inline scripts
  crossOriginEmbedderPolicy: false
});

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const appUrl = process.env.APP_URL;
    if (!origin || !appUrl || origin === appUrl || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
});

export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests. Please slow down.'
    }
  }
});

export const aiAndUploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many AI requests. Please wait a moment before trying again.'
    }
  }
});

