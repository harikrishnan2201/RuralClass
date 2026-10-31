import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { StudentsRepository } from '../db/repositories';

export const aiRouter = Router();

// Lazy or passed GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
let modelName = 'gemini-2.5-flash';

export function configureAi(client: GoogleGenAI | null, model: string): void {
  aiClient = client;
  modelName = model;
}

// 1. Interactive Teacher Assistant Endpoint
aiRouter.post('/chat', async (req: Request, res: Response) => {
  const { message, history, context, language = 'en' } = req.body;

  if (!message) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Message is required' } });
  }

  const langInstruction = language === 'ta'
    ? '\n\nLANGUAGE INSTRUCTION: Write your entire response strictly in natural, encouraging Tamil (தமிழ்) using standard school math terminology (எ.கா. பின்னம், இடமதிப்பு, கூட்டுப் பாடம்).'
    : language === 'hi'
      ? '\n\nLANGUAGE INSTRUCTION: Write your entire response strictly in natural, encouraging Hindi (हिन्दी) using standard school math terminology (उदा. भिन्न, स्थानीय मान, साझा पाठ).'
      : '';

  const systemInstruction = `You are RuralClass AI — an empathetic, experienced pedagogical coach for teachers in rural multi-grade classrooms in India.
In these schools, one teacher handles several grades (${context?.grades?.join(', ') || 'Classes 3, 4, and 5'}) simultaneously in a single room with limited resources (${context?.resources?.join(', ') || 'chalkboard, slates, paper, pebbles, twigs, bottle caps, and no electricity'}).

Guiding Principles from RuralClass:
1. Always find weak topics, not weak students.
2. Teach together: recommend 1 shared lesson that serves all grades at different depths, saving the teacher precious time.
3. Use the Concept Bridge: explain root causes (e.g., higher-grade decimal struggles usually stem from missing fractional partition intuition).
4. Recommend low-cost, hands-on physical manipulatives available in village courtyards (pebbles, leaves, bottle caps, folded paper strips).
5. Suggest cross-grade peer mentorship pairings based on the classroom roster.
6. Provide specific 3-5 minute quick check-in activities for students needing extra support.
7. Always keep the teacher in control: the AI suggests, the teacher decides.

Classroom Context:
- Grades: ${context?.grades?.join(', ') || 'Classes 3, 4, 5'}
- School: ${context?.classroomName || 'Rural Learning Centre'}
- Available Resources: ${context?.resources?.join(', ') || 'Chalkboard, paper, pencils, pebbles, bottle caps'}
- Key Topic Gaps: ${context?.weakTopics || 'None reported'}
- Students Flagged for Check-in: ${context?.flaggedStudents || 'None'}
- Available Peer Mentors: ${context?.peerMentors || 'Senior students with mastery'}

Answer directly, warmly, and concisely with practical bullet points. Never require digital devices for students.${langInstruction}`;

  if (aiClient) {
    try {
      const rawHistory = Array.isArray(history) ? history.slice(-10) : [];
      const turns: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      for (const item of rawHistory) {
        if (!item.text) continue;
        turns.push({
          role: item.sender === 'user' ? 'user' : 'model',
          parts: [{ text: String(item.text) }]
        });
      }

      const lastTurn = turns[turns.length - 1];
      if (!lastTurn || lastTurn.role !== 'user' || lastTurn.parts[0]?.text !== message) {
        turns.push({
          role: 'user',
          parts: [{ text: message }]
        });
      }

      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: turns,
        config: {
          systemInstruction
        }
      });

      return res.json({
        reply: response.text || 'No response generated.',
        source: 'ai'
      });
    } catch (err: any) {
      console.error('Error in /api/ai/chat Gemini call:', err);
      const reply = generateLocalPedagogicalReply(message, context, language);
      return res.json({
        reply,
        source: 'fallback',
        reason: 'api_error'
      });
    }
  } else {
    const reply = generateLocalPedagogicalReply(message, context, language);
    return res.json({
      reply,
      source: 'fallback',
      reason: 'no_api_key'
    });
  }
});

