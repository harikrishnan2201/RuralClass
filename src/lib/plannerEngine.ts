import { ClassroomConfig, Topic, ConceptNode, WeeklyPlan, LessonSession, GradeTask } from '../types';
import { WEAK_THRESHOLD } from '../shared/constants';

export interface PlanGenerationOptions {
  classroom: ClassroomConfig;
  topics: Topic[];
  conceptNodes: ConceptNode[];
  totalWeeklyHours?: number;
  focusTopicId?: string;
  focusGrade?: string;
  planName?: string;
}

export interface RootCauseResult {
  rootTopicId: string;
  rootTopicName: string;
  rootGrade: string;
  understandingLevel: number;
  chain: string[];
}

/**
 * Walks prerequisiteTopicId and ConceptNode.prerequisites to find the deepest weak ancestor topic.
 */
export function rootCauseFor(
  startTopicId: string,
  topics: Topic[],
  conceptNodes: ConceptNode[] = []
): RootCauseResult {
  const topicMap = new Map<string, Topic>(topics.map(t => [t.id, t]));
  // Map concept node ID to topic ID if possible, or build by name matching
  const nodeMap = new Map<string, ConceptNode>(conceptNodes.map(n => [n.id, n]));

  const visited = new Set<string>();
  let currentTopic = topicMap.get(startTopicId);

  if (!currentTopic) {
    return {
      rootTopicId: startTopicId,
      rootTopicName: startTopicId,
      rootGrade: '',
      understandingLevel: 100,
      chain: [startTopicId]
    };
  }

  const chain: string[] = [currentTopic.name];
  let deepestWeak = currentTopic;

  let currentId: string | undefined = startTopicId;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const topic = topicMap.get(currentId);
    if (!topic) break;

    if (topic.understandingLevel < WEAK_THRESHOLD) {
      deepestWeak = topic;
    }

    // Try prerequisiteTopicId directly on Topic
    if (topic.prerequisiteTopicId && topicMap.has(topic.prerequisiteTopicId)) {
      currentId = topic.prerequisiteTopicId;
      const nextTopic = topicMap.get(currentId)!;
      chain.push(nextTopic.name);
      continue;
    }

    // Fall back to ConceptNode prerequisites if available
    const correspondingNode = conceptNodes.find(
      n => n.id === topic.id || n.name.toLowerCase() === topic.name.toLowerCase()
    );

    if (correspondingNode && correspondingNode.prerequisites.length > 0) {
      // Find the first prerequisite node that maps to a topic
      let foundPrereqTopic: Topic | undefined;
      for (const prereqNodeId of correspondingNode.prerequisites) {
        const prereqNode = nodeMap.get(prereqNodeId);
        if (prereqNode) {
          foundPrereqTopic = topics.find(
            t => t.id === prereqNode.id || t.name.toLowerCase() === prereqNode.name.toLowerCase()
          );
          if (foundPrereqTopic) break;
        }
      }

      if (foundPrereqTopic && !visited.has(foundPrereqTopic.id)) {
        currentId = foundPrereqTopic.id;
        chain.push(foundPrereqTopic.name);
        continue;
      }
    }

    break;
  }

  return {
    rootTopicId: deepestWeak.id,
    rootTopicName: deepestWeak.name,
    rootGrade: deepestWeak.grade,
    understandingLevel: deepestWeak.understandingLevel,
    chain
  };
}

// Lesson Template Definition
interface LessonTemplate {
  key: string;
  theme: string;
  sharedTitle: string;
  sharedObjective: string;
  stationTitle: string;
  peerTitle: string;
  buildTasks: (grades: string[], resources: string[]) => {
    sharedTasks: GradeTask[];
    stationTasks: GradeTask[];
    peerTasks: GradeTask[];
    resourcesShared: string[];
    resourcesStation: string[];
    resourcesPeer: string[];
  };
}

function getSkillKey(topicName: string): string {
  const s = topicName.toLowerCase();
  if (s.includes('frac') || s.includes('half') || s.includes('dec')) return 'fractions';
  if (s.includes('word') || s.includes('story') || s.includes('problem')) return 'word_problems';
  if (s.includes('mult') || s.includes('table') || s.includes('array')) return 'multiplication';
  if (s.includes('add') || s.includes('place') || s.includes('carry')) return 'place_value';
  return 'general_math';
}

