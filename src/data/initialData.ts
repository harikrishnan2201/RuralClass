import { ClassroomConfig, Topic, ConceptNode, Activity, WeeklyPlan, UserSettings, Student } from '../types';

export const INITIAL_CLASSROOM: ClassroomConfig = {
  name: 'Rural Learning Centre',
  grades: ['Class 3', 'Class 4', 'Class 5'],
  subjects: ['Mathematics'],
  daysPerWeek: 5,
  hoursPerDay: 3,
  resources: [
    'Chalk and blackboard',
    'Paper',
    'Pencils',
    'Pebbles or stones',
    'Bottle caps',
    'Sticks',
    'Reusable cards',
    'Textbooks',
    'No electricity',
    'Limited internet access'
  ]
};

export const AVAILABLE_RESOURCE_OPTIONS = [
  'Chalk and blackboard',
  'Paper',
  'Pencils',
  'Pebbles or stones',
  'Sticks',
  'Bottle caps',
  'Reusable cards',
  'Textbooks',
  'Printed worksheets',
  'Clay / Mud models',
  'Leaves and seeds',
  'Measuring ropes / strings',
  'No electricity',
  'Limited internet access'
];

export const INITIAL_TOPICS: Topic[] = [
  // Class 3
  {
    id: 't-c3-frac',
    grade: 'Class 3',
    subject: 'Mathematics',
    name: 'Understanding Fractions',
    status: 'In Progress',
    progress: 45,
    understandingLevel: 45,
    prerequisiteTopicName: 'Equal Sharing & Basic Shapes',
    notes: 'Students struggle with dividing wholes into equal parts; often count shaded parts without verifying symmetry.'
  },
  {
    id: 't-c3-add',
    grade: 'Class 3',
    subject: 'Mathematics',
    name: 'Multi-digit Addition',
    status: 'Completed',
    progress: 90,
    understandingLevel: 85,
    prerequisiteTopicName: 'Single-digit Addition & Place Value',
    notes: 'Strong grasp of column addition with carrying up to 100.'
  },
  {
    id: 't-c3-place',
    grade: 'Class 3',
    subject: 'Mathematics',
    name: 'Place Value (Tens & Hundreds)',
    status: 'Completed',
    progress: 80,
    understandingLevel: 72,
    prerequisiteTopicName: 'Number Counting to 100',
    notes: 'Good understanding using bundles of 10 sticks.'
  },

  // Class 4
  {
    id: 't-c4-frac',
    grade: 'Class 4',
    subject: 'Mathematics',
    name: 'Fractions of a Group',
    status: 'In Progress',
    progress: 50,
    understandingLevel: 50,
    prerequisiteTopicId: 't-c3-frac',
    prerequisiteTopicName: 'Class 3: Understanding Fractions',
    notes: 'Finds finding 1/3 of 12 stones confusing; confuses total count with denominator.'
  },
  {
    id: 't-c4-word',
    grade: 'Class 4',
    subject: 'Mathematics',
    name: 'Word Problems (1-Step)',
    status: 'In Progress',
    progress: 40,
    understandingLevel: 40,
    prerequisiteTopicName: 'Reading Comprehension & Operations',
    notes: 'Language barrier in interpreting word problem cues (e.g., "how many left" vs "how many in total").'
  },
  {
    id: 't-c4-mult',
    grade: 'Class 4',
    subject: 'Mathematics',
    name: 'Multiplication Basics (Arrays & Tables)',
    status: 'Completed',
    progress: 75,
    understandingLevel: 68,
    prerequisiteTopicId: 't-c3-add',
    prerequisiteTopicName: 'Class 3: Multi-digit Addition',
    notes: 'Understands repeated addition, memorizing times tables 2-7.'
  },

  // Class 5
  {
    id: 't-c5-dec',
    grade: 'Class 5',
    subject: 'Mathematics',
    name: 'Decimals & Fraction Conversion',
    status: 'In Progress',
    progress: 42,
    understandingLevel: 42,
    prerequisiteTopicId: 't-c4-frac',
    prerequisiteTopicName: 'Class 4: Fractions of a Group',
    notes: 'Difficulty converting 1/2 to 0.5 or 1/4 to 0.25; lack foundational fraction intuition.'
  },
  {
    id: 't-c5-mult',
    grade: 'Class 5',
    subject: 'Mathematics',
    name: 'Multi-digit Multiplication',
    status: 'Completed',
    progress: 85,
    understandingLevel: 78,
    prerequisiteTopicId: 't-c4-mult',
    prerequisiteTopicName: 'Class 4: Multiplication Basics',
    notes: 'Able to multiply 2-digit numbers by 2-digit numbers accurately.'
  },
  {
    id: 't-c5-word',
    grade: 'Class 5',
    subject: 'Mathematics',
    name: 'Multi-step Word Problems',
    status: 'In Progress',
    progress: 48,
    understandingLevel: 48,
    prerequisiteTopicId: 't-c4-word',
    prerequisiteTopicName: 'Class 4: Word Problems (1-Step)',
    notes: 'Struggles when a problem requires solving addition first and then division.'
  }
];

