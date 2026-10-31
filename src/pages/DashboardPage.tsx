import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { localizeGrade, localizeTopicName, localizeSessionTitle } from '../shared/contentLocalization';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
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
  const localizedGrades = grades.map(g => localizeGrade(g, i18n.language));
  const gradesLabel = localizedGrades.join(', ');
  const topicList = Array.isArray(topics) ? topics : [];
  const weakTopics = topicList.filter(t => grades.includes(t.grade) && (t.understandingLevel ?? 0) < 55);
  const totalAvailableHours = (classroom?.daysPerWeek || 5) * (classroom?.hoursPerDay || 3);
  const planSessions = Array.isArray(plan?.sessions) ? plan.sessions : [];
  const studentList = Array.isArray(students) ? students : [];

  // Key weak topics for Section B
  const priorityGaps = [
    { grade: 'Class 3', topic: 'Understanding Fractions', level: 45, root: 'Equal division & part-whole reasoning' },
    { grade: 'Class 4', topic: 'Fractions of a Group', level: 50, root: 'Depends on Class 3 unit fractions' },
    { grade: 'Class 4', topic: 'Word Problems (1-Step)', level: 40, root: 'Language decoding into operations' },
    { grade: 'Class 5', topic: 'Decimals & Fraction Conversion', level: 42, root: 'Bridge from Class 4 fraction models' },
  ];

  const teacherActions = [
    {
      title: i18n.language.startsWith('ta') ? 'வகுப்பு 3-5 பின்ன அடிப்படைகளை மீள்பார்வை செய்க' : i18n.language.startsWith('hi') ? 'कक्षा 3-5 के साथ भिन्न की मूल बातें दोहराएं' : 'Review fraction basics with Classes 3–5',
      desc: i18n.language.startsWith('ta') ? 'திங்கள் காலை 30 நிமிடக் கூட்டுப் பாடம் மூலம் அரை மற்றும் கால் பகுதிகளை விளக்குக.' : i18n.language.startsWith('hi') ? 'सोमवार सुबह 30 मिनट के साझा पाठ में आधा और चौथाई की बुनियादी समझ बनाएं।' : 'Use Monday morning 30-min shared anchor to establish common vocabulary on halves and quarters.',
      category: t('planner.sessionTypes.sharedLesson'),
      action: () => navigate('/concept-bridge-map')
    },
    {
      title: i18n.language.startsWith('ta') ? 'காகிதப் பின்னப் பட்டைகளைத் தயார் செய்க' : i18n.language.startsWith('hi') ? 'कागज़ की भिन्न पट्टियां तैयार करें' : 'Prepare paper fraction strips',
      desc: i18n.language.startsWith('ta') ? 'காலை மணி ஒலிக்கும் முன் 30 எளிய காகிதக் கீற்றுகளை வெட்டி தயார் செய்க.' : i18n.language.startsWith('hi') ? 'सुबह प्रार्थना से पहले 30 कागज़ की पट्टियां काटकर तैयार रखें।' : 'Cut 30 strips of scrap paper before morning bell for hands-on folding activity.',
      category: t('activities.categories.handsOn'),
      action: () => navigate('/activities')
    },
    {
      title: i18n.language.startsWith('ta') ? 'மாணவர்களைத் தோழர் கற்றல் ஜோடிகளாக இணைக்க' : i18n.language.startsWith('hi') ? 'सहपाठी शिक्षण के लिए विद्यार्थियों की जोड़ी बनाएं' : 'Pair students for a short peer-learning activity',
      desc: i18n.language.startsWith('ta') ? 'வகுப்பு 5 மாணவர்களுடன் வகுப்பு 3 மாணவர்களை இணைத்துத் தாள் மடிப்பைச் சரிபார்க்கவும்.' : i18n.language.startsWith('hi') ? 'कक्षा 5 के विद्यार्थियों को कक्षा 3 के साथ जोड़कर 1/2 = 0.5 समझें।' : 'Pair Class 5 students with Class 3 buddies to verify paper folds and explain 1/2 = 0.5.',
      category: t('students.peerRoles.peerMentor'),
      action: () => navigate('/weekly-planner')
    },
    {
      title: i18n.language.startsWith('ta') ? '5 நிமிடப் புரிதல் பரிசோதனை நடத்துக' : i18n.language.startsWith('hi') ? '5-मिनट की समझ जांच आयोजित करें' : 'Schedule a 5-minute understanding check',
      desc: i18n.language.startsWith('ta') ? 'வெள்ளிக்கிழமை கரும்பலகையில் 3 எளிய வினாக்கள் மூலம் தேர்ச்சியை அளவிடவும்.' : i18n.language.startsWith('hi') ? 'शुक्रवार को श्यामपट्ट पर 3 प्रश्नों द्वारा अवधारणात्मक समझ परखें।' : 'Run a 3-question blackboard check on Friday to track mastery before moving on.',
      category: t('planner.sessionTypes.formativeCheck'),
      action: () => navigate('/weekly-planner')
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header & Context Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#E1E7E0]">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#68746B] font-semibold">{t('dashboard.title')}</span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#202923] tracking-tight mt-1">
            {t('dashboard.greeting')}
          </h2>
          <p className="text-sm text-[#4A554E] mt-1">
            {t('dashboard.greetingSubtitle', { grades: gradesLabel })}
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
            <option value="Current Week (Nov 3 – Nov 7)">Week 1: Nov 3 – Nov 7</option>
            <option value="Next Week (Nov 10 – Nov 14)">Week 2: Nov 10 – Nov 14</option>
            <option value="Prior Week (Oct 27 – Oct 31)">Week 0: Oct 27 – Oct 31</option>
          </select>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Grades Managed */}
        <div className="p-5 bg-white rounded-xl border border-[#E1E7E0] shadow-2xs hover:border-[#C6DDD0] transition-colors">
          <div className="flex items-center justify-between text-[#68746B] text-xs font-medium">
            <span>{t('dashboard.manageGrades')}</span>
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
            <span>{t('dashboard.weakTopicsLabel')}</span>
            <AlertTriangle className="w-4 h-4 text-[#C65C48]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#C65C48] tabular-nums font-mono">
            {weakTopics.length}
          </div>
          <p className="mt-1 text-xs text-[#68746B]">
            {t('dashboard.weakTopicsDesc')}
          </p>
        </div>

        {/* Card 3: Weekly Teaching Plan */}
        <div className="p-5 bg-white rounded-xl border border-[#E1E7E0] shadow-2xs hover:border-[#C6DDD0] transition-colors">
          <div className="flex items-center justify-between text-[#68746B] text-xs font-medium">
            <span>{t('dashboard.weeklyTeachingPlan')}</span>
            <CalendarCheck className="w-4 h-4 text-[#245B4A]" />
          </div>
          <div className="mt-2">
            <StatusBadge status={plan?.status} />
          </div>
          <p className="mt-1 text-xs text-[#68746B]">
            {planSessions.length} periods
          </p>
        </div>

        {/* Card 4: Available Teaching Time */}
        <div className="p-5 bg-white rounded-xl border border-[#E1E7E0] shadow-2xs hover:border-[#C6DDD0] transition-colors">
          <div className="flex items-center justify-between text-[#68746B] text-xs font-medium">
            <span>{t('dashboard.availableTeachingTime')}</span>
            <Clock className="w-4 h-4 text-[#245B4A]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#202923] tabular-nums font-mono">
            {totalAvailableHours} hrs
          </div>
          <p className="mt-1 text-xs text-[#68746B]">
            {t('dashboard.teachingTimeDesc', { hours: classroom.hoursPerDay, days: classroom.daysPerWeek })}
          </p>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="bg-[#FAFBF9] p-4 rounded-xl border border-[#E1E7E0]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A554E]">{t('dashboard.quickActions')}</h3>
          <span className="text-[11px] text-[#68746B]">{t('dashboard.quickActionsDesc')}</span>
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
              <div className="text-xs font-semibold text-[#202923]">{t('nav.students')}</div>
              <div className="text-[11px] text-[#68746B]">{t('dashboard.updateMarks')}</div>
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
              <div className="text-xs font-semibold text-[#202923]">{t('nav.aiAssistant')}</div>
              <div className="text-[11px] text-[#68746B]">{t('dashboard.askAiCoach')}</div>
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
              <div className="text-xs font-semibold text-[#202923]">{t('nav.weeklyPlanner')}</div>
              <div className="text-[11px] text-[#68746B]">{t('dashboard.generatePlan')}</div>
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
              <div className="text-xs font-semibold text-[#202923]">{t('nav.conceptBridgeMap')}</div>
              <div className="text-[11px] text-[#68746B]">{t('dashboard.exploreRootCause')}</div>
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
              <div className="text-xs font-semibold text-[#202923]">{t('nav.learningGaps')}</div>
              <div className="text-[11px] text-[#68746B]">{t('dashboard.stats.weakTopics')}</div>
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
              <div className="text-xs font-semibold text-[#202923]">{t('nav.classroomSetup')}</div>
              <div className="text-[11px] text-[#68746B]">{t('dashboard.stats.activeGrades')}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Flagged Students 5-Minute Morning Check-in Banner */}
      <div className="bg-white rounded-xl border border-[#F5C9C0] p-4 shadow-2xs bg-[#FFFDFD] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C65C48] bg-[#FDF2F0] px-2 py-0.5 rounded border border-[#F5C9C0]">
              {t('dashboard.checkinBannerTitle')}
            </span>
            <span className="text-xs font-bold text-[#202923]">
              {t('dashboard.checkinBannerSubtitle', { count: students.filter(s => s.needsCheckin).length })}
            </span>
          </div>
          <p className="text-xs text-[#68746B]">
            {t('dashboard.checkinBannerDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/students')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#C65C48] hover:bg-[#A63A26] rounded-lg shadow-2xs transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{t('dashboard.viewFlaggedStudents')}</span>
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
                <h3 className="text-base font-bold text-[#202923]">{t('dashboard.thisWeekPlan')}</h3>
                <p className="text-xs text-[#68746B] mt-0.5">
                  {t('dashboard.thisWeekPlanDesc', { status: plan.status === 'Approved' ? t('common.statusApproved') : t('common.statusDraft') })}
                </p>
              </div>
              <button
                onClick={() => navigate('/weekly-planner')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#245B4A] hover:underline"
              >
                <span>{t('dashboard.fullPlanner')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Compact Days Grid */}
            <div className="divide-y divide-[#E1E7E0]">
              {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const).map((day) => {
                const daySessions = planSessions.filter(s => s.day === day);
                const sharedSession = daySessions.find(s => s.sessionType === 'Shared Lesson');
                const dayKey = day.toLowerCase() as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

                return (
                  <div key={day} className="p-4 hover:bg-[#FAFBF9] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-24 text-xs font-bold text-[#202923] shrink-0">
                          {t(`common.days.${dayKey}`)}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-[#245B4A]">
                            {sharedSession ? localizeSessionTitle(sharedSession.title, i18n.language) : t('planner.sessionTypes.gradeStations')}
                          </div>
                          <p className="text-[11px] text-[#68746B] mt-0.5">
                            {sharedSession?.sharedObjective || 'Rotational guided stations across grades'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <span className="text-[11px] text-[#68746B] bg-[#F2F6F3] px-2 py-0.5 rounded border border-[#E1E7E0]">
                          {daySessions.length} {t('common.days.' + dayKey)}
                        </span>
                        <span className="text-[11px] text-[#4A554E] font-medium">
                          {t('common.minutesShort', { count: daySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) })}
                        </span>
                      </div>
                    </div>

                    {/* Quick grade pill tags */}
                    <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-[#4A554E] border-t border-[#F0F4F1] pt-2">
                      {grades.map((grade) => {
                        const taskObj = sharedSession?.gradeTasks?.find(gt => gt.grade === grade);
                        return (
                          <div key={grade} className="flex items-baseline gap-1.5">
                            <span className="font-semibold text-[#202923]">{localizeGrade(grade, i18n.language)}:</span>
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
                <h3 className="text-base font-bold text-[#202923]">{t('dashboard.learningGapsToReview')}</h3>
                <p className="text-xs text-[#68746B] mt-0.5">
                  {t('dashboard.learningGapsDesc')}
                </p>
              </div>
              <button
                onClick={() => navigate('/learning-gaps')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#245B4A] hover:underline"
              >
                <span>{t('dashboard.exploreAllGaps')}</span>
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
                      <span className="text-xs font-bold text-[#202923]">{localizeGrade(gap.grade, i18n.language)}</span>
                      <span className="text-xs text-[#68746B]">·</span>
                      <span className="text-xs font-semibold text-[#245B4A]">{localizeTopicName(gap.topic, i18n.language)}</span>
                    </div>
                    <p className="text-xs text-[#4A554E]">
                      <span className="font-medium text-[#68746B]">{t('gaps.prerequisite')}:</span> {gap.root}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge level={gap.level} />
                    <button
                      onClick={() => navigate('/concept-bridge-map')}
                      className="p-1.5 text-[#245B4A] hover:bg-[#E6EFE8] rounded-md transition-colors"
                      title={t('dashboard.exploreRootCause')}
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
                <h3 className="text-sm font-bold text-[#202923]">{t('dashboard.recommendedActions')}</h3>
              </div>
              <p className="text-[11px] text-[#68746B] mt-0.5">
                {t('dashboard.recommendedActionsDesc')}
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
              <h3 className="text-sm font-bold text-[#202923]">{t('dashboard.featuredActivities')}</h3>
              <button
                onClick={() => navigate('/activities')}
                className="text-xs font-semibold text-[#245B4A] hover:underline"
              >
                {t('dashboard.browseAll')}
              </button>
            </div>

            <div className="divide-y divide-[#E1E7E0]">
              <div className="p-3.5 hover:bg-[#FAFBF9] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#202923]">
                    {i18n.language.startsWith('ta') ? 'காகிதப் பட்டை பின்ன மடிப்புகள்' : i18n.language.startsWith('hi') ? 'कागज़ पट्टी भिन्न मोड़' : 'Paper Strip Fraction Folds'}
                  </span>
                  <span className="text-[10px] text-[#68746B]">{t('common.minutesShort', { count: 30 })}</span>
                </div>
                <p className="text-[11px] text-[#4A554E] mt-1">
                  {i18n.language.startsWith('ta') ? 'மின்னணு சாதனங்கள் இன்றி அரை, கால் மற்றும் 0.5 கற்பித்தல்.' : i18n.language.startsWith('hi') ? 'बिना बिजली या स्क्रीन के 1/2, 1/4 और 0.5 सिखाने के लिए व्यावहारिक मोड़।' : 'Tactile folding to teach 1/2, 1/4, and 0.5 without electricity or screens.'}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-[#245B4A] font-medium">
                  <span>{t('activities.materials')}: Paper, Pencils</span>
                </div>
              </div>

              <div className="p-3.5 hover:bg-[#FAFBF9] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#202923]">
                    {i18n.language.startsWith('ta') ? 'கூழாங்கல் தொகுதிகளும் பின்னக் குழுக்களும்' : i18n.language.startsWith('hi') ? 'कंकड़ समूह और भिन्नात्मक अभ्यास' : 'Pebble Sets & Fractional Groups'}
                  </span>
                  <span className="text-[10px] text-[#68746B]">{t('common.minutesShort', { count: 25 })}</span>
                </div>
                <p className="text-[11px] text-[#4A554E] mt-1">
                  {i18n.language.startsWith('ta') ? '12 கற்களை 3 சம குழுக்களாகப் பிரித்து 1/3 பின்னத்தை விளக்குதல்.' : i18n.language.startsWith('hi') ? '12 कंकड़ों को 3 बराबर भागों में बांटकर 1/3 की समझ।' : 'Partition 12 stones into 3 equal sets to visualize 1/3 of a number.'}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-[#245B4A] font-medium">
                  <span>{t('activities.materials')}: Pebbles, Chalk</span>
                </div>
              </div>

              <div className="p-3.5 hover:bg-[#FAFBF9] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#202923]">
                    {i18n.language.startsWith('ta') ? 'கிராமப்புறக் கடை மாதிரி நாடகம்' : i18n.language.startsWith('hi') ? 'ग्रामीण बाज़ार गणित सिमुलेशन' : 'Village Market Math Simulation'}
                  </span>
                  <span className="text-[10px] text-[#68746B]">{t('common.minutesShort', { count: 35 })}</span>
                </div>
                <p className="text-[11px] text-[#4A554E] mt-1">
                  {i18n.language.startsWith('ta') ? 'பாட்டில் மூடிகளைப் பணமாகப் பயன்படுத்தி சொல் கணக்கு பயிற்சி.' : i18n.language.startsWith('hi') ? 'बोतल के ढक्कनों को मुद्रा बनाकर बहु-कक्षा बाज़ार खेल।' : 'Multi-grade marketplace roleplay using bottle caps as currency.'}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-[#245B4A] font-medium">
                  <span>{t('activities.materials')}: Bottle caps, Cards</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
