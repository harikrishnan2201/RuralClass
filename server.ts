import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI Client
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // 1. Interactive Teacher Assistant Endpoint
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message, history, context } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const systemInstruction = `You are RuralClass AI — an empathetic, experienced pedagogical coach for teachers in rural multi-grade classrooms in India.
In these schools, one teacher handles several grades (typically Classes 3, 4, and 5) simultaneously in a single room with limited resources (chalkboard, slates, paper, pebbles, twigs, bottle caps, and no electricity).

Guiding Principles from RuralClass:
1. Always find weak topics, not weak students.
2. Teach together: recommend 1 shared lesson that serves all grades at different depths, saving the teacher precious time.
3. Use the Concept Bridge: explain root causes (e.g., Class 5 Decimal struggles usually stem from missing Class 3 & 4 fractional partition intuition).
4. Recommend low-cost, hands-on physical manipulatives available in village courtyards (pebbles, leaves, bottle caps, folded paper strips).
5. Suggest cross-grade peer mentorship pairings (e.g. Class 5 mentor with Class 3 learner).
6. Provide specific 3-5 minute quick check-in activities for students needing extra support.
7. Always keep the teacher in control: the AI suggests, the teacher decides.

Classroom Context:
- Grades: ${context?.grades?.join(', ') || 'Class 3, Class 4, Class 5'}
- School: ${context?.classroomName || 'Rural Learning Centre'}
- Available Resources: ${context?.resources?.join(', ') || 'Chalkboard, paper, pencils, pebbles, bottle caps'}
- Key Topic Gaps: ${context?.weakTopics || 'Class 3 Fractions (45%), Class 4 Word Problems (40%), Class 5 Decimals (42%)'}

Answer directly, warmly, and concisely with practical bullet points. Never require digital devices for students.`;

      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: message,
          config: {
            systemInstruction
          }
        });

        return res.json({ reply: response.text });
      } else {
        // Deterministic intelligent educational fallback if API key is not yet set
        const reply = generateLocalPedagogicalReply(message, context);
        return res.json({ reply });
      }
    } catch (err: any) {
      console.error('Error in /api/ai/chat:', err);
      const fallback = generateLocalPedagogicalReply(req.body?.message || '', req.body?.context);
      return res.json({ reply: fallback });
    }
  });

  // 2. Personalized Student Plan Generator Endpoint
  app.post('/api/ai/personalized-plan', async (req, res) => {
    try {
      const { student, classroom, topics, conceptNodes } = req.body;

      if (!student) {
        return res.status(400).json({ error: 'Student data is required' });
      }

      const prompt = `Generate a personalized rural multi-grade learning plan for student:
Name: ${student.name}
Grade: ${student.grade}
Topic Scores: ${JSON.stringify(student.topicScores)}
Average Score: ${student.averageScore}%
Notes: ${student.notes || 'None'}
Available Resources in School: ${classroom?.resources?.join(', ') || 'Chalk, paper, pebbles, bottle caps'}

Format your response as a valid JSON object matching this structure:
{
  "diagnosedRootGap": "1 sentence describing the root conceptual barrier using Concept Bridge logic",
  "targetTopic": "Name of the topic needing highest priority intervention",
  "checkinActivity": {
    "title": "Title of 5-minute physical activity",
    "durationMinutes": 5,
    "instruction": "Clear step-by-step instruction for a 5-minute teacher check-in",
    "materials": ["Material 1", "Material 2"]
  },
  "independentStationTask": "1-2 sentences of independent practice while teacher assists other grades",
  "suggestedPeerBuddy": {
    "name": "Suggested student or grade peer partner",
    "grade": "Grade level",
    "guidance": "How the buddy can help support without giving away answers"
  },
  "teacherTip": "Practical pedagogical encouraging tip for the teacher"
}`;

      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are an educational AI specialist for multi-grade rural schools in India. Return ONLY a single raw JSON object, no markdown code block wrapping.',
            responseMimeType: 'application/json'
          }
        });

        const text = response.text || '{}';
        try {
          const parsed = JSON.parse(text);
          return res.json({
            plan: {
              id: `plan-${student.id}-${Date.now()}`,
              studentId: student.id,
              studentName: student.name,
              grade: student.grade,
              generatedAt: new Date().toISOString(),
              ...parsed,
              status: 'Approved'
            }
          });
        } catch (e) {
          // Fall through to deterministic generator if JSON parse fails
        }
      }

      // High-quality deterministic personalized plan generator fallback
      const fallbackPlan = generateLocalPersonalizedPlan(student, classroom);
      return res.json({ plan: fallbackPlan });
    } catch (err: any) {
      console.error('Error in /api/ai/personalized-plan:', err);
      const fallbackPlan = generateLocalPersonalizedPlan(req.body?.student, req.body?.classroom);
      return res.json({ plan: fallbackPlan });
    }
  });

  // Mount Vite middleware in development
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RuralClass full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});

