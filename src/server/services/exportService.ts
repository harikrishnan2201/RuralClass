import * as XLSX from 'xlsx';
import { sanitizeCellValue } from './fileSecurity.js';
import { Student, Topic, WeeklyPlan } from '../../types';
import { localizeGrade, localizeTopicName, localizeSessionTitle } from '../../shared/contentLocalization.js';

/**
 * Generates an Excel workbook for student assessments with CSV injection defense and sections support.
 */
export function generateStudentsWorkbook(
  students: Student[],
  topics: Topic[],
  language: string = 'en'
): Buffer {
  const headers = [
    language === 'ta' ? 'பதிவு எண்' : language === 'hi' ? 'रोल नंबर' : 'Roll Number',
    language === 'ta' ? 'மாணவர் பெயர்' : language === 'hi' ? 'विद्यार्थी का नाम' : 'Student Name',
    language === 'ta' ? 'வகுப்பு' : language === 'hi' ? 'कक्षा' : 'Grade',
    language === 'ta' ? 'பிரிவு' : language === 'hi' ? 'अनुभाग' : 'Section',
    language === 'ta' ? 'சராசரி %' : language === 'hi' ? 'औसत %' : 'Average %',
    language === 'ta' ? 'வருகை %' : language === 'hi' ? 'उपस्थिति %' : 'Attendance %',
    language === 'ta' ? 'கவனிப்பு தேவை' : language === 'hi' ? 'सहायता आवश्यक' : 'Needs Check-in',
    language === 'ta' ? 'வழிகாட்டி பங்கு' : language === 'hi' ? 'साथी मेंटर' : 'Peer Role',
    ...topics.map(t => localizeTopicName(t.name, language))
  ];

  const data: (string | number)[][] = [headers];

  for (const s of students) {
    const row: (string | number)[] = [
      sanitizeCellValue(s.rollNo || s.id),
      sanitizeCellValue(s.name),
      sanitizeCellValue(localizeGrade(s.grade, language)),
      sanitizeCellValue(s.section || ''),
      s.averageScore,
      s.attendancePct ?? 90,
      s.needsCheckin ? (language === 'ta' ? 'ஆம்' : language === 'hi' ? 'हाँ' : 'Yes') : (language === 'ta' ? 'இல்லை' : language === 'hi' ? 'नहीं' : 'No'),
      sanitizeCellValue(s.peerRole || '-'),
      ...topics.map(t => s.topicScores[t.id] !== undefined ? s.topicScores[t.id] : '')
    ];
    data.push(row);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Generates an Excel workbook for the weekly multi-grade timetable.
 */
export function generateTimetableWorkbook(
  plan: WeeklyPlan,
  language: string = 'en'
): Buffer {
  const headers = [
    language === 'ta' ? 'நாள்' : language === 'hi' ? 'दिन' : 'Day',
    language === 'ta' ? 'நேரம்' : language === 'hi' ? 'समय' : 'Time',
    language === 'ta' ? 'அமர்வு வகை' : language === 'hi' ? 'सत्र प्रकार' : 'Session Type',
    language === 'ta' ? 'தலைப்பு' : language === 'hi' ? 'शीर्षक' : 'Title',
    language === 'ta' ? 'வகுப்புகள்' : language === 'hi' ? 'कक्षाएँ' : 'Target Grades',
    language === 'ta' ? 'செயல்பாடு' : language === 'hi' ? 'गतिविधि' : 'Activity',
    language === 'ta' ? 'ஆசிரியர் குறிப்பு' : language === 'hi' ? 'शिक्षक संकेत' : 'Teacher Notes'
  ];

  const data: (string | number)[][] = [headers];

  const dayNames: Record<string, string> = {
    Monday: language === 'ta' ? 'திங்கள்' : language === 'hi' ? 'सोमवार' : 'Monday',
    Tuesday: language === 'ta' ? 'செவ்வாய்' : language === 'hi' ? 'मंगलवार' : 'Tuesday',
    Wednesday: language === 'ta' ? 'புதன்' : language === 'hi' ? 'बुधवार' : 'Wednesday',
    Thursday: language === 'ta' ? 'வியாழன்' : language === 'hi' ? 'गुरुवार' : 'Thursday',
    Friday: language === 'ta' ? 'வெள்ளி' : language === 'hi' ? 'शुक्रवार' : 'Friday',
  };

  for (const sess of (plan.sessions || [])) {
    data.push([
      dayNames[sess.day] || sess.day,
      sanitizeCellValue(`${sess.startTime} (${sess.durationMinutes}m)`),
      sanitizeCellValue(sess.sessionType),
      sanitizeCellValue(localizeSessionTitle(sess.title, language)),
      sanitizeCellValue((sess.gradesInvolved || []).map((g: string) => localizeGrade(g, language)).join(', ')),
      sanitizeCellValue(sess.sharedObjective || ''),
      sanitizeCellValue(sess.teachingNotes || '')
    ]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export type TemplateType = 'students' | 'attendance' | 'timetable' | 'classroom' | 'topics' | 'activities';

/**
 * Generates downloadable blank templates for all supported entities in English, Tamil, and Hindi.
 */
export function generateBlankTemplate(
  type: TemplateType | string,
  language: 'en' | 'ta' | 'hi' = 'en'
): Buffer {
  const workbook = XLSX.utils.book_new();

  if (type === 'attendance') {
    const headers = language === 'ta'
      ? ['பதிவு எண்', 'மாணவர் பெயர்', 'வகுப்பு', 'பிரிவு', 'வருகை %']
      : language === 'hi'
        ? ['रोल नंबर', 'विद्यार्थी का नाम', 'कक्षा', 'अनुभाग', 'उपस्थिति %']
        : ['Roll Number', 'Student Name', 'Grade', 'Section', 'Attendance %'];

    const sample1 = language === 'ta'
      ? ['R101', 'அமுதா', 'Class 4', 'A', 92]
      : language === 'hi'
        ? ['R101', 'आरव', 'Class 4', 'A', 92]
        : ['R101', 'Ananya Sharma', 'Class 4', 'A', 92];

    const sample2 = language === 'ta'
      ? ['R102', 'பாலன்', 'Class 4', 'B', 85]
      : language === 'hi'
        ? ['R102', 'प्रिया', 'Class 4', 'B', 85]
        : ['R102', 'Rahul Kumar', 'Class 4', 'B', 85];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sample1, sample2]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance_Template');
  } else if (type === 'classroom') {
    const headers = language === 'ta'
      ? ['வகுப்பறை பெயர்', 'வகுப்புகள்', 'பாடங்கள்', 'வார நாட்கள்', 'நாள் நேரம் (மணி)', 'பொருட்கள்']
      : language === 'hi'
        ? ['कक्षा का नाम', 'कक्षाएँ', 'विषय', 'सप्ताह के दिन', 'प्रति दिन घंटे', 'संसाधन']
        : ['Classroom Name', 'Grades', 'Subjects', 'Days Per Week', 'Hours Per Day', 'Resources'];

    const sample = language === 'ta'
      ? ['மாதிரி வகுப்பறை', 'Class 3, Class 4, Class 5', 'Mathematics, Science', 5, 4, 'கரும்பலகை, காகிதம், வண்ணக் குச்சிகள்']
      : language === 'hi'
        ? ['मॉडल क्लासरूम', 'Class 3, Class 4, Class 5', 'Mathematics, Science', 5, 4, 'ब्लैकबोर्ड, कागज, कंकड़']
        : ['Govt Primary School', 'Class 3, Class 4, Class 5', 'Mathematics, Science', 5, 4, 'Blackboard, Paper, Chalk, Pebbles'];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sample]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Classroom_Template');
  } else if (type === 'topics') {
    const headers = language === 'ta'
      ? ['வகுப்பு', 'பாடம்', 'தலைப்பு பெயர்', 'முன்நிபந்தனை தலைப்பு', 'குறிப்புகள்']
      : language === 'hi'
        ? ['कक्षा', 'विषय', 'विषय का नाम', 'पूर्व-आवश्यक विषय', 'टिप्पणियाँ']
        : ['Grade', 'Subject', 'Topic Name', 'Prerequisite Topic', 'Notes'];

    const sample1 = language === 'ta'
      ? ['Class 4', 'Mathematics', 'பின்னங்களின் அறிமுகம்', 'சம பங்கீடு', 'காகித மடிப்பு மூலம் விளக்கம்']
      : language === 'hi'
        ? ['Class 4', 'Mathematics', 'भिन्नों का परिचय', 'समान विभाजन', 'कागज मोड़कर सिखाएँ']
        : ['Class 4', 'Mathematics', 'Introduction to Fractions', 'Equal Sharing', 'Use concrete visual props'];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sample1]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Topics_Template');
  } else if (type === 'activities') {
    const headers = language === 'ta'
      ? ['தலைப்பு', 'பாடம்', 'வகுப்புகள்', 'குறிக்கோள்', 'கால அளவு (நிமி)', 'பொருட்கள்', 'படிகள்', 'வகை']
      : language === 'hi'
        ? ['शीर्षक', 'विषय', 'कक्षाएँ', 'उद्देश्य', 'अवधि (मिनट)', 'सामग्री', 'चरण', 'श्रेणी']
        : ['Title', 'Subject', 'Grades', 'Objective', 'Duration Minutes', 'Materials', 'Steps', 'Category'];

    const sample1 = language === 'ta'
      ? ['காகித மடிப்பு பின்னங்கள்', 'Mathematics', 'Class 3, Class 4', 'சம பகுதிகளை அறிதல்', 30, 'காகித கீற்றுகள்', 'மடித்தல், வண்ணம் தீட்டுதல்', 'interactive']
      : language === 'hi'
        ? ['कागज मोड़कर भिन्न', 'Mathematics', 'Class 3, Class 4', 'समान भागों की पहचान', 30, 'कागज की पट्टियाँ', 'मोड़ें, रंग भरें', 'interactive']
        : ['Paper Strip Fractions', 'Mathematics', 'Class 3, Class 4', 'Recognize equal shares', 30, 'Paper strips, Crayons', 'Fold in half, Shade 1 part, Compare', 'interactive'];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sample1]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Activities_Template');
  } else if (type === 'timetable') {
    const headers = language === 'ta'
      ? ['நாள்', 'நேரம்', 'அமர்வு வகை', 'தலைப்பு', 'வகுப்புகள்', 'செயல்பாடு']
      : language === 'hi'
        ? ['दिन', 'समय', 'सत्र प्रकार', 'शीर्षक', 'कक्षाएँ', 'गतिविधि']
        : ['Day', 'Time', 'Session Type', 'Title', 'Target Grades', 'Activity'];

    const sample1 = language === 'ta'
      ? ['திங்கள்', '09:00 - 09:50', 'whole-class', 'கூட்டுப் பாடம்: சம பங்கீடு', 'Class 3, Class 4, Class 5', 'கற்கள் மற்றும் காகித மடிப்பு']
      : language === 'hi'
        ? ['सोमवार', '09:00 - 09:50', 'whole-class', 'साझा पाठ: समान विभाजन', 'Class 3, Class 4, Class 5', 'कंकड़ और कागज मोड़ना']
        : ['Monday', '09:00 - 09:50', 'whole-class', 'Geometry of Equal Parts', 'Class 3, Class 4, Class 5', 'Fold paper strips'];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sample1]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable_Template');
  } else {
    // Default: students template with Section support
    const headers = language === 'ta' 
      ? ['பதிவு எண்', 'மாணவர் பெயர்', 'வகுப்பு', 'பிரிவு', 'பின்னங்கள்', 'தசமங்கள்', 'வடிவியல்']
      : language === 'hi'
        ? ['रोल नंबर', 'विद्यार्थी का नाम', 'कक्षा', 'अनुभाग', 'भिन्न', 'दशमलव', 'ज्यामिति']
        : ['Roll Number', 'Student Name', 'Grade', 'Section', 'Fractions', 'Decimals', 'Geometry'];

    const sample1 = language === 'ta'
      ? ['S101', 'அமுதா', 'Class 3', 'A', 85, 70, 90]
      : language === 'hi'
        ? ['S101', 'आरव', 'Class 3', 'A', 85, 70, 90]
        : ['S101', 'Ananya Sharma', 'Class 3', 'A', 85, 70, 90];

    const sample2 = language === 'ta'
      ? ['S102', 'பாலன்', 'Class 4', 'B', 45, 60, 50]
      : language === 'hi'
        ? ['S102', 'प्रिया', 'Class 4', 'B', 45, 60, 50]
        : ['S102', 'Rahul Kumar', 'Class 4', 'B', 45, 60, 50];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sample1, sample2]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student_Template');
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Generates an Indic print-optimized HTML page for student records or timetable.
 * Fully bundled with Noto Sans Tamil and Noto Sans Devanagari webfont typography.
 */
export function generatePrintableHtml(
  title: string,
  tableHtml: string,
  language: string = 'en'
): string {
  const fontFamily = language === 'ta' 
    ? "'Noto Sans Tamil', system-ui, sans-serif" 
    : language === 'hi'
      ? "'Noto Sans Devanagari', system-ui, sans-serif"
      : "system-ui, -apple-system, sans-serif";

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body {
      font-family: ${fontFamily};
      color: #1f2937;
      margin: 0;
      padding: 16px;
      font-size: 13px;
      line-height: 1.5;
    }
    h1 {
      font-size: 20px;
      margin-bottom: 4px;
      color: #1e3a8a;
    }
    .subtitle {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background-color: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }
    tr:nth-child(even) td {
      background-color: #f9fafb;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }
    .badge-checkin { background-color: #fee2e2; color: #991b1b; }
    .badge-mentor { background-color: #dbeafe; color: #1e40af; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; text-align: right;">
    <button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
      ${language === 'ta' ? 'அச்சிடுக / PDF ஆக சேமி' : language === 'hi' ? 'प्रिंट करें / PDF सेव करें' : 'Print / Save as PDF'}
    </button>
  </div>
  <h1>${title}</h1>
  <div class="subtitle">RuralClass — Multi-Grade Classroom Planning System • ${new Date().toLocaleDateString()}</div>
  ${tableHtml}
</body>
</html>`;
}