// 2. Personalized Student Plan Generator Endpoint
aiRouter.post('/personalized-plan', async (req: Request, res: Response) => {
  const { student, classroom, topics, students: allStudents, language = 'en' } = req.body;

  if (!student) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Student data is required' } });
  }

  const availablePeerMentors = (allStudents || [])
    .filter((s: any) => s.id !== student.id && s.peerRole === 'Peer Mentor')
    .map((s: any) => `${s.name} (${s.grade})`)
    .join(', ') || 'Senior student in higher grade';

  const langDirective = language === 'ta'
    ? 'Output all JSON text values in Tamil (தமிழ்).'
    : language === 'hi'
      ? 'Output all JSON text values in Hindi (हिन्दी).'
      : 'Output in English.';

  const prompt = `Generate a personalized rural multi-grade learning plan for student:
Identifier: ${student.name || student.rollNo}
Grade: ${student.grade}
Topic Scores: ${JSON.stringify(student.topicScores || {})}
Average Score: ${student.averageScore}%
Notes: ${student.notes || 'None'}
Available Resources in School: ${classroom?.resources?.join(', ') || 'Chalk, paper, pebbles, bottle caps'}
Available Peer Mentors in Class: ${availablePeerMentors}
Language Requirement: ${langDirective}

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
    "name": "Name of real peer mentor or suitable grade partner",
    "grade": "Grade level",
    "guidance": "How the buddy can help support without giving away answers"
  },
  "teacherTip": "Practical pedagogical encouraging tip for the teacher"
}`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: `You are an educational AI specialist for multi-grade rural schools in India. Return ONLY a single raw JSON object, no markdown code block wrapping. ${langDirective}`,
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '{}';
      try {
        const parsed = JSON.parse(text);
        const plan = {
          id: `plan-${student.id}-${Date.now()}`,
          studentId: student.id,
          studentName: student.name || `Student ${student.rollNo}`,
          grade: student.grade,
          generatedAt: new Date().toISOString(),
          ...parsed,
          status: 'Generated' as const,
          source: 'ai' as const
        };

        // Persist to database
        StudentsRepository.savePersonalizedPlan(plan);

        return res.json({
          plan,
          source: 'ai'
        });
      } catch (jsonErr) {
        console.error('JSON parsing error from Gemini plan:', jsonErr);
        const fallbackPlan = generateLocalPersonalizedPlan(student, classroom, topics, allStudents, language);
        StudentsRepository.savePersonalizedPlan({ ...fallbackPlan, status: 'Generated', source: 'fallback', reason: 'invalid_json' });
        return res.json({
          plan: { ...fallbackPlan, status: 'Generated', source: 'fallback', reason: 'invalid_json' },
          source: 'fallback',
          reason: 'invalid_json'
        });
      }
    } catch (err: any) {
      console.error('Error generating personalized plan with Gemini:', err);
      const fallbackPlan = generateLocalPersonalizedPlan(student, classroom, topics, allStudents, language);
      StudentsRepository.savePersonalizedPlan({ ...fallbackPlan, status: 'Generated', source: 'fallback', reason: 'api_error' });
      return res.json({
        plan: { ...fallbackPlan, status: 'Generated', source: 'fallback', reason: 'api_error' },
        source: 'fallback',
        reason: 'api_error'
      });
    }
  } else {
    const fallbackPlan = generateLocalPersonalizedPlan(student, classroom, topics, allStudents, language);
    StudentsRepository.savePersonalizedPlan({ ...fallbackPlan, status: 'Generated', source: 'fallback', reason: 'no_api_key' });
    return res.json({
      plan: { ...fallbackPlan, status: 'Generated', source: 'fallback', reason: 'no_api_key' },
      source: 'fallback',
      reason: 'no_api_key'
    });
  }
});

