import { validateFileBuffer } from './fileSecurity.js';
import { parseAllSpreadsheetSheets, parseSpreadsheetBuffer, RawParsedSheet } from './excelParser.js';
import { parseImageWithGemini } from './geminiMultimodalParser.js';
import { matchHeaderToCanonical, matchHeadersToTopics, TopicReference } from './headerSynonyms.js';
import { normalizeIndicDigits, normalizeScore, extractGradeAndSection, IMPORT_REGISTRY } from '../../shared/importRegistry.js';
import mammoth from 'mammoth';

export interface ColumnSuggestion {
  header: string;
  field: 'rollNumber' | 'studentName' | 'grade' | 'section' | 'topic' | 'score' | 'attendancePct' | 'notes' | 'topicScore' | 'ignore';
  topicId?: string;
}

export interface NormalizedStudentRow {
  rollNumber: string;
  name: string;
  grade: string;
  section?: string;
  scores: Record<string, number>;
  attendancePct?: number;
  notes?: string;
  errors?: string[];
  warnings?: string[];
}

export interface DetectedGroup {
  id: string;
  entity: 'students' | 'attendance' | 'timetable' | 'classroom' | 'topics' | 'activities';
  label: string;
  grade?: string;
  section?: string;
  count: number;
  rows: any[];
}

export interface ParsedImportResponse {
  source: 'ai' | 'fallback';
  reason?: 'no_api_key' | 'api_error' | 'invalid_json';
  fileType: string;
  detectedEntity: 'students' | 'attendance' | 'timetable' | 'classroom' | 'topics' | 'activities';
  headers: string[];
  rows: Record<string, string | number>[];
  columnSuggestions: ColumnSuggestion[];
  previewRows: NormalizedStudentRow[];
  groups: DetectedGroup[];
  totalRows: number;
  validRows: number;
  errorRows: number;
  message?: string;
}

/**
 * Classifies a set of headers into an entity type using registry synonyms.
 */
export function classifyEntity(headers: string[]): 'students' | 'attendance' | 'timetable' | 'classroom' | 'topics' | 'activities' {
  const normHeaders = headers.map(h => normalizeIndicDigits(h).toLowerCase().trim());

  // Check Timetable: day, time, session, subject
  const isTimetable = normHeaders.some(h => /day|time|period|slot|கிழமை|நாள்|நேரம்|दिन|समय|कालांश/i.test(h));
  if (isTimetable) return 'timetable';

  // Check Attendance: attendance, present, absent
  const isAttendance = normHeaders.some(h => /attendance|present|absent|வருகை|ஹாஜர்|उपस्थिति|हाजिरी/i.test(h)) &&
    !normHeaders.some(h => /score|mark|மதிப்பெண்|अंक/i.test(h));
  if (isAttendance) return 'attendance';

  // Check Topics / Syllabus: topic, prerequisite, progress
  const isTopics = normHeaders.some(h => /prerequisite|syllabus|முன்தேவை|पूर्व-अपेक्षित/i.test(h));
  if (isTopics) return 'topics';

  // Check Classroom: school, hours per day, resources
  const isClassroom = normHeaders.some(h => /hours per day|school name|resources|கற்பித்தல் மணி/i.test(h));
  if (isClassroom) return 'classroom';

  // Check Activities: steps, materials, objective
  const isActivities = normHeaders.some(h => /materials|steps|செயல்முறை|செய்முறை|चरण|सामग्री/i.test(h));
  if (isActivities) return 'activities';

  // Default: student marks
  return 'students';
}

/**
 * Main parser entrypoint for uploaded files.
 */
