import { ClassroomConfig, Topic, ConceptNode, Activity, WeeklyPlan, UserSettings, Student } from '../types';
import { computeStudentMetrics, recalculateTopicLevels } from '../shared/scoring';
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
  STUDENTS: 'ruralclass_students_list',
  OFFLINE_QUEUE: 'ruralclass_offline_write_queue',
  IS_OFFLINE: 'ruralclass_is_offline'
};

interface QueuedWrite {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  timestamp: string;
}

function safeGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
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
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('ruralclass_storage_change'));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

// In-Memory Cache populated synchronously from localStorage or initialData
const cache = {
  classroom: safeGet<ClassroomConfig>(KEYS.CLASSROOM, INITIAL_CLASSROOM),
  topics: safeGet<Topic[]>(KEYS.TOPICS, INITIAL_TOPICS),
  conceptNodes: safeGet<ConceptNode[]>(KEYS.CONCEPT_NODES, INITIAL_CONCEPT_NODES),
  activities: safeGet<Activity[]>(KEYS.ACTIVITIES, INITIAL_ACTIVITIES),
  activePlan: safeGet<WeeklyPlan>(KEYS.WEEKLY_PLAN, INITIAL_WEEKLY_PLAN),
  savedPlans: safeGet<WeeklyPlan[]>(KEYS.SAVED_PLANS, [INITIAL_WEEKLY_PLAN]),
  settings: safeGet<UserSettings>(KEYS.SETTINGS, INITIAL_USER_SETTINGS),
  students: safeGet<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS),
  isOffline: safeGet<boolean>(KEYS.IS_OFFLINE, false),
  isInitialized: false
};

// Queue write for offline retry
function queueWrite(endpoint: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: any): void {
  const queue = safeGet<QueuedWrite[]>(KEYS.OFFLINE_QUEUE, []);
  queue.push({
    id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    endpoint,
    method,
    body,
    timestamp: new Date().toISOString()
  });
  safeSet(KEYS.OFFLINE_QUEUE, queue);
}

// Async Write-through to REST API with offline retry queue
async function writeThrough(endpoint: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: any): Promise<void> {
  try {
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    if (cache.isOffline) {
      cache.isOffline = false;
      safeSet(KEYS.IS_OFFLINE, false);
      window.dispatchEvent(new Event('ruralclass_network_status_change'));
    }

    // Flush any pending queue
    flushOfflineQueue().catch(() => {});
  } catch (err) {
    console.warn(`Write-through failed for ${method} ${endpoint}, queued for offline sync:`, err);
    cache.isOffline = true;
    safeSet(KEYS.IS_OFFLINE, true);
    window.dispatchEvent(new Event('ruralclass_network_status_change'));
    queueWrite(endpoint, method, body);
  }
}

// Flush pending offline writes
async function flushOfflineQueue(): Promise<void> {
  const queue = safeGet<QueuedWrite[]>(KEYS.OFFLINE_QUEUE, []);
  if (queue.length === 0) return;

  const remaining: QueuedWrite[] = [];

  for (const item of queue) {
    try {
      const res = await fetch(item.endpoint, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: item.body ? JSON.stringify(item.body) : undefined
      });
      if (!res.ok) {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  safeSet(KEYS.OFFLINE_QUEUE, remaining);
}

// Listen to browser online event
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    cache.isOffline = false;
    safeSet(KEYS.IS_OFFLINE, false);
    window.dispatchEvent(new Event('ruralclass_network_status_change'));
    Storage.syncWithServer().catch(() => {});
  });

  window.addEventListener('offline', () => {
    cache.isOffline = true;
    safeSet(KEYS.IS_OFFLINE, true);
    window.dispatchEvent(new Event('ruralclass_network_status_change'));
  });
}

