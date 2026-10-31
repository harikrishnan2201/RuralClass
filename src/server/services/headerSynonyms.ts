/**
 * Trilingual column header synonyms matching English, Tamil, and Hindi.
 */

export interface CanonicalMapping {
  rollNumber?: string;
  studentName?: string;
  grade?: string;
  topic?: string;
  score?: string;
  topicColumns?: Record<string, string>; // topicId -> matched header
}

const ROLL_SYNONYMS = [
  'roll', 'roll_no', 'rollno', 'roll_number', 'roll number', 'id', 'student_id',
  'வரிசை எண்', 'பதிவு எண்', 'எண்', 'ரோல் எண்',
  'क्रमांक', 'रोल नंबर', 'अनुक्रमांक', 'आईडी'
];

const NAME_SYNONYMS = [
  'name', 'student', 'student_name', 'student name', 'full_name',
  'பெயர்', 'மாணவர் பெயர்', 'மாணவர்',
  'नाम', 'विद्यार्थी का नाम', 'छात्र का नाम', 'विद्यार्थी', 'छात्र'
];

const GRADE_SYNONYMS = [
  'grade', 'class', 'standard', 'std',
  'வகுப்பு', 'பிரிவு', 'தரம்',
  'कक्षा', 'वर्ग', 'श्रेणी'
];

const TOPIC_SYNONYMS = [
  'topic', 'subject', 'skill', 'concept',
  'பாடம்', 'தலைப்பு', 'கருத்து',
  'विषय', 'टॉपिक', 'संकल्पना', 'अवधारणा'
];

const SCORE_SYNONYMS = [
  'score', 'marks', 'mark', 'percentage', 'points',
  'மதிப்பெண்', 'அங்கங்கள்', 'மதிப்பீடு',
  'अंक', 'मार्क्स', 'प्राप्तांक', 'प्रतिशत'
];

function normalize(str: string): string {
  return str.toLowerCase().replace(/[\s_\-#]+/g, ' ').trim();
}

export function matchHeaderToCanonical(header: string): 'rollNumber' | 'studentName' | 'grade' | 'topic' | 'score' | null {
  const norm = normalize(header);

  if (ROLL_SYNONYMS.some(syn => normalize(syn) === norm || norm.startsWith(normalize(syn)))) {
    return 'rollNumber';
  }
  if (NAME_SYNONYMS.some(syn => normalize(syn) === norm)) {
    return 'studentName';
  }
  if (GRADE_SYNONYMS.some(syn => normalize(syn) === norm)) {
    return 'grade';
  }
  if (TOPIC_SYNONYMS.some(syn => normalize(syn) === norm)) {
    return 'topic';
  }
  if (SCORE_SYNONYMS.some(syn => normalize(syn) === norm)) {
    return 'score';
  }

  return null;
}

export interface TopicReference {
  id: string;
  name: string;
  grade?: string;
}

/**
 * Detects mapping between column headers and existing topics in database.
 */
export function matchHeadersToTopics(
  headers: string[],
  availableTopics: TopicReference[]
): Record<string, string> {
  const matched: Record<string, string> = {}; // topicId -> header

  for (const header of headers) {
    const norm = normalize(header);
    // Find matching topic
    for (const t of availableTopics) {
      const topicNorm = normalize(t.name);
      if (norm === topicNorm || norm.includes(topicNorm) || topicNorm.includes(norm)) {
        if (!matched[t.id]) {
          matched[t.id] = header;
          break;
        }
      }
    }
  }

  return matched;
}