export const INITIAL_CONCEPT_NODES: ConceptNode[] = [
  // Class 3 Nodes
  {
    id: 'node-c3-add',
    grade: 'Class 3',
    name: 'Addition & Place Value',
    subject: 'Mathematics',
    understandingLevel: 85,
    status: 'Strong',
    category: 'Foundation',
    description: 'Grouping units into tens and hundreds; multi-digit addition with carry-over.',
    rootCauseContext: 'Strong foundation enables students to transition to repeated addition and multiplication tables in Class 4.',
    suggestedAction: 'Have Class 3 students demonstrate bundling sticks to reinforce peer confidence.',
    prerequisites: [],
    nextConcepts: ['node-c4-mult'],
    x: 80,
    y: 120
  },
  {
    id: 'node-c3-frac',
    grade: 'Class 3',
    name: 'Understanding Fractions',
    subject: 'Mathematics',
    understandingLevel: 45,
    status: 'Needs Attention',
    category: 'Foundation',
    description: 'Equal partition of a single whole into halves (1/2), thirds (1/3), and quarters (1/4).',
    rootCauseContext: 'This is the primary root cause blocking Class 4 fractional sets and Class 5 decimal conversions. Students treat fractions as two unrelated numbers rather than a single relational quantity.',
    suggestedAction: 'Dedicate Monday shared lesson to paper folding and physical roti division strips.',
    prerequisites: [],
    nextConcepts: ['node-c4-frac'],
    x: 80,
    y: 320
  },

  // Class 4 Nodes
  {
    id: 'node-c4-mult',
    grade: 'Class 4',
    name: 'Multiplication Basics',
    subject: 'Mathematics',
    understandingLevel: 68,
    status: 'Developing',
    category: 'Application',
    description: 'Repeated addition, rectangular pebble arrays, times tables (2 to 9).',
    rootCauseContext: 'Supported well by Class 3 addition. Need more hands-on array work with stones.',
    suggestedAction: 'Pair Class 4 students with Class 3 to build grid arrays using bottle caps.',
    prerequisites: ['node-c3-add'],
    nextConcepts: ['node-c5-mult', 'node-c4-word'],
    x: 360,
    y: 120
  },
  {
    id: 'node-c4-frac',
    grade: 'Class 4',
    name: 'Fractions of a Group',
    subject: 'Mathematics',
    understandingLevel: 50,
    status: 'Developing',
    category: 'Application',
    description: 'Partitioning a set of objects (e.g. 1/3 of 12 pebbles = 4 pebbles).',
    rootCauseContext: 'Directly impaired by the weak conceptual model of fractional division from Class 3. Without solid part-whole intuition, students confuse items with portions.',
    suggestedAction: 'Use small group stone-sorting activities connected to Class 3 paper strip visuals.',
    prerequisites: ['node-c3-frac'],
    nextConcepts: ['node-c5-dec'],
    x: 360,
    y: 320
  },
  {
    id: 'node-c4-word',
    grade: 'Class 4',
    name: '1-Step Word Problems',
    subject: 'Mathematics',
    understandingLevel: 40,
    status: 'Needs Attention',
    category: 'Application',
    description: 'Translating everyday village marketplace scenarios into basic mathematical operations.',
    rootCauseContext: 'Students struggle to decode sentence structure into arithmetic operations.',
    suggestedAction: 'Run 10-minute daily storytelling checks with tangible props (vegetables, sticks).',
    prerequisites: ['node-c4-mult'],
    nextConcepts: ['node-c5-word'],
    x: 360,
    y: 480
  },

  // Class 5 Nodes
  {
    id: 'node-c5-mult',
    grade: 'Class 5',
    name: 'Multi-digit Multiplication',
    subject: 'Mathematics',
    understandingLevel: 78,
    status: 'Strong',
    category: 'Application',
    description: 'Standard algorithm for multiplying multi-digit numbers; area model verification.',
    rootCauseContext: 'Strong performance allows these students to act as peer tutors during group activities.',
    suggestedAction: 'Utilize Class 5 students as station monitors during Thursday practice.',
    prerequisites: ['node-c4-mult'],
    nextConcepts: ['node-c5-word'],
    x: 640,
    y: 120
  },
  {
    id: 'node-c5-dec',
    grade: 'Class 5',
    name: 'Decimals & Fraction Conversion',
    subject: 'Mathematics',
    understandingLevel: 42,
    status: 'Needs Attention',
    category: 'Synthesis',
    description: 'Connecting decimal tenths (0.1) and hundredths (0.01) to fractions (1/10, 1/100).',
    rootCauseContext: 'Crucial bridge gap! The 42% understanding in Class 5 is directly traceable back to Class 3 (45%) and Class 4 (50%) fraction misunderstandings. If the teacher only reteaches decimal rules, students remain confused.',
    suggestedAction: 'Conduct a multi-grade shared introductory lesson connecting 1/10 to 0.1 using a 10-section chalk line.',
    prerequisites: ['node-c4-frac'],
    nextConcepts: [],
    x: 640,
    y: 320
  },
  {
    id: 'node-c5-word',
    grade: 'Class 5',
    name: 'Multi-step Word Problems',
    subject: 'Mathematics',
    understandingLevel: 48,
    status: 'Needs Attention',
    category: 'Synthesis',
    description: 'Multi-stage problems combining addition/multiplication and division.',
    rootCauseContext: 'Compounded by Class 4 word problem struggles and limited arithmetic breaking.',
    suggestedAction: 'Deconstruct word problems into step 1 and step 2 cards.',
    prerequisites: ['node-c4-word', 'node-c5-mult'],
    nextConcepts: [],
    x: 640,
    y: 480
  }
];

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-paper-folds',
    title: 'Paper Strip Fraction Folds',
    subject: 'Mathematics',
    grades: ['Class 3', 'Class 4', 'Class 5'],
    objective: 'Develop visual and physical intuition of equal halves, quarters, and decimal equivalents using paper folds.',
    durationMinutes: 30,
    requiredMaterials: ['Paper', 'Pencils'],
    category: 'Hands-on',
    steps: [
      'Give each student a strip of plain paper of equal length.',
      'Instruct them to fold into 2 equal parts, trace the crease, and write 1/2 on each half.',
      'Fold a second strip into 4 parts (1/4), comparing its length with the 1/2 strip.',
      'For older students, fold a strip into 10 sections and write both 1/10 and 0.1.',
      'Hold strips side by side to discover that 2/4 = 1/2 and 5/10 = 0.5.'
    ],
    adaptations: [
      { grade: 'Class 3', instruction: 'Focus on 1/2 and 1/4 folds; color one part with pencil.' },
      { grade: 'Class 4', instruction: 'Compare 2/4 to 1/2 and fold into 8 parts to find 2/8 = 1/4.' },
      { grade: 'Class 5', instruction: 'Label tenths (1/10, 2/10) alongside decimal notations (0.1, 0.2).' }
    ]
  },
  {
    id: 'act-pebble-groups',
    title: 'Pebble Grouping & Fractional Sets',
    subject: 'Mathematics',
    grades: ['Class 3', 'Class 4', 'Class 5'],
    objective: 'Partition physical collections of stones into equal sets to grasp fractions of a number.',
    durationMinutes: 25,
    requiredMaterials: ['Pebbles or stones', 'Chalk and blackboard'],
    category: 'Hands-on',
    steps: [
      'Students collect 12 pebbles from the school courtyard.',
      'Draw 3 chalk circles on the desk or floor.',
      'Distribute the 12 pebbles equally into the 3 circles (4 pebbles in each).',
      'Explain that one circle holds 1/3 of the 12 pebbles, which is 4 pebbles.',
      'Repeat with 20 pebbles divided into 4 groups.'
    ],
    adaptations: [
      { grade: 'Class 3', instruction: 'Group 6 or 8 pebbles into 2 equal halves.' },
      { grade: 'Class 4', instruction: 'Calculate 1/3 of 12, 1/4 of 16, and 2/3 of 12.' },
      { grade: 'Class 5', instruction: 'Express 4 out of 12 as a simplified fraction and decimal approximation.' }
    ]
  },
  {
    id: 'act-bottle-caps',
    title: 'Bottle Cap Place Value Bundles',
    subject: 'Mathematics',
    grades: ['Class 3', 'Class 4'],
    objective: 'Build concrete understanding of units, tens, and hundreds using colored bottle caps.',
    durationMinutes: 20,
    requiredMaterials: ['Bottle caps', 'Chalk and blackboard'],
    category: 'Visual Model',
    steps: [
      'Assign values: Plain cap = 1 unit, Red/Scratched cap = 10 units, Large cap = 100 units.',
      'Teacher calls out a 2-digit or 3-digit number (e.g., 47).',
      'Students place 4 tens caps and 7 units caps in labeled chalk columns.',
      'Practice exchanging 10 units caps for 1 ten cap during addition.'
    ],
    adaptations: [
      { grade: 'Class 3', instruction: 'Numbers up to 99; practice trading 10 ones for 1 ten.' },
      { grade: 'Class 4', instruction: 'Numbers up to 999; add two 2-digit numbers using cap trades.' }
    ]
  },
  {
    id: 'act-stick-multiplication',
    title: 'Stick Intersections (Vedic Multiplication)',
    subject: 'Mathematics',
    grades: ['Class 4', 'Class 5'],
    objective: 'Visualize multiplication through intersection points of horizontal and vertical sticks.',
    durationMinutes: 30,
    requiredMaterials: ['Sticks', 'Pencils'],
    category: 'Visual Model',
    steps: [
      'Lay 3 parallel sticks horizontally on the ground.',
      'Place 4 sticks vertically crossing over the 3 horizontal sticks.',
      'Count the intersection points where the sticks cross (12 points).',
      'Students discover that 3 rows × 4 columns = 12 intersections.',
      'Extend to 2-digit multiplication by grouping tens sticks and units sticks.'
    ],
    adaptations: [
      { grade: 'Class 4', instruction: 'Single-digit multiplication facts (3×4, 4×5, 6×3).' },
      { grade: 'Class 5', instruction: 'Two-digit products (e.g. 12 × 13) using angled stick groupings.' }
    ]
  },
  {
    id: 'act-village-market',
    title: 'Village Market Math Roleplay',
    subject: 'Mathematics',
    grades: ['Class 3', 'Class 4', 'Class 5'],
    objective: 'Solve practical 1-step and 2-step financial word problems through simulated market buying and selling.',
    durationMinutes: 35,
    requiredMaterials: ['Paper', 'Pencils', 'Bottle caps', 'Reusable cards'],
    category: 'Peer Learning',
    steps: [
      'Create vegetable and grain price cards (e.g., 1 kg potatoes = ₹20, 1 bunch spinach = ₹10).',
      'Use bottle caps as token rupees (1 cap = ₹10).',
      'Pair a Class 5 student (Shopkeeper) with a Class 3 or 4 student (Customer).',
      'Customer receives a word problem card: "You have ₹50. Buy 2 bunches of spinach and find your change."',
      'Shopkeeper verifies calculation and writes the step-by-step arithmetic.'
    ],
    adaptations: [
      { grade: 'Class 3', instruction: 'Single item purchases and simple addition of rupee coins.' },
      { grade: 'Class 4', instruction: '2-item purchase and subtraction to find change.' },
      { grade: 'Class 5', instruction: 'Multi-step purchases with half-kilo pricing (decimals/fractions).' }
    ]
  },
  {
    id: 'act-five-minute-check',
    title: '5-Minute Blackboard Understanding Flash Check',
    subject: 'Mathematics',
    grades: ['Class 3', 'Class 4', 'Class 5'],
    objective: 'Rapid formative assessment to gauge student understanding before concluding daily class.',
    durationMinutes: 15,
    requiredMaterials: ['Chalk and blackboard', 'Paper', 'Pencils'],
    category: 'Formative Check',
    steps: [
      'Divide the blackboard into 3 columns labeled Class 3, Class 4, and Class 5.',
      'Write 2 targeted questions per grade targeting the week’s weak concepts.',
      'Students have 4 minutes to write their answers on a small slip of paper.',
      'Peer-swap papers across desk partners for immediate answer review.',
      'Teacher records who needs 5 minutes of focused support the next morning.'
    ],
    adaptations: [
      { grade: 'Class 3', instruction: 'Shade 1/3 of a 6-box rectangle.' },
      { grade: 'Class 4', instruction: 'Circle 1/4 of 16 dots.' },
      { grade: 'Class 5', instruction: 'Write 3/10 as a decimal number.' }
    ]
  },
  {
    id: 'act-number-line-jump',
    title: 'Courtyard Chalk Number Line Jump',
    subject: 'Mathematics',
    grades: ['Class 3', 'Class 4', 'Class 5'],
    objective: 'Physically experience fractions, decimals, and skips along a large chalk number line.',
    durationMinutes: 25,
    requiredMaterials: ['Chalk and blackboard'],
    category: 'Hands-on',
    steps: [
      'Draw a 5-meter chalk line on the school courtyard floor from 0 to 1.',
      'Mark the midpoint and ask a Class 3 student to jump to 1/2.',
      'Mark quarters and invite Class 4 students to jump to 1/4 and 3/4.',
      'Mark tenths and have Class 5 students hop to 0.1, 0.5, and 0.8.',
      'Notice that 1/2 and 0.5 land on the exact same chalk mark.'
    ],
    adaptations: [
      { grade: 'Class 3', instruction: 'Identify the exact middle between 0 and 1.' },
      { grade: 'Class 4', instruction: 'Jump in quarter increments (1/4, 2/4, 3/4, 1).' },
      { grade: 'Class 5', instruction: 'Place decimal flags (0.25, 0.5, 0.75) alongside fraction marks.' }
    ]
  }
];

