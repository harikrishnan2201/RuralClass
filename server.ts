import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createApp } from './src/server/app';
import { initDatabase } from './src/server/db/database';
import { runMigrations } from './src/server/db/migrator';
import { seedDatabase } from './src/server/db/seed';
import { configureAi } from './src/server/routes/ai';
import { logger } from './src/server/middleware/security';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  // 1. Initialize SQLite Database & Migrations
  const db = initDatabase();
  runMigrations(db);
  seedDatabase(db, false); // seeds on first run only

  // 2. Initialize Gemini AI Client (Optional)
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0) {
    try {
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'ruralclass-server',
          },
        },
      });
      logger.info('Gemini AI client initialized with live API key.');
    } catch (e) {
      logger.warn({ err: e }, 'Failed to initialize GoogleGenAI client; operating in offline fallback mode.');
      ai = null;
    }
  } else {
    logger.info('No Gemini API key provided. Operating in offline mode with built-in pedagogical rules.');
  }

  configureAi(ai, GEMINI_MODEL);

  // 3. Assemble Express Application
  const app = createApp();

  // 4. Vite middleware (dev) or static serving (prod)
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`RuralClass server listening on http://0.0.0.0:${PORT} [Model: ${GEMINI_MODEL}]`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