function generateLocalPedagogicalReply(message: string, context: any): string {
  const q = message.toLowerCase();

  if (q.includes('fraction') || q.includes('half') || q.includes('part')) {
    return `### Shared Multi-Grade Strategy: Paper Strip Fraction Folds

**The Multi-Grade Bridge:**
Instead of teaching three separate 20-minute fraction lessons, gather Classes 3, 4, and 5 together for **one 25-minute shared anchor lesson** using scrap paper strips:

1. **Shared Introduction (All Grades):**
   - Give every student a paper strip of equal length.
   - Have all students fold in half, crease it, and label each part **1/2**.
   - Emphasize that fractions mean **equal portions of a whole**.

2. **Differentiated Depths:**
   - **Class 3:** Fold another strip into 4 parts (**1/4**). Compare: 2 fourths equal 1 half.
   - **Class 4:** Form sets: Take 12 courtyard pebbles and divide into 4 equal circles. Find **1/4 of 12 = 3 pebbles**.
   - **Class 5:** Draw a 10-step ladder on the chalkboard. Mark **5/10 = 0.5**. Connect 1/2 directly to decimals!

3. **5-Minute Check-in:**
   - Ask your flagged Class 3 students to show you why 2 pieces from an uneven tear are *not* fractions.
   - Pair Class 5 students (like Vikram) to mentor Class 3 students (like Aarav).`;
  }

  if (q.includes('word problem') || q.includes('language') || q.includes('story')) {
    return `### Multi-Grade Village Market Roleplay

**Why students struggle with word problems:**
Students often understand the arithmetic, but stumble on decoding sentence cues ("altogether" vs "remaining").

**Hands-on Classroom Intervention:**
1. **Set Up a Village Shop Corner:** Use bottle caps as ₹10 and ₹1 coins. Create 4 product cards (e.g. 1 kg potatoes = ₹20, spinach = ₹10).
2. **Assign Roles Across Grades:**
   - **Class 3 (Customer):** Buys 1 item, counts bottle caps to pay.
   - **Class 4 (Clerk):** Reads the problem card ("You have ₹50, buy 2 items"), writes the addition & subtraction sentence.
   - **Class 5 (Shopkeeper):** Calculates the change and checks the arithmetic.
3. **5-Minute Check-in:** Have Meena (Class 4) narrate a market story in her own words before writing any mathematical symbols.`;
  }

  if (q.includes('manage') || q.includes('time') || q.includes('simultaneous') || q.includes('noise')) {
    return `### Multi-Grade Classroom Management Flow

When teaching one grade, here is how to keep the other two grades productive without chaos:

1. **The 3-Station Rotation Model:**
   - **Station A (Direct Teacher Anchor - 25 min):** The teacher gives focused instruction to the grade with the most critical gap today.
   - **Station B (Peer Mentor Practice - 25 min):** A senior student guides a junior peer through flashcards or pebble arrays.
   - **Station C (Independent Tactile Work - 25 min):** Workbook practice, drawing shapes on slates, or building stick models.

2. **The "Ask 3 Before Me" Rule:**
   - Train students: if they are stuck during independent time, they must first ask their desk partner, then their Class 5 peer buddy, and only approach the teacher if both are unsure.
   - This gives you 15-20 minutes of uninterrupted direct coaching time!`;
  }

  return `### Multi-Grade Recommendation for Your Classroom

Based on your active classroom configuration (${context?.classroomName || 'Rural Learning Centre'} with ${context?.grades?.join(', ') || 'Classes 3, 4, and 5'}):

1. **Focus on the Root Gap First:**
   - The primary bottleneck is **Fractions in Class 3 (45%)** and **Decimals in Class 5 (42%)**. Because decimal notation relies on fractional partition intuition, fixing fractions through physical paper strips unlocks understanding across all three classes at once.
2. **Flagged Students for 5-Minute Checks:**
   - Prioritize quick 5-minute diagnostic checks during morning arrival for **Aarav (Class 3)**, **Meena (Class 4)**, and **Ananya (Class 5)**.
3. **Zero-Cost Materials:**
   - Use pebbles from the courtyard for set multiplication and division.
   - Use bottle caps for place-value bundling (1 red cap = 10 units).
   - Use folded newspaper strips for fraction bars.

Would you like a specific 5-minute check-in activity for one of your students, or a shared timetable adjustment?`;
}