function generateLocalPedagogicalReply(message: string, context: any, language: string = 'en'): string {
  const q = message.toLowerCase();
  const gradesText = Array.isArray(context?.grades) ? context.grades.join(', ') : 'Classes 3, 4, and 5';
  const schoolName = context?.classroomName || 'Rural Learning Centre';
  const weakTopics = context?.weakTopics || 'priority foundational concepts';
  const flagged = context?.flaggedStudents || 'students requiring diagnostic checks';
  const peerMentors = context?.peerMentors || 'peer mentors';

  if (language === 'ta') {
    if (q.includes('fraction') || q.includes('half') || q.includes('part') || q.includes('decimal') || q.includes('பின்னம்') || q.includes('அரை')) {
      return `### பல வகுப்பு கூட்டு உத்தி: தாள் மடிப்பு மூலம் பின்னங்கள்

**பல வகுப்புப் பாலம் (Concept Bridge):**
தனித்தனியாக மூன்று வகுப்புகளுக்குப் பாடம் எடுப்பதற்குப் பதிலாக, அனைத்து வகுப்புகளையும் (${gradesText}) ஒன்று திரட்டி **25 நிமிடக் கூட்டுப் பாடம்** நடத்துங்கள்:

1. **கூட்டு அறிமுகம் (அனைத்து வகுப்புகளும்):**
   - சம நீளமுள்ள தாள் துண்டுகளை மாணவர்களுக்கு வழங்கவும்.
   - மாணவர்கள் அதை பாதியாக மடித்து, அதன் ஒரு பகுதியில் **1/2** என எழுதட்டும்.
   - பின்னம் என்பது **முழுப்பொருளின் சமமான பங்கீடு** என்பதை வலியுறுத்தவும்.

2. **வகுப்பு நிலை வேறுபாடுகள்:**
   - **தொடக்க நிலை (வகுப்பு 3):** தாளை 4 பாகங்களாக மடித்து (**1/4**), 2 கால் பாகங்கள் 1 அரை பாகத்திற்குச் சமம் என ஒப்பிடவும்.
   - **இடை நிலை (வகுப்பு 4):** 12 கூழாங்கற்களை எடுத்து 4 சம வட்டங்களில் பிரித்து, **12ல் 1/4 = 3 கற்கள்** எனத் தொகுப்புப் பின்னத்தைக் கண்டறியவும்.
   - **உயர் நிலை (வகுப்பு 5):** கரும்பலகையில் 10 படிகள் வரைந்து, **5/10 = 0.5** எனக் குறித்து பின்னத்தைத் தசமத்துடன் இணைக்கவும்.

3. **5 நிமிடப் பரிசோதனை & தோழர் வழிகாட்டல்:**
   - கிழிந்த இலையின் 2 சமமற்ற துண்டுகள் ஏன் கணிதப் பின்னங்கள் ஆகாது என்பதை விளக்கச் சொல்லவும்.
   - மூத்த வழிகாட்டி மாணவர்களை (${peerMentors}) இளைய மாணவர்களுக்கு உதவ இணைக்கவும்.`;
    }

    if (q.includes('word problem') || q.includes('language') || q.includes('story') || q.includes('சொல்') || q.includes('கணக்கு')) {
      return `### கிராமப்புறச் சந்தை மாதிரி நாடகப் பயிற்சி

**மாணவர்கள் சொல் கணக்குகளில் தடுமாறுவது ஏன்?**
மாணவர்கள் எண்களைக் கூட்டக் கழிக்கத் தெரிந்தாலும், 'மொத்தம்', 'மீதி' போன்ற சொல் குறிப்புகளைப் பிரித்தறிய தடுமாறுகிறார்கள்.

**செயல்முறை வகுப்பறைத் தீர்வு:**
1. **கிராமப்புறக் கடை மூலை:** பாட்டில் மூடிகளை ₹10 மற்றும் ₹1 நாணயங்களாகப் பயன்படுத்தவும். 4 எளிய விலை அட்டைகளை வைக்கவும் (எ.கா. 1 கிலோ உருளைக்கிழங்கு = ₹20, கீரைக்கட்டு = ₹10).
2. **பங்கு பிரித்தல்:**
   - **வாங்குபவர்:** 1 பொருள் வாங்கி, மூடிகளை எண்ணிக் கொடுக்கிறார்.
   - **கணக்காளர்:** வினாவை வாசித்து கூட்டல்/கழித்தல் வாக்கியத்தை சிலேட்டில் எழுதுகிறார்.
   - **கடைக்காரர்:** மீதிப் பணத்தைக் கணக்கிட்டுச் சரிபார்க்கிறார்.
3. **5 நிமிடப் பரிசோதனை:** குறியீடுகளை எழுதுவதற்கு முன், மாணவர்கள் கணக்கை வாய்மொழியாகத் தாய்மொழியில் விவரிக்கச் செய்யுங்கள்.`;
    }

    return `### ${schoolName} பள்ளிக்கான பல வகுப்புப் பரிந்துரை

உங்கள் வகுப்பறை அமைப்பின்படி (${schoolName} - ${gradesText}):

1. **அடிப்படை இடைவெளியை முதலில் சரிசெய்யுங்கள்:**
   - முன்னுரிமைக் கற்றல் இடைவெளிகள்: **${weakTopics}**. மேல்நிலைக் கருத்துகள் கீழ்நிலைப் புரிதலின் மீதே கட்டமைக்கப்படுவதால், செயல்வழிக் கற்றல் மூலம் அடித்தளத்தை வலுப்படுத்துங்கள்.
2. **காலை நேர 5 நிமிடப் பரிசோதனை:**
   - கூடுதல் கவனம் தேவைப்படும் மாணவர்கள்: **${flagged}**.
3. **செலவில்லா எளிய பொருட்கள்:**
   - முற்றத்துக் கூழாங்கற்கள் (பெருக்கல், வகுத்தல் தொகுதிகள்).
   - பாட்டில் மூடிகள் (இடமதிப்புக் கட்டுகள் - 1 சிவப்பு மூடி = 10 ஒன்றுகள்).
   - செய்தித் தாள் கீற்றுகள் (பின்னப் பட்டைகள்).

குறிப்பிட்ட மாணவருக்கான 5 நிமிட வழிகாட்டல் திட்டம் வேண்டுமா?`;
  }

  if (language === 'hi') {
    if (q.includes('fraction') || q.includes('half') || q.includes('part') || q.includes('decimal') || q.includes('भिन्न') || q.includes('आधा')) {
      return `### बहु-कक्षा साझा रणनीति: कागज़ मोड़कर भिन्न की समझ

**बहु-कक्षा सेतु (Concept Bridge):**
तीन अलग-अलग पाठ पढ़ाने के बजाय, अपनी सभी कक्षाओं (${gradesText}) को **25 मिनट के एक साझा पाठ** के लिए इकट्ठा करें:

1. **साझा परिचय (सभी कक्षाएं):**
   - हर बच्चे को समान लंबाई की एक कागज़ की पट्टी दें।
   - बच्चों से कहें कि वे इसे बीच से मोड़ें और प्रत्येक भाग पर **1/2** लिखें।
   - स्पष्ट करें कि भिन्न का अर्थ **समान बंटवारा** है।

2. **कक्षा-वार अभ्यास:**
   - **प्राथमिक स्तर (कक्षा 3):** पट्टी को 4 बराबर भागों में मोड़ें (**1/4**)। 2 चौथाई = 1 आधा।
   - **मध्यम स्तर (कक्षा 4):** 12 कंकड़ लें और उन्हें 4 बराबर गोलों में बांटें। समझें: **12 का 1/4 = 3 कंकड़**।
   - **उच्च स्तर (कक्षा 5):** श्यामपट्ट पर 10 सीढ़ियां बनाएं। **5/10 = 0.5** लिखकर भिन्न और दशमलव का संबंध दिखाएं।

3. **5-मिनट जांच व सहपाठी शिक्षण:**
   - जांचें कि क्या बच्चे समझ पाए हैं कि असमान टुकड़े भिन्न नहीं होते।
   - वरिष्ठ सहपाठी मार्गदर्शकों (${peerMentors}) को कनिष्ठ साथियों की मदद के लिए जोड़ें।`;
    }

    if (q.includes('word problem') || q.includes('language') || q.includes('story') || q.includes('इबारती') || q.includes('सवाल')) {
      return `### ग्रामीण बाज़ार रोल-प्ले विधि

**बच्चे इबारती सवालों में क्यों अटकते हैं?**
बच्चे जोड़-घटाव कर लेते हैं, लेकिन 'कुल मिलाकर' या 'शेष बचा' जैसी भाषा को गणितीय संक्रिया में बदलने में कठिनाई होती है।

**कक्षा अभ्यास:**
1. **गाँव की दुकान बनाएं:** बोतल के ढक्कनों को ₹10 और ₹1 के सिक्के बनाएं। 4 सामानों के दाम लिखें (उदा. 1 किलो आलू = ₹20, पालक = ₹10)।
2. **भूमिकाएं बांटें:**
   - **ग्राहक:** सामान चुनता है और ढक्कन गिनकर भुगतान करता है।
   - **सहायक:** सवाल पढ़कर स्लेट पर जोड़ या घटाव का समीकरण लिखता है।
   - **दुकानदार:** छुट्टे पैसे गिनकर हिसाब सत्यापित करता है।
3. **5-मिनट जांच:** गणितीय चिन्ह लिखने से पहले बच्चों से कहें कि वे अपनी मातृभाषा में पूरी बात समझाएं।`;
    }

    return `### ${schoolName} के लिए बहु-कक्षा शिक्षण अनुशंसा

आपकी कक्षा संरचना (${schoolName} - ${gradesText}):

1. **मूल कमजोरी पर सबसे पहले ध्यान दें:**
   - प्राथमिकता वाले विषय: **${weakTopics}**। ऊपरी कक्षाओं की समझ निचली कक्षाओं की नींव पर टिकी है।
2. **5-मिनट की सुबह की जांच:**
   - विशेष ध्यान देने योग्य विद्यार्थी: **${flagged}**।
3. **बिना लागत वाली स्थानीय सामग्री:**
   - आंगन के कंकड़ (गुणा और भाग समूह बनाने के लिए)।
   - बोतल के ढक्कन (स्थानीय मान बंडलिंग के लिए)।
   - पुराने अखबार की पट्टियां (भिन्न समझने के लिए)।

क्या आप किसी विशेष छात्र के लिए 5-मिनट की शिक्षण योजना चाहते हैं?`;
  }

  // English (Default)
  if (q.includes('fraction') || q.includes('half') || q.includes('part') || q.includes('decimal')) {
    return `### Shared Multi-Grade Strategy: Paper Strip Fraction Folds

**The Multi-Grade Bridge:**
Instead of teaching three separate 20-minute lessons, gather your grades (${gradesText}) together for **one 25-minute shared anchor lesson** using scrap paper strips:

1. **Shared Introduction (All Grades):**
   - Give every student a paper strip of equal length.
   - Have all students fold in half, crease it, and label each part **1/2**.
   - Emphasize that fractions mean **equal portions of a whole**.

2. **Differentiated Depths:**
   - **Foundational Grade:** Fold another strip into 4 parts (**1/4**). Compare: 2 fourths equal 1 half.
   - **Intermediate Grade:** Form sets: Take 12 courtyard pebbles and divide into 4 equal circles. Find **1/4 of 12 = 3 pebbles**.
   - **Senior Grade:** Draw a 10-step ladder on the chalkboard. Mark **5/10 = 0.5**. Connect 1/2 directly to decimals!

3. **5-Minute Check-in & Peer Learning:**
   - Ask flagged learners to show why 2 uneven pieces from a torn leaf are *not* mathematical fractions.
   - Pair senior peer mentors (${peerMentors}) to verify folds and guide junior peers.`;
  }

  if (q.includes('word problem') || q.includes('language') || q.includes('story')) {
    return `### Multi-Grade Village Market Roleplay

**Why students struggle with word problems:**
Students often understand basic calculation, but stumble on decoding sentence cues ("altogether" vs "remaining").

**Hands-on Classroom Intervention:**
1. **Set Up a Village Shop Corner:** Use bottle caps as ₹10 and ₹1 coins. Create 4 product cards (e.g. 1 kg potatoes = ₹20, spinach = ₹10).
2. **Assign Roles Across Grades:**
   - **Customer:** Buys 1 item, counts bottle caps to pay.
   - **Clerk:** Reads the problem card ("You have ₹50, buy 2 items"), writes the addition & subtraction sentence.
   - **Shopkeeper:** Calculates change and verifies the arithmetic.
3. **5-Minute Check-in:** Have learners narrate a market story in their own words before writing mathematical symbols.`;
  }

  if (q.includes('manage') || q.includes('time') || q.includes('simultaneous') || q.includes('noise')) {
    return `### Multi-Grade Classroom Management Flow

When teaching one grade, here is how to keep other grades productive without chaos:

1. **The 3-Station Rotation Model:**
   - **Station A (Direct Teacher Anchor - 25 min):** Focused instruction with the grade tackling the most critical gap today.
   - **Station B (Peer Mentor Practice - 25 min):** A senior peer mentor guides peers through flashcards or pebble arrays.
   - **Station C (Independent Tactile Work - 25 min):** Workbook practice, drawing shapes on slates, or building stick models.

2. **The "Ask 3 Before Me" Rule:**
   - If students get stuck during independent practice, they first ask their desk partner, then a designated peer mentor, and only approach the teacher if both are unsure.
   - This protects 15-20 minutes of uninterrupted direct coaching time!`;
  }

  return `### Multi-Grade Recommendation for ${schoolName}

Based on your active classroom configuration (${schoolName} with ${gradesText}):

1. **Focus on the Root Gap First:**
   - Target priority gaps: **${weakTopics}**. Because higher-level operations rely on foundational representations, fixing the root cause through physical manipulatives unlocks understanding across all grades.
2. **Flagged Students for 5-Minute Checks:**
   - Prioritize quick 5-minute diagnostic checks during morning arrival for: **${flagged}**.
3. **Zero-Cost Materials:**
   - Use pebbles from the courtyard for set multiplication and division.
   - Use bottle caps for place-value bundling (1 red cap = 10 units).
   - Use folded newspaper strips for fraction bars.

Would you like a specific 5-minute check-in activity for one of your students, or a shared timetable adjustment?`;
}

