import { spawn, execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 3123;
const SCREENSHOT_DIR = path.resolve('docs/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Find browser binary
const possiblePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];
const browserPath = possiblePaths.find(p => fs.existsSync(p));

if (!browserPath) {
  console.error('No headless browser found (Chrome or Edge).');
  process.exit(1);
}

console.log(`Using browser: ${browserPath}`);

// Start test server
const server = spawn('node', ['dist/server.js'], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore'
});

async function waitForServer(): Promise<void> {
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`http://localhost:${PORT}/api/classroom`, (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(1000, () => req.destroy(new Error('timeout')));
      });
      console.log('Server is ready on port', PORT);
      return;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error('Server timed out starting');
}

const routes = [
  { name: 'dashboard', path: '/' },
  { name: 'students', path: '/students' },
  { name: 'concept-bridge-map', path: '/concept-bridge-map' },
  { name: 'weekly-planner', path: '/weekly-planner' },
  { name: 'activities', path: '/activities' },
  { name: 'settings', path: '/settings' },
  { name: 'ai-assistant', path: '/ai-assistant' },
  { name: 'learning-gaps', path: '/learning-gaps' }
];

const languages = ['ta', 'hi'];

async function run() {
  try {
    await waitForServer();

    for (const lang of languages) {
      for (const route of routes) {
        const targetUrl = `http://localhost:${PORT}${route.path}?lang=${lang}`;
        const outputFile = path.join(SCREENSHOT_DIR, `${route.name}-${lang}.png`);
        console.log(`Capturing [${lang.toUpperCase()}] ${route.name} -> ${outputFile}...`);

        const cmd = `"${browserPath}" --headless --disable-gpu --window-size=1280,850 --virtual-time-budget=2500 --screenshot="${outputFile}" "${targetUrl}"`;
        execSync(cmd, { stdio: 'ignore' });
      }
    }

    console.log('✅ Successfully captured all screenshots in docs/screenshots/!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    server.kill();
  }
}

run();