export const Storage = {
  /**
   * Initializes data on app startup by fetching from REST API.
   * If server is unreachable, seamlessly falls back to cached localStorage copy.
   */
  initialize: async (): Promise<{ offline: boolean }> => {
    try {
      const results = await Promise.allSettled([
        fetch('/api/classroom').then(r => r.json()),
        fetch('/api/topics').then(r => r.json()),
        fetch('/api/students').then(r => r.json()),
        fetch('/api/concept-nodes').then(r => r.json()),
        fetch('/api/activities').then(r => r.json()),
        fetch('/api/plans/active').then(r => r.json()),
        fetch('/api/plans/saved').then(r => r.json()),
        fetch('/api/settings').then(r => r.json())
      ]);

      const isServerAccessible = results.some(r => r.status === 'fulfilled');

      if (isServerAccessible) {
        if (results[0].status === 'fulfilled' && results[0].value?.name) {
          cache.classroom = results[0].value;
          safeSet(KEYS.CLASSROOM, cache.classroom);
        }
        if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) {
          cache.topics = results[1].value;
          safeSet(KEYS.TOPICS, cache.topics);
        }
        if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) {
          cache.students = results[2].value;
          safeSet(KEYS.STUDENTS, cache.students);
        }
        if (results[3].status === 'fulfilled' && Array.isArray(results[3].value)) {
          cache.conceptNodes = results[3].value;
          safeSet(KEYS.CONCEPT_NODES, cache.conceptNodes);
        }
        if (results[4].status === 'fulfilled' && Array.isArray(results[4].value)) {
          cache.activities = results[4].value;
          safeSet(KEYS.ACTIVITIES, cache.activities);
        }
        if (results[5].status === 'fulfilled' && results[5].value?.sessions) {
          cache.activePlan = results[5].value;
          safeSet(KEYS.WEEKLY_PLAN, cache.activePlan);
        }
        if (results[6].status === 'fulfilled' && Array.isArray(results[6].value)) {
          cache.savedPlans = results[6].value;
          safeSet(KEYS.SAVED_PLANS, cache.savedPlans);
        }
        if (results[7].status === 'fulfilled' && results[7].value?.teacherName) {
          cache.settings = results[7].value;
          safeSet(KEYS.SETTINGS, cache.settings);
        }

        cache.isOffline = false;
        safeSet(KEYS.IS_OFFLINE, false);
        flushOfflineQueue().catch(() => {});
      } else {
        cache.isOffline = true;
        safeSet(KEYS.IS_OFFLINE, true);
      }
    } catch {
      cache.isOffline = true;
      safeSet(KEYS.IS_OFFLINE, true);
    } finally {
      cache.isInitialized = true;
      window.dispatchEvent(new Event('ruralclass_storage_change'));
      window.dispatchEvent(new Event('ruralclass_network_status_change'));
    }

    return { offline: cache.isOffline };
  },

  syncWithServer: async (): Promise<void> => {
    await Storage.initialize();
  },

  isOffline: (): boolean => cache.isOffline,
  isInitialized: (): boolean => cache.isInitialized,

  // Synchronous Getters (read from in-memory cache)
  getClassroom: (): ClassroomConfig => cache.classroom,
  saveClassroom: (cfg: ClassroomConfig): void => {
    cache.classroom = cfg;
    safeSet(KEYS.CLASSROOM, cfg);
    writeThrough('/api/classroom', 'PUT', cfg);
  },

  getTopics: (): Topic[] => cache.topics,
  saveTopics: (topics: Topic[]): void => {
    cache.topics = topics;
    safeSet(KEYS.TOPICS, topics);
    // Write-through individual changes or bulk
    for (const t of topics) {
      writeThrough(`/api/topics/${t.id}`, 'PUT', t);
    }
  },

  getStudents: (): Student[] => cache.students,
  saveStudents: (students: Student[]): void => {
    cache.students = students;
    safeSet(KEYS.STUDENTS, students);
    // Recalculate local topic understanding levels immediately
    Storage.recalculateTopicAverages(students);
    for (const s of students) {
      writeThrough(`/api/students/${s.id}`, 'PUT', s);
    }
  },

  updateStudentScore: (studentId: string, topicId: string, newScore: number): void => {
    // 1. Synchronously update in-memory cache
    const updated = cache.students.map(s => {
      if (s.id !== studentId) return s;
      const updatedScores = { ...s.topicScores, [topicId]: newScore };
      const metrics = computeStudentMetrics(updatedScores);

      return {
        ...s,
        topicScores: updatedScores,
        averageScore: metrics.averageScore,
        needsCheckin: metrics.needsCheckin,
        peerRole: metrics.peerRole,
        lastAssessmentDate: new Date().toISOString().split('T')[0]
      };
    });

    cache.students = updated;
    safeSet(KEYS.STUDENTS, updated);
    Storage.recalculateTopicAverages(updated);

    // 2. Write-through to server PATCH /api/students/:id/scores (which recomputes on server as source of truth)
    writeThrough(`/api/students/${studentId}/scores`, 'PATCH', { topicId, score: newScore });
  },

  recalculateTopicAverages: (students: Student[]): void => {
    const updatedTopics = recalculateTopicLevels(cache.topics, students);
    cache.topics = updatedTopics;
    safeSet(KEYS.TOPICS, updatedTopics);
  },

  getConceptNodes: (): ConceptNode[] => cache.conceptNodes,
  saveConceptNodes: (nodes: ConceptNode[]): void => {
    cache.conceptNodes = nodes;
    safeSet(KEYS.CONCEPT_NODES, nodes);
    for (const n of nodes) {
      writeThrough(`/api/concept-nodes/${n.id}`, 'PUT', n);
    }
  },

  getActivities: (): Activity[] => cache.activities,
  saveActivities: (acts: Activity[]): void => {
    cache.activities = acts;
    safeSet(KEYS.ACTIVITIES, acts);
    for (const a of acts) {
      writeThrough(`/api/activities/${a.id}`, 'PUT', a);
    }
  },

  getActivePlan: (): WeeklyPlan => cache.activePlan,
  saveActivePlan: (plan: WeeklyPlan): void => {
    cache.activePlan = plan;
    safeSet(KEYS.WEEKLY_PLAN, plan);
    writeThrough('/api/plans/active', 'PUT', plan);
  },

  getSavedPlans: (): WeeklyPlan[] => cache.savedPlans,
  saveSavedPlans: (plans: WeeklyPlan[]): void => {
    cache.savedPlans = plans;
    safeSet(KEYS.SAVED_PLANS, plans);
    for (const p of plans) {
      writeThrough('/api/plans/saved', 'POST', p);
    }
  },

  getSettings: (): UserSettings => cache.settings,
  saveSettings: (settings: UserSettings): void => {
    cache.settings = settings;
    safeSet(KEYS.SETTINGS, settings);
    writeThrough('/api/settings', 'PUT', settings);
  },

  commitImport: async (mode: 'merge' | 'replace', rows: any[], filename: string): Promise<{ success: boolean; count: number; jobId: string }> => {
    const res = await fetch('/api/import/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, rows, filename })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error?.message || 'Failed to commit import');
    }
    const data = await res.json();
    await Storage.initialize();
    return data;
  },

  undoImport: async (): Promise<{ success: boolean; restoredCount: number; filename: string }> => {
    const res = await fetch('/api/import/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error?.message || 'Failed to undo import');
    }
    const data = await res.json();
    await Storage.initialize();
    return data;
  },

  resetToDefaults: async (): Promise<void> => {
    cache.classroom = INITIAL_CLASSROOM;
    cache.topics = INITIAL_TOPICS;
    cache.students = INITIAL_STUDENTS;
    cache.conceptNodes = INITIAL_CONCEPT_NODES;
    cache.activities = INITIAL_ACTIVITIES;
    cache.activePlan = INITIAL_WEEKLY_PLAN;
    cache.savedPlans = [INITIAL_WEEKLY_PLAN];
    cache.settings = INITIAL_USER_SETTINGS;

    safeSet(KEYS.CLASSROOM, INITIAL_CLASSROOM);
    safeSet(KEYS.TOPICS, INITIAL_TOPICS);
    safeSet(KEYS.STUDENTS, INITIAL_STUDENTS);
    safeSet(KEYS.CONCEPT_NODES, INITIAL_CONCEPT_NODES);
    safeSet(KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    safeSet(KEYS.WEEKLY_PLAN, INITIAL_WEEKLY_PLAN);
    safeSet(KEYS.SAVED_PLANS, [INITIAL_WEEKLY_PLAN]);
    safeSet(KEYS.SETTINGS, INITIAL_USER_SETTINGS);
    safeSet(KEYS.OFFLINE_QUEUE, []);

    window.dispatchEvent(new Event('ruralclass_storage_change'));

    try {
      await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true })
      });
    } catch (err) {
      console.warn('Failed to call server reset, local cache reset completed:', err);
    }
  }
};
