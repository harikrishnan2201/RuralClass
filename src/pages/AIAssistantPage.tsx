import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RotateCcw,
  BookOpen,
  Copy,
  Check,
  School,
  Clock,
  HeartHandshake,
  Layers,
  ChevronRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { Storage } from '../lib/storage';
import { ClassroomConfig, Topic, Student } from '../types';
import { WEAK_THRESHOLD } from '../shared/constants';
import { localizeGrade } from '../shared/contentLocalization';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  source?: 'ai' | 'fallback';
  reason?: 'no_api_key' | 'api_error' | 'invalid_json';
}

export const AIAssistantPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [classroom] = useState<ClassroomConfig>(Storage.getClassroom());
  const [topics] = useState<Topic[]>(Storage.getTopics());
  const [students] = useState<Student[]>(Storage.getStudents());
  const [settings] = useState(Storage.getSettings());

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Compute real dynamic gaps and students
  const weakTopics = topics
    .filter(t => t.understandingLevel < WEAK_THRESHOLD)
    .map(t => `${localizeGrade(t.grade, i18n.language)} ${t.name} (${t.understandingLevel}%)`);
  const weakTopicsText = weakTopics.length > 0 ? weakTopics.join(', ') : 'None below 55%';

  const flaggedStudents = students
    .filter(s => s.needsCheckin)
    .map(s => settings.shareStudentNamesWithAI ? `${s.name} (${localizeGrade(s.grade, i18n.language)})` : `Student ${s.rollNo} (${localizeGrade(s.grade, i18n.language)})`);
  const flaggedText = flaggedStudents.length > 0 ? flaggedStudents.slice(0, 3).join(', ') : 'No check-ins flagged';

  const peerMentors = students
    .filter(s => s.peerRole === 'Peer Mentor')
    .map(s => settings.shareStudentNamesWithAI ? `${s.name} (${localizeGrade(s.grade, i18n.language)})` : `Student ${s.rollNo} (${localizeGrade(s.grade, i18n.language)})`);
  const peerMentorsText = peerMentors.length > 0 ? peerMentors.slice(0, 3).join(', ') : 'Senior learners';

  // Initial welcome message from AI Coach built dynamically from real classroom data
  const welcomeText = i18n.language.startsWith('ta')
    ? `வணக்கம், ஆசிரியரே! நான் உங்கள் **RuralClass பல வகுப்பு AI வழிகாட்டி**.

உங்கள் வகுப்பறை விவரங்கள்:
- **பள்ளி:** ${classroom.name}
- **ஒன்றாகக் கற்கும் வகுப்புகள்:** ${classroom.grades.map(g => localizeGrade(g, 'ta')).join(', ')}
- **செலவில்லாப் பொருட்கள்:** ${classroom.resources.slice(0, 5).join(', ')}
- **முன்னுரிமை இடைவெளிகள்:** ${weakTopicsText}
- **5 நிமிடப் பரிசோதனை மாணவர்கள்:** ${flaggedText}

உங்களுக்கு இன்று எப்படி உதவட்டும்? பல வகுப்பு கூட்டுப் பாடம், எளிய செயல்முறைப் பயிற்சிகள், அல்லது தோழர் வழிகாட்டல் உத்திகளைக் கேட்கலாம்.`
    : i18n.language.startsWith('hi')
      ? `नमस्ते, शिक्षक जी! मैं आपका **RuralClass बहु-कक्षा AI मार्गदर्शक** हूँ।

आपकी कक्षा की जानकारी:
- **विद्यालय:** ${classroom.name}
- **एक साथ पढ़ने वाली कक्षाएं:** ${classroom.grades.map(g => localizeGrade(g, 'hi')).join(', ')}
- **सुलभ सामग्री:** ${classroom.resources.slice(0, 5).join(', ')}
- **प्राथमिक अंतराल:** ${weakTopicsText}
- **त्वरित जांच वाले विद्यार्थी:** ${flaggedText}

आज मैं आपकी किस प्रकार सहायता करूँ? आप साझा बहु-कक्षा पाठ, 5-मिनट की जांच गतिविधि, या सहपाठी शिक्षण के सुझाव मांग सकते हैं।`
      : `Hello, Teacher! I am your **RuralClass AI Assistant & Multi-Grade Coach**.

I'm aware of your classroom:
- **School:** ${classroom.name}
- **Grades Sharing the Room:** ${classroom.grades.join(', ')}
- **School Inventory:** ${classroom.resources.slice(0, 5).join(', ')}
- **Priority Gaps:** ${weakTopicsText}
- **Flagged for Check-in:** ${flaggedText}

How can I help you today? You can ask me to design a **shared multi-grade anchor lesson**, create a **5-minute student check-in**, pair **peer buddies**, or suggest classroom management tips.`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: welcomeText,
      timestamp: t('common.justNow'),
      source: 'fallback'
    }
  ]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{
          id: 'welcome',
          sender: 'ai',
          text: welcomeText,
          timestamp: t('common.justNow'),
          source: 'fallback'
        }];
      }
      return prev;
    });
  }, [i18n.language, welcomeText, t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const currentLangCode = i18n.language.startsWith('ta') ? 'ta' : i18n.language.startsWith('hi') ? 'hi' : 'en';

  const handleSendMessage = async (userText?: string) => {
    const textToSend = userText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!userText) setInputMessage('');
    setIsLoading(true);

    try {
      // Pass the conversation history (last 10 turns) to /api/ai/chat
      const historyTurns = newMessages.slice(-10).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: historyTurns,
          context: {
            classroomName: classroom.name,
            grades: classroom.grades,
            resources: classroom.resources,
            weakTopics: weakTopicsText,
            flaggedStudents: flaggedText,
            peerMentors: peerMentorsText
          },
          language: currentLangCode
        })
      });

      const data = await response.json();
      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || (currentLangCode === 'ta' ? 'உங்கள் பல வகுப்பறைக்கான பயனுள்ள பரிந்துரை இதோ...' : currentLangCode === 'hi' ? 'आपकी बहु-कक्षा के लिए व्यावहारिक सुझाव प्रस्तुत है...' : 'Here is a practical recommendation for your multi-grade classroom...'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'fallback',
        reason: data.reason
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error contacting AI chat:', err);
      const fallbackMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: currentLangCode === 'ta'
          ? `### பல வகுப்புப் பரிந்துரை:
${classroom.grades.map(g => localizeGrade(g, 'ta')).join(', ')} வகுப்புகளுக்குக் காகித மடிப்புப் பயிற்சியை 20 நிமிடக் கூட்டுப் பாடமாக நடத்துங்கள். சம நீளத் தாளை 1/2, 1/4 என மடித்து விளக்குங்கள்.`
          : currentLangCode === 'hi'
            ? `### बहु-कक्षा शिक्षण अनुशंसा:
${classroom.grades.map(g => localizeGrade(g, 'hi')).join(', ')} के लिए 20-मिनट का कागज़ मोड़ने का साझा पाठ आयोजित करें। समान कागज़ पट्टी से आधा और चौथाई की समझ बनाएं।`
            : `### Multi-Grade Recommendation:

For ${classroom.grades.join(', ')}, anchor your morning in a **shared 20-minute paper-folding lesson**.
1. Have all students fold scrap paper into halves and quarters.
2. Direct foundational learners to shade 1/2, intermediate to count 1/4 of 12 pebbles, and senior learners to record 0.5 and 0.25 on the blackboard.
3. Use senior peer mentors (${peerMentorsText}) to verify partner folds.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'fallback',
        reason: 'api_error'
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const firstFlaggedStudent = students.find(s => s.needsCheckin);
  const sampleStudentName = firstFlaggedStudent
    ? (settings.shareStudentNamesWithAI ? firstFlaggedStudent.name : `Roll ${firstFlaggedStudent.rollNo}`)
    : 'a student needing support';

  const seniorGrade = classroom.grades[classroom.grades.length - 1] || 'Class 5';
  const juniorGrade = classroom.grades[0] || 'Class 3';

  const promptStarters = currentLangCode === 'ta'
    ? [
        `${classroom.grades.map(g => localizeGrade(g, 'ta')).join(', ')} வகுப்புகளுக்கு தாள் மடிப்பு மூலம் பின்னம் கற்பிப்பது எப்படி?`,
        `${sampleStudentName} மாணவருக்கு 5 நிமிட காலை நேரப் பரிசோதனை உருவாக்குக`,
        `${localizeGrade(seniorGrade, 'ta')} மற்றும் ${localizeGrade(juniorGrade, 'ta')} மாணவர்களைத் தோழர் ஜோடிகளாக இணைப்பது எப்படி?`,
        'முற்றத்துக் கூழாங்கற்கள் கொண்டு என்ன கணித விளையாட்டுகளை விளையாடலாம்?'
      ]
    : currentLangCode === 'hi'
      ? [
          `${classroom.grades.map(g => localizeGrade(g, 'hi')).join(', ')} को कागज़ पट्टी से भिन्न कैसे सिखाएं?`,
          `${sampleStudentName} के लिए 5-मिनट की सुबह की जांच गतिविधि बनाएं`,
          `${localizeGrade(seniorGrade, 'hi')} और ${localizeGrade(juniorGrade, 'hi')} के बीच सहपाठी शिक्षण जोड़ी कैसे बनाएं?`,
          'आंगन के कंकड़ और तीलियों से कौन से गणितीय खेल खेले जा सकते हैं?'
        ]
      : [
          `How do I teach fractions to ${classroom.grades.join(', ')} simultaneously using paper strips?`,
          `Generate a 5-minute morning check-in for ${sampleStudentName}`,
          `Suggest cross-grade peer pairings between ${seniorGrade} mentors and ${juniorGrade} learners`,
          `How can I manage classroom noise while teaching ${seniorGrade} decimals?`,
          'What zero-cost math games can we play in the courtyard using pebbles and sticks?'
        ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E1E7E0] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[#245B4A] font-bold">{t('nav.aiAssistant')}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#EBF3ED] text-[#245B4A] font-medium border border-[#C6DDD0] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {t('ai.badge')}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#202923] tracking-tight mt-1">
            {t('ai.title')}
          </h2>
          <p className="text-xs text-[#4A554E] mt-0.5">
            {t('ai.subtitle')}
          </p>
        </div>

        <button
          onClick={() => {
            setMessages([messages[0]]);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4A554E] hover:text-[#202923] hover:bg-[#F2F6F3] rounded-lg border border-[#E1E7E0] transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('ai.resetChat')}</span>
        </button>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 no-scrollbar">
        <span className="text-[11px] font-semibold text-[#68746B] whitespace-nowrap">{t('ai.suggestedPrompts')}</span>
        {promptStarters.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 text-xs bg-white hover:bg-[#F2F6F3] text-[#245B4A] border border-[#C6DDD0] rounded-full whitespace-nowrap transition-colors shadow-2xs font-medium"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 bg-white rounded-xl border border-[#E1E7E0] p-4 overflow-y-auto space-y-4 shadow-2xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-[#245B4A] text-white'
                  : 'bg-[#E6EFE8] text-[#245B4A] border border-[#C6DDD0]'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`space-y-1 max-w-[85%] ${msg.sender === 'user' ? 'text-right' : ''}`}>
              <div
                className={`p-4 rounded-xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#245B4A] text-white rounded-tr-xs text-left'
                    : 'bg-[#FAFBF9] text-[#202923] border border-[#E1E7E0] rounded-tl-xs whitespace-pre-wrap'
                }`}
              >
                {msg.text}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-[#68746B] px-1">
                <span>{msg.timestamp}</span>
                {msg.sender === 'ai' && (
                  <>
                    <span>·</span>
                    {msg.source === 'ai' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#EBF3ED] text-[#245B4A] border border-[#C6DDD0]">
                        <Sparkles className="w-2.5 h-2.5" />
                        {t('common.sourceAi')}
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F5F5F0] text-[#68746B] border border-[#E1E7E0]"
                        title={msg.reason ? `${t('common.sourceBuiltinDesc')} (${msg.reason})` : t('common.sourceBuiltinDesc')}
                      >
                        <Cpu className="w-2.5 h-2.5" />
                        {t('common.sourceBuiltin')}
                      </span>
                    )}
                    <span>·</span>
                    <button
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="inline-flex items-center gap-1 hover:text-[#202923]"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#245B4A]" />
                          <span>{t('ai.copied')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>{t('common.search', { defaultValue: 'Copy' }).replace('...', '')}</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#E6EFE8] text-[#245B4A] border border-[#C6DDD0] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#FAFBF9] border border-[#E1E7E0] p-3.5 rounded-xl text-xs text-[#68746B] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#245B4A] animate-pulse" />
              <span>{t('ai.thinking')}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={t('ai.placeholder')}
          disabled={isLoading}
          className="flex-1 bg-white border border-[#E1E7E0] rounded-xl px-4 py-3 text-xs text-[#202923] placeholder-[#68746B] focus:outline-hidden focus:border-[#245B4A] focus:ring-1 focus:ring-[#245B4A] shadow-2xs disabled:bg-gray-50"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-3 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] disabled:bg-gray-300 rounded-xl transition-colors shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{t('ai.send')}</span>
        </button>
      </form>
    </div>
  );
};
