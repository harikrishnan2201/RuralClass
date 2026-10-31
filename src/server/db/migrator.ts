import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_001_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS classroom_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL,
  grades TEXT NOT NULL,
  subjects TEXT NOT NULL,
  days_per_week INTEGER NOT NULL,
  hours_per_day INTEGER NOT NULL,
  resources TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  teacher_name TEXT NOT NULL,
  classroom_name TEXT NOT NULL,
  preferred_language TEXT NOT NULL,
  time_format TEXT NOT NULL,
  default_hours_per_day INTEGER NOT NULL,
  enable_tips INTEGER NOT NULL,
  share_student_names_with_ai INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL,
  understanding_level INTEGER NOT NULL,
  prerequisite_topic_id TEXT,
  prerequisite_topic_name TEXT,
  notes TEXT,
  reviewed INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  roll_no TEXT NOT NULL,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  average_score INTEGER NOT NULL,
  needs_checkin INTEGER NOT NULL,
  peer_role TEXT NOT NULL,
  paired_student_id TEXT,
  paired_student_name TEXT,
  notes TEXT,
  attendance_pct INTEGER NOT NULL,
  last_assessment_date TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS student_topic_scores (
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  PRIMARY KEY (student_id, topic_id)
);

CREATE TABLE IF NOT EXISTS personalized_plans (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  diagnosed_root_gap TEXT NOT NULL,
  target_topic TEXT NOT NULL,
  checkin_activity TEXT NOT NULL,
  independent_station_task TEXT NOT NULL,
  suggested_peer_buddy TEXT NOT NULL,
  teacher_tip TEXT NOT NULL,
  status TEXT NOT NULL,
  source TEXT DEFAULT 'fallback',
  reason TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS concept_nodes (
  id TEXT PRIMARY KEY,
  grade TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  understanding_level INTEGER NOT NULL,
  status TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  root_cause_context TEXT NOT NULL,
  suggested_action TEXT NOT NULL,
  prerequisites TEXT NOT NULL,
  next_concepts TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grades TEXT NOT NULL,
  objective TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  required_materials TEXT NOT NULL,
  steps TEXT NOT NULL,
  adaptations TEXT NOT NULL,
  category TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weekly_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  week_label TEXT NOT NULL,
  classroom_name TEXT NOT NULL,
  grades_covered TEXT NOT NULL,
  sessions TEXT NOT NULL,
  status TEXT NOT NULL,
  approved_date TEXT,
  last_updated TEXT NOT NULL,
  total_planned_hours REAL NOT NULL,
  max_available_hours REAL NOT NULL,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS saved_plans (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  saved_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS import_jobs (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  records_count INTEGER NOT NULL,
  summary TEXT NOT NULL,
  snapshot TEXT
);
`;

const MIGRATION_002_SQL = `
-- Add section column to students table if upgrading from v1
-- SQLite does not fail if column already exists via migration versioning
ALTER TABLE students ADD COLUMN section TEXT;
`;

const BUILTIN_MIGRATIONS: Array<{ version: number; name: string; sql: string }> = [
  { version: 1, name: '001_initial_schema.sql', sql: MIGRATION_001_SQL },
  { version: 2, name: '002_add_section_to_students.sql', sql: MIGRATION_002_SQL }
];

export function runMigrations(db: Database.Database): void {
  // Ensure migration tracking table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[];
  const appliedVersions = new Set(appliedRows.map(r => r.version));

  // 1. Run built-in embedded migrations
  for (const m of BUILTIN_MIGRATIONS) {
    if (!appliedVersions.has(m.version)) {
      const runTx = db.transaction(() => {
        try {
          db.exec(m.sql);
        } catch (err: any) {
          if (!err.message?.includes('duplicate column name')) {
            throw err;
          }
        }
        db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
          m.version,
          m.name,
          new Date().toISOString()
        );
      });
      runTx();
      appliedVersions.add(m.version);
      console.log(`Applied migration: ${m.name} (v${m.version})`);
    }
  }

  // 2. Discover any additional external SQL files if present on disk
  const possibleDirs = [
    path.resolve(__dirname, 'migrations'),
    path.resolve(process.cwd(), 'src', 'server', 'db', 'migrations'),
    path.resolve(__dirname, 'src', 'server', 'db', 'migrations')
  ];

  for (const dir of possibleDirs) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const match = file.match(/^(\d+)/);
      if (!match) continue;

      const version = parseInt(match[1], 10);
      if (appliedVersions.has(version)) continue;

      const sql = fs.readFileSync(path.join(dir, file), 'utf-8');
      const runTx = db.transaction(() => {
        db.exec(sql);
        db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
          version,
          file,
          new Date().toISOString()
        );
      });
      runTx();
      appliedVersions.add(version);
      console.log(`Applied file migration: ${file} (v${version})`);
    }
  }
}
