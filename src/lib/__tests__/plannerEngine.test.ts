import { describe, it, expect } from 'vitest';
import { rootCauseFor, generateWeeklyPlan } from '../plannerEngine';
import { computeStudentMetrics, recalculateTopicLevels } from '../../shared/scoring';
import { WEAK_THRESHOLD, PEER_MENTOR_THRESHOLD, CHECKIN_SCORE_TRIGGER } from '../../shared/constants';
import { Topic, ConceptNode, ClassroomConfig, Student } from '../../types';

describe('rootCauseFor Concept Bridge Traversal', () => {
  const sampleTopics: Topic[] = [
    {
      id: 't-c3-frac',
      grade: 'Class 3',
      subject: 'Mathematics',
      name: 'Understanding Fractions',
      status: 'In Progress',
      progress: 45,
      understandingLevel: 45,
      notes: 'Root concept'
    },
    {
      id: 't-c4-frac',
      grade: 'Class 4',
      subject: 'Mathematics',
      name: 'Fractions of a Group',
      status: 'In Progress',
      progress: 50,
      understandingLevel: 50,
      prerequisiteTopicId: 't-c3-frac',
      notes: 'Intermediate'
    },
    {
      id: 't-c5-dec',
      grade: 'Class 5',
      subject: 'Mathematics',
      name: 'Decimals & Fraction Conversion',
      status: 'In Progress',
      progress: 42,
      understandingLevel: 42,
      prerequisiteTopicId: 't-c4-frac',
      notes: 'High-level gap'
    },
    {
      id: 't-c3-add',
      grade: 'Class 3',
      subject: 'Mathematics',
      name: 'Multi-digit Addition',
      status: 'Completed',
      progress: 90,
      understandingLevel: 85
    }
  ];

  it('traces Class 5 Decimals back to Class 3 Understanding Fractions as the deepest weak root', () => {
    const result = rootCauseFor('t-c5-dec', sampleTopics);
    expect(result.rootTopicId).toBe('t-c3-frac');
    expect(result.rootTopicName).toBe('Understanding Fractions');
    expect(result.rootGrade).toBe('Class 3');
    expect(result.understandingLevel).toBe(45);
    expect(result.chain).toContain('Decimals & Fraction Conversion');
    expect(result.chain).toContain('Fractions of a Group');
    expect(result.chain).toContain('Understanding Fractions');
  });

  it('returns the topic itself when there are no prerequisites', () => {
    const result = rootCauseFor('t-c3-frac', sampleTopics);
    expect(result.rootTopicId).toBe('t-c3-frac');
    expect(result.chain).toEqual(['Understanding Fractions']);
  });

  it('safely handles non-existent topic IDs', () => {
    const result = rootCauseFor('non-existent-id', sampleTopics);
    expect(result.rootTopicId).toBe('non-existent-id');
  });

  it('prevents infinite loops in cyclic prerequisites', () => {
    const cyclicTopics: Topic[] = [
      {
        id: 't-a',
        grade: 'Class 3',
        subject: 'Math',
        name: 'Topic A',
        status: 'In Progress',
        progress: 40,
        understandingLevel: 40,
        prerequisiteTopicId: 't-b'
      },
      {
        id: 't-b',
        grade: 'Class 3',
        subject: 'Math',
        name: 'Topic B',
        status: 'In Progress',
        progress: 40,
        understandingLevel: 40,
        prerequisiteTopicId: 't-a'
      }
    ];

    const result = rootCauseFor('t-a', cyclicTopics);
    expect(result.chain.length).toBeLessThanOrEqual(3);
    expect(['t-a', 't-b']).toContain(result.rootTopicId);
  });
});

