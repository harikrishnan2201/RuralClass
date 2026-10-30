import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  CalendarCheck,
  Clock,
  ArrowRight,
  School,
  TrendingDown,
  CalendarDays,
  GitMerge,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  FileText,
  Bot,
  UserCheck
} from 'lucide-react';
import { Storage } from '../lib/storage';
import { ClassroomConfig, Topic, WeeklyPlan, Student } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<ClassroomConfig>(Storage.getClassroom());
  const [topics, setTopics] = useState<Topic[]>(Storage.getTopics());
  const [plan, setPlan] = useState<WeeklyPlan>(Storage.getActivePlan());
  const [students, setStudents] = useState<Student[]>(Storage.getStudents());
  const [selectedWeek, setSelectedWeek] = useState('Current Week (Nov 3 – Nov 7)');

  useEffect(() => {
    const handleStorageChange = () => {
      setClassroom(Storage.getClassroom());
      setTopics(Storage.getTopics());
      setPlan(Storage.getActivePlan());
      setStudents(Storage.getStudents());
    };
    window.addEventListener('ruralclass_storage_change', handleStorageChange);
    return () => window.removeEventListener('ruralclass_storage_change', handleStorageChange);
  }, []);

  // Compute derived statistics from the current classroom configuration with defensive guards
  const grades = Array.isArray(classroom?.grades) && classroom.grades.length > 0 ? classroom.grades : ['Class 3', 'Class 4', 'Class 5'];
  const gradesCount = grades.length;
  const gradesLabel = grades.join(', ');
  const topicList = Array.isArray(topics) ? topics : [];
  const weakTopics = topicList.filter(t => grades.includes(t.grade) && (t.understandingLevel ?? 0) < 55);
  const totalAvailableHours = (classroom?.daysPerWeek || 5) * (classroom?.hoursPerDay || 3);
  const planSessions = Array.isArray(plan?.sessions) ? plan.sessions : [];
  const studentList = Array.isArray(students) ? students : [];
  const planCompletion = plan?.status === 'Approved' ? 'Approved' : 'In Progress (Draft)';

  // Key weak topics for Section B
  const priorityGaps = [
    { grade: 'Class 3', topic: 'Understanding Fractions', level: 45, root: 'Equal division & part-whole reasoning' },
    { grade: 'Class 4', topic: 'Fractions of a Group', level: 50, root: 'Depends on Class 3 unit fractions' },
    { grade: 'Class 4', topic: '1-Step Word Problems', level: 40, root: 'Language decoding into operations' },
    { grade: 'Class 5', topic: 'Decimals & Fraction Conversion', level: 42, root: 'Bridge from Class 4 fraction models' },
  ];

  const teacherActions = [
    {
      title: 'Review fraction basics with Classes 3–5',
      desc: 'Use Monday morning 30-min shared anchor to establish common vocabulary on halves and quarters.',
      category: 'Shared Teaching',
      action: () => navigate('/concept-bridge-map')
    },
    {
      title: 'Prepare paper fraction strips',
      desc: 'Cut 30 strips of scrap paper before morning bell for hands-on folding activity.',
      category: 'Low-Cost Prep',
      action: () => navigate('/activities')
    },
    {
      title: 'Pair students for a short peer-learning activity',
      desc: 'Pair Class 5 students with Class 3 buddies to verify paper folds and explain 1/2 = 0.5.',
      category: 'Peer Mentoring',
      action: () => navigate('/weekly-planner')
    },
    {
      title: 'Schedule a 5-minute understanding check',
      desc: 'Run a 3-question blackboard check on Friday to track mastery before moving on.',
      category: 'Formative Check',
      action: () => navigate('/weekly-planner')
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header & Context Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#E1E7E0]">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#68746B] font-semibold">Teacher Dashboard</span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#202923] tracking-tight mt-1">
            Good morning, Teacher
          </h2>
          <p className="text-sm text-[#4A554E] mt-1">
            Let's make this week's learning count across {gradesLabel}.
          </p>
        </div>

        {/* Classroom & Week Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E1E7E0] text-xs font-medium text-[#202923] shadow-2xs">
            <School className="w-3.5 h-3.5 text-[#245B4A]" />
            <span>{classroom.name}</span>
          </div>

          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="bg-white px-3 py-1.5 rounded-lg border border-[#E1E7E0] text-xs font-medium text-[#202923] shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-[#245B4A]"
          >
            <option value="Current Week (Nov 3 – Nov 7)">Week 1: Nov 3 – Nov 7 (Active)</option>
            <option value="Next Week (Nov 10 – Nov 14)">Week 2: Nov 10 – Nov 14 (Upcoming)</option>
            <option value="Prior Week (Oct 27 – Oct 31)">Week 0: Oct 27 – Oct 31 (Archive)</option>
          </select>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Grades Managed */}
        <div className="p-5 bg-white rounded-xl border border-[#E1E7E0] shadow-2xs hover:border-[#C6DDD0] transition-colors">
          <div className="flex items-center justify-between text-[#68746B] text-xs font-medium">
            <span>Grades Managed</span>
            <Users className="w-4 h-4 text-[#245B4A]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#202923] tabular-nums font-mono">
            {gradesCount}
          </div>
          <p className="mt-1 text-xs text-[#68746B] truncate">
            {gradesLabel}
          </p>
        </div>

        {/* Card 2: Topics Needing Support */}
        <div className="p-5 bg-white rounded-xl border border-[#E1E7E0] shadow-2xs hover:border-[#F5C9C0] transition-colors">
          <div className="flex items-center justify-between text-[#68746B] text-xs font-medium">
            <span>Topics Needing Support</span>
            <AlertTriangle className="w-4 h-4 text-[#C65C48]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#C65C48] tabular-nums font-mono">
            {weakTopics.length}
          </div>
          <p className="mt-1 text-xs text-[#68746B]">
            Identified for additional practice
          </p>
        </div>

        {/* Card 3: Weekly Teaching Plan */}
        <div className="p-5 bg-white rounded-xl border border-[#E1E7E0] shadow-2xs hover:border-[#C6DDD0] transition-colors">
          <div className="flex items-center justify-between text-[#68746B] text-xs font-medium">
            <span>Weekly Teaching Plan</span>
            <CalendarCheck className="w-4 h-4 text-[#245B4A]" />
          </div>
          <div className="mt-2">
            <StatusBadge status={plan?.status} />
          </div>
          <p className="mt-1 text-xs text-[#68746B]">
            {planSessions.length} scheduled periods
          </p>
        </div>

        {/* Card 4: Available Teaching Time */}
        <div className="p-5 bg-white rounded-xl border border-[#E1E7E0] shadow-2xs hover:border-[#C6DDD0] transition-colors">
          <div className="flex items-center justify-between text-[#68746B] text-xs font-medium">
            <span>Available Teaching Time</span>
            <Clock className="w-4 h-4 text-[#245B4A]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#202923] tabular-nums font-mono">
            {totalAvailableHours} hrs
          </div>
          <p className="mt-1 text-xs text-[#68746B]">
            {classroom.hoursPerDay} hrs/day across {classroom.daysPerWeek} days
          </p>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="bg-[#FAFBF9] p-4 rounded-xl border border-[#E1E7E0]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A554E]">Quick Actions</h3>
          <span className="text-[11px] text-[#68746B]">Essential multi-grade teacher tools</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => navigate('/students')}
            className="flex flex-col gap-2 p-3 rounded-lg bg-white border border-[#E1E7E0] hover:border-[#245B4A] hover:bg-[#F2F6F3] text-left transition-all shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-md bg-[#E6EFE8] text-[#245B4A] flex items-center justify-center shrink-0 group-hover:bg-[#245B4A] group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#202923]">Student Records</div>
              <div className="text-[11px] text-[#68746B]">Update marks & plans</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/ai-assistant')}
            className="flex flex-col gap-2 p-3 rounded-lg bg-white border border-[#E1E7E0] hover:border-[#D97706] hover:bg-[#FEF8ED] text-left transition-all shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-md bg-[#FEF8ED] text-[#D97706] flex items-center justify-center shrink-0 group-hover:bg-[#D97706] group-hover:text-white transition-colors">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#202923]">AI Planning Coach</div>
              <div className="text-[11px] text-[#68746B]">Interactive assistant</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/weekly-planner')}
            className="flex flex-col gap-2 p-3 rounded-lg bg-white border border-[#E1E7E0] hover:border-[#245B4A] hover:bg-[#F2F6F3] text-left transition-all shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-md bg-[#E6EFE8] text-[#245B4A] flex items-center justify-center shrink-0 group-hover:bg-[#245B4A] group-hover:text-white transition-colors">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#202923]">Weekly Planner</div>
              <div className="text-[11px] text-[#68746B]">Mon–Fri timetable</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/concept-bridge-map')}
            className="flex flex-col gap-2 p-3 rounded-lg bg-white border border-[#E1E7E0] hover:border-[#245B4A] hover:bg-[#F2F6F3] text-left transition-all shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-md bg-[#FEF8ED] text-[#D97706] flex items-center justify-center shrink-0 group-hover:bg-[#D97706] group-hover:text-white transition-colors">
              <GitMerge className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#202923]">Concept Bridge</div>
              <div className="text-[11px] text-[#68746B]">Inter-grade links</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/learning-gaps')}
            className="flex flex-col gap-2 p-3 rounded-lg bg-white border border-[#E1E7E0] hover:border-[#245B4A] hover:bg-[#F2F6F3] text-left transition-all shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-md bg-[#FDF2F0] text-[#C65C48] flex items-center justify-center shrink-0 group-hover:bg-[#C65C48] group-hover:text-white transition-colors">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#202923]">Analyze Gaps</div>
              <div className="text-[11px] text-[#68746B]">Topic diagnosis</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/classroom-setup')}
            className="flex flex-col gap-2 p-3 rounded-lg bg-white border border-[#E1E7E0] hover:border-[#245B4A] hover:bg-[#F2F6F3] text-left transition-all shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-md bg-[#E6EFE8] text-[#245B4A] flex items-center justify-center shrink-0 group-hover:bg-[#245B4A] group-hover:text-white transition-colors">
              <School className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#202923]">Classroom Setup</div>
              <div className="text-[11px] text-[#68746B]">Grades & inventory</div>
            </div>
          </button>
        </div>
      </div>

      {/* Flagged Students 5-Minute Morning Check-in Banner */}
      <div className="bg-white rounded-xl border border-[#F5C9C0] p-4 shadow-2xs bg-[#FFFDFD] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C65C48] bg-[#FDF2F0] px-2 py-0.5 rounded border border-[#F5C9C0]">
              5-Minute Morning Check-in List
            </span>
            <span className="text-xs font-bold text-[#202923]">
              {students.filter(s => s.needsCheckin).length} Students Flagged for Rapid Formative Checks
            </span>
          </div>
          <p className="text-xs text-[#68746B]">
            Short 3–5 minute physical checks (paper folding, pebble partition) before gaps widen across grades.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/students')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#C65C48] hover:bg-[#A63A26] rounded-lg shadow-2xs transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Update Student Records</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): This Week's Plan & Learning Gaps */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section A: This Week's Plan Preview */}
          <div className="bg-white rounded-xl border border-[#E1E7E0] shadow-2xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-[#E1E7E0] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#202923]">This Week's Teaching Plan</h3>
                <p className="text-xs text-[#68746B] mt-0.5">
                  Monday through Friday multi-grade breakdown · {plan.status === 'Approved' ? 'Teacher Approved' : 'Draft'}
                </p>
              </div>
              <button
                onClick={() => navigate('/weekly-planner')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#245B4A] hover:underline"
              >
                <span>Full Planner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Compact Days Grid */}
            <div className="divide-y divide-[#E1E7E0]">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                const daySessions = planSessions.filter(s => s.day === day);
                const sharedSession = daySessions.find(s => s.sessionType === 'Shared Lesson');

                return (
                  <div key={day} className="p-4 hover:bg-[#FAFBF9] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-24 text-xs font-bold text-[#202923] shrink-0">
                          {day}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-[#245B4A]">
                            {sharedSession ? sharedSession.title : 'Differentiated Practice'}
                          </div>
                          <p className="text-[11px] text-[#68746B] mt-0.5">
                            {sharedSession?.sharedObjective || 'Rotational guided stations across grades'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <span className="text-[11px] text-[#68746B] bg-[#F2F6F3] px-2 py-0.5 rounded border border-[#E1E7E0]">
                          {daySessions.length} sessions
                        </span>
                        <span className="text-[11px] text-[#4A554E] font-medium">
                          {daySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)} min
                        </span>
                      </div>
                    </div>

                    {/* Quick grade pill tags */}
                    <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-[#4A554E] border-t border-[#F0F4F1] pt-2">
                      {grades.map((grade) => {
                        const taskObj = sharedSession?.gradeTasks?.find(gt => gt.grade === grade);
                        return (
                          <div key={grade} className="flex items-baseline gap-1.5">
                            <span className="font-semibold text-[#202923]">{grade}:</span>
                            <span className="text-[#68746B]">{taskObj ? taskObj.task.substring(0, 50) + '...' : 'Guided practice'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: Learning Gaps to Review */}
          <div className="bg-white rounded-xl border border-[#E1E7E0] shadow-2xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-[#E1E7E0] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#202923]">Learning Gaps to Review</h3>
                <p className="text-xs text-[#68746B] mt-0.5">
                  High-priority weak topics and their root prerequisite relationships
                </p>
              </div>
              <button
                onClick={() => navigate('/learning-gaps')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#245B4A] hover:underline"
              >
                <span>Explore All Gaps</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {priorityGaps.map((gap, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-lg border border-[#E1E7E0] bg-[#FAFBF9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#245B4A]/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#202923]">{gap.grade}</span>
                      <span className="text-xs text-[#68746B]">·</span>
                      <span className="text-xs font-semibold text-[#245B4A]">{gap.topic}</span>
                    </div>
                    <p className="text-xs text-[#4A554E]">
                      <span className="font-medium text-[#68746B]">Prerequisite root:</span> {gap.root}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge level={gap.level} />
                    <button
                      onClick={() => navigate('/concept-bridge-map')}
                      className="p-1.5 text-[#245B4A] hover:bg-[#E6EFE8] rounded-md transition-colors"
                      title="Inspect in Concept Bridge Map"
                    >
                      <GitMerge className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Teacher Actions & Upcoming Activities */}
        <div className="lg:col-span-4 space-y-6">
          {/* Section C: Recommended Teacher Actions */}
          <div className="bg-white rounded-xl border border-[#E1E7E0] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#E1E7E0] bg-[#FAFBF9]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D97706]" />
                <h3 className="text-sm font-bold text-[#202923]">Recommended Teacher Actions</h3>
              </div>
              <p className="text-[11px] text-[#68746B] mt-0.5">
                Practical classroom interventions for this week
              </p>
            </div>

            <div className="p-4 space-y-3">
              {teacherActions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={item.action}
                  className="p-3 rounded-lg border border-[#E1E7E0] hover:border-[#245B4A] hover:bg-[#FAFBF9] cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between text-[10px] font-semibold text-[#245B4A] uppercase tracking-wider mb-1">
                    <span>{item.category}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#68746B]" />
                  </div>
                  <h4 className="text-xs font-bold text-[#202923] leading-snug">{item.title}</h4>
                  <p className="text-[11px] text-[#68746B] mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section D: Upcoming Activities */}
          <div className="bg-white rounded-xl border border-[#E1E7E0] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#E1E7E0] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#202923]">Featured Low-Cost Activities</h3>
              <button
                onClick={() => navigate('/activities')}
                className="text-xs font-semibold text-[#245B4A] hover:underline"
              >
                Browse All
              </button>
            </div>

            <div className="divide-y divide-[#E1E7E0]">
              <div className="p-3.5 hover:bg-[#FAFBF9] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#202923]">Paper Strip Fraction Folds</span>
                  <span className="text-[10px] text-[#68746B]">30 min</span>
                </div>
                <p className="text-[11px] text-[#4A554E] mt-1">
                  Tactile folding to teach 1/2, 1/4, and 0.5 without electricity or screens.
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-[#245B4A] font-medium">
                  <span>Materials: Paper, Pencils</span>
                </div>
              </div>

              <div className="p-3.5 hover:bg-[#FAFBF9] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#202923]">Pebble Sets & Fractional Groups</span>
                  <span className="text-[10px] text-[#68746B]">25 min</span>
                </div>
                <p className="text-[11px] text-[#4A554E] mt-1">
                  Partition 12 stones into 3 equal sets to visualize 1/3 of a number.
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-[#245B4A] font-medium">
                  <span>Materials: Pebbles, Chalk</span>
                </div>
              </div>

              <div className="p-3.5 hover:bg-[#FAFBF9] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#202923]">Village Market Math Simulation</span>
                  <span className="text-[10px] text-[#68746B]">35 min</span>
                </div>
                <p className="text-[11px] text-[#4A554E] mt-1">
                  Multi-grade marketplace roleplay using bottle caps as currency.
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-[#245B4A] font-medium">
                  <span>Materials: Bottle caps, Cards</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