export const INITIAL_WEEKLY_PLAN: WeeklyPlan = {
  id: 'plan-week-1',
  name: 'Week 1: Multi-Grade Fractions & Problem Solving Bridge',
  weekLabel: 'Nov 3 – Nov 7, 2026',
  classroomName: 'Rural Learning Centre',
  gradesCovered: ['Class 3', 'Class 4', 'Class 5'],
  status: 'Approved',
  approvedDate: '2026-11-01',
  lastUpdated: '2026-11-01T09:30:00Z',
  totalPlannedHours: 15,
  maxAvailableHours: 15,
  notes: 'Focus on connecting Class 3 equal partitions to Class 4 fractional sets and Class 5 decimals. Heavy use of paper strips and courtyard pebbles.',
  sessions: [
    // MONDAY (3 hours = 180 min)
    {
      id: 'sess-mon-1',
      day: 'Monday',
      startTime: '09:00',
      durationMinutes: 45,
      title: 'Shared Lesson: The Meaning of Equal Shares & Wholes',
      topicId: 't-c3-frac',
      sessionType: 'Shared Lesson',
      gradesInvolved: ['Class 3', 'Class 4', 'Class 5'],
      sharedObjective: 'Build whole-room tactile intuition that fractions represent equal portions of a single whole or set.',
      gradeTasks: [
        { grade: 'Class 3', task: 'Fold paper strips into 2 and 4 equal parts; shade 1/2 and 1/4.' },
        { grade: 'Class 4', task: 'Fold strips into 4 and 8 parts; prove why 2/4 is equal to 1/2.' },
        { grade: 'Class 5', task: 'Fold a 10-section strip; compare 5/10 with 1/2 and mark 0.5.' }
      ],
      resources: ['Paper', 'Pencils', 'Chalk and blackboard'],
      teachingNotes: 'Start with a shared story about sharing 1 roti among 2 children, then 4 children.'
    },
    {
      id: 'sess-mon-2',
      day: 'Monday',
      startTime: '09:50',
      durationMinutes: 75,
      title: 'Differentiated Practice Stations',
      sessionType: 'Grade-Specific Stations',
      gradesInvolved: ['Class 3', 'Class 4', 'Class 5'],
      sharedObjective: 'Address specific grade curriculum requirements while teacher rotates between stations.',
      gradeTasks: [
        { grade: 'Class 3', task: 'Draw shapes on slate/paper and divide them into equal halves and thirds.' },
        { grade: 'Class 4', task: 'Pebble grouping: divide 12 and 16 stones into equal parts.' },
        { grade: 'Class 5', task: 'Textbook exercise: converting tenths into decimal notations (0.1 to 0.9).' }
      ],
      resources: ['Pebbles or stones', 'Paper', 'Textbooks'],
      teachingNotes: 'Spend first 25 min guiding Class 3, then 25 min with Class 5, while Class 4 works in pebble pairs.'
    },
    {
      id: 'sess-mon-3',
      day: 'Monday',
      startTime: '11:15',
      durationMinutes: 60,
      title: 'Peer Learning & Daily Wrap-Up',
      sessionType: 'Peer Learning',
      gradesInvolved: ['Class 3', 'Class 4', 'Class 5'],
      sharedObjective: 'Senior students reinforce junior concepts through explanation and verification.',
      gradeTasks: [
        { grade: 'Class 3', task: 'Show fraction paper folds to Class 5 partner.' },
        { grade: 'Class 4', task: 'Verify pebble counts with desk partner.' },
        { grade: 'Class 5', task: 'Check Class 3 paper folds and explain why 1/2 equals 0.5.' }
      ],
      resources: ['Paper', 'Pencils'],
      teachingNotes: 'Conduct a 5-minute chalkboard flash check before concluding.'
    },

    // TUESDAY (3 hours = 180 min)
    {
      id: 'sess-tue-1',
      day: 'Tuesday',
      startTime: '09:00',
      durationMinutes: 45,
      title: 'Shared Lesson: Groups, Sets & Multiplication Foundations',
      topicId: 't-c4-mult',
      sessionType: 'Shared Lesson',
      gradesInvolved: ['Class 3', 'Class 4', 'Class 5'],
      sharedObjective: 'Connect repeated addition to array multiplication and proportional grouping.',
      gradeTasks: [
        { grade: 'Class 3', task: 'Repeated addition practice: 3 + 3 + 3 = 9 with bottle caps.' },
        { grade: 'Class 4', task: 'Arranging 3 rows of 4 bottle caps to show 3 × 4 = 12.' },
        { grade: 'Class 5', task: 'Multi-digit multiplication area models with chalk.' }
      ],
      resources: ['Bottle caps', 'Chalk and blackboard'],
      teachingNotes: 'Demonstrate array grid on blackboard using simple chalk dots.'
    },
    {
      id: 'sess-tue-2',
      day: 'Tuesday',
      startTime: '09:50',
      durationMinutes: 75,
      title: 'Focused Practice: Decimals & Word Problem Basics',
      sessionType: 'Grade-Specific Stations',
      gradesInvolved: ['Class 3', 'Class 4', 'Class 5'],
      sharedObjective: 'Intensive practice on the primary gap areas identified in Monday diagnostic.',
      gradeTasks: [
        { grade: 'Class 3', task: 'Multi-digit addition with carry-over practice.' },
        { grade: 'Class 4', task: 'Deciphering 1-step word problem cards using cue words.' },
        { grade: 'Class 5', task: 'Connecting 1/4 = 0.25 and 3/4 = 0.75 using ruler/chalk lines.' }
      ],
      resources: ['Reusable cards', 'Textbooks', 'Paper'],
      teachingNotes: 'Target Class 5 decimal misconceptions first while Class 3 does workbook calculations.'
    },
    {
      id: 'sess-tue-3',
      day: 'Tuesday',
      startTime: '11:15',
      durationMinutes: 60,
      title: 'Courtyard Number Line Jump & Summary',
      sessionType: 'Formative Check & Review',
      gradesInvolved: ['Class 3', 'Class 4', 'Class 5'],
      sharedObjective: 'Physical kinesthetic reinforcement of number sense and fractional values.',
      gradeTasks: [
        { grade: 'Class 3', task: 'Jump to integers and middle halves.' },
        { grade: 'Class 4', task: 'Jump to quarters on chalk court.' },
        { grade: 'Class 5', task: 'Jump to decimal positions (0.2, 0.7).' }
      ],
      resources: ['Chalk and blackboard'],
      teachingNotes: 'Fast, high-energy exercise in courtyard before midday meal.'
    },

    // WEDNESDAY (3 hours = 180 min)
    {
      id: 'sess-wed-1',
      day: 'Wednesday',
      startTime: '09:00',
      durationMinutes: 45,
      title: 'Shared Lesson: Decoding Word Problems from Everyday Scenarios',
      topicId: 't-c4-word',
      sessionType: 'Shared Lesson',
      gradesInvolved: ['Class 3', 'Class 4', 'Class 5'],
      sharedObjective: 'Deconstruct word problems into simple "Given", "Asked", and "Operation" steps.',
      gradeTasks: [
        { grade: 'Class 3', task: 'Identify if a problem asks for adding or taking away.' },
        { grade: 'Class 4', task: 'Circle key numbers and action words (total, each, left).' },
        { grade: 'Class 5', task: 'Identify two separate operations needed in multi-step problems.' }
      ],
      resources: ['Chalk and blackboard', 'Reusable cards'],
      teachingNotes: 'Use real-world agricultural harvest examples (bags of grain, egg baskets).'
    },
    {
      id: 'sess-wed-2',
      day: 'Wednesday',
      startTime: '09:50',
      durationMinutes: 75,
      title: 'Village Market Simulation Workshop',
      sessionType: 'Peer Learning',
      gradesInvolved: ['Class 3', 'Class 4', 'Class 5'],
      sharedObjective: 'Cross-grade simulated transactions practicing mental math and change calculation.',
      gradeTasks: [
        { grade: 'Class 3', task: 'Buyer: pays with bottle cap tokens and counts change.' },
        { grade: 'Class 4', task: 'Calculate bill total for 2 items.' },
        { grade: 'Class 5', task: 'Shopkeeper: calculates change and checks student arithmetic.' }
      ],
      resources: ['Bottle caps', 'Paper', 'Reusable cards'],
      teachingNotes: 'Students thrive with physical cap currency; great engagement for reluctant learners.'
    },
    {
      id: 'sess-wed-3',
      day: 'Wednesday',
      startTime: '11:15',
      durationMinutes: 60,
      title: 'Individual Reflection & Slates Check',
      sessionType: 'Formative Check & Review',
      gradesInvolved: ['Class 3', 'Class 4', 'Class 5'],
      sharedObjective: 'Confirm individual mastery following the group market simulation.',
      gradeTasks: [
        { grade: 'Class 3', task: 'Write 3 addition word problems solved during market.' },
        { grade: 'Class 4', task: 'Write 2 subtraction word problems.' },
        { grade: 'Class 5', task: 'Write 1 two-step word problem with complete solution steps.' }
      ],
      resources: ['Paper', 'Pencils'],
      teachingNotes: 'Collect papers to review student misconception trends.'
    },

    // THURSDAY (3 hours = 180 min)
    {
      id: 'sess-thu-1',
      day: 'Thursday',
      startTime: '09:00',
      durationMinutes: 45,
      title: 'Shared Lesson: Geometry & Visual Partitioning',
      sessionType: 'Shared Lesson',
      gradesInvolved: ['Class 3', 'Class 4', 'Class 5'],
      sharedObjective: 'Reinforce spatial fractions using sticks and perimeter concepts.',
      gradeTasks: [
        { grade: 'Class 3', task: 'Make triangles and squares using sticks of equal length.' },
        { grade: 'Class 4', task: 'Divide stick squares into 4 equal quarters.' },
        { grade: 'Class 5', task: 'Calculate perimeter and fractional areas of stick figures.' }
      ],
      resources: ['Sticks', 'Pencils'],
      teachingNotes: 'Collect dry twigs from school boundary beforehand.'
    },
    {
      id: 'sess-thu-2',
      day: 'Thursday',
      startTime: '09:50',
      durationMinutes: 75,
      title: 'Remediation Stations: Targeting the Red Zones',
      sessionType: 'Grade-Specific Stations',
      gradesInvolved: ['Class 3', 'Class 4', 'Class 5'],
      sharedObjective: 'Direct teacher intervention on lowest scoring topics before Friday review.',
      gradeTasks: [
        { grade: 'Class 3', task: 'Focused teacher group on fraction strips (45% understanding cohort).' },
        { grade: 'Class 4', task: 'Guided group on 1-step word problem cue decoding.' },
        { grade: 'Class 5', task: 'Decimals to fractions chart compilation.' }
      ],
      resources: ['Paper', 'Chalk and blackboard', 'Textbooks'],
      teachingNotes: 'Give high-confidence Class 5 students leadership over peer buddy stations.'
    },
    {
      id: 'sess-thu-3',
      day: 'Thursday',
      startTime: '11:15',
      durationMinutes: 60,
      title: 'Peer Quiz & Rapid Board Clashing',
      sessionType: 'Peer Learning',
      gradesInvolved: ['Class 3', 'Class 4', 'Class 5'],
      sharedObjective: 'Friendly multi-grade math challenge reinforcing week vocabulary.',
      gradeTasks: [
        { grade: 'Class 3', task: 'Represent fractions called out by teacher.' },
        { grade: 'Class 4', task: 'Multiply by 6, 7, 8 in rapid blackboard turns.' },
        { grade: 'Class 5', task: 'Convert fractions to decimals within 15 seconds.' }
      ],
      resources: ['Chalk and blackboard'],
      teachingNotes: 'Maintain light, encouraging atmosphere. Praise effort and explanation.'
    },

    // FRIDAY (3 hours = 180 min)
    {
      id: 'sess-fri-1',
      day: 'Friday',
      startTime: '09:00',
      durationMinutes: 50,
      title: 'Weekly Formative Understanding Assessment',
      sessionType: 'Formative Check & Review',
      gradesInvolved: ['Class 3', 'Class 4', 'Class 5'],
      sharedObjective: 'Calm, low-stress individual assessment of week learning gains across all 3 grades.',
      gradeTasks: [
        { grade: 'Class 3', task: '4-item check: 2 fraction shading questions, 2 addition problems.' },
        { grade: 'Class 4', task: '4-item check: 2 pebble fraction problems, 2 word problems.' },
        { grade: 'Class 5', task: '4-item check: 2 decimal conversions, 2 multi-step problems.' }
      ],
      resources: ['Paper', 'Pencils'],
      teachingNotes: 'Stress that this check helps the teacher plan better games and activities next week.'
    },
    {
      id: 'sess-fri-2',
      day: 'Friday',
      startTime: '09:55',
      durationMinutes: 70,
      title: 'Celebration Math Games & Courtyard Display',
      sessionType: 'Shared Lesson',
      gradesInvolved: ['Class 3', 'Class 4', 'Class 5'],
      sharedObjective: 'Showcase student created fraction strips, stick models, and pebble arrays.',
      gradeTasks: [
        { grade: 'Class 3', task: 'Pin fraction strips to display string.' },
        { grade: 'Class 4', task: 'Demonstrate stick multiplication to junior classes.' },
        { grade: 'Class 5', task: 'Explain the 0.5 = 1/2 number line jump to all students.' }
      ],
      resources: ['Paper', 'Sticks', 'Pebbles or stones'],
      teachingNotes: 'Invites sense of community pride; reinforces cross-grade mentorship.'
    },
    {
      id: 'sess-fri-3',
      day: 'Friday',
      startTime: '11:10',
      durationMinutes: 60,
      title: 'Teacher Planning & Student Free Reading/Drawing',
      sessionType: 'Formative Check & Review',
      gradesInvolved: ['Class 3', 'Class 4', 'Class 5'],
      sharedObjective: 'Teacher records weekly score progress in RuralClass and plans next week interventions.',
      gradeTasks: [
        { grade: 'Class 3', task: 'Independent math drawing and coloring on slates.' },
        { grade: 'Class 4', task: 'Textbook story problems reading.' },
        { grade: 'Class 5', task: 'Math puzzle solving in pairs.' }
      ],
      resources: ['Textbooks', 'Paper', 'Pencils'],
      teachingNotes: 'Use this uninterrupted period to update the topic understanding sliders in the app.'
    }
  ]
};

