export type GradeLevel = 'Class 3' | 'Class 4' | 'Class 5' | string;

export interface Topic {
  id: string;
  grade: GradeLevel;
  subject: string;
  name: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number; // 0 to 100
  understandingLevel: number; // 0 to 100
  prerequisiteTopicId?: string;
  prerequisiteTopicName?: string;
  notes?: string;
  reviewed?: boolean;
}

export interface ClassroomConfig {
  name: string;
  grades: string[];
  subjects: string[];
  daysPerWeek: number;
  hoursPerDay: number;
  resources: string[];
}

export interface ConceptNode {
  id: string;
  grade: string;
  name: string;
  subject: string;
  understandingLevel: number;
  status: 'Needs Attention' | 'Developing' | 'Strong';
  category: 'Foundation' | 'Application' | 'Synthesis';
  description: string;
  rootCauseContext: string;
  suggestedAction: string;
  prerequisites: string[]; // parent concept IDs
  nextConcepts: string[]; // downstream concept IDs
  x: number;
  y: number;
}

export interface ActivityAdaptation {
  grade: string;
  instruction: string;
}

export interface Activity {
  id: string;
  title: string;
  subject: string;
  grades: string[];
  objective: string;
  durationMinutes: number;
  requiredMaterials: string[];
  steps: string[];
  adaptations: ActivityAdaptation[];
  category: 'Hands-on' | 'Peer Learning' | 'Visual Model' | 'Formative Check';
}

export interface GradeTask {
  grade: string;
  task: string;
}

export interface LessonSession {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  durationMinutes: number;
  title: string;
  topicId?: string;
  sessionType: 'Shared Lesson' | 'Grade-Specific Stations' | 'Peer Learning' | 'Formative Check & Review';
  gradesInvolved: string[];
  sharedObjective: string;
  gradeTasks: GradeTask[];
  resources: string[];
  teachingNotes: string;
}

export interface WeeklyPlan {
  id: string;
  name: string;
  weekLabel: string;
  classroomName: string;
  gradesCovered: string[];
  sessions: LessonSession[];
  status: 'Draft' | 'Approved';
  approvedDate?: string;
  lastUpdated: string;
  totalPlannedHours: number;
  maxAvailableHours: number;
  notes?: string;
}

export interface UserSettings {
  teacherName: string;
  classroomName: string;
  preferredLanguage: string;
  timeFormat: '12-hour' | '24-hour';
  defaultHoursPerDay: number;
  enableTips: boolean;
  shareStudentNamesWithAI?: boolean;
}

export interface AiChatResponse {
  reply: string;
  source: 'ai' | 'fallback';
  reason?: 'no_api_key' | 'api_error' | 'invalid_json';
}

export interface StudentTopicScore {
  topicId: string;
  topicName: string;
  score: number;
}

export interface PersonalizedPlan {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  generatedAt: string;
  diagnosedRootGap: string;
  targetTopic: string;
  checkinActivity: {
    title: string;
    durationMinutes: number; // e.g. 5 min check-in
    instruction: string;
    materials: string[];
  };
  independentStationTask: string;
  suggestedPeerBuddy: {
    studentId?: string;
    name: string;
    grade: string;
    guidance: string;
  };
  teacherTip: string;
  status: 'Generated' | 'Approved';
  source?: 'ai' | 'fallback';
  reason?: 'no_api_key' | 'api_error' | 'invalid_json';
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  grade: string;
  section?: string;
  topicScores: Record<string, number>; // topicId -> score (0-100)
  averageScore: number;
  needsCheckin: boolean; // Flagged for 5-minute check-in
  peerRole: 'Needs Support' | 'Steady Learner' | 'Peer Mentor';
  pairedStudentId?: string;
  pairedStudentName?: string;
  notes?: string;
  attendancePct: number;
  lastAssessmentDate?: string;
  personalizedPlan?: PersonalizedPlan;
}

declare module 'mammoth' {
  export function extractRawText(options: { buffer: Buffer }): Promise<{ value: string; messages: any[] }>;
}

