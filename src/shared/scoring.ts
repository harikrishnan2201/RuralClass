import { WEAK_THRESHOLD, PEER_MENTOR_THRESHOLD, CHECKIN_SCORE_TRIGGER } from './constants';
import { Student, Topic } from '../types';

export interface ScoreRecalculationResult {
  averageScore: number;
  needsCheckin: boolean;
  peerRole: 'Needs Support' | 'Steady Learner' | 'Peer Mentor';
}

/**
 * Computes student score metrics based on topic scores.
 */
export function computeStudentMetrics(topicScores: Record<string, number>): ScoreRecalculationResult {
  const scores = Object.values(topicScores);
  if (scores.length === 0) {
    return {
      averageScore: 0,
      needsCheckin: false,
      peerRole: 'Steady Learner'
    };
  }

  const sum = scores.reduce((acc, curr) => acc + curr, 0);
  const averageScore = Math.round(sum / scores.length);
  const needsCheckin = scores.some(score => score < CHECKIN_SCORE_TRIGGER) || averageScore < WEAK_THRESHOLD;

  let peerRole: 'Needs Support' | 'Steady Learner' | 'Peer Mentor' = 'Steady Learner';
  if (averageScore < WEAK_THRESHOLD) {
    peerRole = 'Needs Support';
  } else if (averageScore >= PEER_MENTOR_THRESHOLD) {
    peerRole = 'Peer Mentor';
  }

  return {
    averageScore,
    needsCheckin,
    peerRole
  };
}

/**
 * Recalculates topic understanding levels based on student scores in that topic's grade.
 */
export function recalculateTopicLevels(topics: Topic[], students: Student[]): Topic[] {
  return topics.map(topic => {
    const gradeStudents = students.filter(s => s.grade === topic.grade && s.topicScores[topic.id] !== undefined);
    if (gradeStudents.length === 0) {
      return topic;
    }

    const sum = gradeStudents.reduce((acc, s) => acc + s.topicScores[topic.id], 0);
    const newAverage = Math.round(sum / gradeStudents.length);

    return {
      ...topic,
      understandingLevel: newAverage,
      progress: Math.min(100, Math.max(topic.progress, newAverage))
    };
  });
}