const LESSON_TEMPLATES: Record<string, LessonTemplate> = {
  fractions: {
    key: 'fractions',
    theme: 'Equal Partitioning & Relational Fractions',
    sharedTitle: 'Shared Anchor: The Geometry of Equal Shares & Wholes',
    sharedObjective: 'Demystify fractions as equal parts of 1 whole or 1 set using physical folding and division models.',
    stationTitle: 'Differentiated Foundation Stations: Concrete Partitions',
    peerTitle: 'Cross-Grade Fraction Fold Verification Pairs',
    buildTasks: (grades, resources) => {
      const hasPaper = resources.some(r => r.toLowerCase().includes('paper'));
      const hasPebbles = resources.some(r => r.toLowerCase().includes('pebble') || r.toLowerCase().includes('stone'));

      const sharedTasks: GradeTask[] = grades.map(g => {
        if (g.includes('3')) {
          return { grade: g, task: hasPaper ? 'Fold paper strips into 2 & 4 equal parts; shade 1/2 and 1/4 with pencil.' : 'Draw geometric squares and split into symmetrical halves.' };
        }
        if (g.includes('4')) {
          return { grade: g, task: hasPaper ? 'Fold 8-part strips; compare why 2/4 and 4/8 cover the same length as 1/2.' : 'Create fraction bars on slates comparing quarters to halves.' };
        }
        return { grade: g, task: 'Divide a 10-segment chalk line on blackboard; mark 1/10 = 0.1 and 5/10 = 0.5.' };
      });

      const stationTasks: GradeTask[] = grades.map(g => {
        if (g.includes('3')) return { grade: g, task: 'Practice identifying equal vs unequal splits in drawn shapes on slate.' };
        if (g.includes('4')) return { grade: g, task: hasPebbles ? 'Group 12 and 16 pebbles into equal sets to calculate 1/3 and 1/4 of a set.' : 'Solve set division problems on slate.' };
        return { grade: g, task: 'Convert tenths and quarters into decimals (1/4 = 0.25, 2/4 = 0.5) in notebook.' };
      });

      const peerTasks: GradeTask[] = grades.map(g => {
        if (g.includes('3')) return { grade: g, task: 'Show folded paper half to senior partner and verify edges match exactly.' };
        if (g.includes('4')) return { grade: g, task: 'Share pebble partition arrays with Class 3 peer.' };
        return { grade: g, task: 'Check Class 3 paper folds; explain decimal connection (1/2 = 0.5) to partner.' };
      });

      return {
        sharedTasks,
        stationTasks,
        peerTasks,
        resourcesShared: ['Chalk and blackboard', hasPaper ? 'Paper' : 'Slates'],
        resourcesStation: ['Textbooks', hasPebbles ? 'Pebbles or stones' : 'Bottle caps'],
        resourcesPeer: ['Paper', 'Pencils']
      };
    }
  },

  word_problems: {
    key: 'word_problems',
    theme: 'Everyday Rural Scenarios & Mathematical Operations',
    sharedTitle: 'Shared Lesson: Decoding Marketplace Problem Scenarios',
    sharedObjective: 'Break down rural village transactions into clear operations and clue-word identification.',
    stationTitle: 'Village Market Simulation Stations',
    peerTitle: 'Math Storytelling & Calculation Pairs',
    buildTasks: (grades, resources) => {
      const hasBottleCaps = resources.some(r => r.toLowerCase().includes('cap'));
      const hasCards = resources.some(r => r.toLowerCase().includes('card'));

      const sharedTasks: GradeTask[] = grades.map(g => {
        if (g.includes('3')) return { grade: g, task: 'Listen to village grocery story; point out if items are being added or taken away.' };
        if (g.includes('4')) return { grade: g, task: 'Underline key operational clues: "altogether", "each", "remaining", "shared equally".' };
        return { grade: g, task: 'Deconstruct 2-step transactions into Step 1 total and Step 2 balance calculations.' };
      });

      const stationTasks: GradeTask[] = grades.map(g => {
        if (g.includes('3')) return { grade: g, task: 'Purchase 2 vegetables using bottle cap tokens; verify total with pebbles.' };
        if (g.includes('4')) return { grade: g, task: 'Calculate bill totals for 2 items from price list and write addition sentence.' };
        return { grade: g, task: 'Act as shopkeeper; compute change accurately using column subtraction.' };
      });

      const peerTasks: GradeTask[] = grades.map(g => {
        if (g.includes('3')) return { grade: g, task: 'Narrate a farm or market story to partner.' };
        if (g.includes('4')) return { grade: g, task: 'Write arithmetic equation matching junior partner story.' };
        return { grade: g, task: 'Review junior equations; challenge partner with an extra item addition.' };
      });

      return {
        sharedTasks,
        stationTasks,
        peerTasks,
        resourcesShared: ['Chalk and blackboard', 'Village Price Cards'],
        resourcesStation: [hasBottleCaps ? 'Bottle caps' : 'Pebbles', hasCards ? 'Reusable cards' : 'Slates'],
        resourcesPeer: ['Paper', 'Pencils']
      };
    }
  },

  multiplication: {
    key: 'multiplication',
    theme: 'Groups, Rectangular Arrays & Multiplication Relationships',
    sharedTitle: 'Shared Workshop: Groups, Arrays & Mathematical Relations',
    sharedObjective: 'Link repeated addition to structured rectangular arrays and times tables.',
    stationTitle: 'Focused Remediation Stations: Array Modeling',
    peerTitle: 'Courtyard Number Jump & Table Relay',
    buildTasks: (grades, resources) => {
      const hasBottleCaps = resources.some(r => r.toLowerCase().includes('cap'));
      const hasSticks = resources.some(r => r.toLowerCase().includes('stick'));

      const sharedTasks: GradeTask[] = grades.map(g => {
        if (g.includes('3')) return { grade: g, task: hasBottleCaps ? 'Build 3 groups of 4 bottle caps to show 3 × 4.' : 'Draw repeated addition dots (3 + 3 + 3).' };
        if (g.includes('4')) return { grade: g, task: hasBottleCaps ? 'Rearrange 24 caps into 2×12, 3×8, and 4×6 arrays.' : 'Solve 2-digit by 1-digit multiplication problems.' };
        return { grade: g, task: 'Find prime factors and express fractional groups of arrays.' };
      });

      const stationTasks: GradeTask[] = grades.map(g => {
        if (g.includes('3')) return { grade: g, task: 'Practice 2s, 3s, and 5s skip counting using courtyard grid.' };
        if (g.includes('4')) return { grade: g, task: 'Independent multiplication grid practice in textbook.' };
        return { grade: g, task: 'Multi-digit column multiplication verification on blackboard.' };
      });

      const peerTasks: GradeTask[] = grades.map(g => {
        if (g.includes('3')) return { grade: g, task: 'Call out skip counting numbers with partner.' };
        if (g.includes('4')) return { grade: g, task: 'Quiz partner with multiplication flash slates.' };
        return { grade: g, task: 'Coach junior peers through tricky carry-overs in multiplication.' };
      });

      return {
        sharedTasks,
        stationTasks,
        peerTasks,
        resourcesShared: ['Chalk and blackboard', hasBottleCaps ? 'Bottle caps' : 'Pebbles'],
        resourcesStation: ['Textbooks', hasSticks ? 'Sticks' : 'Paper'],
        resourcesPeer: ['Slates', 'Chalk']
      };
    }
  },

  place_value: {
    key: 'place_value',
    theme: 'Number Patterns & Place Value Systems',
    sharedTitle: 'Shared Anchor: Number Patterns & Place Value Systems',
    sharedObjective: 'Ground arithmetic operations in physical groupings of tens and hundreds.',
    stationTitle: 'Station Practice: Place Value Bundling & Carrying',
    peerTitle: 'Peer Counting & Carry Challenge',
    buildTasks: (grades, resources) => {
      const hasSticks = resources.some(r => r.toLowerCase().includes('stick'));

      const sharedTasks: GradeTask[] = grades.map(g => {
        if (g.includes('3')) return { grade: g, task: hasSticks ? 'Bundle 10s and units using sticks or tally marks.' : 'Group dots into tens and singles.' };
        if (g.includes('4')) return { grade: g, task: 'Build 3-digit numbers and practice place value decomposition.' };
        return { grade: g, task: 'Explore place values beyond 1,000 and tenths place decimal relationships.' };
      });

      const stationTasks: GradeTask[] = grades.map(g => {
        if (g.includes('3')) return { grade: g, task: 'Addition with carrying up to 100 on slates.' };
        if (g.includes('4')) return { grade: g, task: 'Multiplication facts via grid grouping and expanded form.' };
        return { grade: g, task: 'Multi-digit operations and estimation worksheets.' };
      });

      const peerTasks: GradeTask[] = grades.map(g => {
        if (g.includes('3')) return { grade: g, task: 'Count by 5s and 10s with partner.' };
        if (g.includes('4')) return { grade: g, task: 'Time partner solving column carry additions.' };
        return { grade: g, task: 'Mentor younger students through tricky carry-overs.' };
      });

      return {
        sharedTasks,
        stationTasks,
        peerTasks,
        resourcesShared: ['Chalk and blackboard', hasSticks ? 'Sticks' : 'Pencils'],
        resourcesStation: ['Textbooks', 'Slates'],
        resourcesPeer: ['Slates', 'Chalk']
      };
    }
  },

  general_math: {
    key: 'general_math',
    theme: 'Applied Mathematics & Concrete Visual Models',
    sharedTitle: 'Shared Anchor: Building Concrete Mathematical Intuition',
    sharedObjective: 'Connect abstract numbers to tangible models and cooperative peer investigations.',
    stationTitle: 'Targeted Remediation & Guided Practice Stations',
    peerTitle: 'Peer Demonstration & Collaborative Problem Solving',
    buildTasks: (grades, resources) => {
      const sharedTasks: GradeTask[] = grades.map(g => ({
        grade: g,
        task: `Explore foundational concepts of ${g} using blackboard diagrams and physical counters.`
      }));

      const stationTasks: GradeTask[] = grades.map(g => ({
        grade: g,
        task: `Complete differentiated workbook exercises adapted for ${g} learners.`
      }));

      const peerTasks: GradeTask[] = grades.map(g => ({
        grade: g,
        task: `Pair with desk partner to verify working steps and explain reasoning aloud.`
      }));

      return {
        sharedTasks,
        stationTasks,
        peerTasks,
        resourcesShared: ['Chalk and blackboard'],
        resourcesStation: ['Textbooks', 'Slates'],
        resourcesPeer: ['Paper', 'Pencils']
      };
    }
  }
};