function generateLocalPersonalizedPlan(student: any, classroom: any) {
  const isClass3 = student?.grade === 'Class 3';
  const isClass4 = student?.grade === 'Class 4';

  if (isClass3) {
    return {
      id: `plan-${student?.id || 'std'}-${Date.now()}`,
      studentId: student?.id,
      studentName: student?.name,
      grade: student?.grade,
      generatedAt: new Date().toISOString(),
      diagnosedRootGap: `Foundational partition gap: ${student?.name} perceives fractions as separate whole numbers rather than an equal share of 1 whole.`,
      targetTopic: 'Understanding Fractions (Halves & Quarters)',
      checkinActivity: {
        title: '5-Minute Tactile Paper Strip Folding Check',
        durationMinutes: 5,
        instruction: `Give ${student?.name} a strip of paper. Have them fold it into 2 equal parts and 4 equal parts. Ask: "If you tear this unevenly, is it still a fraction?" Reinforce that fractions require exact equality.`,
        materials: ['Paper strip', 'Pencil']
      },
      independentStationTask: 'Draw 3 circles and 3 rectangles on slate. Color exactly half of each shape.',
      suggestedPeerBuddy: {
        name: 'Vikram Singh',
        grade: 'Class 5',
        guidance: 'Vikram checks the folded edges for alignment and provides encouraging feedback.'
      },
      teacherTip: 'Focus on tactile and spoken understanding before writing the fractional numbers on paper.',
      status: 'Approved'
    };
  } else if (isClass4) {
    return {
      id: `plan-${student?.id || 'std'}-${Date.now()}`,
      studentId: student?.id,
      studentName: student?.name,
      grade: student?.grade,
      generatedAt: new Date().toISOString(),
      diagnosedRootGap: `Word problem language barrier & set partitioning: ${student?.name} knows basic addition/multiplication but struggles to translate story context into operations.`,
      targetTopic: 'Word Problems (1-Step) & Fractional Sets',
      checkinActivity: {
        title: '5-Minute Village Market Cue Card Check',
        durationMinutes: 5,
        instruction: `Read a 1-sentence math story with ${student?.name}. Have them point to the clue word ("bought more", "shared equally") and decide whether to add, subtract, or group with pebbles.`,
        materials: ['12 Pebbles', 'Story Card']
      },
      independentStationTask: 'Divide 16 pebbles into 4 equal groups. Write what fraction 1 group represents.',
      suggestedPeerBuddy: {
        name: 'Lakshmi Reddy',
        grade: 'Class 5',
        guidance: 'Lakshmi roleplays as the shopkeeper and has the student explain their math steps aloud.'
      },
      teacherTip: 'Allow the student to explain the problem in their native language before writing arithmetic.',
      status: 'Approved'
    };
  } else {
    return {
      id: `plan-${student?.id || 'std'}-${Date.now()}`,
      studentId: student?.id,
      studentName: student?.name,
      grade: student?.grade,
      generatedAt: new Date().toISOString(),
      diagnosedRootGap: `Concept Bridge breakdown: Class 5 Decimal confusion (tenths and hundredths) is directly caused by a missing connection to Class 4 fractional shares (1/10 = 0.1).`,
      targetTopic: 'Decimals & Fraction Conversion',
      checkinActivity: {
        title: '5-Minute Blackboard 10-Step Chalk Ladder',
        durationMinutes: 5,
        instruction: `Draw a 10-step chalk ladder on the board. Mark 0 at the bottom and 1 at the top. Have ${student?.name} hop to 5/10 and write 0.5 right next to it to see they are identical locations.`,
        materials: ['Blackboard', 'Chalk']
      },
      independentStationTask: 'Convert 1/10, 2/10, 5/10, and 9/10 into decimals in notebook using decimal point dots.',
      suggestedPeerBuddy: {
        name: 'Vikram Singh',
        grade: 'Class 5',
        guidance: 'Vikram quizzes student on quick flash conversions (e.g. "What is half of 1 as a decimal?").'
      },
      teacherTip: 'Emphasize that 0.5 is just the decimal name for one-half of a roti or rupee.',
      status: 'Approved'
    };
  }
}
