-- 001_initial_schema.sql
-- RuralClass SQLite Database Schema

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS classroom_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL,
  grades TEXT NOT NULL, -- JSON array
  subjects TEXT NOT NULL, -- JSON array
  days_per_week INTEGER NOT NULL,
  hours_per_day INTEGER NOT NULL,
  resources TEXT NOT NULL, -- JSON array
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
  checkin_activity TEXT NOT NULL, -- JSON
  independent_station_task TEXT NOT NULL,
  suggested_peer_buddy TEXT NOT NULL, -- JSON
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
  prerequisites TEXT NOT NULL, -- JSON array
  next_concepts TEXT NOT NULL, -- JSON array
  x REAL NOT NULL,
  y REAL NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grades TEXT NOT NULL, -- JSON array
  objective TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  required_materials TEXT NOT NULL, -- JSON array
  steps TEXT NOT NULL, -- JSON array
  adaptations TEXT NOT NULL, -- JSON array
  category TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weekly_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  week_label TEXT NOT NULL,
  classroom_name TEXT NOT NULL,
  grades_covered TEXT NOT NULL, -- JSON array
  sessions TEXT NOT NULL, -- JSON array
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
  summary TEXT NOT NULL, -- JSON
  snapshot TEXT -- JSON
);

