import React, { useState, useRef, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { Storage } from '../lib/storage';
import { ClassroomConfig, Topic, Student } from '../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AIAssistantPage: React.FC = () => {
  const [classroom] = useState<ClassroomConfig>(Storage.getClassroom());
  const [topics] = useState<Topic[]>(Storage.getTopics());
  const [students] = useState<Student[]>(Storage.getStudents());

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message from AI Coach
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello, Teacher! I am your **RuralClass AI Assistant & Multi-Grade Coach**.

I'm aware of your classroom:
- **School:** ${classroom.name}
- **Grades Sharing the Room:** ${classroom.grades.join(', ')}
- **School Inventory:** ${classroom.resources.slice(0, 5).join(', ')}
- **Priority Gaps:** Class 3 Fractions (45%), Class 4 Word Problems (40%), Class 5 Decimals (42%)

How can I help you today? You can ask me to design a **shared 3-grade anchor lesson**, create a **5-minute student check-in**, pair **peer buddies**, or suggest classroom management tips.`,
      timestamp: 'Just now'
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (userText?: string) => {
    const textToSend = userText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!userText) setInputMessage('');
    setIsLoading(true);

    try {
      // Send context to server endpoint
      const weakTopics = topics.filter(t => t.understandingLevel < 55).map(t => `${t.grade} ${t.name} (${t.understandingLevel}%)`).join(', ');

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          context: {
            classroomName: classroom.name,
            grades: classroom.grades,
            resources: classroom.resources,
            weakTopics
          }
        })
      });

      const data = await response.json();
      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Here is a practical recommendation for your multi-grade classroom...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error contacting AI chat:', err);
      const fallbackMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: `### Multi-Grade Recommendation:

For ${classroom.grades.join(', ')}, anchor your morning in a **shared 20-minute paper-folding lesson**.
1. Have all students fold scrap paper into halves and quarters.
2. Direct Class 3 to shade 1/2, Class 4 to count 1/4 of 12 pebbles, and Class 5 to record 0.5 and 0.25 on the blackboard.
3. Use senior students as station mentors to keep noise low.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

  const promptStarters = [
    'How do I teach fractions to Classes 3, 4, 5 simultaneously using paper strips?',
    'Generate a 5-minute morning check-in for Meena (Class 4 Word Problems 36%)',
    'Suggest cross-grade peer pairings between Class 5 mentors and Class 3 learners',
    'How can I manage classroom noise while teaching Class 5 decimals?',
    'What zero-cost math games can we play in the courtyard using pebbles and sticks?'
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-[#E1E7E0] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[#D97706] font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive AI Coach</span>
            </span>
            <span className="text-xs text-[#68746B]">·</span>
            <span className="text-xs text-[#245B4A] font-medium">Multi-Grade Teaching Companion</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[#202923] tracking-tight mt-0.5">
            RuralClass AI Planning Assistant
          </h2>
          <p className="text-xs text-[#4A554E]">
            Context-aware AI companion to solve simultaneous multi-grade planning, peer pairings, and zero-cost activities.
          </p>
        </div>

        <button
          onClick={() => {
            setMessages([messages[0]]);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4A554E] bg-white border border-[#E1E7E0] hover:bg-[#FAFBF9] rounded-lg transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3 h-3 text-[#68746B]" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 no-scrollbar">
        <span className="text-[11px] font-semibold text-[#68746B] whitespace-nowrap">Suggested Prompts:</span>
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
                    <button
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="inline-flex items-center gap-1 hover:text-[#202923]"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#245B4A]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
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
            <div className="w-7 h-7 rounded-full bg-[#E6EFE8] text-[#245B4A] flex items-center justify-center shrink-0 border border-[#C6DDD0]">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 bg-[#FAFBF9] border border-[#E1E7E0] rounded-xl text-xs text-[#68746B] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#245B4A] animate-ping" />
              <span>RuralClass AI is thinking through multi-grade strategies...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="shrink-0 bg-white p-2.5 rounded-xl border border-[#E1E7E0] shadow-2xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about a shared lesson, 5-minute student check-in, or classroom management..."
            className="flex-1 px-3 py-2 text-xs bg-white border border-[#E1E7E0] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#245B4A]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