describe('Planner Time Maths & Gap Inclusion', () => {
  const sampleClassroom: ClassroomConfig = {
    name: 'Test Rural School',
    grades: ['Class 3', 'Class 4', 'Class 5'],
    subjects: ['Mathematics'],
    daysPerWeek: 5,
    hoursPerDay: 3,
    resources: ['Chalk and blackboard', 'Paper', 'Pebbles or stones']
  };

  const sampleTopics: Topic[] = [
    {
      id: 't-c3-frac',
      grade: 'Class 3',
      subject: 'Mathematics',
      name: 'Understanding Fractions',
      status: 'In Progress',
      progress: 45,
      understandingLevel: 45
    }
  ];

  it('allocates daily sessions such that sessions + two 10-minute gaps fit EXACTLY within hoursPerDay * 60', () => {
    const plan = generateWeeklyPlan({
      classroom: sampleClassroom,
      topics: sampleTopics,
      conceptNodes: []
    });

    const mondaySessions = plan.sessions.filter(s => s.day === 'Monday');
    expect(mondaySessions).toHaveLength(3);

    const s1 = mondaySessions[0];
    const s2 = mondaySessions[1];
    const s3 = mondaySessions[2];

    const GAP_DURATION = 10;
    const totalDailyTime = s1.durationMinutes + GAP_DURATION + s2.durationMinutes + GAP_DURATION + s3.durationMinutes;

    expect(totalDailyTime).toBe(sampleClassroom.hoursPerDay * 60); // 180 min
  });

  it('includes gaps in totalPlannedHours so it equals maxAvailableHours without over-allocation', () => {
    const plan = generateWeeklyPlan({
      classroom: sampleClassroom,
      topics: sampleTopics,
      conceptNodes: []
    });

    // 5 days * 3 hours = 15 hours
    expect(plan.maxAvailableHours).toBe(15);
    expect(plan.totalPlannedHours).toBe(15);
    expect(plan.totalPlannedHours).toBeLessThanOrEqual(plan.maxAvailableHours);
  });

  it('correctly sequences session start times with 10-minute transition gaps', () => {
    const plan = generateWeeklyPlan({
      classroom: sampleClassroom,
      topics: sampleTopics,
      conceptNodes: []
    });

    const mondaySessions = plan.sessions.filter(s => s.day === 'Monday');
    expect(mondaySessions[0].startTime).toBe('09:00');

    // S1 starts at 09:00 (duration: 45 min) -> finishes at 09:45
    // Gap 10 min -> S2 starts at 09:55 (duration: 70 min) -> finishes at 11:05
    // Gap 10 min -> S3 starts at 11:15 (duration: 45 min) -> finishes at 12:00
    expect(mondaySessions[1].startTime).toBe('09:55');
    expect(mondaySessions[2].startTime).toBe('11:15');
  });

  it('honours focusGrade when specified in generation options', () => {
    const plan = generateWeeklyPlan({
      classroom: sampleClassroom,
      topics: sampleTopics,
      conceptNodes: [],
      focusGrade: 'Class 4'
    });

    expect(plan.gradesCovered).toEqual(['Class 4']);
    expect(plan.sessions[0].gradesInvolved).toEqual(['Class 4']);
  });
});

describe('Score-to-Flag and Peer Role Logic', () => {
  it('flags student for check-in and assigns Needs Support when average is below WEAK_THRESHOLD (55)', () => {
    const metrics = computeStudentMetrics({
      't1': 50,
      't2': 45,
      't3': 52
    });

    expect(metrics.averageScore).toBe(49);
    expect(metrics.averageScore).toBeLessThan(WEAK_THRESHOLD);
    expect(metrics.needsCheckin).toBe(true);
    expect(metrics.peerRole).toBe('Needs Support');
  });

  it('assigns Peer Mentor when average score >= PEER_MENTOR_THRESHOLD (75) and no scores < 50', () => {
    const metrics = computeStudentMetrics({
      't1': 80,
      't2': 85,
      't3': 78
    });

    expect(metrics.averageScore).toBe(81);
    expect(metrics.averageScore).toBeGreaterThanOrEqual(PEER_MENTOR_THRESHOLD);
    expect(metrics.needsCheckin).toBe(false);
    expect(metrics.peerRole).toBe('Peer Mentor');
  });

  it('flags student for 5-minute check-in if any single topic score is below CHECKIN_SCORE_TRIGGER (50)', () => {
    const metrics = computeStudentMetrics({
      't1': 90,
      't2': 85,
      't3': 40 // isolated deficit
    });

    expect(metrics.averageScore).toBe(72);
    expect(metrics.needsCheckin).toBe(true); // flagged due to t3 < 50
    expect(metrics.peerRole).toBe('Steady Learner');
  });

  it('recalculates topic understanding levels based on student scores in that grade', () => {
    const topics: Topic[] = [
      {
        id: 't-c3-frac',
        grade: 'Class 3',
        subject: 'Math',
        name: 'Fractions',
        status: 'In Progress',
        progress: 40,
        understandingLevel: 40
      }
    ];

    const students: Student[] = [
      {
        id: 's1',
        rollNo: '101',
        name: 'Student 1',
        grade: 'Class 3',
        topicScores: { 't-c3-frac': 70 },
        averageScore: 70,
        needsCheckin: false,
        peerRole: 'Steady Learner',
        attendancePct: 90
      },
      {
        id: 's2',
        rollNo: '102',
        name: 'Student 2',
        grade: 'Class 3',
        topicScores: { 't-c3-frac': 50 },
        averageScore: 50,
        needsCheckin: false,
        peerRole: 'Needs Support',
        attendancePct: 90
      }
    ];

    const updated = recalculateTopicLevels(topics, students);
    // (70 + 50) / 2 = 60
    expect(updated[0].understandingLevel).toBe(60);
  });
});

