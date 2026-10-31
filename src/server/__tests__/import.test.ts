import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { createApp } from '../app';
import { initDatabase } from '../db/database';
import { runMigrations } from '../db/migrator';
import { seedDatabase } from '../db/seed';
import { sanitizeCellValue, validateFileBuffer } from '../services/fileSecurity';
import { matchHeaderToCanonical, matchHeadersToTopics } from '../services/headerSynonyms';
import { parseSpreadsheetBuffer } from '../services/excelParser';
import { parseUploadedFile } from '../services/fileParser';
import { StudentsRepository, PlansRepository, ClassroomRepository, TopicsRepository, ActivitiesRepository } from '../db/repositories';

describe('Phase 3: Import / Export Integration Tests', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    delete process.env.ENABLE_IMPORT;
    const db = initDatabase(':memory:');
    runMigrations(db);
    seedDatabase(db, true);
    app = createApp();
  });

  describe('1. Security & Formula Injection Sanitizer', () => {
    it('escapes spreadsheet formula triggers (=, +, -, @) with leading quote', () => {
      expect(sanitizeCellValue('=1+1')).toBe("'=1+1");
      expect(sanitizeCellValue('+cmd|/c calc')).toBe("'+cmd|/c calc");
      expect(sanitizeCellValue('-dangerousCommand')).toBe("'-dangerousCommand");
      expect(sanitizeCellValue('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
      expect(sanitizeCellValue('\tTAB_EVIL')).toBe("'\tTAB_EVIL");
    });

    it('preserves valid negative and positive numeric values without quoting', () => {
      expect(sanitizeCellValue('-5')).toBe('-5');
      expect(sanitizeCellValue('+10')).toBe('+10');
      expect(sanitizeCellValue('45')).toBe('45');
      expect(sanitizeCellValue('0')).toBe('0');
    });

    it('detects magic bytes for PDF, PNG, JPEG, and valid CSV', () => {
      const pdfBuf = Buffer.from('%PDF-1.4 header text');
      expect(validateFileBuffer(pdfBuf, 'test.pdf').valid).toBe(true);
      expect(validateFileBuffer(pdfBuf, 'test.pdf').detectedType).toBe('application/pdf');

      const pngBuf = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      expect(validateFileBuffer(pngBuf, 'photo.png').valid).toBe(true);

      const jpegBuf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      expect(validateFileBuffer(jpegBuf, 'card.jpg').valid).toBe(true);

      const csvBuf = Buffer.from('Roll,Name,Grade\n1,Ananya,Class 3');
      expect(validateFileBuffer(csvBuf, 'roster.csv').valid).toBe(true);

      // Rejects binary with null bytes pretending to be CSV
      const badBuf = Buffer.from([0x00, 0x01, 0x02, 0x00]);
      expect(validateFileBuffer(badBuf, 'fake.csv').valid).toBe(false);
    });
  });

  describe('2. Trilingual Header Synonym Matching', () => {
    it('matches roll number headers across English, Tamil, and Hindi', () => {
      expect(matchHeaderToCanonical('Roll No')).toBe('rollNumber');
      expect(matchHeaderToCanonical('roll_number')).toBe('rollNumber');
      expect(matchHeaderToCanonical('பதிவு எண்')).toBe('rollNumber');
      expect(matchHeaderToCanonical('வரிசை எண்')).toBe('rollNumber');
      expect(matchHeaderToCanonical('रोल नंबर')).toBe('rollNumber');
      expect(matchHeaderToCanonical('क्रमांक')).toBe('rollNumber');
    });

    it('matches student name headers across languages', () => {
      expect(matchHeaderToCanonical('Student Name')).toBe('studentName');
      expect(matchHeaderToCanonical('பெயர்')).toBe('studentName');
      expect(matchHeaderToCanonical('மாணவர் பெயர்')).toBe('studentName');
      expect(matchHeaderToCanonical('विद्यार्थी का नाम')).toBe('studentName');
      expect(matchHeaderToCanonical('नाम')).toBe('studentName');
    });

    it('matches class/grade headers across languages', () => {
      expect(matchHeaderToCanonical('Class')).toBe('grade');
      expect(matchHeaderToCanonical('வகுப்பு')).toBe('grade');
      expect(matchHeaderToCanonical('कक्षा')).toBe('grade');
    });

    it('matches topic headers to available database topics', () => {
      const mockTopics = [
        { id: 'top-f1', name: 'Understanding Fractions', grade: 'Class 4' },
        { id: 'top-d1', name: 'Understanding Decimals', grade: 'Class 5' }
      ];
      const matched = matchHeadersToTopics(['Roll', 'Name', 'Understanding Fractions', 'Understanding Decimals'], mockTopics);
      expect(matched['top-f1']).toBe('Understanding Fractions');
      expect(matched['top-d1']).toBe('Understanding Decimals');
    });
  });

  describe('3. Multi-format Spreadsheet Parsing', () => {
    it('parses XLSX buffer into headers and structured rows', () => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['Roll', 'Name', 'Grade', 'Understanding Fractions'],
        ['101', 'Devi', 'Class 4', 75],
        ['102', 'Arjun', 'Class 4', 40]
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parsed = parseSpreadsheetBuffer(buffer);
      expect(parsed.headers).toContain('Roll');
      expect(parsed.headers).toContain('Name');
      expect(parsed.rows.length).toBe(2);
      expect(parsed.rows[0]['Name']).toBe('Devi');
    });

    it('normalizes preview rows and flags invalid scores or missing names', async () => {
      const csv = `Roll,Name,Grade,Understanding Fractions\n1,,Class 4,120\n2,Balan,Class 4,60`;
      const buffer = Buffer.from(csv);
      const topics = [{ id: 'top-f1', name: 'Understanding Fractions', grade: 'Class 4' }];

      const res = await parseUploadedFile(buffer, 'test.csv', 'text/csv', topics);
      expect(res.totalRows).toBe(2);
      expect(res.errorRows).toBe(1);
      expect(res.validRows).toBe(1);
      expect(res.previewRows[0].errors).toBeDefined();
      expect(res.previewRows[0].errors?.[0]).toContain('Student name is required');
      expect(res.previewRows[1].name).toBe('Balan');
      expect(res.previewRows[1].scores['top-f1']).toBe(60);
    });
  });

  describe('4. Import Commit and Undo Endpoints', () => {
    it('POST /api/import/commit commits student records and recomputes metrics', async () => {
      const commitPayload = {
        mode: 'replace',
        filename: 'new_students.xlsx',
        rows: [
          {
            rollNumber: 'R101',
            name: 'New Student Alpha',
            grade: 'Class 3',
            scores: { 'top-f1': 80, 'top-d1': 70 }
          },
          {
            rollNumber: 'R102',
            name: 'New Student Beta',
            grade: 'Class 4',
            scores: { 'top-f1': 40, 'top-d1': 50 }
          }
        ]
      };

      const res = await request(app)
        .post('/api/import/commit')
        .send(commitPayload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);

      // Verify students API returns replaced list
      const stuRes = await request(app).get('/api/students').expect(200);
      expect(stuRes.body.length).toBe(2);
      expect(stuRes.body[0].name).toBe('New Student Alpha');
      expect(stuRes.body[1].needsCheckin).toBe(true); // average 45 <= 55
    });

    it('POST /api/import/undo accurately restores previous database snapshot', async () => {
      const initial = await request(app).get('/api/students').expect(200);
      const initialCount = initial.body.length;

      await request(app)
        .post('/api/import/commit')
        .send({
          mode: 'replace',
          filename: 'temporary.xlsx',
          rows: [
            { rollNumber: 'TX1', name: 'Temp Student', grade: 'Class 3', scores: {} }
          ]
        })
        .expect(200);

      const mid = await request(app).get('/api/students').expect(200);
      expect(mid.body.length).toBe(1);

      const undoRes = await request(app)
        .post('/api/import/undo')
        .expect(200);

      expect(undoRes.body.success).toBe(true);
      expect(undoRes.body.restoredCount).toBe(initialCount);

      const restored = await request(app).get('/api/students').expect(200);
      expect(restored.body.length).toBe(initialCount);
    });
  });

  describe('5. Export Endpoints & Templates', () => {
    it('GET /api/export/students.xlsx streams an XLSX spreadsheet', async () => {
      const res = await request(app)
        .get('/api/export/students.xlsx?lang=en')
        .expect(200);

      expect(res.headers['content-type']).toContain('spreadsheetml');
      expect(res.headers['content-disposition']).toContain('attachment');
    });

    it('GET /api/export/students.html returns Indic print view with UTF-8 Tamil/Hindi text', async () => {
      const res = await request(app)
        .get('/api/export/students.html?lang=ta')
        .expect(200);

      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('மாணவர் மதிப்பீட்டுப் பட்டியல்');
      expect(res.text).toContain('Noto Sans Tamil');
    });

    it('GET /api/templates/students returns downloadable template', async () => {
      const res = await request(app)
        .get('/api/templates/students?lang=hi')
        .expect(200);

      expect(res.headers['content-type']).toContain('spreadsheetml');
    });
  });

  describe('6. Composite Identity, Sections, and Unselected Groups', () => {
    it('(a) Roll 1 in Section A and Roll 1 in Section B do not collide', async () => {
      const commitPayload = {
        mode: 'replace',
        filename: 'sections.xlsx',
        rows: [
          { rollNumber: '1', name: 'Student 4A Roll 1', grade: 'Class 4', section: 'A', scores: {} },
          { rollNumber: '1', name: 'Student 4B Roll 1', grade: 'Class 4', section: 'B', scores: {} },
          { rollNumber: '1', name: 'Student 4C Roll 1', grade: 'Class 4', section: 'C', scores: {} }
        ]
      };

      const res = await request(app)
        .post('/api/import/commit')
        .send(commitPayload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);

      const students = StudentsRepository.getAll();
      expect(students.length).toBe(3);
      const roll1s = students.filter(s => s.rollNo === '1');
      expect(roll1s.length).toBe(3);
      expect(roll1s.map(s => s.section).sort()).toEqual(['A', 'B', 'C']);
    });

    it('(b) Hard Rule: Unselected groups are never saved when filtered', async () => {
      // Simulate filtering for Section A only
      const allRows = [
        { rollNumber: '1', name: 'Student A1', grade: 'Class 4', section: 'A', scores: {} },
        { rollNumber: '2', name: 'Student A2', grade: 'Class 4', section: 'A', scores: {} },
        { rollNumber: '1', name: 'Student B1', grade: 'Class 4', section: 'B', scores: {} }
      ];

      // Wizard passes only the selected groups
      const selectedOnly = allRows.filter(r => r.section === 'A');

      await request(app)
        .post('/api/import/commit')
        .send({
          mode: 'replace',
          filename: 'filtered.xlsx',
          rows: selectedOnly
        })
        .expect(200);

      const students = StudentsRepository.getAll();
      expect(students.length).toBe(2);
      expect(students.every(s => s.section === 'A')).toBe(true);
      expect(students.some(s => s.section === 'B')).toBe(false);
    });
  });

  describe('7. Natural Language Filter Instruction Endpoint', () => {
    it('parses "only Section A" and returns selectedGroups', async () => {
      const res = await request(app)
        .post('/api/import/filter-instruction')
        .send({
          instruction: 'only Section A',
          availableGroups: ['Class 4 Section A', 'Class 4 Section B', 'Class 4 Section C']
        })
        .expect(200);

      expect(res.body.action).toBe('filter');
      expect(res.body.selectedGroups).toEqual(['Class 4 Section A']);
      expect(res.body.unselectedGroups).toContain('Class 4 Section B');
    });

    it('parses "Class 4 B and C" correctly', async () => {
      const res = await request(app)
        .post('/api/import/filter-instruction')
        .send({
          instruction: 'Class 4 B and C',
          availableGroups: ['Class 4 Section A', 'Class 4 Section B', 'Class 4 Section C']
        })
        .expect(200);

      expect(res.body.selectedGroups).toContain('Class 4 Section B');
      expect(res.body.selectedGroups).toContain('Class 4 Section C');
      expect(res.body.selectedGroups).not.toContain('Class 4 Section A');
    });

    it('parses "all" and "clear"', async () => {
      const allRes = await request(app)
        .post('/api/import/filter-instruction')
        .send({
          instruction: 'all',
          availableGroups: ['Group 1', 'Group 2']
        })
        .expect(200);
      expect(allRes.body.selectedGroups.length).toBe(2);

      const clearRes = await request(app)
        .post('/api/import/filter-instruction')
        .send({
          instruction: 'clear',
          availableGroups: ['Group 1', 'Group 2']
        })
        .expect(200);
      expect(clearRes.body.selectedGroups.length).toBe(0);
    });
  });

  describe('8. Multi-Entity Import & Draft Timetable Rule', () => {
    it('Timetable import creates a Draft plan and leaves the active plan untouched', async () => {
      const activeBefore = PlansRepository.getActive();
      expect(activeBefore).not.toBeNull();
      const activeIdBefore = activeBefore!.id;

      const timetablePayload = {
        entity: 'timetable',
        filename: 'timetable-grid.xlsx',
        sessions: [
          {
            day: 'Monday',
            startTime: '09:00',
            durationMinutes: 45,
            title: 'Imported Session 1',
            sessionType: 'Shared Lesson',
            gradesInvolved: ['Class 3', 'Class 4'],
            sharedObjective: 'Foundation numeracy'
          }
        ]
      };

      const res = await request(app)
        .post('/api/import/commit')
        .send(timetablePayload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.entity).toBe('timetable');
      expect(res.body.status).toBe('Draft');

      // Verify active plan is UNCHANGED
      const activeAfter = PlansRepository.getActive();
      expect(activeAfter!.id).toBe(activeIdBefore);
      expect(activeAfter!.status).toBe('Approved');
    });

    it('Imports attendance and updates attendance_pct on matching students', async () => {
      const students = StudentsRepository.getAll();
      const target = students[0];

      await request(app)
        .post('/api/import/commit')
        .send({
          entity: 'attendance',
          filename: 'attendance.csv',
          rows: [
            { rollNumber: target.rollNo, name: target.name, grade: target.grade, attendancePct: 98 }
          ]
        })
        .expect(200);

      const updated = StudentsRepository.getById(target.id);
      expect(updated!.attendancePct).toBe(98);
    });

    it('Imports classroom configuration updates', async () => {
      await request(app)
        .post('/api/import/commit')
        .send({
          entity: 'classroom',
          filename: 'classroom-setup.csv',
          config: {
            name: 'Updated School Name',
            hoursPerDay: 5
          }
        })
        .expect(200);

      const cfg = ClassroomRepository.get();
      expect(cfg.name).toBe('Updated School Name');
      expect(cfg.hoursPerDay).toBe(5);
    });

    it('Imports syllabus topics', async () => {
      await request(app)
        .post('/api/import/commit')
        .send({
          entity: 'topics',
          mode: 'merge',
          filename: 'syllabus.csv',
          rows: [
            { id: 'top-custom-1', name: 'New Custom Topic', grade: 'Class 4', subject: 'Mathematics' }
          ]
        })
        .expect(200);

      const topic = TopicsRepository.getById('top-custom-1');
      expect(topic).not.toBeNull();
      expect(topic!.name).toBe('New Custom Topic');
    });

    it('Imports activities', async () => {
      await request(app)
        .post('/api/import/commit')
        .send({
          entity: 'activities',
          mode: 'merge',
          filename: 'activities.csv',
          rows: [
            { id: 'act-custom-1', title: 'New Custom Activity', durationMinutes: 25 }
          ]
        })
        .expect(200);

      const act = ActivitiesRepository.getById('act-custom-1');
      expect(act).not.toBeNull();
      expect(act!.title).toBe('New Custom Activity');
    });
  });

  describe('9. Disk Fixtures Import Verification', () => {
    it('parses students-sections.xlsx fixture and extracts all sections', async () => {
      const filePath = path.resolve(process.cwd(), 'fixtures', 'students-sections.xlsx');
      const buf = fs.readFileSync(filePath);
      const parsed = await parseUploadedFile(buf, 'students-sections.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', []);

      expect(parsed.totalRows).toBe(5);
      expect(parsed.previewRows.some(r => r.section === 'A')).toBe(true);
      expect(parsed.previewRows.some(r => r.section === 'B')).toBe(true);
      expect(parsed.previewRows.some(r => r.section === 'C')).toBe(true);
    });

    it('parses students-long.csv fixture correctly', async () => {
      const filePath = path.resolve(process.cwd(), 'fixtures', 'students-long.csv');
      const buf = fs.readFileSync(filePath);
      const parsed = await parseUploadedFile(buf, 'students-long.csv', 'text/csv', []);

      expect(parsed.totalRows).toBeGreaterThan(0);
      expect(parsed.previewRows.length).toBeGreaterThan(0);
    });

    it('parses edge-cases.csv and properly flags bad records without crashing', async () => {
      const filePath = path.resolve(process.cwd(), 'fixtures', 'edge-cases.csv');
      const buf = fs.readFileSync(filePath);
      const parsed = await parseUploadedFile(buf, 'edge-cases.csv', 'text/csv', []);

      expect(parsed.totalRows).toBeGreaterThan(0);
      // Row with missing name should have errors
      const missingName = parsed.previewRows.find(r => !r.name);
      expect(missingName?.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('10. Separability & ENABLE_IMPORT=false Guard', () => {
    it('returns 404 IMPORT_DISABLED when ENABLE_IMPORT=false is set', async () => {
      process.env.ENABLE_IMPORT = 'false';

      // Status endpoint reports disabled
      const statusRes = await request(app).get('/api/import/status').expect(200);
      expect(statusRes.body.enabled).toBe(false);

      // Operations return 404
      const parseRes = await request(app)
        .post('/api/import/parse')
        .expect(404);
      expect(parseRes.body.error.code).toBe('IMPORT_DISABLED');

      const commitRes = await request(app)
        .post('/api/import/commit')
        .expect(404);
      expect(commitRes.body.error.code).toBe('IMPORT_DISABLED');

      // Core application endpoints still work 100%
      const stuRes = await request(app).get('/api/students').expect(200);
      expect(stuRes.body.length).toBeGreaterThan(0);

      const planRes = await request(app).get('/api/plans/active').expect(200);
      expect(planRes.body.status).toBe('Approved');

      // Cleanup
      delete process.env.ENABLE_IMPORT;
    });
  });
});