function generateLocalPersonalizedPlan(student: any, classroom: any, topics: any[] = [], allStudents: any[] = [], language: string = 'en') {
  const studentName = student?.name || `Student ${student?.rollNo || ''}`;
  const grade = student?.grade || 'Class 3';

  let targetTopicName = 'Foundational Mathematics';
  let targetTopicId = '';
  let lowestScore = 101;

  if (student?.topicScores && typeof student.topicScores === 'object') {
    for (const [topicId, score] of Object.entries(student.topicScores)) {
      const numScore = Number(score);
      if (numScore < lowestScore) {
        lowestScore = numScore;
        targetTopicId = topicId;
      }
    }
  }

  const topicObj = (topics || []).find((t: any) => t.id === targetTopicId);
  if (topicObj) {
    targetTopicName = topicObj.name;
  }

  const peerMentor = (allStudents || []).find((s: any) =>
    s.id !== student?.id &&
    s.peerRole === 'Peer Mentor' &&
    (s.grade !== grade || s.averageScore >= 75)
  );

  const peerBuddyName = peerMentor ? peerMentor.name : 'Class Peer Mentor';
  const peerBuddyGrade = peerMentor ? peerMentor.grade : grade;
  const topicLower = targetTopicName.toLowerCase();

  if (language === 'ta') {
    if (topicLower.includes('frac') || topicLower.includes('part') || grade.includes('3')) {
      return {
        id: `plan-${student?.id || 'std'}-${Date.now()}`,
        studentId: student?.id,
        studentName,
        grade,
        generatedAt: new Date().toISOString(),
        diagnosedRootGap: `${targetTopicName} பாடத்தில் அடிப்படை பகிர்வு இடைவெளி: ${studentName} பின்னத்தை ஒரு முழுப்பொருளின் சம பங்காகக் கருதாமல் தனித்தனி எண்களாகப் பார்க்கிறார்.`,
        targetTopic: targetTopicName,
        checkinActivity: {
          title: '5 நிமிட காகிதப் பட்டை மடிப்புப் பரிசோதனை',
          durationMinutes: 5,
          instruction: `${studentName}-க்கு ஒரு காகிதப் பட்டையைக் கொடுத்து, அதை 2 சம பாகங்களாகவும் 4 சம பாகங்களாகவும் மடிக்கச் சொல்லுங்கள். 'சமமற்ற முறையில் கிழித்தால் அது பின்னமாகுமா?' எனக் கேட்டு, பின்னம் சமபங்காக இருக்க வேண்டும் என்பதை உறுதிப்படுத்துங்கள்.`,
          materials: ['காகிதப் பட்டை', 'பென்சில்']
        },
        independentStationTask: 'சிலேட்டில் 3 வட்டங்களையும் 3 செவ்வகங்களையும் வரைந்து, ஒவ்வொன்றிலும் சரியாகப் பாதியை நிழலிடச் செய்யுங்கள்.',
        suggestedPeerBuddy: {
          studentId: peerMentor?.id,
          name: peerBuddyName,
          grade: peerBuddyGrade,
          guidance: `${peerBuddyName} தாள் மடிப்புகள் சமமாக உள்ளதா என்பதைச் சரிபார்த்து ஊக்கமளிப்பார்.`
        },
        teacherTip: 'எழுத்து வடிவில் எண்களை எழுதுவதற்கு முன், தொட்டுணரும் செயல்முறைப் புரிதலை உறுதிப்படுத்துங்கள்.',
        status: 'Generated' as const
      };
    } else {
      return {
        id: `plan-${student?.id || 'std'}-${Date.now()}`,
        studentId: student?.id,
        studentName,
        grade,
        generatedAt: new Date().toISOString(),
        diagnosedRootGap: `${targetTopicName} பாடத்தில் வழிகாட்டல் தேவை: மொழிக் குறிப்புகளை கணிதச் சமன்பாடாக மாற்ற கூடுதல் பயிற்சி தேவைப்படுகிறது.`,
        targetTopic: targetTopicName,
        checkinActivity: {
          title: '5 நிமிட கிராமப்புறச் சந்தை அட்டைப் பயிற்சி',
          durationMinutes: 5,
          instruction: `${studentName}-உடன் ஒரு எளிய கணக்குக் கதையைப் படியுங்கள். 'வாங்கியது', 'மீதமுள்ளது' போன்ற சொற்களைக் கூழாங்கற்கள் கொண்டு விளக்கச் சொல்லுங்கள்.`,
          materials: ['12 கூழாங்கற்கள்', 'கணக்கு அட்டை']
        },
        independentStationTask: '16 கூழாங்கற்களை 4 சம குழுக்களாகப் பிரித்து சிலேட்டில் எழுதவும்.',
        suggestedPeerBuddy: {
          studentId: peerMentor?.id,
          name: peerBuddyName,
          grade: peerBuddyGrade,
          guidance: `${peerBuddyName} கடைக்காரராக நடித்து, விடையை விளக்கிச் சொல்ல உதவுவார்.`
        },
        teacherTip: 'மாணவர் கணக்கைத் தனது சொந்தத் தாய்மொழியில் விளக்குவதற்கு வாய்ப்பளியுங்கள்.',
        status: 'Generated' as const
      };
    }
  }

  if (language === 'hi') {
    if (topicLower.includes('frac') || topicLower.includes('part') || grade.includes('3')) {
      return {
        id: `plan-${student?.id || 'std'}-${Date.now()}`,
        studentId: student?.id,
        studentName,
        grade,
        generatedAt: new Date().toISOString(),
        diagnosedRootGap: `${targetTopicName} में मूल वैचारिक बाधा: ${studentName} भिन्न को 1 पूर्ण के समान बंटवारे के बजाय अलग-अलग संख्या मान रहे हैं।`,
        targetTopic: targetTopicName,
        checkinActivity: {
          title: '5-मिनट कागज़ मोड़कर जांच गतिविधि',
          durationMinutes: 5,
          instruction: `${studentName} को कागज़ की एक पट्टी दें। उन्हें 2 और 4 बराबर भागों में मोड़ने को कहें। पूछें: 'अगर यह असमान फटे तो क्या यह भिन्न है?' स्पष्ट करें कि भिन्न हमेशा बराबर होना चाहिए।`,
          materials: ['कागज़ की पट्टी', 'पेंसिल']
        },
        independentStationTask: 'स्लेट पर 3 वृत्त और 3 आयत बनाएं। प्रत्येक आकृति के ठीक आधे हिस्से में रंग भरें।',
        suggestedPeerBuddy: {
          studentId: peerMentor?.id,
          name: peerBuddyName,
          grade: peerBuddyGrade,
          guidance: `${peerBuddyName} कागज़ के सिरों के बराबर होने की जांच करेंगे और प्रोत्साहित करेंगे।`
        },
        teacherTip: 'लिखित गणित से पहले व्यावहारिक व मौखिक समझ पर ध्यान दें।',
        status: 'Generated' as const
      };
    } else {
      return {
        id: `plan-${student?.id || 'std'}-${Date.now()}`,
        studentId: student?.id,
        studentName,
        grade,
        generatedAt: new Date().toISOString(),
        diagnosedRootGap: `${targetTopicName} में भाषाई डिकोडिंग बाधा: गणना सही है पर भाषा को गणितीय संक्रिया में बदलने में सहायता चाहिए।`,
        targetTopic: targetTopicName,
        checkinActivity: {
          title: '5-मिनट बाज़ार कहानी कार्ड जांच',
          durationMinutes: 5,
          instruction: `${studentName} के साथ 1 वाक्य का सवाल पढ़ें। 'खरीदा' या 'बचा' जैसे संकेत शब्दों को कंकड़ से दर्शाने को कहें।`,
          materials: ['12 कंकड़', 'कहानी कार्ड']
        },
        independentStationTask: '16 कंकड़ों को 4 बराबर समूहों में बांटें और स्लेट पर लिखें।',
        suggestedPeerBuddy: {
          studentId: peerMentor?.id,
          name: peerBuddyName,
          grade: peerBuddyGrade,
          guidance: `${peerBuddyName} दुकानदार की भूमिका निभाकर छात्र से पूरी प्रक्रिया समझाने को कहेंगे।`
        },
        teacherTip: 'छात्र को गणित लिखने से पहले अपनी घरेलू भाषा में बोलने की छूट दें।',
        status: 'Generated' as const
      };
    }
  }

  // English (Default)
  if (topicLower.includes('frac') || topicLower.includes('part') || grade.includes('3')) {
    return {
      id: `plan-${student?.id || 'std'}-${Date.now()}`,
      studentId: student?.id,
      studentName,
      grade,
      generatedAt: new Date().toISOString(),
      diagnosedRootGap: `Foundational partition gap in ${targetTopicName}: ${studentName} perceives fractions as separate whole numbers rather than an equal share of 1 whole.`,
      targetTopic: targetTopicName,
      checkinActivity: {
        title: '5-Minute Tactile Paper Strip Folding Check',
        durationMinutes: 5,
        instruction: `Give ${studentName} a strip of paper. Have them fold it into 2 equal parts and 4 equal parts. Ask: "If you tear this unevenly, is it still a fraction?" Reinforce that fractions require exact equality.`,
        materials: ['Paper strip', 'Pencil']
      },
      independentStationTask: 'Draw 3 circles and 3 rectangles on slate. Color exactly half of each shape.',
      suggestedPeerBuddy: {
        studentId: peerMentor?.id,
        name: peerBuddyName,
        grade: peerBuddyGrade,
        guidance: `${peerBuddyName} checks the folded edges for alignment and provides encouraging feedback.`
      },
      teacherTip: 'Focus on tactile and spoken understanding before writing mathematical symbols on paper.',
      status: 'Generated' as const
    };
  } else if (topicLower.includes('word') || topicLower.includes('story') || grade.includes('4')) {
    return {
      id: `plan-${student?.id || 'std'}-${Date.now()}`,
      studentId: student?.id,
      studentName,
      grade,
      generatedAt: new Date().toISOString(),
      diagnosedRootGap: `Language decoding barrier in ${targetTopicName}: ${studentName} understands the computation but struggles to translate story context into operations.`,
      targetTopic: targetTopicName,
      checkinActivity: {
        title: '5-Minute Village Market Cue Card Check',
        durationMinutes: 5,
        instruction: `Read a 1-sentence math story with ${studentName}. Have them point to the clue word ("bought more", "shared equally") and decide whether to add, subtract, or group with pebbles.`,
        materials: ['12 Pebbles', 'Story Card']
      },
      independentStationTask: 'Divide 16 pebbles into 4 equal groups. Write what fraction 1 group represents.',
      suggestedPeerBuddy: {
        studentId: peerMentor?.id,
        name: peerBuddyName,
        grade: peerBuddyGrade,
        guidance: `${peerBuddyName} roleplays as the shopkeeper and has the student explain their math steps aloud.`
      },
      teacherTip: 'Allow the student to explain the problem in their spoken mother tongue before writing arithmetic.',
      status: 'Generated' as const
    };
  } else {
    return {
      id: `plan-${student?.id || 'std'}-${Date.now()}`,
      studentId: student?.id,
      studentName,
      grade,
      generatedAt: new Date().toISOString(),
      diagnosedRootGap: `Concept Bridge breakdown in ${targetTopicName}: Higher-order decimal and fraction difficulty is directly caused by a missing connection to fractional shares (1/10 = 0.1).`,
      targetTopic: targetTopicName,
      checkinActivity: {
        title: '5-Minute Blackboard 10-Step Chalk Ladder',
        durationMinutes: 5,
        instruction: `Draw a 10-step chalk ladder on the board. Mark 0 at the bottom and 1 at the top. Have ${studentName} hop to 5/10 and write 0.5 right next to it to see they are identical locations.`,
        materials: ['Blackboard', 'Chalk']
      },
      independentStationTask: 'Convert 1/10, 2/10, 5/10, and 9/10 into decimals in notebook using decimal point dots.',
      suggestedPeerBuddy: {
        studentId: peerMentor?.id,
        name: peerBuddyName,
        grade: peerBuddyGrade,
        guidance: `${peerBuddyName} quizzes student on quick flash conversions (e.g. "What is half of 1 as a decimal?").`
      },
      teacherTip: 'Emphasize that 0.5 is just the decimal name for one-half of a roti or rupee.',
      status: 'Generated' as const
    };
  }
}

