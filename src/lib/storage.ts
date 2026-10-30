import { ClassroomConfig, Topic, ConceptNode, Activity, WeeklyPlan, UserSettings, Student } from '../types';
import {
  INITIAL_CLASSROOM,
  INITIAL_TOPICS,
  INITIAL_CONCEPT_NODES,
  INITIAL_ACTIVITIES,
  INITIAL_WEEKLY_PLAN,
  INITIAL_USER_SETTINGS,
  INITIAL_STUDENTS
} from '../data/initialData';

const KEYS = {
  CLASSROOM: 'ruralclass_classroom_config',
  TOPICS: 'ruralclass_topics_list',
  CONCEPT_NODES: 'ruralclass_concept_nodes',
  ACTIVITIES: 'ruralclass_activities_list',
  WEEKLY_PLAN: 'ruralclass_current_weekly_plan',
  SAVED_PLANS: 'ruralclass_saved_plans_list',
  SETTINGS: 'ruralclass_user_settings',
  STUDENTS: 'ruralclass_students_list'
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Dispatch a custom storage event so other components in the same window can react
    window.dispatchEvent(new Event('ruralclass_storage_change'));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

export const Storage = {
  getClassroom: (): ClassroomConfig => {
    const cfg = safeGet<ClassroomConfig>(KEYS.CLASSROOM, INITIAL_CLASSROOM);
    return {
      name: cfg?.name || INITIAL_CLASSROOM.name,
      grades: Array.isArray(cfg?.grades) && cfg.grades.length > 0 ? cfg.grades : INITIAL_CLASSROOM.grades,
      subjects: Array.isArray(cfg?.subjects) && cfg.subjects.length > 0 ? cfg.subjects : INITIAL_CLASSROOM.subjects,
      daysPerWeek: typeof cfg?.daysPerWeek === 'number' && cfg.daysPerWeek > 0 ? cfg.daysPerWeek : INITIAL_CLASSROOM.daysPerWeek,
      hoursPerDay: typeof cfg?.hoursPerDay === 'number' && cfg.hoursPerDay > 0 ? cfg.hoursPerDay : INITIAL_CLASSROOM.hoursPerDay,
      resources: Array.isArray(cfg?.resources) && cfg.resources.length > 0 ? cfg.resources : INITIAL_CLASSROOM.resources,
    };
  },
  saveClassroom: (cfg: ClassroomConfig) => safeSet(KEYS.CLASSROOM, cfg),

  getTopics: (): Topic[] => {
    const list = safeGet<Topic[]>(KEYS.TOPICS, INITIAL_TOPICS);
    return Array.isArray(list) && list.length > 0 ? list : INITIAL_TOPICS;
  },
  saveTopics: (topics: Topic[]) => safeSet(KEYS.TOPICS, topics),

  getStudents: (): Student[] => {
    const list = safeGet<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
    return Array.isArray(list) && list.length > 0 ? list : INITIAL_STUDENTS;
  },
  saveStudents: (students: Student[]) => {
    safeSet(KEYS.STUDENTS, students);
    // Automatically recompute topic understanding levels from student marks!
    Storage.recalculateTopicAverages(students);
  },

  updateStudentScore: (studentId: string, topicId: string, newScore: number) => {
    const students = Storage.getStudents();
    const updated = students.map(s => {
      if (s.id !== studentId) return s;
      const updatedScores = { ...s.topicScores, [topicId]: newScore };
      const values = Object.values(updatedScores);
      const avg = Math.round(values.reduce((a, b) => a + b, 0) / (values.length || 1));
      const needsCheckin = Object.values(updatedScores).some(sc => sc < 50);
      const peerRole: 'Needs Support' | 'Steady Learner' | 'Peer Mentor' =
        avg < 55 ? 'Needs Support' : avg >= 75 ? 'Peer Mentor' : 'Steady Learner';

      return {
        ...s,
        topicScores: updatedScores,
        averageScore: avg,
        needsCheckin,
        peerRole,
        lastAssessmentDate: new Date().toISOString().split('T')[0]
      };
    });
    Storage.saveStudents(updated);
  },

  recalculateTopicAverages: (students: Student[]) => {
    const topics = Storage.getTopics();
    const updatedTopics = topics.map(t => {
      // Find all students in this topic's grade who have a score for this topic
      const gradeStudents = students.filter(s => s.grade === t.grade && s.topicScores[t.id] !== undefined);
      if (gradeStudents.length === 0) return t;

      const sum = gradeStudents.reduce((acc, s) => acc + s.topicScores[t.id], 0);
      const newAverage = Math.round(sum / gradeStudents.length);
      return {
        ...t,
        understandingLevel: newAverage,
        progress: Math.min(100, Math.max(t.progress, newAverage))
      };
    });
    safeSet(KEYS.TOPICS, updatedTopics);
  },

  getConceptNodes: (): ConceptNode[] => safeGet(KEYS.CONCEPT_NODES, INITIAL_CONCEPT_NODES),
  saveConceptNodes: (nodes: ConceptNode[]) => safeSet(KEYS.CONCEPT_NODES, nodes),

  getActivities: (): Activity[] => safeGet(KEYS.ACTIVITIES, INITIAL_ACTIVITIES),
  saveActivities: (acts: Activity[]) => safeSet(KEYS.ACTIVITIES, acts),

  getActivePlan: (): WeeklyPlan => {
    const plan = safeGet<WeeklyPlan>(KEYS.WEEKLY_PLAN, INITIAL_WEEKLY_PLAN);
    return {
      ...INITIAL_WEEKLY_PLAN,
      ...plan,
      sessions: Array.isArray(plan?.sessions) && plan.sessions.length > 0 ? plan.sessions : INITIAL_WEEKLY_PLAN.sessions,
      gradesCovered: Array.isArray(plan?.gradesCovered) && plan.gradesCovered.length > 0 ? plan.gradesCovered : INITIAL_WEEKLY_PLAN.gradesCovered,
    };
  },
  saveActivePlan: (plan: WeeklyPlan) => safeSet(KEYS.WEEKLY_PLAN, plan),

  getSavedPlans: (): WeeklyPlan[] => {
    const plans = safeGet<WeeklyPlan[]>(KEYS.SAVED_PLANS, [INITIAL_WEEKLY_PLAN]);
    return Array.isArray(plans) && plans.length > 0 ? plans : [INITIAL_WEEKLY_PLAN];
  },
  saveSavedPlans: (plans: WeeklyPlan[]) => safeSet(KEYS.SAVED_PLANS, plans),

  getSettings: (): UserSettings => safeGet(KEYS.SETTINGS, INITIAL_USER_SETTINGS),
  saveSettings: (settings: UserSettings) => safeSet(KEYS.SETTINGS, settings),

  resetToDefaults: () => {
    safeSet(KEYS.CLASSROOM, INITIAL_CLASSROOM);
    safeSet(KEYS.TOPICS, INITIAL_TOPICS);
    safeSet(KEYS.STUDENTS, INITIAL_STUDENTS);
    safeSet(KEYS.CONCEPT_NODES, INITIAL_CONCEPT_NODES);
    safeSet(KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    safeSet(KEYS.WEEKLY_PLAN, INITIAL_WEEKLY_PLAN);
    safeSet(KEYS.SAVED_PLANS, [INITIAL_WEEKLY_PLAN]);
    safeSet(KEYS.SETTINGS, INITIAL_USER_SETTINGS);
    window.dispatchEvent(new Event('ruralclass_storage_change'));
  }
};

