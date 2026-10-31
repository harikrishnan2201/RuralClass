/**
 * Schema-driven Import Registry for RuralClass.
 * Defining a new data type = adding a registry entry, not rewriting pipeline code.
 */

export interface RegistryField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'record' | 'array';
  required: boolean;
  validator?: (val: any) => true | string;
  synonyms: {
    en: string[];
    ta: string[];
    hi: string[];
  };
}

export interface EntityDefinition<T = any> {
  key: 'students' | 'attendance' | 'timetable' | 'classroom' | 'topics' | 'activities';
  i18nLabelKey: string;
  fields: RegistryField[];
  identityKey: (row: T) => string;
  groupingFields: string[];
  description: string;
}

/**
 * Normalizes Tamil and Devanagari numerals to standard ASCII digits.
 */
export function normalizeIndicDigits(str: string): string {
  if (!str) return '';
  const indicDigitMap: Record<string, string> = {
    // Tamil numerals
    '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4',
    '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9',
    // Devanagari numerals
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };

  return str.replace(/[௦-௯०-९]/g, (char) => indicDigitMap[char] || char);
}

/**
 * Normalizes marks and fractional scores into 0-100 percentage.
 * e.g. "7/10" -> 70, "45/50" -> 90, "85%" -> 85
 */
export function normalizeScore(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const str = normalizeIndicDigits(String(val)).trim().replace(/%/g, '');

  // Check fraction format like "7/10" or "45/50"
  const fractionMatch = str.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fractionMatch) {
    const num = parseFloat(fractionMatch[1]);
    const denom = parseFloat(fractionMatch[2]);
    if (denom > 0) {
      return Math.round(Math.min(100, Math.max(0, (num / denom) * 100)));
    }
  }

  const parsed = Number(str);
  if (!isNaN(parsed) && isFinite(parsed)) {
    return Math.round(Math.min(100, Math.max(0, parsed)));
  }

  return null;
}

/**
 * Extracts grade and section from headings, sheet names, or column labels.
 * e.g. "Class 4 - Section A", "4B", "பிரிவு B", "सेक्शन ए"
 */
export function extractGradeAndSection(text: string): { grade?: string; section?: string } {
  if (!text) return {};
  const norm = normalizeIndicDigits(text);

  let grade: string | undefined;
  let section: string | undefined;

  // Grade match: 3, 4, 5
  const gradeMatch = norm.match(/(?:Class|Grade|வகுப்பு|கற்றல்|कक्षा|std|standard)?\s*([345])/i);
  if (gradeMatch) {
    grade = `Class ${gradeMatch[1]}`;
  }

  // Section match: Section A, Sec B, பிரிவு A, பிரிவு B, सेक्शन ए, 4A, 4B
  const secMatch = norm.match(/(?:Section|Sec|பிரிவு|सेक्शन|वर्ग)?\s*([A-Da-dஅ-இए-घ])/i);
  if (secMatch) {
    let raw = secMatch[1].toUpperCase();
    if (raw === 'அ' || raw === 'ए') raw = 'A';
    else if (raw === 'ஆ' || raw === 'बी') raw = 'B';
    else if (raw === 'இ' || raw === 'सी') raw = 'C';
    section = raw;
  }

  // Shorthand e.g. "4A", "3B", "5C"
  const shortMatch = norm.match(/([345])\s*([A-D])/i);
  if (shortMatch) {
    grade = `Class ${shortMatch[1]}`;
    section = shortMatch[2].toUpperCase();
  }

  return { grade, section };
}

