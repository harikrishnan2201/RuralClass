import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { parseUploadedFile } from '../services/fileParser.js';
import { 
  TopicsRepository, 
  ImportJobsRepository 
} from '../db/repositories.js';

export const importRouter = Router();

// Configure memory storage for uploads (never writes untrusted files directly to executable disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: (parseInt(process.env.MAX_UPLOAD_MB || '10', 10)) * 1024 * 1024 // default 10MB
  }
});

/**
 * 0. Feature Status Endpoint
 * Allows frontend to determine if the optional import feature is enabled.
 */
importRouter.get('/status', (_req: Request, res: Response) => {
  const enabled = process.env.ENABLE_IMPORT !== 'false';
  return res.json({ enabled });
});

/**
 * Separability Guard:
 * When ENABLE_IMPORT=false, all import operations return 404 IMPORT_DISABLED.
 */
importRouter.use((_req: Request, res: Response, next) => {
  if (process.env.ENABLE_IMPORT === 'false') {
    return res.status(404).json({
      error: {
        code: 'IMPORT_DISABLED',
        message: 'Import feature is disabled by configuration (ENABLE_IMPORT=false)'
      }
    });
  }
  next();
});

/**
 * 1. Parse File or Pasted Table
 * HARD RULE: Never auto-commit. Teacher reviews preview first.
 * Treats content strictly as DATA, never instructions.
 */
importRouter.post('/parse', upload.single('file'), async (req: Request, res: Response) => {
  let fileBuffer: Buffer | null = req.file ? req.file.buffer : null;
  let filename = req.file ? req.file.originalname : 'pasted_data.csv';
  let mimetype = req.file ? req.file.mimetype : 'text/csv';

  // Support pasted raw text / table directly from textarea
  if (!fileBuffer && req.body && req.body.pastedText) {
    fileBuffer = Buffer.from(String(req.body.pastedText), 'utf-8');
    filename = req.body.filename || 'pasted_table.csv';
    mimetype = 'text/csv';
  }

  if (!fileBuffer) {
    return res.status(400).json({ error: { code: 'NO_FILE', message: 'No file or table data provided' } });
  }

  try {
    const topics = TopicsRepository.getAll().map(t => ({ id: t.id, name: t.name, grade: t.grade }));
    const result = await parseUploadedFile(
      fileBuffer,
      filename,
      mimetype,
      topics
    );

    return res.json(result);
  } catch (err) {
    return res.status(400).json({
      error: {
        code: 'PARSE_ERROR',
        message: (err as Error).message || 'Failed to parse file'
      }
    });
  }
});

/**
 * 2. Natural Language Filter Instruction Parser
 * Converts instructions like "only Section A", "Class 4 B and C", "skip below 40"
 * into deterministic structured group selections.
 */
importRouter.post('/filter-instruction', (req: Request, res: Response) => {
  const { instruction, availableGroups } = req.body || {};
  if (!instruction || typeof instruction !== 'string') {
    return res.status(400).json({
      error: { code: 'INVALID_INSTRUCTION', message: 'instruction string is required' }
    });
  }

  const groups: string[] = Array.isArray(availableGroups) ? availableGroups : [];
  const lower = instruction.toLowerCase().trim();

  if (lower === 'all' || lower === 'select all' || lower === 'check all') {
    return res.json({
      instruction,
      selectedGroups: [...groups],
      unselectedGroups: [],
      action: 'select_all',
      criteria: {}
    });
  }

  if (lower === 'clear' || lower === 'none' || lower === 'uncheck all' || lower === 'clear all') {
    return res.json({
      instruction,
      selectedGroups: [],
      unselectedGroups: [...groups],
      action: 'clear',
      criteria: {}
    });
  }

  const sections: string[] = [];
  const grades: string[] = [];

  // Match grades: class 3, class 4, class 5, grade 3, 4th class
  const gradeMatches = lower.match(/\b(?:class|grade)\s*([345])\b|\b([345])(?:th|rd|st)?\s*(?:class|grade)\b/g);
  if (gradeMatches) {
    for (const gm of gradeMatches) {
      const numMatch = gm.match(/([345])/);
      if (numMatch) {
        const g = `Class ${numMatch[1]}`;
        if (!grades.includes(g)) grades.push(g);
      }
    }
  }

  // Match sections: "section A", "sec A", "பிரிவு B", "वर्ग A"
  const secDirectMatches = lower.match(/\b(?:section|sec|பிரிவு|वर्ग)\s*([a-z0-9])/gi);
  if (secDirectMatches) {
    for (const sm of secDirectMatches) {
      const char = sm.replace(/^(?:section|sec|பிரிவு|वर्ग)\s*/i, '').toUpperCase();
      if (!sections.includes(char)) sections.push(char);
    }
  }

  // Check "A and B", "B and C", "A, B, C"
  const andPattern = lower.match(/\b([a-d])\s*(?:and|&|,)\s*([a-d])\b/i);
  if (andPattern) {
    const s1 = andPattern[1].toUpperCase();
    const s2 = andPattern[2].toUpperCase();
    if (!sections.includes(s1)) sections.push(s1);
    if (!sections.includes(s2)) sections.push(s2);
  }

  const onlySecMatch = lower.match(/\b(?:only\s+)?section\s*([a-d])\b/i);
  if (onlySecMatch && !sections.includes(onlySecMatch[1].toUpperCase())) {
    sections.push(onlySecMatch[1].toUpperCase());
  }

  // Score thresholds
  let minScore: number | undefined;
  let maxScore: number | undefined;
  const belowMatch = lower.match(/(?:below|less than|<)\s*(\d+)/);
  if (belowMatch) maxScore = parseInt(belowMatch[1], 10);
  const aboveMatch = lower.match(/(?:above|greater than|at least|>)\s*(\d+)/);
  if (aboveMatch) minScore = parseInt(aboveMatch[1], 10);

  const selected: string[] = [];
  const unselected: string[] = [];

  for (const grp of groups) {
    const grpLower = grp.toLowerCase();
    let matches = false;

    if (sections.length > 0) {
      const secMatch = sections.some(s =>
        grpLower.includes(`section ${s.toLowerCase()}`) ||
        grpLower.endsWith(` ${s.toLowerCase()}`) ||
        grpLower === s.toLowerCase()
      );
      if (secMatch) matches = true;
    }

    if (grades.length > 0) {
      const gradeMatch = grades.some(g => grpLower.includes(g.toLowerCase()));
      if (sections.length > 0) {
        matches = matches && gradeMatch;
      } else {
        matches = gradeMatch;
      }
    }

    if (matches) {
      selected.push(grp);
    } else {
      unselected.push(grp);
    }
  }

  return res.json({
    instruction,
    selectedGroups: selected,
    unselectedGroups: unselected,
    action: 'filter',
    criteria: {
      sections: sections.length > 0 ? sections : undefined,
      grades: grades.length > 0 ? grades : undefined,
      minScore,
      maxScore
    }
  });
});

