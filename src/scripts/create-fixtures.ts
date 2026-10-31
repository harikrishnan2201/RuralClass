import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const fixturesDir = path.resolve(process.cwd(), 'fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

// 1. fixtures/students-sections.xlsx (Class 4 Sections A, B, C with roll 1 in each)
{
  const wb = XLSX.utils.book_new();
  const data = [
    ['Roll Number', 'Student Name', 'Grade', 'Section', 'Fractions', 'Decimals'],
    ['1', 'Student 4A Roll 1', 'Class 4', 'A', 88, 75],
    ['2', 'Student 4A Roll 2', 'Class 4', 'A', 62, 58],
    ['1', 'Student 4B Roll 1', 'Class 4', 'B', 94, 90],
    ['2', 'Student 4B Roll 2', 'Class 4', 'B', 48, 52],
    ['1', 'Student 4C Roll 1', 'Class 4', 'C', 72, 68]
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Students_Sections');
  XLSX.writeFile(wb, path.join(fixturesDir, 'students-sections.xlsx'));
}

// 2. fixtures/students-long.csv (long layout)
{
  const csvContent = [
    'Roll,Student Name,Grade,Section,Topic,Score',
    '101,Aarav Patel,Class 3,A,Fractions,78',
    '101,Aarav Patel,Class 3,A,Decimals,82',
    '102,Deepa Nair,Class 4,B,Fractions,44',
    '102,Deepa Nair,Class 4,B,Decimals,50'
  ].join('\n');
  fs.writeFileSync(path.join(fixturesDir, 'students-long.csv'), csvContent, 'utf-8');
}

// 3. fixtures/timetable-grid.xlsx (weekly timetable schedule)
{
  const wb = XLSX.utils.book_new();
  const data = [
    ['Day', 'Time', 'Session Type', 'Title', 'Target Grades', 'Activity', 'Teacher Notes'],
    ['Monday', '09:00 - 09:45', 'whole-class', 'Number Sense Foundation', 'Class 3, Class 4', 'Pebble counting groups', 'Review place values'],
    ['Tuesday', '10:00 - 10:45', 'peer-learning', 'Fractions Hands-On', 'Class 4, Class 5', 'Paper strip folding', 'Pair mentors with mentees'],
    ['Wednesday', '11:00 - 11:45', 'independent', 'Mental Math Challenges', 'Class 3', 'Flash cards', 'Self-paced station'],
    ['Thursday', '09:00 - 09:45', 'teacher-led', 'Decimal Point Introduction', 'Class 5', 'Number line chalk walk', 'Target struggling students'],
    ['Friday', '10:00 - 10:45', 'whole-class', 'Weekly Problem Solving Circle', 'Class 3, Class 4, Class 5', 'Word problem puzzle teams', 'Celebration and recap']
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Weekly_Timetable');
  XLSX.writeFile(wb, path.join(fixturesDir, 'timetable-grid.xlsx'));
}

// 4. fixtures/multi-dataset.xlsx (Sheets: Marks, Attendance, Timetable)
{
  const wb = XLSX.utils.book_new();

  // Sheet 1: Marks
  const marksData = [
    ['Roll', 'Name', 'Grade', 'Section', 'Fractions', 'Decimals'],
    ['1', 'Kavitha R', 'Class 3', 'A', 82, 85],
    ['2', 'Manoj S', 'Class 3', 'A', 54, 49]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(marksData), 'Marks');

  // Sheet 2: Attendance
  const attData = [
    ['Roll', 'Name', 'Grade', 'Section', 'Attendance %'],
    ['1', 'Kavitha R', 'Class 3', 'A', 95],
    ['2', 'Manoj S', 'Class 3', 'A', 78]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(attData), 'Attendance');

  // Sheet 3: Timetable
  const ttData = [
    ['Day', 'Time', 'Session Type', 'Title', 'Target Grades', 'Activity'],
    ['Monday', '09:00 - 09:45', 'whole-class', 'Morning Math Circle', 'Class 3', 'Group chanting']
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ttData), 'Timetable');

  XLSX.writeFile(wb, path.join(fixturesDir, 'multi-dataset.xlsx'));
}

// 5. fixtures/classroom-setup.csv
{
  const classCsv = [
    'Classroom Name,Grades,Subjects,Days Per Week,Hours Per Day,Resources',
    '"Govt Model Primary School","Class 3, Class 4, Class 5","Mathematics, Science",5,4,"Blackboard, Chalk, Pebbles, Paper Strips, Chart Sheets"'
  ].join('\n');
  fs.writeFileSync(path.join(fixturesDir, 'classroom-setup.csv'), classCsv, 'utf-8');
}

// 6. fixtures/syllabus-topics.csv (with Tamil & Hindi synonyms)
{
  const topicsCsv = [
    'Grade,Subject,Topic Name,Prerequisite Topic,Notes',
    'Class 3,Mathematics,Equal Sharing,Counting,Foundational sharing concept',
    'Class 4,Mathematics,Fractions on Number Line,Equal Sharing,Bridge from sharing to fractions',
    'Class 5,Mathematics,Decimals Representation,Fractions on Number Line,Decimal place values'
  ].join('\n');
  fs.writeFileSync(path.join(fixturesDir, 'syllabus-topics.csv'), topicsCsv, 'utf-8');
}

// 7. fixtures/activities-sample.txt
{
  const actText = [
    'Activity: Paper Strip Fraction Folding',
    'Subject: Mathematics',
    'Grades: Class 3, Class 4',
    'Objective: Understand 1/2, 1/4, and 1/8 visually through folding.',
    'Duration: 30 minutes',
    'Materials: Paper strips, Crayons, Ruler',
    'Steps: 1. Take a strip of paper. 2. Fold in half. 3. Color one half. 4. Compare with peers.',
    'Category: interactive'
  ].join('\n');
  fs.writeFileSync(path.join(fixturesDir, 'activities-sample.txt'), actText, 'utf-8');
}

// 8. fixtures/edge-cases.csv
{
  const edgeCasesCsv = [
    'Roll Number,Student Name,Grade,Section,Score,Notes',
    'R999,,Class 3,A,75,Missing student name',
    'R101,Invalid Score Student,Class 4,B,150,Score over 100',
    'R102,Negative Score Student,Class 4,B,-20,Negative score',
    'R103,Text Score Student,Class 5,A,Absent,Score is text',
    'R104,Unknown Grade Student,Class 9,A,80,Grade outside 3-5',
    'R105,Duplicate Roll 1,Class 3,A,70,First with R105 in 3A',
    'R105,Duplicate Roll 2,Class 3,A,85,Second with R105 in 3A'
  ].join('\n');
  fs.writeFileSync(path.join(fixturesDir, 'edge-cases.csv'), edgeCasesCsv, 'utf-8');
}

console.log('✅ Created 8 test fixtures in ./fixtures/');

