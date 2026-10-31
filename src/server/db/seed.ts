import Database from 'better-sqlite3';
import {
  INITIAL_CLASSROOM,
  INITIAL_USER_SETTINGS,
  INITIAL_TOPICS,
  INITIAL_STUDENTS,
  INITIAL_CONCEPT_NODES,
  INITIAL_ACTIVITIES,
  INITIAL_WEEKLY_PLAN
} from '../../data/initialData';

export function seedDatabase(db: Database.Database, force: boolean = false): void {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM topics').get() as { count: number };
  if (!force && countRow.count > 0) {
    // Already seeded
    return;
  }

  const runSeed = db.transaction(() => {
    if (force) {
      // Clear all tables in dependency order
      db.prepare('DELETE FROM saved_plans').run();
      db.prepare('DELETE FROM weekly_plans').run();
      db.prepare('DELETE FROM personalized_plans').run();
      db.prepare('DELETE FROM student_topic_scores').run();
      db.prepare('DELETE FROM students').run();
      db.prepare('DELETE FROM topics').run();
      db.prepare('DELETE FROM concept_nodes').run();
      db.prepare('DELETE FROM activities').run();
      db.prepare('DELETE FROM classroom_config').run();
      db.prepare('DELETE FROM user_settings').run();
      db.prepare('DELETE FROM import_jobs').run();
    }

    const now = new Date().toISOString();

    // 1. Classroom config
    const insertClassroom = db.prepare(`
      INSERT OR REPLACE INTO classroom_config (id, name, grades, subjects, days_per_week, hours_per_day, resources, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertClassroom.run(
      'default',
      INITIAL_CLASSROOM.name,
      JSON.stringify(INITIAL_CLASSROOM.grades),
      JSON.stringify(INITIAL_CLASSROOM.subjects),
      INITIAL_CLASSROOM.daysPerWeek,
      INITIAL_CLASSROOM.hoursPerDay,
      JSON.stringify(INITIAL_CLASSROOM.resources),
      now
    );

    // 2. User settings
    const insertSettings = db.prepare(`
      INSERT OR REPLACE INTO user_settings (id, teacher_name, classroom_name, preferred_language, time_format, default_hours_per_day, enable_tips, share_student_names_with_ai, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertSettings.run(
      'default',
      INITIAL_USER_SETTINGS.teacherName,
      INITIAL_USER_SETTINGS.classroomName,
      INITIAL_USER_SETTINGS.preferredLanguage,
      INITIAL_USER_SETTINGS.timeFormat,
      INITIAL_USER_SETTINGS.defaultHoursPerDay,
      INITIAL_USER_SETTINGS.enableTips ? 1 : 0,
      INITIAL_USER_SETTINGS.shareStudentNamesWithAI ? 1 : 0,
      now
    );

    // 3. Topics
    const insertTopic = db.prepare(`
      INSERT INTO topics (id, grade, subject, name, status, progress, understanding_level, prerequisite_topic_id, prerequisite_topic_name, notes, reviewed, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const t of INITIAL_TOPICS) {
      insertTopic.run(
        t.id,
        t.grade,
        t.subject,
        t.name,
        t.status,
        t.progress,
        t.understandingLevel,
        t.prerequisiteTopicId || null,
        t.prerequisiteTopicName || null,
        t.notes || null,
        t.reviewed ? 1 : 0,
        now
      );
    }

    // 4. Students, Topic Scores, and Personalized Plans
    const insertStudent = db.prepare(`
      INSERT INTO students (id, roll_no, name, grade, average_score, needs_checkin, peer_role, paired_student_id, paired_student_name, notes, attendance_pct, last_assessment_date, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertScore = db.prepare(`
      INSERT INTO student_topic_scores (student_id, topic_id, score)
      VALUES (?, ?, ?)
    `);
    const insertPlan = db.prepare(`
      INSERT INTO personalized_plans (id, student_id, student_name, grade, generated_at, diagnosed_root_gap, target_topic, checkin_activity, independent_station_task, suggested_peer_buddy, teacher_tip, status, source, reason, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const s of INITIAL_STUDENTS) {
      insertStudent.run(
        s.id,
        s.rollNo,
        s.name,
        s.grade,
        s.averageScore,
        s.needsCheckin ? 1 : 0,
        s.peerRole,
        s.pairedStudentId || null,
        s.pairedStudentName || null,
        s.notes || null,
        s.attendancePct,
        s.lastAssessmentDate || null,
        now
      );

      if (s.topicScores) {
        for (const [topicId, score] of Object.entries(s.topicScores)) {
          insertScore.run(s.id, topicId, score);
        }
      }

      if (s.personalizedPlan) {
        insertPlan.run(
          s.personalizedPlan.id,
          s.id,
          s.personalizedPlan.studentName,
          s.personalizedPlan.grade,
          s.personalizedPlan.generatedAt,
          s.personalizedPlan.diagnosedRootGap,
          s.personalizedPlan.targetTopic,
          JSON.stringify(s.personalizedPlan.checkinActivity),
          s.personalizedPlan.independentStationTask,
          JSON.stringify(s.personalizedPlan.suggestedPeerBuddy),
          s.personalizedPlan.teacherTip,
          s.personalizedPlan.status || 'Generated',
          s.personalizedPlan.source || 'fallback',
          s.personalizedPlan.reason || null,
          now
        );
      }
    }

    // 5. Concept Nodes
    const insertNode = db.prepare(`
      INSERT INTO concept_nodes (id, grade, name, subject, understanding_level, status, category, description, root_cause_context, suggested_action, prerequisites, next_concepts, x, y, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const n of INITIAL_CONCEPT_NODES) {
      insertNode.run(
        n.id,
        n.grade,
        n.name,
        n.subject,
        n.understandingLevel,
        n.status,
        n.category,
        n.description,
        n.rootCauseContext,
        n.suggestedAction,
        JSON.stringify(n.prerequisites),
        JSON.stringify(n.nextConcepts),
        n.x,
        n.y,
        now
      );
    }

    // 6. Activities
    const insertActivity = db.prepare(`
      INSERT INTO activities (id, title, subject, grades, objective, duration_minutes, required_materials, steps, adaptations, category, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const a of INITIAL_ACTIVITIES) {
      insertActivity.run(
        a.id,
        a.title,
        a.subject,
        JSON.stringify(a.grades),
        a.objective,
        a.durationMinutes,
        JSON.stringify(a.requiredMaterials),
        JSON.stringify(a.steps),
        JSON.stringify(a.adaptations),
        a.category,
        now
      );
    }

    // 7. Active Weekly Plan & Saved Plans
    const insertWeeklyPlan = db.prepare(`
      INSERT INTO weekly_plans (id, name, week_label, classroom_name, grades_covered, sessions, status, approved_date, last_updated, total_planned_hours, max_available_hours, notes, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertWeeklyPlan.run(
      INITIAL_WEEKLY_PLAN.id,
      INITIAL_WEEKLY_PLAN.name,
      INITIAL_WEEKLY_PLAN.weekLabel,
      INITIAL_WEEKLY_PLAN.classroomName,
      JSON.stringify(INITIAL_WEEKLY_PLAN.gradesCovered),
      JSON.stringify(INITIAL_WEEKLY_PLAN.sessions),
      INITIAL_WEEKLY_PLAN.status,
      INITIAL_WEEKLY_PLAN.approvedDate || null,
      INITIAL_WEEKLY_PLAN.lastUpdated,
      INITIAL_WEEKLY_PLAN.totalPlannedHours,
      INITIAL_WEEKLY_PLAN.maxAvailableHours,
      INITIAL_WEEKLY_PLAN.notes || null,
      1 // active
    );

    const insertSavedPlan = db.prepare(`
      INSERT INTO saved_plans (id, plan_id, saved_at)
      VALUES (?, ?, ?)
    `);
    insertSavedPlan.run(`saved-${INITIAL_WEEKLY_PLAN.id}`, INITIAL_WEEKLY_PLAN.id, now);
  });

  runSeed();
  console.log('Database seeded with initial RuralClass demo curriculum data.');
}

