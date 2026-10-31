import { z } from 'zod';

export const ClassroomConfigSchema = z.object({
  name: z.string().min(1, 'Classroom name is required'),
  grades: z.array(z.string()).min(1, 'At least one grade is required'),
  subjects: z.array(z.string()).min(1, 'At least one subject is required'),
  daysPerWeek: z.number().int().min(1).max(7),
  hoursPerDay: z.number().int().min(1).max(12),
  resources: z.array(z.string())
});

export const UserSettingsSchema = z.object({
  teacherName: z.string().optional(),
  classroomName: z.string().optional(),
  preferredLanguage: z.string().optional(),
  timeFormat: z.enum(['12-hour', '24-hour']).optional(),
  defaultHoursPerDay: z.number().int().min(1).max(12).optional(),
  enableTips: z.boolean().optional(),
  shareStudentNamesWithAI: z.boolean().optional()
});

export const TopicSchema = z.object({
  id: z.string().min(1).optional(),
  grade: z.string().min(1, 'Grade is required'),
  subject: z.string().min(1, 'Subject is required'),
  name: z.string().min(1, 'Topic name is required'),
  status: z.enum(['Not Started', 'In Progress', 'Completed']).default('In Progress'),
  progress: z.number().min(0).max(100).default(0),
  understandingLevel: z.number().min(0).max(100).default(50),
  prerequisiteTopicId: z.string().optional(),
  prerequisiteTopicName: z.string().optional(),
  notes: z.string().optional(),
  reviewed: z.boolean().optional()
});

export const StudentSchema = z.object({
  id: z.string().min(1).optional(),
  rollNo: z.string().min(1, 'Roll number is required'),
  name: z.string().min(1, 'Student name is required'),
  grade: z.string().min(1, 'Grade is required'),
  section: z.string().optional(),
  topicScores: z.record(z.string(), z.number().min(0).max(100)).optional(),
  notes: z.string().optional(),
  attendancePct: z.number().min(0).max(100).default(90),
  pairedStudentId: z.string().optional(),
  pairedStudentName: z.string().optional(),
  lastAssessmentDate: z.string().optional()
});

export const UpdateScoreSchema = z.object({
  topicId: z.string().min(1, 'Topic ID is required'),
  score: z.number().min(0).max(100, 'Score must be between 0 and 100')
});

export const ConceptNodeSchema = z.object({
  id: z.string().min(1).optional(),
  grade: z.string().min(1),
  name: z.string().min(1),
  subject: z.string().min(1),
  understandingLevel: z.number().min(0).max(100),
  status: z.enum(['Needs Attention', 'Developing', 'Strong']),
  category: z.enum(['Foundation', 'Application', 'Synthesis']),
  description: z.string(),
  rootCauseContext: z.string(),
  suggestedAction: z.string(),
  prerequisites: z.array(z.string()).default([]),
  nextConcepts: z.array(z.string()).default([]),
  x: z.number(),
  y: z.number()
});

export const ActivitySchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1),
  subject: z.string().min(1),
  grades: z.array(z.string()),
  objective: z.string().min(1),
  durationMinutes: z.number().min(1),
  requiredMaterials: z.array(z.string()),
  steps: z.array(z.string()),
  adaptations: z.array(z.object({
    grade: z.string(),
    instruction: z.string()
  })),
  category: z.enum(['Hands-on', 'Peer Learning', 'Visual Model', 'Formative Check'])
});

export const WeeklyPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  weekLabel: z.string().min(1),
  classroomName: z.string().min(1),
  gradesCovered: z.array(z.string()),
  sessions: z.array(z.any()),
  status: z.enum(['Draft', 'Approved']),
  approvedDate: z.string().optional(),
  lastUpdated: z.string(),
  totalPlannedHours: z.number(),
  maxAvailableHours: z.number(),
  notes: z.string().optional()
});

export const GeneratePlanOptionsSchema = z.object({
  totalWeeklyHours: z.number().optional(),
  focusTopicId: z.string().optional(),
  focusGrade: z.string().optional(),
  planName: z.string().optional()
});

export const ResetSchema = z.object({
  confirm: z.literal(true, {
    message: 'Body must include confirm: true to reset data'
  })
});

export const LoginSchema = z.object({
  passcode: z.string().min(1, 'Passcode is required')
});
