/**
 * Shared constants across client and server
 */

// Diagnostic threshold for flagging weak topics and student check-ins
export const WEAK_THRESHOLD = 55;

// Peer mentorship threshold: students with an average >= 75% can serve as peer mentors
export const PEER_MENTOR_THRESHOLD = 75;

// Check-in mark trigger: any individual topic score below this triggers a 5-minute teacher check-in
export const CHECKIN_SCORE_TRIGGER = 50;

// Classroom standard grades
export const DEFAULT_GRADES = ['Class 3', 'Class 4', 'Class 5'];

