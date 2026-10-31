import Database from 'better-sqlite3';
import { getDb } from './database';
import { ClassroomConfig, Topic, Student, ConceptNode, Activity, WeeklyPlan, UserSettings, PersonalizedPlan } from '../../types';
import { computeStudentMetrics, recalculateTopicLevels } from '../../shared/scoring';

export const ClassroomRepository = {
  get: (db: Database.Database = getDb()): ClassroomConfig => {
    const row = db.prepare('SELECT * FROM classroom_config WHERE id = ?').get('default') as any;
    if (!row) {
      throw new Error('Classroom configuration not initialized');
    }
    return {
      name: row.name,
      grades: JSON.parse(row.grades),
      subjects: JSON.parse(row.subjects),
      daysPerWeek: row.days_per_week,
      hoursPerDay: row.hours_per_day,
      resources: JSON.parse(row.resources)
    };
  },

  update: (data: ClassroomConfig, db: Database.Database = getDb()): ClassroomConfig => {
    db.prepare(`
      UPDATE classroom_config
      SET name = ?, grades = ?, subjects = ?, days_per_week = ?, hours_per_day = ?, resources = ?, updated_at = ?
      WHERE id = 'default'
    `).run(
      data.name,
      JSON.stringify(data.grades),
      JSON.stringify(data.subjects),
      data.daysPerWeek,
      data.hoursPerDay,
      JSON.stringify(data.resources),
      new Date().toISOString()
    );
    return ClassroomRepository.get(db);
  }
};

export const SettingsRepository = {
  get: (db: Database.Database = getDb()): UserSettings => {
    const row = db.prepare('SELECT * FROM user_settings WHERE id = ?').get('default') as any;
    if (!row) {
      throw new Error('User settings not initialized');
    }
    return {
      teacherName: row.teacher_name,
      classroomName: row.classroom_name,
      preferredLanguage: row.preferred_language,
      timeFormat: row.time_format,
      defaultHoursPerDay: row.default_hours_per_day,
      enableTips: Boolean(row.enable_tips),
      shareStudentNamesWithAI: Boolean(row.share_student_names_with_ai)
    };
  },

  update: (data: Partial<UserSettings>, db: Database.Database = getDb()): UserSettings => {
    const current = SettingsRepository.get(db);
    const updated = { ...current, ...data };
    db.prepare(`
      UPDATE user_settings
      SET teacher_name = ?, classroom_name = ?, preferred_language = ?, time_format = ?, default_hours_per_day = ?, enable_tips = ?, share_student_names_with_ai = ?, updated_at = ?
      WHERE id = 'default'
    `).run(
      updated.teacherName,
      updated.classroomName,
      updated.preferredLanguage,
      updated.timeFormat,
      updated.defaultHoursPerDay,
      updated.enableTips ? 1 : 0,
      updated.shareStudentNamesWithAI ? 1 : 0,
      new Date().toISOString()
    );
    return SettingsRepository.get(db);
  }
};