export const IMPORT_REGISTRY: Record<string, EntityDefinition> = {
  students: {
    key: 'students',
    i18nLabelKey: 'import.entities.students',
    description: 'Student assessment roster with roll numbers, grades, sections, and topic mastery scores.',
    identityKey: (row: any) => `${row.grade || 'Class 3'}_${row.section || ''}_${row.rollNumber || row.rollNo || row.name}`,
    groupingFields: ['grade', 'section'],
    fields: [
      {
        key: 'rollNumber',
        type: 'string',
        required: true,
        validator: (v) => (v && String(v).trim().length > 0 ? true : 'Roll number is required'),
        synonyms: {
          en: ['roll', 'roll_no', 'rollno', 'roll number', 'id', 'student id', 'reg no'],
          ta: ['வரிசை எண்', 'பதிவு எண்', 'எண்', 'ரோல் எண்'],
          hi: ['क्रमांक', 'रोल नंबर', 'अनुक्रमांक', 'आईडी']
        }
      },
      {
        key: 'name',
        type: 'string',
        required: true,
        validator: (v) => (v && String(v).trim().length > 0 ? true : 'Student name is required'),
        synonyms: {
          en: ['name', 'student', 'student name', 'full name'],
          ta: ['பெயர்', 'மாணவர் பெயர்', 'மாணவர்'],
          hi: ['नाम', 'विद्यार्थी का नाम', 'छात्र का नाम', 'विद्यार्थी', 'छात्र']
        }
      },
      {
        key: 'grade',
        type: 'string',
        required: true,
        validator: (v) => (/Class [345]/.test(String(v)) ? true : 'Grade must be Class 3, Class 4, or Class 5'),
        synonyms: {
          en: ['grade', 'class', 'standard', 'std'],
          ta: ['வகுப்பு', 'பிரிவு', 'தரம்'],
          hi: ['कक्षा', 'वर्ग', 'श्रेणी']
        }
      },
      {
        key: 'section',
        type: 'string',
        required: false,
        synonyms: {
          en: ['section', 'sec', 'division'],
          ta: ['பிரிவு', 'பிரிவு எண்'],
          hi: ['सेक्शन', 'वर्ग', 'विभाग']
        }
      },
      {
        key: 'attendancePct',
        type: 'number',
        required: false,
        validator: (v) => (v === undefined || (v >= 0 && v <= 100) ? true : 'Attendance must be 0-100%'),
        synonyms: {
          en: ['attendance', 'attendance pct', 'attendance %', 'present %'],
          ta: ['வருகை', 'வருகை %', 'வருகைப் பதிவு'],
          hi: ['उपस्थिति', 'हाजिरी', 'उपस्थिति %']
        }
      },
      {
        key: 'notes',
        type: 'string',
        required: false,
        synonyms: {
          en: ['notes', 'remarks', 'comments'],
          ta: ['குறிப்பு', 'குறிப்புகள்'],
          hi: ['टिप्पणी', 'नोट्स']
        }
      }
    ]
  },

  attendance: {
    key: 'attendance',
    i18nLabelKey: 'import.entities.attendance',
    description: 'Attendance records updating student attendance percentage.',
    identityKey: (row: any) => `${row.grade || 'Class 3'}_${row.section || ''}_${row.rollNumber || row.rollNo || row.name}`,
    groupingFields: ['grade', 'section'],
    fields: [
      {
        key: 'rollNumber',
        type: 'string',
        required: true,
        synonyms: {
          en: ['roll', 'roll_no', 'roll number', 'id'],
          ta: ['வரிசை எண்', 'பதிவு எண்', 'எண்'],
          hi: ['क्रमांक', 'रोल नंबर', 'अनुक्रमांक']
        }
      },
      {
        key: 'name',
        type: 'string',
        required: false,
        synonyms: {
          en: ['name', 'student name'],
          ta: ['பெயர்', 'மாணவர் பெயர்'],
          hi: ['नाम', 'विद्यार्थी का नाम']
        }
      },
      {
        key: 'attendancePct',
        type: 'number',
        required: true,
        validator: (v) => (v >= 0 && v <= 100 ? true : 'Attendance must be between 0 and 100%'),
        synonyms: {
          en: ['attendance', 'percentage', 'attendance %', 'days present'],
          ta: ['வருகை', 'வருகை %', 'வருகை நாட்கள்'],
          hi: ['उपस्थिति', 'उपस्थिति %', 'कुल उपस्थिति']
        }
      }
    ]
  },

  timetable: {
    key: 'timetable',
    i18nLabelKey: 'import.entities.timetable',
    description: 'Weekly schedule sessions. Always saved as a DRAFT plan without overwriting the active plan.',
    identityKey: (row: any) => `${row.day}_${row.startTime}_${row.title}`,
    groupingFields: ['day'],
    fields: [
      {
        key: 'day',
        type: 'string',
        required: true,
        validator: (v) => (/Monday|Tuesday|Wednesday|Thursday|Friday/i.test(String(v)) ? true : 'Valid school day required'),
        synonyms: {
          en: ['day', 'weekday'],
          ta: ['நாள்', 'கிழமை'],
          hi: ['दिन', 'वार']
        }
      },
      {
        key: 'startTime',
        type: 'string',
        required: true,
        synonyms: {
          en: ['time', 'start time', 'slot', 'period'],
          ta: ['நேரம்', 'தொடக்க நேரம்', 'பாடவேளை'],
          hi: ['समय', 'प्रारंभ समय', 'घंटी', 'कालांश']
        }
      },
      {
        key: 'durationMinutes',
        type: 'number',
        required: false,
        synonyms: {
          en: ['duration', 'duration minutes', 'mins', 'length'],
          ta: ['கால அளவு', 'நிமிடங்கள்'],
          hi: ['अवधि', 'समय सीमा', 'मिनट']
        }
      },
      {
        key: 'title',
        type: 'string',
        required: true,
        synonyms: {
          en: ['title', 'session title', 'lesson', 'subject', 'topic'],
          ta: ['தலைப்பு', 'பாடம்', 'பாடத் தலைப்பு'],
          hi: ['शीर्षक', 'पाठ', 'विषय', 'गतिविधि']
        }
      },
      {
        key: 'sessionType',
        type: 'string',
        required: false,
        synonyms: {
          en: ['type', 'session type', 'pedagogy'],
          ta: ['வகை', 'அமர்வு வகை'],
          hi: ['प्रकार', 'सत्र प्रकार']
        }
      },
      {
        key: 'gradesInvolved',
        type: 'array',
        required: false,
        synonyms: {
          en: ['grades', 'classes', 'target grades'],
          ta: ['வகுப்புகள்', 'இலக்கு வகுப்புகள்'],
          hi: ['कक्षाएँ', 'लक्षित कक्षा']
        }
      }
    ]
  },

  classroom: {
    key: 'classroom',
    i18nLabelKey: 'import.entities.classroom',
    description: 'School setup configuration: classroom name, managed grades, teaching hours, and local courtyard resources.',
    identityKey: () => 'default',
    groupingFields: [],
    fields: [
      {
        key: 'name',
        type: 'string',
        required: true,
        synonyms: {
          en: ['school name', 'classroom name', 'centre name', 'school'],
          ta: ['பள்ளிப் பெயர்', 'வகுப்பறை பெயர்'],
          hi: ['विद्यालय का नाम', 'स्कूल का नाम', 'कक्षा नाम']
        }
      },
      {
        key: 'hoursPerDay',
        type: 'number',
        required: true,
        validator: (v) => (v >= 1 && v <= 8 ? true : 'Teaching hours must be between 1 and 8'),
        synonyms: {
          en: ['hours per day', 'teaching hours', 'daily hours', 'hours'],
          ta: ['தினசரி கற்பித்தல் மணி நேரம்', 'மணி நேரம்'],
          hi: ['दैनिक शिक्षण घंटे', 'घंटे प्रति दिन']
        }
      },
      {
        key: 'daysPerWeek',
        type: 'number',
        required: false,
        synonyms: {
          en: ['days per week', 'working days'],
          ta: ['வார வேலை நாட்கள்', 'நாட்கள்'],
          hi: ['साप्ताहिक कार्य दिवस', 'दिन']
        }
      },
      {
        key: 'resources',
        type: 'array',
        required: false,
        synonyms: {
          en: ['resources', 'materials', 'available materials'],
          ta: ['பொருட்கள்', 'கற்றல் பொருட்கள்'],
          hi: ['संसाधन', 'सामग्री']
        }
      }
    ]
  },

  topics: {
    key: 'topics',
    i18nLabelKey: 'import.entities.topics',
    description: 'Curriculum syllabus topics and foundational progression.',
    identityKey: (row: any) => `${row.grade}_${row.name}`,
    groupingFields: ['grade'],
    fields: [
      {
        key: 'name',
        type: 'string',
        required: true,
        synonyms: {
          en: ['topic', 'topic name', 'concept', 'skill'],
          ta: ['தலைப்பு', 'பாடத் தலைப்பு', 'கருத்து'],
          hi: ['विषय', 'टॉपिक', 'संकल्पना', 'अवधारणा']
        }
      },
      {
        key: 'grade',
        type: 'string',
        required: true,
        synonyms: {
          en: ['grade', 'class', 'standard'],
          ta: ['வகுப்பு', 'தரம்'],
          hi: ['कक्षा', 'श्रेणी']
        }
      },
      {
        key: 'prerequisiteTopicName',
        type: 'string',
        required: false,
        synonyms: {
          en: ['prerequisite', 'prereq', 'foundational topic'],
          ta: ['முன்தேவை', 'அடிப்படைப் பாடம்'],
          hi: ['पूर्व-अपेक्षित', 'मूल संकल्पना']
        }
      }
    ]
  },

  activities: {
    key: 'activities',
    i18nLabelKey: 'import.entities.activities',
    description: 'Hands-on village classroom exercises with zero-cost physical manipulatives.',
    identityKey: (row: any) => `${row.title}`,
    groupingFields: ['category'],
    fields: [
      {
        key: 'title',
        type: 'string',
        required: true,
        synonyms: {
          en: ['title', 'activity name', 'exercise'],
          ta: ['செயல்பாட்டுத் தலைப்பு', 'பெயர்'],
          hi: ['गतिविधि का नाम', 'शीर्षक']
        }
      },
      {
        key: 'requiredMaterials',
        type: 'array',
        required: false,
        synonyms: {
          en: ['materials', 'required materials', 'resources'],
          ta: ['தேவையான பொருட்கள்', 'பொருட்கள்'],
          hi: ['आवश्यक सामग्री', 'सामग्री']
        }
      },
      {
        key: 'steps',
        type: 'array',
        required: true,
        synonyms: {
          en: ['steps', 'instructions', 'method'],
          ta: ['படிநிலைகள்', 'செய்முறை'],
          hi: ['चरण', 'निर्देश', 'विधि']
        }
      }
    ]
  }
};

