import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { createApp } from '../app';
import { initDatabase, closeDatabase } from '../db/database';
import { runMigrations } from '../db/migrator';
import { seedDatabase } from '../db/seed';

describe('RuralClass REST API Integration Tests', () => {
  let app: any;
  let testDb: Database.Database;

  beforeAll(() => {
    // Initialize in-memory SQLite database for test isolation
    testDb = initDatabase(':memory:');
    runMigrations(testDb);
    seedDatabase(testDb, true);
    app = createApp();
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('1. Classroom Configuration API (/api/classroom)', () => {
    it('GET /api/classroom returns default classroom configuration', async () => {
      const res = await request(app).get('/api/classroom');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name');
      expect(res.body.grades).toContain('Class 3');
      expect(res.body.hoursPerDay).toBe(3);
    });

    it('PUT /api/classroom updates configuration with valid payload', async () => {
      const updatePayload = {
        name: 'Updated Block B School',
        grades: ['Class 3', 'Class 4', 'Class 5'],
        subjects: ['Mathematics'],
        daysPerWeek: 5,
        hoursPerDay: 4,
        resources: ['Chalkboard', 'Pebbles']
      };

      const res = await request(app)
        .put('/api/classroom')
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Block B School');
      expect(res.body.hoursPerDay).toBe(4);
    });

    it('PUT /api/classroom rejects invalid payload with uniform error format', async () => {
      const invalidPayload = {
        name: '', // required
        hoursPerDay: 99 // out of range
      };

      const res = await request(app)
        .put('/api/classroom')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('2. User Settings API (/api/settings)', () => {
    it('GET /api/settings returns settings', async () => {
      const res = await request(app).get('/api/settings');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('teacherName');
      expect(res.body).toHaveProperty('shareStudentNamesWithAI');
    });

    it('PUT /api/settings updates teacher preferences', async () => {
      const res = await request(app)
        .put('/api/settings')
        .send({ teacherName: 'Teacher Anita Sharma', shareStudentNamesWithAI: true });

      expect(res.status).toBe(200);
      expect(res.body.teacherName).toBe('Teacher Anita Sharma');
      expect(res.body.shareStudentNamesWithAI).toBe(true);
    });
  });

  describe('3. Topics CRUD API (/api/topics)', () => {
    let createdTopicId: string;

    it('GET /api/topics returns list of topics', async () => {
      const res = await request(app).get('/api/topics');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('POST /api/topics creates a new topic', async () => {
      const newTopic = {
        id: 't-test-geom',
        grade: 'Class 4',
        subject: 'Mathematics',
        name: 'Basic Geometry and Shapes',
        status: 'In Progress',
        progress: 30,
        understandingLevel: 50,
        notes: 'Testing geometric shapes with sticks'
      };

      const res = await request(app)
        .post('/api/topics')
        .send(newTopic);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('t-test-geom');
      createdTopicId = res.body.id;
    });

    it('GET /api/topics/:id returns specific topic', async () => {
      const res = await request(app).get(`/api/topics/${createdTopicId}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Basic Geometry and Shapes');
    });

    it('PUT /api/topics/:id updates topic', async () => {
      const res = await request(app)
        .put(`/api/topics/${createdTopicId}`)
        .send({ progress: 60, understandingLevel: 65 });

      expect(res.status).toBe(200);
      expect(res.body.progress).toBe(60);
      expect(res.body.understandingLevel).toBe(65);
    });

    it('DELETE /api/topics/:id removes topic', async () => {
      const res = await request(app).delete(`/api/topics/${createdTopicId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const checkRes = await request(app).get(`/api/topics/${createdTopicId}`);
      expect(checkRes.status).toBe(404);
      expect(checkRes.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('4. Students CRUD & Score Recomputation API (/api/students)', () => {
    it('GET /api/students returns students with scores and metrics', async () => {
      const res = await request(app).get('/api/students');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const student = res.body[0];
      expect(student).toHaveProperty('topicScores');
      expect(student).toHaveProperty('averageScore');
      expect(student).toHaveProperty('peerRole');
    });

    it('POST /api/students creates a new student with auto-computed metrics', async () => {
      const newStudent = {
        id: 'stud-test-01',
        rollNo: '499',
        name: 'Kavita Kumari',
        grade: 'Class 4',
        topicScores: {
          't-c4-frac': 45,
          't-c4-word': 40
        },
        attendancePct: 94
      };

      const res = await request(app)
        .post('/api/students')
        .send(newStudent);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Kavita Kumari');
      expect(res.body.averageScore).toBe(43);
      expect(res.body.needsCheckin).toBe(true);
      expect(res.body.peerRole).toBe('Needs Support');
    });

    it('PATCH /api/students/:id/scores updates score and recomputes metrics on server', async () => {
      // Update Kavita's score on t-c4-frac to 90
      const res = await request(app)
        .patch('/api/students/stud-test-01/scores')
        .send({ topicId: 't-c4-frac', score: 90 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('student');
      expect(res.body).toHaveProperty('updatedTopics');

      const updatedStudent = res.body.student;
      expect(updatedStudent.topicScores['t-c4-frac']).toBe(90);
      // (90 + 40) / 2 = 65
      expect(updatedStudent.averageScore).toBe(65);
      // t-c4-word is still 40 (< 50 trigger), so needsCheckin is true
      expect(updatedStudent.needsCheckin).toBe(true);
      expect(updatedStudent.peerRole).toBe('Steady Learner');

      // Now boost t-c4-word to 85 as well
      const res2 = await request(app)
        .patch('/api/students/stud-test-01/scores')
        .send({ topicId: 't-c4-word', score: 85 });

      const student2 = res2.body.student;
      // (90 + 85) / 2 = 88
      expect(student2.averageScore).toBe(88);
      expect(student2.needsCheckin).toBe(false);
      expect(student2.peerRole).toBe('Peer Mentor');
    });
  });

  describe('5. Weekly Plans & Generator API (/api/plans)', () => {
    it('GET /api/plans/active returns active weekly plan', async () => {
      const res = await request(app).get('/api/plans/active');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('sessions');
      expect(Array.isArray(res.body.sessions)).toBe(true);
    });

    it('POST /api/plans/generate runs planner engine server-side', async () => {
      const res = await request(app)
        .post('/api/plans/generate')
        .send({
          totalWeeklyHours: 15,
          focusGrade: 'Class 3'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('sessions');
      expect(res.body.gradesCovered).toEqual(['Class 3']);
      expect(res.body.totalPlannedHours).toBe(15);
    });
  });

  describe('6. Reset Endpoint (/api/reset)', () => {
    it('POST /api/reset rejects without confirm: true', async () => {
      const res = await request(app)
        .post('/api/reset')
        .send({ confirm: false });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/reset restores initial demo curriculum state when confirmed', async () => {
      const res = await request(app)
        .post('/api/reset')
        .send({ confirm: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('7. AI Fallback Metadata & Privacy Guard (/api/ai)', () => {
    it('POST /api/ai/chat returns deterministic fallback with source and reason', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'How do I teach fractions?' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reply');
      expect(res.body.source).toBe('fallback');
      expect(res.body.reason).toBe('no_api_key');
    });

    it('POST /api/ai/personalized-plan returns plan in Generated status with fallback metadata', async () => {
      const res = await request(app)
        .post('/api/ai/personalized-plan')
        .send({
          student: {
            id: 's-test',
            rollNo: '305',
            name: 'Pooja',
            grade: 'Class 3',
            topicScores: { 't1': 35 },
            averageScore: 35
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.plan).toHaveProperty('diagnosedRootGap');
      expect(res.body.plan.status).toBe('Generated'); // Hard Rule: must be Generated, not Approved
      expect(res.body.source).toBe('fallback');
      expect(res.body.reason).toBe('no_api_key');
    });
  });
});