export const TopicsRepository = {
  getAll: (db: Database.Database = getDb()): Topic[] => {
    const rows = db.prepare('SELECT * FROM topics ORDER BY grade ASC, name ASC').all() as any[];
    return rows.map(r => ({
      id: r.id,
      grade: r.grade,
      subject: r.subject,
      name: r.name,
      status: r.status,
      progress: r.progress,
      understandingLevel: r.understanding_level,
      prerequisiteTopicId: r.prerequisite_topic_id || undefined,
      prerequisiteTopicName: r.prerequisite_topic_name || undefined,
      notes: r.notes || undefined,
      reviewed: Boolean(r.reviewed)
    }));
  },

  getById: (id: string, db: Database.Database = getDb()): Topic | null => {
    const r = db.prepare('SELECT * FROM topics WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      grade: r.grade,
      subject: r.subject,
      name: r.name,
      status: r.status,
      progress: r.progress,
      understandingLevel: r.understanding_level,
      prerequisiteTopicId: r.prerequisite_topic_id || undefined,
      prerequisiteTopicName: r.prerequisite_topic_name || undefined,
      notes: r.notes || undefined,
      reviewed: Boolean(r.reviewed)
    };
  },

  create: (topic: Topic, db: Database.Database = getDb()): Topic => {
    db.prepare(`
      INSERT INTO topics (id, grade, subject, name, status, progress, understanding_level, prerequisite_topic_id, prerequisite_topic_name, notes, reviewed, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      topic.id,
      topic.grade,
      topic.subject,
      topic.name,
      topic.status,
      topic.progress,
      topic.understandingLevel,
      topic.prerequisiteTopicId || null,
      topic.prerequisiteTopicName || null,
      topic.notes || null,
      topic.reviewed ? 1 : 0,
      new Date().toISOString()
    );
    return topic;
  },

  update: (id: string, data: Partial<Topic>, db: Database.Database = getDb()): Topic | null => {
    const existing = TopicsRepository.getById(id, db);
    if (!existing) return null;

    const merged = { ...existing, ...data };
    db.prepare(`
      UPDATE topics
      SET grade = ?, subject = ?, name = ?, status = ?, progress = ?, understanding_level = ?, prerequisite_topic_id = ?, prerequisite_topic_name = ?, notes = ?, reviewed = ?, updated_at = ?
      WHERE id = ?
    `).run(
      merged.grade,
      merged.subject,
      merged.name,
      merged.status,
      merged.progress,
      merged.understandingLevel,
      merged.prerequisiteTopicId || null,
      merged.prerequisiteTopicName || null,
      merged.notes || null,
      merged.reviewed ? 1 : 0,
      new Date().toISOString(),
      id
    );
    return TopicsRepository.getById(id, db);
  },

  delete: (id: string, db: Database.Database = getDb()): boolean => {
    const res = db.prepare('DELETE FROM topics WHERE id = ?').run(id);
    return res.changes > 0;
  }
};

export const StudentsRepository = {
  getAll: (db: Database.Database = getDb()): Student[] => {
    const studentRows = db.prepare('SELECT * FROM students ORDER BY grade ASC, roll_no ASC').all() as any[];
    const scoreRows = db.prepare('SELECT * FROM student_topic_scores').all() as any[];
    const planRows = db.prepare('SELECT * FROM personalized_plans').all() as any[];

    const scoresByStudent: Record<string, Record<string, number>> = {};
    for (const row of scoreRows) {
      if (!scoresByStudent[row.student_id]) {
        scoresByStudent[row.student_id] = {};
      }
      scoresByStudent[row.student_id][row.topic_id] = row.score;
    }

    const plansByStudent: Record<string, PersonalizedPlan> = {};
    for (const r of planRows) {
      plansByStudent[r.student_id] = {
        id: r.id,
        studentId: r.student_id,
        studentName: r.student_name,
        grade: r.grade,
        generatedAt: r.generated_at,
        diagnosedRootGap: r.diagnosed_root_gap,
        targetTopic: r.target_topic,
        checkinActivity: JSON.parse(r.checkin_activity),
        independentStationTask: r.independent_station_task,
        suggestedPeerBuddy: JSON.parse(r.suggested_peer_buddy),
        teacherTip: r.teacher_tip,
        status: r.status as 'Generated' | 'Approved',
        source: r.source,
        reason: r.reason
      };
    }

    return studentRows.map(r => ({
      id: r.id,
      rollNo: r.roll_no,
      name: r.name,
      grade: r.grade,
      section: r.section || undefined,
      topicScores: scoresByStudent[r.id] || {},
      averageScore: r.average_score,
      needsCheckin: Boolean(r.needs_checkin),
      peerRole: r.peer_role,
      pairedStudentId: r.paired_student_id || undefined,
      pairedStudentName: r.paired_student_name || undefined,
      notes: r.notes || undefined,
      attendancePct: r.attendance_pct,
      lastAssessmentDate: r.last_assessment_date || undefined,
      personalizedPlan: plansByStudent[r.id] || undefined
    }));
  },

  getById: (id: string, db: Database.Database = getDb()): Student | null => {
    const r = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;
    if (!r) return null;

    const scoreRows = db.prepare('SELECT topic_id, score FROM student_topic_scores WHERE student_id = ?').all(id) as any[];
    const topicScores: Record<string, number> = {};
    for (const row of scoreRows) {
      topicScores[row.topic_id] = row.score;
    }

    const planRow = db.prepare('SELECT * FROM personalized_plans WHERE student_id = ?').get(id) as any;
    let personalizedPlan: PersonalizedPlan | undefined;
    if (planRow) {
      personalizedPlan = {
        id: planRow.id,
        studentId: planRow.student_id,
        studentName: planRow.student_name,
        grade: planRow.grade,
        generatedAt: planRow.generated_at,
        diagnosedRootGap: planRow.diagnosed_root_gap,
        targetTopic: planRow.target_topic,
        checkinActivity: JSON.parse(planRow.checkin_activity),
        independentStationTask: planRow.independent_station_task,
        suggestedPeerBuddy: JSON.parse(planRow.suggested_peer_buddy),
        teacherTip: planRow.teacher_tip,
        status: planRow.status,
        source: planRow.source,
        reason: planRow.reason
      };
    }

    return {
      id: r.id,
      rollNo: r.roll_no,
      name: r.name,
      grade: r.grade,
      section: r.section || undefined,
      topicScores,
      averageScore: r.average_score,
      needsCheckin: Boolean(r.needs_checkin),
      peerRole: r.peer_role,
      pairedStudentId: r.paired_student_id || undefined,
      pairedStudentName: r.paired_student_name || undefined,
      notes: r.notes || undefined,
      attendancePct: r.attendance_pct,
      lastAssessmentDate: r.last_assessment_date || undefined,
      personalizedPlan
    };
  },

  create: (student: Student, db: Database.Database = getDb()): Student => {
    const now = new Date().toISOString();
    const metrics = computeStudentMetrics(student.topicScores || {});

    const runTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO students (id, roll_no, name, grade, section, average_score, needs_checkin, peer_role, paired_student_id, paired_student_name, notes, attendance_pct, last_assessment_date, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        student.id,
        student.rollNo,
        student.name,
        student.grade,
        student.section || null,
        metrics.averageScore,
        metrics.needsCheckin ? 1 : 0,
        metrics.peerRole,
        student.pairedStudentId || null,
        student.pairedStudentName || null,
        student.notes || null,
        student.attendancePct || 90,
        student.lastAssessmentDate || now.split('T')[0],
        now
      );

      if (student.topicScores) {
        const insertScore = db.prepare(`
          INSERT INTO student_topic_scores (student_id, topic_id, score)
          VALUES (?, ?, ?)
        `);
        for (const [topicId, score] of Object.entries(student.topicScores)) {
          insertScore.run(student.id, topicId, score);
        }
      }
    });

    runTx();
    return StudentsRepository.getById(student.id, db)!;
  },

  update: (id: string, data: Partial<Student>, db: Database.Database = getDb()): Student | null => {
    const existing = StudentsRepository.getById(id, db);
    if (!existing) return null;

    const merged = { ...existing, ...data };
    const now = new Date().toISOString();

    const runTx = db.transaction(() => {
      db.prepare(`
        UPDATE students
        SET roll_no = ?, name = ?, grade = ?, section = ?, average_score = ?, needs_checkin = ?, peer_role = ?, paired_student_id = ?, paired_student_name = ?, notes = ?, attendance_pct = ?, last_assessment_date = ?, updated_at = ?
        WHERE id = ?
      `).run(
        merged.rollNo,
        merged.name,
        merged.grade,
        merged.section || null,
        merged.averageScore,
        merged.needsCheckin ? 1 : 0,
        merged.peerRole,
        merged.pairedStudentId || null,
        merged.pairedStudentName || null,
        merged.notes || null,
        merged.attendancePct,
        merged.lastAssessmentDate || null,
        now,
        id
      );

      if (data.topicScores) {
        db.prepare('DELETE FROM student_topic_scores WHERE student_id = ?').run(id);
        const insertScore = db.prepare(`
          INSERT INTO student_topic_scores (student_id, topic_id, score)
          VALUES (?, ?, ?)
        `);
        for (const [topicId, score] of Object.entries(data.topicScores)) {
          insertScore.run(id, topicId, score);
        }
      }
    });

    runTx();
    return StudentsRepository.getById(id, db);
  },

  delete: (id: string, db: Database.Database = getDb()): boolean => {
    const res = db.prepare('DELETE FROM students WHERE id = ?').run(id);
    return res.changes > 0;
  },

  updateScore: (
    studentId: string,
    topicId: string,
    newScore: number,
    db: Database.Database = getDb()
  ): { student: Student; updatedTopics: Topic[] } => {
    const student = StudentsRepository.getById(studentId, db);
    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }

    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const runTx = db.transaction(() => {
      // 1. Update score in student_topic_scores
      db.prepare(`
        INSERT INTO student_topic_scores (student_id, topic_id, score)
        VALUES (?, ?, ?)
        ON CONFLICT(student_id, topic_id) DO UPDATE SET score = excluded.score
      `).run(studentId, topicId, newScore);

      // 2. Fetch updated scores for this student
      const updatedScores = { ...student.topicScores, [topicId]: newScore };
      const metrics = computeStudentMetrics(updatedScores);

      // 3. Update student table
      db.prepare(`
        UPDATE students
        SET average_score = ?, needs_checkin = ?, peer_role = ?, last_assessment_date = ?, updated_at = ?
        WHERE id = ?
      `).run(
        metrics.averageScore,
        metrics.needsCheckin ? 1 : 0,
        metrics.peerRole,
        today,
        now,
        studentId
      );

      // 4. Recalculate topic averages across students
      const allStudents = StudentsRepository.getAll(db);
      const allTopics = TopicsRepository.getAll(db);
      const recalculated = recalculateTopicLevels(allTopics, allStudents);

      const updateTopicStmt = db.prepare(`
        UPDATE topics
        SET understanding_level = ?, progress = ?, updated_at = ?
        WHERE id = ?
      `);

      for (const t of recalculated) {
        updateTopicStmt.run(t.understandingLevel, t.progress, now, t.id);
      }
    });

    runTx();

    const updatedStudent = StudentsRepository.getById(studentId, db)!;
    const allUpdatedTopics = TopicsRepository.getAll(db);
    return { student: updatedStudent, updatedTopics: allUpdatedTopics };
  },

  savePersonalizedPlan: (plan: PersonalizedPlan, db: Database.Database = getDb()): PersonalizedPlan => {
    const student = StudentsRepository.getById(plan.studentId, db);
    if (!student) {
      // Return plan directly if student is not yet persisted in database
      return plan;
    }
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO personalized_plans (id, student_id, student_name, grade, generated_at, diagnosed_root_gap, target_topic, checkin_activity, independent_station_task, suggested_peer_buddy, teacher_tip, status, source, reason, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id) DO UPDATE SET
        id = excluded.id,
        student_name = excluded.student_name,
        grade = excluded.grade,
        generated_at = excluded.generated_at,
        diagnosed_root_gap = excluded.diagnosed_root_gap,
        target_topic = excluded.target_topic,
        checkin_activity = excluded.checkin_activity,
        independent_station_task = excluded.independent_station_task,
        suggested_peer_buddy = excluded.suggested_peer_buddy,
        teacher_tip = excluded.teacher_tip,
        status = excluded.status,
        source = excluded.source,
        reason = excluded.reason,
        updated_at = excluded.updated_at
    `).run(
      plan.id,
      plan.studentId,
      plan.studentName,
      plan.grade,
      plan.generatedAt,
      plan.diagnosedRootGap,
      plan.targetTopic,
      JSON.stringify(plan.checkinActivity),
      plan.independentStationTask,
      JSON.stringify(plan.suggestedPeerBuddy),
      plan.teacherTip,
      plan.status,
      plan.source || 'fallback',
      plan.reason || null,
      now
    );
    return plan;
  }
};

