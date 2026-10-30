import { ClassroomConfig, Topic, ConceptNode, WeeklyPlan, LessonSession } from '../types';

interface PlanGenerationOptions {
  classroom: ClassroomConfig;
  topics: Topic[];
  conceptNodes: ConceptNode[];
  totalWeeklyHours?: number;
  focusTopicId?: string;
  focusGrade?: string;
  planName?: string;
}

export function generateWeeklyPlan(options: PlanGenerationOptions): WeeklyPlan {
  const {
    classroom,
    topics,
    conceptNodes,
    totalWeeklyHours = classroom.daysPerWeek * classroom.hoursPerDay,
    focusTopicId,
    focusGrade,
    planName
  } = options;

  // 1. Identify weak topics across configured grades (< 55% understanding)
  const weakTopics = topics.filter(t => 
    classroom.grades.includes(t.grade) && t.understandingLevel < 60
  ).sort((a, b) => a.understandingLevel - b.understandingLevel);

  // Fallback to in-progress topics if none are weak
  const targetTopics = weakTopics.length > 0 
    ? weakTopics 
    : topics.filter(t => classroom.grades.includes(t.grade));

  // Determine key thematic bridge: Fractions, Multiplication, or Word Problems
  const hasFractionGap = targetTopics.some(t => t.name.toLowerCase().includes('frac') || t.name.toLowerCase().includes('dec'));
  const hasWordProblemGap = targetTopics.some(t => t.name.toLowerCase().includes('word') || t.name.toLowerCase().includes('problem'));
  const hasMultiplicationGap = targetTopics.some(t => t.name.toLowerCase().includes('mult') || t.name.toLowerCase().includes('arith'));

  // Classroom available materials filter
  const hasPaper = classroom.resources.some(r => r.toLowerCase().includes('paper'));
  const hasPebbles = classroom.resources.some(r => r.toLowerCase().includes('pebble') || r.toLowerCase().includes('stone'));
  const hasBottleCaps = classroom.resources.some(r => r.toLowerCase().includes('cap'));
  const hasSticks = classroom.resources.some(r => r.toLowerCase().includes('stick'));
  const hasCards = classroom.resources.some(r => r.toLowerCase().includes('card'));
  const hasTextbooks = classroom.resources.some(r => r.toLowerCase().includes('textbook'));

  // Calculate daily duration allocation
  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = 
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].slice(0, classroom.daysPerWeek) as any;

  const minutesPerDay = Math.round((totalWeeklyHours * 60) / days.length);

  // Divide daily minutes into 3 pedagogical blocks:
  // 1. Shared Anchor Lesson (25-30%)
  // 2. Differentiated Stations & Guided Practice (40-45%)
  // 3. Peer Mentorship & Quick Formative Check (30-35%)
  const sharedDuration = Math.round(minutesPerDay * 0.28);
  const stationDuration = Math.round(minutesPerDay * 0.42);
  const peerDuration = minutesPerDay - sharedDuration - stationDuration;

  const sessions: LessonSession[] = [];

  days.forEach((day, dayIndex) => {
    let dayTheme = '';
    let sharedTitle = '';
    let sharedObj = '';
    let grade3Task = '';
    let grade4Task = '';
    let grade5Task = '';
    let resourcesForShared: string[] = ['Chalk and blackboard'];
    let stationTitle = '';
    let stationG3 = '';
    let stationG4 = '';
    let stationG5 = '';
    let resourcesForStation: string[] = ['Textbooks'];
    let peerTitle = '';
    let peerG3 = '';
    let peerG4 = '';
    let peerG5 = '';
    let resourcesForPeer: string[] = ['Paper', 'Pencils'];

    if (dayIndex === 0) {
      // Monday: Shared Anchor on core conceptual root
      if (hasFractionGap || focusTopicId?.includes('frac') || focusTopicId?.includes('dec')) {
        sharedTitle = 'Shared Anchor: The Geometry of Equal Shares & Wholes';
        sharedObj = 'Demystify fractions as equal parts of 1 whole or 1 set using physical division models.';
        grade3Task = hasPaper 
          ? 'Fold strips into 2 & 4 equal parts; shade 1/2 and 1/4 with pencil.' 
          : 'Draw geometric squares and split into symmetrical halves.';
        grade4Task = hasPaper 
          ? 'Fold 8-part strips; compare why 2/4 and 4/8 cover the same length as 1/2.' 
          : 'Create fraction bars on slates comparing quarters to halves.';
        grade5Task = 'Divide a 10-segment chalk bar; link 1/10 to 0.1 and 5/10 to 0.5.';
        if (hasPaper) resourcesForShared.push('Paper');

        stationTitle = 'Differentiated Foundation Stations';
        stationG3 = 'Practice identifying equal vs unequal splits in drawn shapes.';
        stationG4 = hasPebbles ? 'Group 12 and 16 pebbles into equal sets to find 1/3 and 1/4.' : 'Solve set division problems on slate.';
        stationG5 = 'Solve textbook conversion problems: turning simple fractions into decimals.';
        if (hasPebbles) resourcesForStation.push('Pebbles or stones');

        peerTitle = 'Cross-Grade Fraction Fold Verification';
        peerG3 = 'Explain your folded paper half to your Class 5 partner.';
        peerG4 = 'Share stone partition models with Class 3 peer.';
        peerG5 = 'Check Class 3 fold accuracy; demonstrate decimal equivalence (1/2 = 0.5).';
      } else {
        sharedTitle = 'Shared Anchor: Number Patterns & Place Value Systems';
        sharedObj = 'Ground arithmetic operations in physical groupings of tens and hundreds.';
        grade3Task = 'Bundle 10s and units using sticks or tally marks.';
        grade4Task = 'Build 3-digit numbers and practice place value decomposition.';
        grade5Task = 'Explore place values beyond 1,000 and tenths place relationships.';

        stationTitle = 'Station Practice: Place Value Work';
        stationG3 = 'Addition with carrying up to 100.';
        stationG4 = 'Multiplication facts via grid grouping.';
        stationG5 = 'Multi-digit operations and estimation.';

        peerTitle = 'Peer Counting Challenge';
        peerG3 = 'Count by 5s and 10s with partner.';
        peerG4 = 'Time partner solving multiplication flash cards.';
        peerG5 = 'Mentor younger students through tricky carry-overs.';
      }
    } else if (dayIndex === 1) {
      // Tuesday: Application & Grouping
      sharedTitle = 'Shared Workshop: Groups, Arrays & Mathematical Relations';
      sharedObj = 'Link repeated addition to structured multiplication arrays and fractional shares.';
      grade3Task = hasBottleCaps ? 'Build 3 groups of 4 bottle caps to show 3 × 4.' : 'Draw repeated addition arrays (2+2+2+2).';
      grade4Task = hasBottleCaps ? 'Rearrange 24 caps into 2×12, 3×8, and 4×6 arrays.' : 'Solve 2-digit by 1-digit multiplication problems.';
      grade5Task = 'Find factors and express fractional groups of arrays.';
      if (hasBottleCaps) resourcesForShared.push('Bottle caps');

      stationTitle = 'Focused Remediation Stations';
      stationG3 = 'Guided teacher group: verifying equal shape splits.';
      stationG4 = hasCards ? 'Match question cards with corresponding arithmetic models.' : 'Textbook word problem practice.';
      stationG5 = 'Practice decimal place value on vertical number charts.';

      peerTitle = 'Courtyard Number Jump Challenge';
      peerG3 = 'Jump along courtyard line to integer markers.';
      peerG4 = 'Jump to quarter and half distance marks.';
      peerG5 = 'Place decimal flags along line (0.25, 0.5, 0.75).';
      resourcesForPeer.push('Chalk and blackboard');
    } else if (dayIndex === 2) {
      // Wednesday: Word Problems & Practical Context
      sharedTitle = 'Shared Lesson: Decoding Practical Problem Scenarios';
      sharedObj = 'Break down rural village transactions into clear mathematical operations.';
      grade3Task = 'Identify whether a marketplace story means adding or subtracting.';
      grade4Task = 'Underline clue words: "altogether", "each", "remaining".';
      grade5Task = 'Deconstruct 2-step problems into Step 1 and Step 2 calculations.';

      stationTitle = 'Village Market Simulation Stations';
      stationG3 = 'Purchase items with bottle cap tokens; verify single coins.';
      stationG4 = 'Calculate bill totals for 2 items from market price list.';
      stationG5 = 'Act as shopkeeper; compute change accurately using subtraction.';
      if (hasBottleCaps) resourcesForStation.push('Bottle caps');
      if (hasCards) resourcesForStation.push('Reusable cards');

      peerTitle = 'Math Storytelling Pairs';
      peerG3 = 'Narrate a shopping story to partner.';
      peerG4 = 'Write out equation for partner story.';
      peerG5 = 'Check calculations and suggest a challenge step.';
    } else if (dayIndex === 3) {
      // Thursday: Hands-on Exploration
      sharedTitle = 'Shared Workshop: Tangible Geometry & Measurement Models';
      sharedObj = 'Use sticks, strings, or pebbles to understand shapes, perimeter, and partitions.';
      grade3Task = hasSticks ? 'Form closed polygons with 3 and 4 equal sticks.' : 'Draw triangles and squares with equal sides.';
      grade4Task = hasSticks ? 'Construct rectangles and divide inside area into equal segments.' : 'Calculate perimeter of rectangular drawings.';
      grade5Task = 'Determine fractional area ratios in combined stick figures.';
      if (hasSticks) resourcesForShared.push('Sticks');

      stationTitle = 'Targeted Red-Zone Intervention';
      stationG3 = 'Teacher-led station: reviewing weak topics with tangible manipulatives.';
      stationG4 = 'Independent workbook task with peer check partner.';
      stationG5 = 'Decimal-to-fraction speed matching cards.';

      peerTitle = 'Rapid Blackboard Quiz & Relay';
      peerG3 = 'Quickly draw a fraction called by teacher.';
      peerG4 = 'Multiply factors called out in rapid succession.';
      peerG5 = 'Convert decimal values to simplified fractions.';
      resourcesForPeer.push('Chalk and blackboard');
    } else {
      // Friday: Formative Review & Planning
      sharedTitle = 'Whole-Class Review & Courtyard Exhibition';
      sharedObj = 'Celebrate weekly learning gains, display student manipulatives, and assess progress.';
      grade3Task = 'Present paper fraction folds and explain half vs quarter to the room.';
      grade4Task = 'Demonstrate pebble grouping solution on blackboard.';
      grade5Task = 'Explain decimal equivalence on the 10-step chalk ladder.';

      stationTitle = 'Low-Stress Formative Understanding Check';
      stationG3 = '4-question mini check on paper/slate (2 fractions, 2 additions).';
      stationG4 = '4-question check (2 group fractions, 2 word problems).';
      stationG5 = '4-question check (2 decimal conversions, 2 multi-step problems).';

      peerTitle = 'Learning Log Review & Partner Praise';
      peerG3 = 'Review week drawings with Class 4 buddy.';
      peerG4 = 'Highlight favorite new math trick learned this week.';
      peerG5 = 'Provide feedback to teacher on which concepts still feel tricky.';
    }

    // Push 3 sessions for each day
    // Session 1: Shared Anchor
    sessions.push({
      id: `sess-${day.toLowerCase()}-1`,
      day,
      startTime: '09:00',
      durationMinutes: sharedDuration,
      title: sharedTitle,
      topicId: focusTopicId || (targetTopics[0]?.id),
      sessionType: 'Shared Lesson',
      gradesInvolved: classroom.grades,
      sharedObjective: sharedObj,
      gradeTasks: [
        { grade: 'Class 3', task: grade3Task },
        { grade: 'Class 4', task: grade4Task },
        { grade: 'Class 5', task: grade5Task }
      ].filter(gt => classroom.grades.includes(gt.grade)),
      resources: resourcesForShared,
      teachingNotes: `Open with whole-class inquiry. Ensure Class 3 feels included while Class 5 sees the higher-order connection.`
    });

    // Session 2: Differentiated Stations
    const startTime2 = formatMinutesToTime(9 * 60 + sharedDuration + 10);
    sessions.push({
      id: `sess-${day.toLowerCase()}-2`,
      day,
      startTime: startTime2,
      durationMinutes: stationDuration,
      title: stationTitle,
      sessionType: 'Grade-Specific Stations',
      gradesInvolved: classroom.grades,
      sharedObjective: 'Rotate teacher attention across grade clusters while others engage in purposeful independent work.',
      gradeTasks: [
        { grade: 'Class 3', task: stationG3 },
        { grade: 'Class 4', task: stationG4 },
        { grade: 'Class 5', task: stationG5 }
      ].filter(gt => classroom.grades.includes(gt.grade)),
      resources: resourcesForStation,
      teachingNotes: `Allocate 15-20 min direct coaching to the lowest-performing grade today, with independent exercises for the rest.`
    });

    // Session 3: Peer Learning & Wrap-up
    const startTime3 = formatMinutesToTime(9 * 60 + sharedDuration + 10 + stationDuration + 10);
    sessions.push({
      id: `sess-${day.toLowerCase()}-3`,
      day,
      startTime: startTime3,
      durationMinutes: peerDuration,
      title: peerTitle,
      sessionType: dayIndex === 4 ? 'Formative Check & Review' : 'Peer Learning',
      gradesInvolved: classroom.grades,
      sharedObjective: 'Reinforce concepts through peer articulation, verbalization, and quick formative checks.',
      gradeTasks: [
        { grade: 'Class 3', task: peerG3 },
        { grade: 'Class 4', task: peerG4 },
        { grade: 'Class 5', task: peerG5 }
      ].filter(gt => classroom.grades.includes(gt.grade)),
      resources: resourcesForPeer,
      teachingNotes: `Pair students deliberately (e.g. Class 5 mentor with Class 4 learner). Celebrate effort and peer support.`
    });
  });

  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPlannedHours = Math.round((totalMinutes / 60) * 10) / 10;

  const titlePrefix = planName || (focusTopicId ? `Adaptive Remediation: ${targetTopics[0]?.name || 'Targeted Review'}` : 'Weekly Multi-Grade Integrated Plan');

  return {
    id: `plan-${Date.now()}`,
    name: titlePrefix,
    weekLabel: 'Next Week (Monday – Friday)',
    classroomName: classroom.name,
    gradesCovered: classroom.grades,
    sessions,
    status: 'Draft',
    lastUpdated: new Date().toISOString(),
    totalPlannedHours,
    maxAvailableHours: totalWeeklyHours,
    notes: `Generated based on ${weakTopics.length} priority topics. Integrates ${classroom.resources.length} available local resources with multi-grade peer scaffolding.`
  };
}

function formatMinutesToTime(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const padH = h.toString().padStart(2, '0');
  const padM = m.toString().padStart(2, '0');
  return `${padH}:${padM}`;
}