export function generateWeeklyPlan(options: PlanGenerationOptions): WeeklyPlan {
  const {
    classroom,
    topics,
    conceptNodes = [],
    totalWeeklyHours = classroom.daysPerWeek * classroom.hoursPerDay,
    focusTopicId,
    focusGrade,
    planName
  } = options;

  // Active grades to plan for
  const activeGrades = focusGrade ? [focusGrade] : (classroom.grades || ['Class 3', 'Class 4', 'Class 5']);

  // 1. Identify weak topics across configured grades (< WEAK_THRESHOLD = 55%)
  const weakTopics = topics
    .filter(t => activeGrades.includes(t.grade) && t.understandingLevel < WEAK_THRESHOLD)
    .sort((a, b) => a.understandingLevel - b.understandingLevel);

  // Fallback to in-progress topics if none are weak
  const targetTopics = weakTopics.length > 0
    ? weakTopics
    : topics.filter(t => activeGrades.includes(t.grade));

  // 2. Walk Concept Bridge: find the deepest weak root cause across grades
  let anchorTopic: Topic | undefined;

  if (focusTopicId) {
    anchorTopic = topics.find(t => t.id === focusTopicId);
  }

  if (!anchorTopic && targetTopics.length > 0) {
    // Find deepest weak root cause for each candidate
    const rootCauses = targetTopics.map(t => rootCauseFor(t.id, topics, conceptNodes));
    // Sort by understanding level ascending (deepest/most urgent gap)
    rootCauses.sort((a, b) => a.understandingLevel - b.understandingLevel);
    const primaryRoot = rootCauses[0];
    anchorTopic = topics.find(t => t.id === primaryRoot.rootTopicId) || targetTopics[0];
  }

  // 3. Daily time allocation
  // Exactly fit within hoursPerDay. 3 sessions + two 10-minute gaps = hoursPerDay * 60 min.
  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] =
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].slice(0, classroom.daysPerWeek) as any;

  const totalDailyMinutes = Math.round((totalWeeklyHours * 60) / days.length);
  const GAP_DURATION = 10;
  const TOTAL_GAPS = 2 * GAP_DURATION; // 2 gaps of 10 min = 20 min
  const availableInstructionMinutes = Math.max(30, totalDailyMinutes - TOTAL_GAPS);

  // Pedagogical block proportions:
  // 1. Shared Anchor Lesson (~28% of instruction)
  // 2. Differentiated Stations & Guided Practice (~44% of instruction)
  // 3. Peer Mentorship & Quick Formative Check (remainder)
  const sharedDuration = Math.round(availableInstructionMinutes * 0.28);
  const stationDuration = Math.round(availableInstructionMinutes * 0.44);
  const peerDuration = availableInstructionMinutes - sharedDuration - stationDuration;

  // Verify daily session math: sharedDuration + stationDuration + peerDuration + 20 === totalDailyMinutes
  const sessions: LessonSession[] = [];

  // Determine lesson sequence driven by weak topics
  const primarySkill = anchorTopic ? getSkillKey(anchorTopic.name) : 'fractions';
  const secondaryTopics = targetTopics.filter(t => t.id !== anchorTopic?.id);
  const secondarySkill = secondaryTopics[0] ? getSkillKey(secondaryTopics[0].name) : 'word_problems';
  const tertiarySkill = secondaryTopics[1] ? getSkillKey(secondaryTopics[1].name) : 'multiplication';

  const dayTemplates: LessonTemplate[] = [
    LESSON_TEMPLATES[primarySkill] || LESSON_TEMPLATES.fractions,
    LESSON_TEMPLATES[secondarySkill] || LESSON_TEMPLATES.multiplication,
    LESSON_TEMPLATES[tertiarySkill] || LESSON_TEMPLATES.word_problems,
    LESSON_TEMPLATES.place_value,
    LESSON_TEMPLATES[primarySkill] || LESSON_TEMPLATES.fractions // Review/formative on Friday
  ];

  days.forEach((day, dayIndex) => {
    const template = dayTemplates[dayIndex % dayTemplates.length];
    const isFriday = day === 'Friday';

    const tasks = template.buildTasks(activeGrades, classroom.resources);

    // Session 1: Shared Anchor
    const s1Start = '09:00';
    sessions.push({
      id: `sess-${day.toLowerCase()}-1`,
      day,
      startTime: s1Start,
      durationMinutes: sharedDuration,
      title: isFriday ? `Formative Exhibition: ${template.theme}` : template.sharedTitle,
      topicId: anchorTopic?.id,
      sessionType: 'Shared Lesson',
      gradesInvolved: activeGrades,
      sharedObjective: template.sharedObjective,
      gradeTasks: tasks.sharedTasks,
      resources: tasks.resourcesShared,
      teachingNotes: `Open with whole-class inquiry. Anchor in tangible courtyard materials so all grades share the foundational model.`
    });

    // Session 2: Differentiated Stations (after 10 min gap)
    const s2StartMin = 9 * 60 + sharedDuration + GAP_DURATION;
    const s2Start = formatMinutesToTime(s2StartMin);
    sessions.push({
      id: `sess-${day.toLowerCase()}-2`,
      day,
      startTime: s2Start,
      durationMinutes: stationDuration,
      title: template.stationTitle,
      sessionType: 'Grade-Specific Stations',
      gradesInvolved: activeGrades,
      sharedObjective: 'Rotate teacher coaching to priority grade while other grades engage in independent practice.',
      gradeTasks: tasks.stationTasks,
      resources: tasks.resourcesStation,
      teachingNotes: `Allocate 15-20 min direct coaching to ${focusGrade || 'the lowest-performing grade today'}, with independent practice for the rest.`
    });

    // Session 3: Peer Learning & Formative Wrap-up (after second 10 min gap)
    const s3StartMin = s2StartMin + stationDuration + GAP_DURATION;
    const s3Start = formatMinutesToTime(s3StartMin);
    sessions.push({
      id: `sess-${day.toLowerCase()}-3`,
      day,
      startTime: s3Start,
      durationMinutes: peerDuration,
      title: isFriday ? 'Weekly Learning Celebration & Partner Praise' : template.peerTitle,
      sessionType: isFriday ? 'Formative Check & Review' : 'Peer Learning',
      gradesInvolved: activeGrades,
      sharedObjective: 'Reinforce concepts through cross-grade peer dialogue and quick formative verification.',
      gradeTasks: tasks.peerTasks,
      resources: tasks.resourcesPeer,
      teachingNotes: `Pair students deliberately (e.g. senior mentor with junior learner). Encourage verbal explanations.`
    });
  });

  // Include sessions AND gaps in totalPlannedHours so the entire daily period is accounted for
  const totalSessionMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalGapMinutes = days.length * TOTAL_GAPS;
  const totalPlannedMinutes = totalSessionMinutes + totalGapMinutes;
  const totalPlannedHours = Math.round((totalPlannedMinutes / 60) * 10) / 10;

  const titlePrefix = planName || (focusTopicId
    ? `Adaptive Bridge Remediation: ${anchorTopic?.name || 'Targeted Review'}`
    : `Weekly Multi-Grade Integrated Plan (${activeGrades.join(', ')})`);

  return {
    id: `plan-${Date.now()}`,
    name: titlePrefix,
    weekLabel: 'Next Week (Monday – Friday)',
    classroomName: classroom.name,
    gradesCovered: activeGrades,
    sessions,
    status: 'Draft',
    lastUpdated: new Date().toISOString(),
    totalPlannedHours,
    maxAvailableHours: totalWeeklyHours,
    notes: `Generated based on ${weakTopics.length} priority topics. Deepest root cause: ${anchorTopic?.name || 'Core Foundations'}. Sessions + 10-minute transition gaps fit within ${classroom.hoursPerDay}h/day.`
  };
}

export function formatMinutesToTime(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const padH = h.toString().padStart(2, '0');
  const padM = m.toString().padStart(2, '0');
  return `${padH}:${padM}`;
}