export const ConceptNodesRepository = {
  getAll: (db: Database.Database = getDb()): ConceptNode[] => {
    const rows = db.prepare('SELECT * FROM concept_nodes ORDER BY grade ASC, name ASC').all() as any[];
    return rows.map(r => ({
      id: r.id,
      grade: r.grade,
      name: r.name,
      subject: r.subject,
      understandingLevel: r.understanding_level,
      status: r.status,
      category: r.category,
      description: r.description,
      rootCauseContext: r.root_cause_context,
      suggestedAction: r.suggested_action,
      prerequisites: JSON.parse(r.prerequisites),
      nextConcepts: JSON.parse(r.next_concepts),
      x: r.x,
      y: r.y
    }));
  },

  getById: (id: string, db: Database.Database = getDb()): ConceptNode | null => {
    const r = db.prepare('SELECT * FROM concept_nodes WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      grade: r.grade,
      name: r.name,
      subject: r.subject,
      understandingLevel: r.understanding_level,
      status: r.status,
      category: r.category,
      description: r.description,
      rootCauseContext: r.root_cause_context,
      suggestedAction: r.suggested_action,
      prerequisites: JSON.parse(r.prerequisites),
      nextConcepts: JSON.parse(r.next_concepts),
      x: r.x,
      y: r.y
    };
  },

  create: (node: ConceptNode, db: Database.Database = getDb()): ConceptNode => {
    db.prepare(`
      INSERT INTO concept_nodes (id, grade, name, subject, understanding_level, status, category, description, root_cause_context, suggested_action, prerequisites, next_concepts, x, y, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      node.id,
      node.grade,
      node.name,
      node.subject,
      node.understandingLevel,
      node.status,
      node.category,
      node.description,
      node.rootCauseContext,
      node.suggestedAction,
      JSON.stringify(node.prerequisites),
      JSON.stringify(node.nextConcepts),
      node.x,
      node.y,
      new Date().toISOString()
    );
    return node;
  },

  update: (id: string, data: Partial<ConceptNode>, db: Database.Database = getDb()): ConceptNode | null => {
    const existing = ConceptNodesRepository.getById(id, db);
    if (!existing) return null;
    const merged = { ...existing, ...data };
    db.prepare(`
      UPDATE concept_nodes
      SET grade = ?, name = ?, subject = ?, understanding_level = ?, status = ?, category = ?, description = ?, root_cause_context = ?, suggested_action = ?, prerequisites = ?, next_concepts = ?, x = ?, y = ?, updated_at = ?
      WHERE id = ?
    `).run(
      merged.grade,
      merged.name,
      merged.subject,
      merged.understandingLevel,
      merged.status,
      merged.category,
      merged.description,
      merged.rootCauseContext,
      merged.suggestedAction,
      JSON.stringify(merged.prerequisites),
      JSON.stringify(merged.nextConcepts),
      merged.x,
      merged.y,
      new Date().toISOString(),
      id
    );
    return ConceptNodesRepository.getById(id, db);
  },

  delete: (id: string, db: Database.Database = getDb()): boolean => {
    const res = db.prepare('DELETE FROM concept_nodes WHERE id = ?').run(id);
    return res.changes > 0;
  }
};

export const ActivitiesRepository = {
  getAll: (db: Database.Database = getDb()): Activity[] => {
    const rows = db.prepare('SELECT * FROM activities ORDER BY title ASC').all() as any[];
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      subject: r.subject,
      grades: JSON.parse(r.grades),
      objective: r.objective,
      durationMinutes: r.duration_minutes,
      requiredMaterials: JSON.parse(r.required_materials),
      steps: JSON.parse(r.steps),
      adaptations: JSON.parse(r.adaptations),
      category: r.category
    }));
  },

  getById: (id: string, db: Database.Database = getDb()): Activity | null => {
    const r = db.prepare('SELECT * FROM activities WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      subject: r.subject,
      grades: JSON.parse(r.grades),
      objective: r.objective,
      durationMinutes: r.duration_minutes,
      requiredMaterials: JSON.parse(r.required_materials),
      steps: JSON.parse(r.steps),
      adaptations: JSON.parse(r.adaptations),
      category: r.category
    };
  },

  create: (act: Activity, db: Database.Database = getDb()): Activity => {
    db.prepare(`
      INSERT INTO activities (id, title, subject, grades, objective, duration_minutes, required_materials, steps, adaptations, category, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      act.id,
      act.title,
      act.subject,
      JSON.stringify(act.grades),
      act.objective,
      act.durationMinutes,
      JSON.stringify(act.requiredMaterials),
      JSON.stringify(act.steps),
      JSON.stringify(act.adaptations),
      act.category,
      new Date().toISOString()
    );
    return act;
  },

  update: (id: string, data: Partial<Activity>, db: Database.Database = getDb()): Activity | null => {
    const existing = ActivitiesRepository.getById(id, db);
    if (!existing) return null;
    const merged = { ...existing, ...data };
    db.prepare(`
      UPDATE activities
      SET title = ?, subject = ?, grades = ?, objective = ?, duration_minutes = ?, required_materials = ?, steps = ?, adaptations = ?, category = ?, updated_at = ?
      WHERE id = ?
    `).run(
      merged.title,
      merged.subject,
      JSON.stringify(merged.grades),
      merged.objective,
      merged.durationMinutes,
      JSON.stringify(merged.requiredMaterials),
      JSON.stringify(merged.steps),
      JSON.stringify(merged.adaptations),
      merged.category,
      new Date().toISOString(),
      id
    );
    return ActivitiesRepository.getById(id, db);
  },

  delete: (id: string, db: Database.Database = getDb()): boolean => {
    const res = db.prepare('DELETE FROM activities WHERE id = ?').run(id);
    return res.changes > 0;
  }
};

export const PlansRepository = {
  getActive: (db: Database.Database = getDb()): WeeklyPlan | null => {
    const r = db.prepare('SELECT * FROM weekly_plans WHERE is_active = 1 LIMIT 1').get() as any;
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      weekLabel: r.week_label,
      classroomName: r.classroom_name,
      gradesCovered: JSON.parse(r.grades_covered),
      sessions: JSON.parse(r.sessions),
      status: r.status,
      approvedDate: r.approved_date || undefined,
      lastUpdated: r.last_updated,
      totalPlannedHours: r.total_planned_hours,
      maxAvailableHours: r.max_available_hours,
      notes: r.notes || undefined
    };
  },

  setActive: (plan: WeeklyPlan, db: Database.Database = getDb()): WeeklyPlan => {
    const now = new Date().toISOString();
    const runTx = db.transaction(() => {
      // Mark others as inactive
      db.prepare('UPDATE weekly_plans SET is_active = 0').run();

      db.prepare(`
        INSERT INTO weekly_plans (id, name, week_label, classroom_name, grades_covered, sessions, status, approved_date, last_updated, total_planned_hours, max_available_hours, notes, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          week_label = excluded.week_label,
          classroom_name = excluded.classroom_name,
          grades_covered = excluded.grades_covered,
          sessions = excluded.sessions,
          status = excluded.status,
          approved_date = excluded.approved_date,
          last_updated = excluded.last_updated,
          total_planned_hours = excluded.total_planned_hours,
          max_available_hours = excluded.max_available_hours,
          notes = excluded.notes,
          is_active = 1
      `).run(
        plan.id,
        plan.name,
        plan.weekLabel,
        plan.classroomName,
        JSON.stringify(plan.gradesCovered),
        JSON.stringify(plan.sessions),
        plan.status,
        plan.approvedDate || null,
        plan.lastUpdated || now,
        plan.totalPlannedHours,
        plan.maxAvailableHours,
        plan.notes || null
      );
    });

    runTx();
    return PlansRepository.getActive(db)!;
  },

  getSaved: (db: Database.Database = getDb()): WeeklyPlan[] => {
    const rows = db.prepare(`
      SELECT p.*, s.saved_at
      FROM saved_plans s
      JOIN weekly_plans p ON s.plan_id = p.id
      ORDER BY s.saved_at DESC
    `).all() as any[];

    return rows.map(r => ({
      id: r.id,
      name: r.name,
      weekLabel: r.week_label,
      classroomName: r.classroom_name,
      gradesCovered: JSON.parse(r.grades_covered),
      sessions: JSON.parse(r.sessions),
      status: r.status,
      approvedDate: r.approved_date || undefined,
      lastUpdated: r.last_updated,
      totalPlannedHours: r.total_planned_hours,
      maxAvailableHours: r.max_available_hours,
      notes: r.notes || undefined
    }));
  },

  savePlan: (plan: WeeklyPlan, db: Database.Database = getDb()): WeeklyPlan => {
    const now = new Date().toISOString();
    const runTx = db.transaction(() => {
      // Ensure plan is in weekly_plans
      db.prepare(`
        INSERT OR IGNORE INTO weekly_plans (id, name, week_label, classroom_name, grades_covered, sessions, status, approved_date, last_updated, total_planned_hours, max_available_hours, notes, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(
        plan.id,
        plan.name,
        plan.weekLabel,
        plan.classroomName,
        JSON.stringify(plan.gradesCovered),
        JSON.stringify(plan.sessions),
        plan.status,
        plan.approvedDate || null,
        plan.lastUpdated || now,
        plan.totalPlannedHours,
        plan.maxAvailableHours,
        plan.notes || null
      );

      const savedId = `saved-${plan.id}-${Date.now()}`;
      db.prepare(`
        INSERT INTO saved_plans (id, plan_id, saved_at)
        VALUES (?, ?, ?)
      `).run(savedId, plan.id, now);
    });

    runTx();
    return plan;
  },

  deleteSaved: (planId: string, db: Database.Database = getDb()): boolean => {
    const res = db.prepare('DELETE FROM saved_plans WHERE plan_id = ?').run(planId);
    return res.changes > 0;
  }
};

export interface ImportJobRecord {
  id: string;
  jobType: string;
  filename: string;
  importedAt: string;
  recordsCount: number;
  summary: string;
  snapshot?: string;
}

export const ImportJobsRepository = {
  getAll: (db: Database.Database = getDb()): ImportJobRecord[] => {
    const rows = db.prepare('SELECT * FROM import_jobs ORDER BY imported_at DESC').all() as any[];
    return rows.map(r => ({
      id: r.id,
      jobType: r.job_type,
      filename: r.filename,
      importedAt: r.imported_at,
      recordsCount: r.records_count,
      summary: r.summary,
      snapshot: r.snapshot || undefined
    }));
  },

  getLatestWithSnapshot: (db: Database.Database = getDb()): ImportJobRecord | null => {
    const r = db.prepare('SELECT * FROM import_jobs WHERE snapshot IS NOT NULL ORDER BY imported_at DESC LIMIT 1').get() as any;
    if (!r) return null;
    return {
      id: r.id,
      jobType: r.job_type,
      filename: r.filename,
      importedAt: r.imported_at,
      recordsCount: r.records_count,
      summary: r.summary,
      snapshot: r.snapshot
    };
  },

  commitStudentsImport: (
    mode: 'merge' | 'replace',
    rows: Array<{ rollNumber: string; name: string; grade: string; section?: string; scores: Record<string, number> }>,
    filename: string,
    db: Database.Database = getDb()
  ): { jobId: string; count: number } => {
    const currentStudents = StudentsRepository.getAll(db);
    const snapshotJson = JSON.stringify(currentStudents);
    const now = new Date().toISOString();
    const jobId = `job-${Date.now()}`;

    const runTx = db.transaction(() => {
      if (mode === 'replace') {
        db.prepare('DELETE FROM students').run();
      }

      for (const row of rows) {
        let existing: Student | null = null;
        if (mode === 'merge') {
          // Student identity: grade + section + rollNo (or name within grade+section)
          const rowGrade = row.grade || 'Class 3';
          const rowSec = row.section || '';
          const match = db.prepare(`
            SELECT id FROM students 
            WHERE (grade = ? AND COALESCE(section, '') = ? AND roll_no = ?)
               OR (grade = ? AND COALESCE(section, '') = ? AND name = ? COLLATE NOCASE)
          `).get(rowGrade, rowSec, row.rollNumber, rowGrade, rowSec, row.name) as any;
          if (match) {
            existing = StudentsRepository.getById(match.id, db);
          }
        }

        const studentId = existing ? existing.id : `stu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const mergedScores = existing ? { ...existing.topicScores, ...row.scores } : row.scores;
        const metrics = computeStudentMetrics(mergedScores);

        if (existing) {
          db.prepare(`
            UPDATE students
            SET roll_no = ?, name = ?, grade = ?, section = ?, average_score = ?, needs_checkin = ?, peer_role = ?, updated_at = ?
            WHERE id = ?
          `).run(
            row.rollNumber || existing.rollNo,
            row.name || existing.name,
            row.grade || existing.grade,
            row.section !== undefined ? (row.section || null) : (existing.section || null),
            metrics.averageScore,
            metrics.needsCheckin ? 1 : 0,
            metrics.peerRole,
            now,
            studentId
          );
        } else {
          db.prepare(`
            INSERT INTO students (id, roll_no, name, grade, section, average_score, needs_checkin, peer_role, attendance_pct, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 90, ?)
          `).run(
            studentId,
            row.rollNumber || `R${Date.now() % 1000}`,
            row.name,
            row.grade || 'Class 3',
            row.section || null,
            metrics.averageScore,
            metrics.needsCheckin ? 1 : 0,
            metrics.peerRole,
            now
          );
        }

        const upsertScore = db.prepare(`
          INSERT INTO student_topic_scores (student_id, topic_id, score)
          VALUES (?, ?, ?)
          ON CONFLICT(student_id, topic_id) DO UPDATE SET score = excluded.score
        `);
        for (const [topicId, score] of Object.entries(mergedScores)) {
          const topicExists = db.prepare('SELECT id FROM topics WHERE id = ?').get(topicId);
          if (topicExists) {
            upsertScore.run(studentId, topicId, score);
          }
        }
      }

      const allStudents = StudentsRepository.getAll(db);
      const allTopics = TopicsRepository.getAll(db);
      const updatedTopics = recalculateTopicLevels(allTopics, allStudents);
      const updateTopicLvl = db.prepare('UPDATE topics SET understanding_level = ?, status = ?, updated_at = ? WHERE id = ?');
      for (const ut of updatedTopics) {
        updateTopicLvl.run(ut.understandingLevel, ut.status, now, ut.id);
      }

      db.prepare(`
        INSERT INTO import_jobs (id, job_type, filename, imported_at, records_count, summary, snapshot)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        jobId,
        'students',
        filename,
        now,
        rows.length,
        `${mode.toUpperCase()} import of ${rows.length} student records from ${filename}`,
        snapshotJson
      );
    });

    runTx();
    return { jobId, count: rows.length };
  },

  commitAttendanceImport: (
    rows: Array<{ rollNumber?: string; name?: string; grade?: string; section?: string; attendancePct: number }>,
    filename: string,
    db: Database.Database = getDb()
  ): { jobId: string; count: number } => {
    const currentStudents = StudentsRepository.getAll(db);
    const snapshotJson = JSON.stringify(currentStudents);
    const now = new Date().toISOString();
    const jobId = `job-att-${Date.now()}`;
    let updatedCount = 0;

    const runTx = db.transaction(() => {
      const updateStmt = db.prepare(`
        UPDATE students
        SET attendance_pct = ?, updated_at = ?
        WHERE id = ?
      `);

      for (const row of rows) {
        const rowGrade = row.grade || '';
        const rowSec = row.section || '';
        const rowRoll = row.rollNumber || '';
        const rowName = row.name || '';

        let match: any = null;
        if (rowGrade && rowRoll) {
          match = db.prepare("SELECT id FROM students WHERE grade = ? AND COALESCE(section, '') = ? AND roll_no = ?").get(rowGrade, rowSec, rowRoll);
        }
        if (!match && rowGrade && rowName) {
          match = db.prepare("SELECT id FROM students WHERE grade = ? AND COALESCE(section, '') = ? AND name = ? COLLATE NOCASE").get(rowGrade, rowSec, rowName);
        }
        if (!match && rowRoll) {
          match = db.prepare('SELECT id FROM students WHERE roll_no = ?').get(rowRoll);
        }
        if (!match && rowName) {
          match = db.prepare('SELECT id FROM students WHERE name = ? COLLATE NOCASE').get(rowName);
        }

        if (match) {
          updateStmt.run(Math.max(0, Math.min(100, Math.round(row.attendancePct))), now, match.id);
          updatedCount++;
        }
      }

      db.prepare(`
        INSERT INTO import_jobs (id, job_type, filename, imported_at, records_count, summary, snapshot)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        jobId,
        'attendance',
        filename,
        now,
        updatedCount,
        `Updated attendance for ${updatedCount} students from ${filename}`,
        snapshotJson
      );
    });

    runTx();
    return { jobId, count: updatedCount };
  },

  commitTimetableImport: (
    sessions: any[],
    filename: string,
    planName?: string,
    db: Database.Database = getDb()
  ): { jobId: string; count: number; planId: string } => {
    const now = new Date().toISOString();
    const planId = `plan-draft-${Date.now()}`;
    const jobId = `job-tt-${Date.now()}`;

    const totalMinutes = sessions.reduce((sum, s) => sum + (Number(s.durationMinutes) || 45), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const gradesCovered = Array.from(new Set(sessions.flatMap(s => s.gradesInvolved || [s.grade]).filter(Boolean)));
    if (gradesCovered.length === 0) gradesCovered.push('Class 3', 'Class 4', 'Class 5');

    const formattedSessions = sessions.map((s, idx) => ({
      id: s.id || `sess-imp-${Date.now()}-${idx}`,
      day: s.day || 'Monday',
      startTime: s.startTime || s.timeSlot || '09:00',
      durationMinutes: Number(s.durationMinutes) || 45,
      title: s.title || s.topicName || s.topic || 'General Session',
      topicId: s.topicId,
      sessionType: s.sessionType || 'Shared Lesson',
      gradesInvolved: Array.isArray(s.gradesInvolved) ? s.gradesInvolved : [s.grade || 'Class 3'],
      sharedObjective: s.sharedObjective || s.objective || 'Session objective',
      gradeTasks: Array.isArray(s.gradeTasks) ? s.gradeTasks : [],
      resources: Array.isArray(s.resources) ? s.resources : [],
      teachingNotes: s.teachingNotes || s.notes || ''
    }));

    const runTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO weekly_plans (id, name, week_label, classroom_name, grades_covered, sessions, status, last_updated, total_planned_hours, max_available_hours, notes, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 'Draft', ?, ?, 25, 'Imported from timetable schedule', 0)
      `).run(
        planId,
        planName || `Imported Schedule (${new Date().toLocaleDateString()})`,
        'Draft Timetable',
        'Multigrade Classroom',
        JSON.stringify(gradesCovered),
        JSON.stringify(formattedSessions),
        now,
        totalHours
      );

      const snapshotJson = JSON.stringify({ planId });

      db.prepare(`
        INSERT INTO import_jobs (id, job_type, filename, imported_at, records_count, summary, snapshot)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        jobId,
        'timetable',
        filename,
        now,
        formattedSessions.length,
        `Imported ${formattedSessions.length} timetable sessions as Draft plan`,
        snapshotJson
      );
    });

    runTx();
    return { jobId, count: formattedSessions.length, planId };
  },

  commitClassroomImport: (
    config: Partial<ClassroomConfig>,
    filename: string,
    db: Database.Database = getDb()
  ): { jobId: string; count: number } => {
    const current = ClassroomRepository.get(db);
    const snapshotJson = JSON.stringify(current);
    const now = new Date().toISOString();
    const jobId = `job-class-${Date.now()}`;

    const merged: ClassroomConfig = {
      name: config.name || current.name,
      grades: config.grades && config.grades.length > 0 ? config.grades : current.grades,
      subjects: config.subjects && config.subjects.length > 0 ? config.subjects : current.subjects,
      daysPerWeek: config.daysPerWeek || current.daysPerWeek,
      hoursPerDay: config.hoursPerDay || current.hoursPerDay,
      resources: config.resources && config.resources.length > 0 ? config.resources : current.resources
    };

    const runTx = db.transaction(() => {
      ClassroomRepository.update(merged, db);

      db.prepare(`
        INSERT INTO import_jobs (id, job_type, filename, imported_at, records_count, summary, snapshot)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        jobId,
        'classroom',
        filename,
        now,
        1,
        `Updated classroom configuration from ${filename}`,
        snapshotJson
      );
    });

    runTx();
    return { jobId, count: 1 };
  },

  commitTopicsImport: (
    topics: Array<Partial<Topic>>,
    mode: 'merge' | 'replace',
    filename: string,
    db: Database.Database = getDb()
  ): { jobId: string; count: number } => {
    const currentTopics = TopicsRepository.getAll(db);
    const snapshotJson = JSON.stringify(currentTopics);
    const now = new Date().toISOString();
    const jobId = `job-top-${Date.now()}`;

    const runTx = db.transaction(() => {
      if (mode === 'replace') {
        db.prepare('DELETE FROM student_topic_scores').run();
        db.prepare('DELETE FROM topics').run();
      }

      for (const t of topics) {
        if (!t.name) continue;
        const topicId = t.id || `top-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        db.prepare(`
          INSERT INTO topics (id, grade, subject, name, status, progress, understanding_level, prerequisite_topic_id, prerequisite_topic_name, notes, reviewed, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
          ON CONFLICT(id) DO UPDATE SET
            grade = excluded.grade,
            subject = excluded.subject,
            name = excluded.name,
            progress = excluded.progress,
            understanding_level = excluded.understanding_level,
            updated_at = excluded.updated_at
        `).run(
          topicId,
          t.grade || 'Class 3',
          t.subject || 'Mathematics',
          t.name,
          t.status || 'not-started',
          t.progress ?? 0,
          t.understandingLevel ?? 60,
          t.prerequisiteTopicId || null,
          t.prerequisiteTopicName || null,
          t.notes || null,
          now
        );
      }

      db.prepare(`
        INSERT INTO import_jobs (id, job_type, filename, imported_at, records_count, summary, snapshot)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        jobId,
        'topics',
        filename,
        now,
        topics.length,
        `${mode.toUpperCase()} import of ${topics.length} topics from ${filename}`,
        snapshotJson
      );
    });

    runTx();
    return { jobId, count: topics.length };
  },

  commitActivitiesImport: (
    activities: Array<Partial<Activity>>,
    mode: 'merge' | 'replace',
    filename: string,
    db: Database.Database = getDb()
  ): { jobId: string; count: number } => {
    const current = ActivitiesRepository.getAll(db);
    const snapshotJson = JSON.stringify(current);
    const now = new Date().toISOString();
    const jobId = `job-act-${Date.now()}`;

    const runTx = db.transaction(() => {
      if (mode === 'replace') {
        db.prepare('DELETE FROM activities').run();
      }

      for (const act of activities) {
        if (!act.title) continue;
        const actId = act.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        db.prepare(`
          INSERT INTO activities (id, title, subject, grades, objective, duration_minutes, required_materials, steps, adaptations, category, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            subject = excluded.subject,
            grades = excluded.grades,
            objective = excluded.objective,
            duration_minutes = excluded.duration_minutes,
            required_materials = excluded.required_materials,
            steps = excluded.steps,
            adaptations = excluded.adaptations,
            category = excluded.category,
            updated_at = excluded.updated_at
        `).run(
          actId,
          act.title,
          act.subject || 'Mathematics',
          JSON.stringify(act.grades || ['Class 3']),
          act.objective || act.title,
          act.durationMinutes || 30,
          JSON.stringify(act.requiredMaterials || ['Paper', 'Pencil']),
          JSON.stringify(act.steps || ['Introduce topic', 'Group activity', 'Review']),
          JSON.stringify(act.adaptations || ['Allow peer assistance']),
          act.category || 'interactive',
          now
        );
      }

      db.prepare(`
        INSERT INTO import_jobs (id, job_type, filename, imported_at, records_count, summary, snapshot)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        jobId,
        'activities',
        filename,
        now,
        activities.length,
        `${mode.toUpperCase()} import of ${activities.length} activities from ${filename}`,
        snapshotJson
      );
    });

    runTx();
    return { jobId, count: activities.length };
  },

  undoLastImport: (db: Database.Database = getDb()): { restoredCount: number; filename: string } | null => {
    const latest = ImportJobsRepository.getLatestWithSnapshot(db);
    if (!latest || !latest.snapshot) return null;

    const now = new Date().toISOString();
    let restoredCount = latest.recordsCount;

    const runTx = db.transaction(() => {
      if (latest.jobType === 'students' || latest.jobType === 'attendance') {
        const previousStudents: Student[] = JSON.parse(latest.snapshot!);
        restoredCount = previousStudents.length;
        db.prepare('DELETE FROM students').run();
        for (const s of previousStudents) {
          StudentsRepository.create(s, db);
        }
        const allStudents = StudentsRepository.getAll(db);
        const allTopics = TopicsRepository.getAll(db);
        const updatedTopics = recalculateTopicLevels(allTopics, allStudents);
        const updateTopicLvl = db.prepare('UPDATE topics SET understanding_level = ?, status = ?, updated_at = ? WHERE id = ?');
        for (const ut of updatedTopics) {
          updateTopicLvl.run(ut.understandingLevel, ut.status, now, ut.id);
        }
      } else if (latest.jobType === 'timetable') {
        const { planId } = JSON.parse(latest.snapshot!);
        if (planId) {
          db.prepare('DELETE FROM weekly_plans WHERE id = ?').run(planId);
        }
      } else if (latest.jobType === 'classroom') {
        const prevConfig: ClassroomConfig = JSON.parse(latest.snapshot!);
        ClassroomRepository.update(prevConfig, db);
      } else if (latest.jobType === 'topics') {
        const prevTopics: Topic[] = JSON.parse(latest.snapshot!);
        restoredCount = prevTopics.length;
        db.prepare('DELETE FROM student_topic_scores').run();
        db.prepare('DELETE FROM topics').run();
        for (const pt of prevTopics) {
          TopicsRepository.create(pt, db);
        }
      } else if (latest.jobType === 'activities') {
        const prevActivities: Activity[] = JSON.parse(latest.snapshot!);
        restoredCount = prevActivities.length;
        db.prepare('DELETE FROM activities').run();
        for (const pa of prevActivities) {
          ActivitiesRepository.create(pa, db);
        }
      }

      db.prepare('DELETE FROM import_jobs WHERE id = ?').run(latest.id);
    });

    runTx();
    return { restoredCount, filename: latest.filename };
  }
};