export async function parseUploadedFile(
  buffer: Buffer,
  filename: string,
  declaredMimeType: string,
  availableTopics: TopicReference[] = []
): Promise<ParsedImportResponse> {
  const validation = validateFileBuffer(buffer, filename);
  if (!validation.valid || !validation.detectedType) {
    throw new Error(validation.error || 'Invalid or unsupported file format');
  }

  const detected = validation.detectedType;
  let headers: string[] = [];
  let rows: Record<string, string | number>[] = [];
  let source: 'ai' | 'fallback' = 'fallback';
  let reason: 'no_api_key' | 'api_error' | 'invalid_json' | undefined;
  let message: string | undefined;
  const groups: DetectedGroup[] = [];

  if (
    detected === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    detected === 'application/vnd.ms-excel' ||
    detected === 'text/csv'
  ) {
    const allSheets = parseAllSpreadsheetSheets(buffer);
    if (allSheets.length > 0) {
      headers = allSheets[0].headers;
      rows = allSheets[0].rows;

      // Build groups from all sheets
      allSheets.forEach((sh, idx) => {
        const entity = classifyEntity(sh.headers);
        const { grade, section } = extractGradeAndSection(sh.sheetName);
        const label = grade 
          ? `${grade}${section ? ` - Sec ${section}` : ''}: ${sh.sheetName} (${sh.rows.length})` 
          : `${sh.sheetName} (${sh.rows.length})`;

        groups.push({
          id: `sheet-${idx + 1}`,
          entity,
          label,
          grade,
          section,
          count: sh.rows.length,
          rows: sh.rows
        });
      });
    }
  } else if (detected === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // DOCX: Extract text via mammoth
    try {
      const docResult = await mammoth.extractRawText({ buffer });
      const rawText = docResult.value || '';
      const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

      headers = ['Title', 'Materials', 'Steps'];
      rows = [{
        Title: lines[0] || 'Imported Activity',
        Materials: lines.slice(1, 3).join(', '),
        Steps: lines.slice(3).join('\n')
      }];

      groups.push({
        id: 'docx-1',
        entity: 'activities',
        label: `Activity Document: ${filename}`,
        count: rows.length,
        rows
      });
    } catch (err) {
      throw new Error(`Failed to read Word (.docx) file: ${(err as Error).message}`);
    }
  } else if (
    detected === 'image/jpeg' ||
    detected === 'image/png' ||
    detected === 'image/webp'
  ) {
    const aiResult = await parseImageWithGemini(buffer, detected);
    source = aiResult.source;
    reason = aiResult.reason;
    headers = aiResult.headers;
    rows = aiResult.rows;
    message = aiResult.message;
  } else if (detected === 'application/pdf') {
    // Basic tabular PDF extraction
    try {
      const parsed = parseSpreadsheetBuffer(buffer);
      if (parsed.headers.length > 0) {
        headers = parsed.headers;
        rows = parsed.rows;
      } else {
        throw new Error('PDF does not contain extractable spreadsheet tables');
      }
    } catch {
      // PDF fallback
      headers = ['Roll Number', 'Student Name', 'Grade', 'Topic', 'Score'];
      rows = [];
      reason = 'api_error';
      message = 'PDF tabular parsing returned no rows. Please upload Excel (.xlsx) or CSV for precise table imports.';
    }
  }

  // Detect entity
  const detectedEntity = classifyEntity(headers);

  // Generate column suggestions
  const topicMap = matchHeadersToTopics(headers, availableTopics);
  const columnSuggestions: ColumnSuggestion[] = headers.map(h => {
    // Check if header matches a known topic
    for (const [topicId, matchedHeader] of Object.entries(topicMap)) {
      if (matchedHeader === h) {
        return { header: h, field: 'topicScore', topicId };
      }
    }

    const norm = normalizeIndicDigits(h).toLowerCase();
    if (/section|பிரிவு|सेक्शन|वर्ग/i.test(norm)) {
      return { header: h, field: 'section' };
    }
    if (/attendance|வருகை|उपस्थिति/i.test(norm)) {
      return { header: h, field: 'attendancePct' };
    }
    if (/note|remark|குறிப்பு|टिप्पणी/i.test(norm)) {
      return { header: h, field: 'notes' };
    }

    const canonical = matchHeaderToCanonical(h);
    if (canonical) {
      return { header: h, field: canonical };
    }

    return { header: h, field: 'ignore' };
  });

  // Build preview normalized student rows
  const previewRows: NormalizedStudentRow[] = [];
  const rollCol = columnSuggestions.find(c => c.field === 'rollNumber')?.header;
  const nameCol = columnSuggestions.find(c => c.field === 'studentName')?.header;
  const gradeCol = columnSuggestions.find(c => c.field === 'grade')?.header;
  const secCol = columnSuggestions.find(c => c.field === 'section')?.header;
  const scoreCol = columnSuggestions.find(c => c.field === 'score')?.header;
  const topicCol = columnSuggestions.find(c => c.field === 'topic')?.header;
  const attCol = columnSuggestions.find(c => c.field === 'attendancePct')?.header;
  const notesCol = columnSuggestions.find(c => c.field === 'notes')?.header;
  const topicScoreCols = columnSuggestions.filter(c => c.field === 'topicScore');

  let validCount = 0;
  let errorCount = 0;

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Normalize roll and digits
    const rawRoll = rollCol ? String(r[rollCol] || '').trim() : `R${idx + 1}`;
    const roll = normalizeIndicDigits(rawRoll);

    const name = nameCol ? String(r[nameCol] || '').trim() : '';

    // Extract grade and section
    let rawGrade = gradeCol ? String(r[gradeCol] || '').trim() : '';
    let section = secCol ? String(r[secCol] || '').trim().toUpperCase() : undefined;

    const extracted = extractGradeAndSection(rawGrade);
    let grade = extracted.grade || rawGrade;
    if (!section && extracted.section) {
      section = extracted.section;
    }

    if (!name) {
      errors.push('Student name is required');
    }

    // Validate grade
    const gradeMatch = grade.match(/([345])/);
    if (gradeMatch) {
      grade = `Class ${gradeMatch[1]}`;
    } else if (!grade) {
      grade = 'Class 3';
      warnings.push('Grade not specified, defaulted to Class 3');
    }

    const scores: Record<string, number> = {};

    // 1. Wide format: multiple topic columns
    if (topicScoreCols.length > 0) {
      for (const tCol of topicScoreCols) {
        const val = r[tCol.header];
        if (val !== undefined && val !== '') {
          const normalized = normalizeScore(val);
          if (normalized === null) {
            errors.push(`Score in '${tCol.header}' must be between 0 and 100`);
          } else if (tCol.topicId) {
            scores[tCol.topicId] = normalized;
          }
        }
      }
    }

    // 2. Long format: topic column + score column
    if (topicCol && scoreCol) {
      const topicVal = String(r[topicCol] || '').trim();
      const scoreVal = r[scoreCol];
      if (topicVal && scoreVal !== undefined && scoreVal !== '') {
        const normalized = normalizeScore(scoreVal);
        if (normalized === null) {
          errors.push('Score must be between 0 and 100');
        } else {
          const matchedT = availableTopics.find(t => 
            t.name.toLowerCase() === topicVal.toLowerCase() ||
            t.id === topicVal
          );
          const key = matchedT ? matchedT.id : topicVal;
          scores[key] = normalized;
        }
      }
    }

    // Attendance
    let attendancePct: number | undefined;
    if (attCol && r[attCol] !== undefined && r[attCol] !== '') {
      const parsedAtt = normalizeScore(r[attCol]);
      if (parsedAtt !== null) {
        attendancePct = parsedAtt;
      }
    }

    const notes = notesCol ? String(r[notesCol] || '').trim() : undefined;

    if (errors.length > 0) {
      errorCount++;
    } else {
      validCount++;
    }

    previewRows.push({
      rollNumber: roll,
      name,
      grade,
      section,
      scores,
      attendancePct,
      notes,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  }

  // If no multi-sheets found, group single sheet by grade + section
  if (groups.length === 0 && previewRows.length > 0) {
    const groupMap = new Map<string, NormalizedStudentRow[]>();
    previewRows.forEach(row => {
      const key = `${row.grade}${row.section ? ` - Sec ${row.section}` : ''}`;
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(row);
    });

    let gIdx = 1;
    for (const [grpLabel, grpRows] of groupMap.entries()) {
      const sample = grpRows[0];
      groups.push({
        id: `group-${gIdx++}`,
        entity: detectedEntity,
        label: `${grpLabel} (${grpRows.length})`,
        grade: sample.grade,
        section: sample.section,
        count: grpRows.length,
        rows: grpRows
      });
    }
  }

  return {
    source,
    reason,
    fileType: detected,
    detectedEntity,
    headers,
    rows,
    columnSuggestions,
    previewRows,
    groups,
    totalRows: rows.length,
    validRows: validCount,
    errorRows: errorCount,
    message
  };
}