export const INITIAL_USER_SETTINGS: UserSettings = {
  teacherName: 'Teacher Sunita Devi',
  classroomName: 'Rural Learning Centre, Block B',
  preferredLanguage: 'English',
  timeFormat: '12-hour',
  defaultHoursPerDay: 3,
  enableTips: true
};

export const INITIAL_STUDENTS: Student[] = [
  // Class 3 Students
  {
    id: 'stud-301',
    rollNo: '301',
    name: 'Aarav Sharma',
    grade: 'Class 3',
    attendancePct: 92,
    topicScores: {
      't-c3-frac': 40,
      't-c3-add': 85,
      't-c3-place': 70
    },
    averageScore: 65,
    needsCheckin: true,
    peerRole: 'Needs Support',
    pairedStudentId: 'stud-501',
    pairedStudentName: 'Vikram Singh (Class 5)',
    notes: 'Understands halves with paper folding, but struggles with 1/3 and 1/4 on slate.',
    lastAssessmentDate: '2026-10-28',
    personalizedPlan: {
      id: 'plan-aarav',
      studentId: 'stud-301',
      studentName: 'Aarav Sharma',
      grade: 'Class 3',
      generatedAt: '2026-10-30T09:00:00Z',
      diagnosedRootGap: 'Equal partition symmetry in single wholes (Class 3 Fractions at 40%).',
      targetTopic: 'Understanding Fractions',
      checkinActivity: {
        title: '5-Minute Paper Strip Equal Fold Check',
        durationMinutes: 5,
        instruction: 'Ask Aarav to fold a paper strip into 4 parts and verify if each part is congruent by overlapping edges.',
        materials: ['Paper strip', 'Pencil']
      },
      independentStationTask: 'Color 1/4 of drawn rectangular shapes on slate.',
      suggestedPeerBuddy: {
        studentId: 'stud-501',
        name: 'Vikram Singh',
        grade: 'Class 5',
        guidance: 'Vikram guides Aarav to count only equal parts during Friday group time.'
      },
      teacherTip: 'Praise Aarav for physical accuracy before introducing fraction notation 1/4.',
      status: 'Approved'
    }
  },
  {
    id: 'stud-302',
    rollNo: '302',
    name: 'Priya Kumari',
    grade: 'Class 3',
    attendancePct: 95,
    topicScores: {
      't-c3-frac': 48,
      't-c3-add': 88,
      't-c3-place': 76
    },
    averageScore: 71,
    needsCheckin: false,
    peerRole: 'Steady Learner',
    notes: 'Enjoys drawing shapes on slate; rapidly improving in addition.',
    lastAssessmentDate: '2026-10-28'
  },
  {
    id: 'stud-303',
    rollNo: '303',
    name: 'Rahul Verma',
    grade: 'Class 3',
    attendancePct: 98,
    topicScores: {
      't-c3-frac': 72,
      't-c3-add': 92,
      't-c3-place': 82
    },
    averageScore: 82,
    needsCheckin: false,
    peerRole: 'Peer Mentor',
    notes: 'High confidence with stick bundling; can assist Kavita.',
    lastAssessmentDate: '2026-10-28'
  },
  {
    id: 'stud-304',
    rollNo: '304',
    name: 'Kavita Devi',
    grade: 'Class 3',
    attendancePct: 78,
    topicScores: {
      't-c3-frac': 35,
      't-c3-add': 78,
      't-c3-place': 62
    },
    averageScore: 58,
    needsCheckin: true,
    peerRole: 'Needs Support',
    pairedStudentId: 'stud-303',
    pairedStudentName: 'Rahul Verma (Class 3)',
    notes: 'Frequently misses school on harvest days; needs catch-up on equal shares.',
    lastAssessmentDate: '2026-10-28',
    personalizedPlan: {
      id: 'plan-kavita',
      studentId: 'stud-304',
      studentName: 'Kavita Devi',
      grade: 'Class 3',
      generatedAt: '2026-10-30T09:00:00Z',
      diagnosedRootGap: 'Missing attendance during foundational fraction introduction.',
      targetTopic: 'Understanding Fractions',
      checkinActivity: {
        title: '5-Minute Biscuit/Roti Sharing Simulation',
        durationMinutes: 5,
        instruction: 'Use two cardboard disks to practice dividing equally between 2 and 4 children.',
        materials: ['Cardboard disks or leaves', 'Chalk']
      },
      independentStationTask: 'Trace and divide circles into halves and quarters on blackboard slate.',
      suggestedPeerBuddy: {
        studentId: 'stud-303',
        name: 'Rahul Verma',
        grade: 'Class 3',
        guidance: 'Rahul shares his folded paper strips with Kavita during morning arrival.'
      },
      teacherTip: 'Focus on verbal reasoning ("Are the two pieces the same size?") before written numbers.',
      status: 'Approved'
    }
  },

  // Class 4 Students
  {
    id: 'stud-401',
    rollNo: '401',
    name: 'Meena Patel',
    grade: 'Class 4',
    attendancePct: 90,
    topicScores: {
      't-c4-frac': 42,
      't-c4-word': 36,
      't-c4-mult': 68
    },
    averageScore: 49,
    needsCheckin: true,
    peerRole: 'Needs Support',
    pairedStudentId: 'stud-504',
    pairedStudentName: 'Lakshmi Reddy (Class 5)',
    notes: 'Struggles with word problem language decoding; confuses "in all" with "left over".',
    lastAssessmentDate: '2026-10-28',
    personalizedPlan: {
      id: 'plan-meena',
      studentId: 'stud-401',
      studentName: 'Meena Patel',
      grade: 'Class 4',
      generatedAt: '2026-10-30T09:00:00Z',
      diagnosedRootGap: 'Sentence cue decoding in word problems & set partition (Class 4 Word Problems at 36%).',
      targetTopic: 'Word Problems (1-Step)',
      checkinActivity: {
        title: '5-Minute Market Cue Card Check',
        durationMinutes: 5,
        instruction: 'Show Meena 2 short flashcards: circle the action words ("buys more", "gives away") before doing arithmetic.',
        materials: ['Flashcards', 'Pencil']
      },
      independentStationTask: 'Act out 2 market transactions using bottle caps as coins.',
      suggestedPeerBuddy: {
        studentId: 'stud-504',
        name: 'Lakshmi Reddy',
        grade: 'Class 5',
        guidance: 'Lakshmi acts as village shopkeeper while Meena computes the change.'
      },
      teacherTip: 'Encourage Meena to narrate the math story aloud in her mother tongue first.',
      status: 'Approved'
    }
  },
  {
    id: 'stud-402',
    rollNo: '402',
    name: 'Raju Kumar',
    grade: 'Class 4',
    attendancePct: 88,
    topicScores: {
      't-c4-frac': 52,
      't-c4-word': 44,
      't-c4-mult': 65
    },
    averageScore: 54,
    needsCheckin: true,
    peerRole: 'Needs Support',
    pairedStudentId: 'stud-403',
    pairedStudentName: 'Sunita Sah (Class 4)',
    notes: 'Understands fractions when using pebbles in courtyard; slow with pencil-paper workbook.',
    lastAssessmentDate: '2026-10-28',
    personalizedPlan: {
      id: 'plan-raju',
      studentId: 'stud-402',
      studentName: 'Raju Kumar',
      grade: 'Class 4',
      generatedAt: '2026-10-30T09:00:00Z',
      diagnosedRootGap: 'Bridging physical pebble sets to formal fractional representation (1/3 of 12).',
      targetTopic: 'Fractions of a Group',
      checkinActivity: {
        title: '5-Minute Pebble Partition Verification',
        durationMinutes: 5,
        instruction: 'Ask Raju to divide 12 pebbles into 4 chalk circles. What fraction is 1 circle?',
        materials: ['12 pebbles', 'Chalk']
      },
      independentStationTask: 'Write down fractions for 3 circles out of 4 circles with pebbles.',
      suggestedPeerBuddy: {
        studentId: 'stud-403',
        name: 'Sunita Sah',
        grade: 'Class 4',
        guidance: 'Sunita checks that Raju writes denominator 4, not 3.'
      },
      teacherTip: 'Keep pebbles on desk as a permissible thinking tool during tests.',
      status: 'Approved'
    }
  },
  {
    id: 'stud-403',
    rollNo: '403',
    name: 'Sunita Sah',
    grade: 'Class 4',
    attendancePct: 96,
    topicScores: {
      't-c4-frac': 74,
      't-c4-word': 70,
      't-c4-mult': 82
    },
    averageScore: 75,
    needsCheckin: false,
    peerRole: 'Peer Mentor',
    notes: 'Reliable peer mentor candidate for Class 3 or peer partner for Raju.',
    lastAssessmentDate: '2026-10-28'
  },
  {
    id: 'stud-404',
    rollNo: '404',
    name: 'Amit Yadav',
    grade: 'Class 4',
    attendancePct: 94,
    topicScores: {
      't-c4-frac': 48,
      't-c4-word': 40,
      't-c4-mult': 66
    },
    averageScore: 51,
    needsCheckin: false,
    peerRole: 'Steady Learner',
    notes: 'Needs additional practice with times tables 7 and 8 using stick arrays.',
    lastAssessmentDate: '2026-10-28'
  },

  // Class 5 Students
  {
    id: 'stud-501',
    rollNo: '501',
    name: 'Vikram Singh',
    grade: 'Class 5',
    attendancePct: 98,
    topicScores: {
      't-c5-dec': 78,
      't-c5-mult': 88,
      't-c5-word': 76
    },
    averageScore: 81,
    needsCheckin: false,
    peerRole: 'Peer Mentor',
    pairedStudentId: 'stud-301',
    pairedStudentName: 'Aarav Sharma (Class 3)',
    notes: 'Strong in mental math; excellent student tutor for Class 3 during Friday courtyard games.',
    lastAssessmentDate: '2026-10-28'
  },
  {
    id: 'stud-502',
    rollNo: '502',
    name: 'Ananya Ghosh',
    grade: 'Class 5',
    attendancePct: 92,
    topicScores: {
      't-c5-dec': 38,
      't-c5-mult': 76,
      't-c5-word': 46
    },
    averageScore: 53,
    needsCheckin: true,
    peerRole: 'Needs Support',
    pairedStudentId: 'stud-501',
    pairedStudentName: 'Vikram Singh (Class 5)',
    notes: 'Confuses 0.5 with 0.05; needs 10-step ladder visual on blackboard.',
    lastAssessmentDate: '2026-10-28',
    personalizedPlan: {
      id: 'plan-ananya',
      studentId: 'stud-502',
      studentName: 'Ananya Ghosh',
      grade: 'Class 5',
      generatedAt: '2026-10-30T09:00:00Z',
      diagnosedRootGap: 'Concept Bridge Failure: Class 5 Decimals (38%) caused by missing tenths partitioning from Class 3 & 4 fractions.',
      targetTopic: 'Decimals & Fraction Conversion',
      checkinActivity: {
        title: '5-Minute Blackboard Chalk 10-Step Ladder Check',
        durationMinutes: 5,
        instruction: 'Draw a 10-box strip: write 1/10 above box 1, 0.1 below. Have Ananya mark 5/10 and 0.5.',
        materials: ['Chalkboard', 'Chalk']
      },
      independentStationTask: 'Convert 1/2, 1/4, 3/4 to decimals using paper strip measurement.',
      suggestedPeerBuddy: {
        studentId: 'stud-501',
        name: 'Vikram Singh',
        grade: 'Class 5',
        guidance: 'Vikram challenges Ananya with fraction-to-decimal card matching.'
      },
      teacherTip: 'Show that 0.5 and 1/2 are just two ways of saying "half of the roti".',
      status: 'Approved'
    }
  },
  {
    id: 'stud-503',
    rollNo: '503',
    name: 'Suresh Boro',
    grade: 'Class 5',
    attendancePct: 90,
    topicScores: {
      't-c5-dec': 44,
      't-c5-mult': 80,
      't-c5-word': 50
    },
    averageScore: 58,
    needsCheckin: true,
    peerRole: 'Needs Support',
    pairedStudentId: 'stud-504',
    pairedStudentName: 'Lakshmi Reddy (Class 5)',
    notes: 'Missing fraction-decimal bridge from Class 4; good in multiplication computation.',
    lastAssessmentDate: '2026-10-28',
    personalizedPlan: {
      id: 'plan-suresh',
      studentId: 'stud-503',
      studentName: 'Suresh Boro',
      grade: 'Class 5',
      generatedAt: '2026-10-30T09:00:00Z',
      diagnosedRootGap: 'Decimal place value misunderstanding (tenths vs hundredths).',
      targetTopic: 'Decimals & Fraction Conversion',
      checkinActivity: {
        title: '5-Minute Bottle Cap Decimal Place Value Trading',
        durationMinutes: 5,
        instruction: 'Use small seeds as hundredths and bottle caps as tenths. Represent 0.34.',
        materials: ['Bottle caps', 'Seeds / Pebbles']
      },
      independentStationTask: 'Complete 4 decimal expansion problems in notebook.',
      suggestedPeerBuddy: {
        studentId: 'stud-504',
        name: 'Lakshmi Reddy',
        grade: 'Class 5',
        guidance: 'Lakshmi reviews Suresh’s notebook before Friday assessment.'
      },
      teacherTip: 'Reinforce that decimal point marks the boundary between whole units and parts.',
      status: 'Approved'
    }
  },
  {
    id: 'stud-504',
    rollNo: '504',
    name: 'Lakshmi Reddy',
    grade: 'Class 5',
    attendancePct: 96,
    topicScores: {
      't-c5-dec': 72,
      't-c5-mult': 82,
      't-c5-word': 68
    },
    averageScore: 74,
    needsCheckin: false,
    peerRole: 'Peer Mentor',
    notes: 'Enjoys village market roleplay; patient in explaining steps to Class 4 students.',
    lastAssessmentDate: '2026-10-28'
  }
];