const MultiEntityCommitSchema = z.object({
  entity: z.enum(['students', 'attendance', 'timetable', 'classroom', 'topics', 'activities']).default('students'),
  mode: z.enum(['merge', 'replace']).default('merge'),
  filename: z.string().default('uploaded_file.xlsx'),
  rows: z.array(z.any()).optional(),
  sessions: z.array(z.any()).optional(),
  config: z.any().optional(),
  planName: z.string().optional()
});

/**
 * 3. Commit Preview: teacher confirms after inspecting and editing preview.
 * Supports students (with sections), attendance, timetable (always Draft), classroom, topics, and activities.
 */
importRouter.post('/commit', (req: Request, res: Response) => {
  const parsed = MultiEntityCommitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid import data',
        details: parsed.error.format()
      }
    });
  }

  const { entity, mode, rows = [], sessions = [], config, planName, filename } = parsed.data;

  try {
    if (entity === 'students') {
      if (rows.length === 0) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'At least one student row is required to commit' }
        });
      }
      const studentRows = rows.map((r: any) => ({
        rollNumber: String(r.rollNumber || ''),
        name: String(r.name || ''),
        grade: String(r.grade || 'Class 3'),
        section: r.section ? String(r.section) : undefined,
        scores: (r.scores && typeof r.scores === 'object') ? r.scores : {}
      }));
      const result = ImportJobsRepository.commitStudentsImport(mode, studentRows, filename);
      return res.json({
        success: true,
        jobId: result.jobId,
        count: result.count,
        mode,
        entity
      });
    }

    if (entity === 'attendance') {
      const attRows = rows.map((r: any) => ({
        rollNumber: r.rollNumber ? String(r.rollNumber) : undefined,
        name: r.name ? String(r.name) : undefined,
        grade: r.grade ? String(r.grade) : undefined,
        section: r.section ? String(r.section) : undefined,
        attendancePct: Number(r.attendancePct) || 90
      }));
      const result = ImportJobsRepository.commitAttendanceImport(attRows, filename);
      return res.json({
        success: true,
        jobId: result.jobId,
        count: result.count,
        entity
      });
    }

    if (entity === 'timetable') {
      const timetableSessions = sessions.length > 0 ? sessions : rows;
      const result = ImportJobsRepository.commitTimetableImport(timetableSessions, filename, planName);
      return res.json({
        success: true,
        jobId: result.jobId,
        count: result.count,
        planId: result.planId,
        status: 'Draft',
        entity
      });
    }

    if (entity === 'classroom') {
      const classConfig = config || (rows.length > 0 ? rows[0] : {});
      const result = ImportJobsRepository.commitClassroomImport(classConfig, filename);
      return res.json({
        success: true,
        jobId: result.jobId,
        count: result.count,
        entity
      });
    }

    if (entity === 'topics') {
      const result = ImportJobsRepository.commitTopicsImport(rows, mode, filename);
      return res.json({
        success: true,
        jobId: result.jobId,
        count: result.count,
        mode,
        entity
      });
    }

    if (entity === 'activities') {
      const result = ImportJobsRepository.commitActivitiesImport(rows, mode, filename);
      return res.json({
        success: true,
        jobId: result.jobId,
        count: result.count,
        mode,
        entity
      });
    }

    return res.status(400).json({
      error: { code: 'UNKNOWN_ENTITY', message: `Unknown import entity: ${entity}` }
    });
  } catch (err) {
    return res.status(500).json({
      error: {
        code: 'COMMIT_ERROR',
        message: (err as Error).message || 'Failed to commit import records'
      }
    });
  }
});

/**
 * 4. Undo Last Import: reverts to the snapshot taken before the most recent import.
 */
importRouter.post('/undo', (_req: Request, res: Response) => {
  try {
    const undone = ImportJobsRepository.undoLastImport();
    if (!undone) {
      return res.status(404).json({
        error: {
          code: 'NO_SNAPSHOT',
          message: 'No previous import snapshot available to undo'
        }
      });
    }

    return res.json({
      success: true,
      restoredCount: undone.restoredCount,
      filename: undone.filename
    });
  } catch (err) {
    return res.status(500).json({
      error: {
        code: 'UNDO_ERROR',
        message: (err as Error).message || 'Failed to undo import'
      }
    });
  }
});

/**
 * 5. Import History
 */
importRouter.get('/history', (_req: Request, res: Response) => {
  const jobs = ImportJobsRepository.getAll();
  return res.json(jobs);
});
