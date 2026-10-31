
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  Sparkles,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  BookOpen,
  Users,
  Layers,
  FileCheck,
  FileDown,
  FileSpreadsheet
} from 'lucide-react';
import { Storage } from '../lib/storage';
import { WeeklyPlan, LessonSession, ClassroomConfig, Topic, ConceptNode } from '../types';
import { generateWeeklyPlan } from '../lib/plannerEngine';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { localizeGrade, localizeSessionTitle } from '../shared/contentLocalization';

export const WeeklyPlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();

  // Storage data
  const [classroom, setClassroom] = useState<ClassroomConfig>(Storage.getClassroom());
  const [topics, setTopics] = useState<Topic[]>(Storage.getTopics());
  const [conceptNodes] = useState<ConceptNode[]>(Storage.getConceptNodes());
  const [activePlan, setActivePlan] = useState<WeeklyPlan>(Storage.getActivePlan());

  // View state: 'overview' (weekly grid) vs 'daily' (day-by-day detail)
  const [viewMode, setViewMode] = useState<'overview' | 'daily'>('overview');
  const [activeDay, setActiveDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');

  // Generator configuration dialog / drawer
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [planTeachingHours, setPlanTeachingHours] = useState<number>(classroom.daysPerWeek * classroom.hoursPerDay);
  const [selectedGradesForPlan, setSelectedGradesForPlan] = useState<string[]>(classroom.grades);
  const [prioritizeFractions, setPrioritizeFractions] = useState(true);

  // Edit session modal state
  const [editingSession, setEditingSession] = useState<LessonSession | null>(null);
  const [isAddingSession, setIsAddingSession] = useState(false);

  // Confirmation dialogs
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Check query params if transferred from Concept Bridge Map
  useEffect(() => {
    const focusTopicId = searchParams.get('focusTopicId');
    const focusTopicName = searchParams.get('focusTopicName');
    if (focusTopicId) {
      // Auto-open generator with pre-filled bridge gap
      setSuccessToast(`Transferred gap "${focusTopicName || 'Selected Concept'}" into weekly planner! Click Generate to create schedule.`);
      setIsGeneratorOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleStorageChange = () => {
      setClassroom(Storage.getClassroom());
      setTopics(Storage.getTopics());
      setActivePlan(Storage.getActivePlan());
    };
    window.addEventListener('ruralclass_storage_change', handleStorageChange);
    return () => window.removeEventListener('ruralclass_storage_change', handleStorageChange);
  }, []);

  // Time calculations
  const totalPlannedMinutes = activePlan.sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPlannedHours = Math.round((totalPlannedMinutes / 60) * 10) / 10;
  const maxAvailableHours = activePlan.maxAvailableHours || (classroom.daysPerWeek * classroom.hoursPerDay);
  const isOverAllocated = totalPlannedHours > maxAvailableHours;

  // Generate Plan Handler
  const handleGeneratePlan = () => {
    const generated = generateWeeklyPlan({
      classroom: {
        ...classroom,
        grades: selectedGradesForPlan
      },
      topics,
      conceptNodes,
      totalWeeklyHours: planTeachingHours,
      focusTopicId: searchParams.get('focusTopicId') || undefined
    });

    setActivePlan(generated);
    Storage.saveActivePlan(generated);
    setIsGeneratorOpen(false);
    setSuccessToast('New weekly plan generated successfully based on current topic gaps!');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Save Draft
  const handleSaveDraft = () => {
    const updated: WeeklyPlan = {
      ...activePlan,
      status: 'Draft',
      lastUpdated: new Date().toISOString(),
      totalPlannedHours
    };
    setActivePlan(updated);
    Storage.saveActivePlan(updated);
    // Also sync to saved plans list
    const allSaved = Storage.getSavedPlans();
    const existingIdx = allSaved.findIndex(p => p.id === updated.id);
    if (existingIdx >= 0) {
      allSaved[existingIdx] = updated;
    } else {
      allSaved.unshift(updated);
    }
    Storage.saveSavedPlans(allSaved);

    setSuccessToast('Teaching plan draft saved locally.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Approve Plan
  const handleApprovePlan = () => {
    const updated: WeeklyPlan = {
      ...activePlan,
      status: 'Approved',
      approvedDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString(),
      totalPlannedHours
    };
    setActivePlan(updated);
    Storage.saveActivePlan(updated);

    const allSaved = Storage.getSavedPlans();
    const existingIdx = allSaved.findIndex(p => p.id === updated.id);
    if (existingIdx >= 0) {
      allSaved[existingIdx] = updated;
    } else {
      allSaved.unshift(updated);
    }
    Storage.saveSavedPlans(allSaved);

    setSuccessToast('Plan officially marked as Approved by Teacher!');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Rebalance Schedule if over-allocated
  const handleRebalanceSchedule = () => {
    const targetDailyMinutes = Math.floor((maxAvailableHours * 60) / 5);
    const rebalancedSessions = activePlan.sessions.map(s => {
      // Scale duration proportionally
      const ratio = targetDailyMinutes / (totalPlannedMinutes / 5);
      return {
        ...s,
        durationMinutes: Math.max(15, Math.round((s.durationMinutes * ratio) / 5) * 5)
      };
    });

    const newPlannedMin = rebalancedSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const updated: WeeklyPlan = {
      ...activePlan,
      sessions: rebalancedSessions,
      totalPlannedHours: Math.round((newPlannedMin / 60) * 10) / 10
    };
    setActivePlan(updated);
    Storage.saveActivePlan(updated);
    setSuccessToast('Schedule durations rebalanced to fit within teaching hours.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Save session edits
  const handleSaveSessionEdit = () => {
    if (!editingSession) return;
    let updatedSessions: LessonSession[];

    if (isAddingSession) {
      updatedSessions = [...activePlan.sessions, editingSession];
    } else {
      updatedSessions = activePlan.sessions.map(s => s.id === editingSession.id ? editingSession : s);
    }

    const newPlannedMin = updatedSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const updatedPlan: WeeklyPlan = {
      ...activePlan,
      sessions: updatedSessions,
      totalPlannedHours: Math.round((newPlannedMin / 60) * 10) / 10,
      lastUpdated: new Date().toISOString()
    };

    setActivePlan(updatedPlan);
    Storage.saveActivePlan(updatedPlan);
    setEditingSession(null);
    setIsAddingSession(false);
    setSuccessToast('Session updated successfully.');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // Delete session
  const confirmDeleteSession = () => {
    if (!deleteSessionId) return;
    const updatedSessions = activePlan.sessions.filter(s => s.id !== deleteSessionId);
    const newPlannedMin = updatedSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const updatedPlan: WeeklyPlan = {
      ...activePlan,
      sessions: updatedSessions,
      totalPlannedHours: Math.round((newPlannedMin / 60) * 10) / 10
    };
    setActivePlan(updatedPlan);
    Storage.saveActivePlan(updatedPlan);
    setDeleteSessionId(null);
    setSuccessToast('Session removed from weekly plan.');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday'
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="no-print p-3.5 rounded-lg bg-[#F0F7F2] border border-[#C3DEC9] text-[#1E563E] text-xs flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#245B4A]" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-[#245B4A] font-bold text-xs">
            ×
          </button>
        </div>
      )}

      {/* PRINT-ONLY HEADER (Hidden on screen, visible on print) */}
      <div className="hidden print-only mb-6 border-b-2 border-black pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-black uppercase tracking-tight">RuralClass Weekly Teaching Plan</h1>
            <p className="text-sm text-neutral-800 font-medium mt-1">
              Classroom: {activePlan.classroomName} · Grades: {activePlan.gradesCovered.join(', ')}
            </p>
            <p className="text-xs text-neutral-600 mt-0.5">
              Week: {activePlan.weekLabel} · Total Hours: {activePlan.totalPlannedHours} hrs
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase px-3 py-1 border border-black inline-block">
              Status: {activePlan.status}
            </span>
            <p className="text-[10px] text-neutral-500 mt-1">Printed on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        {activePlan.notes && (
          <p className="text-xs text-neutral-700 italic mt-2 border-t pt-1">
            Teacher Notes: {activePlan.notes}
          </p>
        )}
      </div>

      {/* Screen Header */}
      <div className="no-print flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#E1E7E0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[#68746B] font-semibold">Primary Working Area</span>
            <span className="text-xs text-[#68746B]">·</span>
            <StatusBadge status={activePlan.status} />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#202923] tracking-tight mt-1">
            {activePlan.name}
          </h2>
          <p className="text-sm text-[#4A554E] mt-1">
            One classroom. Multiple grades. A practical plan for everyone.
          </p>
        </div>

        {/* Primary Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#E8AE48]" />
            <span>{t('planner.generateButton')}</span>
          </button>

          <button
            onClick={() => navigate('/import?entity=timetable')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4A554E] bg-white border border-[#E1E7E0] hover:bg-[#FAFBF9] rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('import.importTimetable')}</span>
          </button>

          <a
            href={`/api/export/planner.xlsx?lang=${i18n.language}`}
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4A554E] bg-white border border-[#E1E7E0] hover:bg-[#FAFBF9] rounded-lg transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600" />
            <span>Excel (.xlsx)</span>
          </a>

          <a
            href={`/api/export/planner.html?lang=${i18n.language}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4A554E] bg-white border border-[#E1E7E0] hover:bg-[#FAFBF9] rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#68746B]" />
            <span>{t('planner.printButton')}</span>
          </a>
        </div>
      </div>

      {/* Teaching Hours Meter & Warning Strip */}
      <div className="no-print bg-white p-4 rounded-xl border border-[#E1E7E0] shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#245B4A]" />
            <span className="text-xs font-bold text-[#202923]">{t('planner.plannedHours')}:</span>
            <span className="text-xs font-mono font-bold text-[#202923]">
              {totalPlannedHours} hrs
            </span>
            <span className="text-xs text-[#68746B]">/ {maxAvailableHours} hrs available</span>
          </div>

          <div className="flex items-center gap-3">
            {isOverAllocated ? (
              <div className="flex items-center gap-2 text-xs text-[#C65C48] font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Exceeds capacity by {(totalPlannedHours - maxAvailableHours).toFixed(1)} hrs</span>
                <button
                  onClick={handleRebalanceSchedule}
                  className="ml-2 text-[11px] underline hover:text-[#A63A26]"
                >
                  Rebalance Durations
                </button>
              </div>
            ) : (
              <span className="text-xs text-[#245B4A] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Within school capacity
              </span>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#F2F6F3] p-1 rounded-lg border border-[#E1E7E0]">
              <button
                onClick={() => setViewMode('overview')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'overview'
                    ? 'bg-white text-[#202923] shadow-2xs font-semibold'
                    : 'text-[#68746B] hover:text-[#202923]'
                }`}
              >
                {t('planner.views.weeklyOverview')}
              </button>
              <button
                onClick={() => setViewMode('daily')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'daily'
                    ? 'bg-white text-[#202923] shadow-2xs font-semibold'
                    : 'text-[#68746B] hover:text-[#202923]'
                }`}
              >
                {t('planner.views.dailyDetail')}
              </button>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-[#E1E7E0] rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverAllocated ? 'bg-[#C65C48]' : 'bg-[#245B4A]'
            }`}
            style={{ width: `${Math.min((totalPlannedHours / maxAvailableHours) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Generator Configuration Drawer Modal */}
      {isGeneratorOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-[#E1E7E0] overflow-hidden">
            <div className="p-4 bg-[#FAFBF9] border-b border-[#E1E7E0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D97706]" />
                <h3 className="font-bold text-sm text-[#202923]">Generate Adaptive Weekly Plan</h3>
              </div>
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="text-xs text-[#68746B] hover:text-[#202923]"
              >
                Cancel
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-[#4A554E] leading-relaxed">
                The local engine reads current topic scores and prerequisite connections to construct shared multi-grade anchor lessons, independent rotational stations, and low-cost material activities.
              </p>

              <div>
                <label className="block font-semibold text-[#202923] mb-1.5">
                  Available Total Teaching Time This Week: {planTeachingHours} hours
                </label>
                <input
                  type="range"
                  min={5}
                  max={25}
                  step={1}
                  value={planTeachingHours}
                  onChange={(e) => setPlanTeachingHours(parseInt(e.target.value))}
                  className="w-full accent-[#245B4A]"
                />
                <div className="flex justify-between text-[11px] text-[#68746B] mt-1 font-mono">
                  <span>5 hrs (1h/day)</span>
                  <span>15 hrs (Standard 3h/day)</span>
                  <span>25 hrs (5h/day)</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#202923] mb-1.5">
                  Grades to Include in this Plan
                </label>
                <div className="flex flex-wrap gap-2">
                  {classroom.grades.map(grade => {
                    const isSelected = selectedGradesForPlan.includes(grade);
                    return (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => {
                          setSelectedGradesForPlan(
                            isSelected
                              ? selectedGradesForPlan.filter(g => g !== grade)
                              : [...selectedGradesForPlan, grade]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-[#E6EFE8] text-[#245B4A] border-[#245B4A]'
                            : 'bg-white text-[#68746B] border-[#E1E7E0]'
                        }`}
                      >
                        {grade}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-[#FAFBF9] rounded-lg border border-[#E1E7E0] space-y-1">
                <div className="font-semibold text-[#202923]">Automated Multi-Grade Rules:</div>
                <div className="text-[11px] text-[#68746B] space-y-0.5">
                  <div>✓ Prioritize weak topics (&lt;55% score) across grades</div>
                  <div>✓ Group foundational concepts (e.g. Fractions across 3, 4, 5)</div>
                  <div>✓ Incorporate local materials: {classroom.resources.slice(0, 4).join(', ')}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAFBF9] border-t border-[#E1E7E0] flex justify-end gap-2.5">
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-[#4A554E] bg-white border border-[#E1E7E0] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleGeneratePlan}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E8AE48]" />
                <span>Run Generator</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WEEKLY OVERVIEW VIEW MODE */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {days.map((day) => {
              const daySessions = activePlan.sessions.filter(s => s.day === day);
              const dayMinutes = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);

              return (
                <div
                  key={day}
                  className="bg-white rounded-xl border border-[#E1E7E0] shadow-2xs overflow-hidden flex flex-col"
                >
                  {/* Day Header */}
                  <div className="p-3 bg-[#FAFBF9] border-b border-[#E1E7E0] flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-xs text-[#202923] uppercase tracking-wider">{day}</h3>
                      <span className="text-[10px] text-[#68746B] font-mono">{dayMinutes} mins</span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveDay(day);
                        setViewMode('daily');
                      }}
                      className="text-[10px] text-[#245B4A] font-semibold hover:underline"
                    >
                      Detail →
                    </button>
                  </div>

                  {/* Day Sessions List */}
                  <div className="p-2 space-y-2 flex-1">
                    {daySessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => {
                          setEditingSession(session);
                          setIsAddingSession(false);
                        }}
                        className="p-2.5 rounded-lg border border-[#E1E7E0] hover:border-[#245B4A] cursor-pointer transition-all bg-[#FFFFFF] hover:bg-[#FAFBF9] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[10px] font-semibold text-[#245B4A]">
                          <span className="font-mono">{session.startTime} ({session.durationMinutes}m)</span>
                          <span className="text-[9px] px-1 py-0.5 rounded bg-[#E6EFE8] text-[#245B4A] font-medium">
                            {session.sessionType === 'Shared Lesson' ? 'Shared' : session.sessionType === 'Grade-Specific Stations' ? 'Stations' : 'Peer'}
                          </span>
                        </div>

                        <h4 className="text-[11px] font-bold text-[#202923] leading-snug line-clamp-2">
                          {session.title}
                        </h4>

                        <div className="text-[10px] text-[#68746B] line-clamp-2">
                          {session.sharedObjective}
                        </div>

                        {session.resources.length > 0 && (
                          <div className="text-[9px] text-[#68746B] truncate border-t border-[#F0F4F1] pt-1">
                            Materials: {session.resources.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Session on this day button */}
                  <div className="p-2 border-t border-[#E1E7E0] bg-[#FAFBF9]">
                    <button
                      onClick={() => {
                        setEditingSession({
                          id: `sess-${Date.now()}`,
                          day,
                          startTime: '10:00',
                          durationMinutes: 45,
                          title: 'New Session',
                          sessionType: 'Shared Lesson',
                          gradesInvolved: classroom.grades,
                          sharedObjective: '',
                          gradeTasks: classroom.grades.map(g => ({ grade: g, task: '' })),
                          resources: ['Chalk and blackboard'],
                          teachingNotes: ''
                        });
                        setIsAddingSession(true);
                      }}
                      className="w-full py-1 text-[11px] font-medium text-[#245B4A] hover:bg-[#E6EFE8] rounded text-center transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Session</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAILY DETAIL VIEW MODE */}
      {viewMode === 'daily' && (
        <div className="space-y-6">
          {/* Day Tabs */}
          <div className="no-print flex items-center gap-2 border-b border-[#E1E7E0] pb-2">
            {days.map((day) => {
              const count = activePlan.sessions.filter(s => s.day === day).length;
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                    activeDay === day
                      ? 'bg-[#245B4A] text-white shadow-xs'
                      : 'bg-white text-[#4A554E] hover:bg-[#F2F6F3] border border-[#E1E7E0]'
                  }`}
                >
                  <span>{day}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeDay === day ? 'bg-white/20 text-white' : 'bg-[#E1E7E0] text-[#68746B]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sessions for selected day */}
          <div className="space-y-4">
            {activePlan.sessions.filter(s => s.day === activeDay).map((session, index) => (
              <div
                key={session.id}
                className="bg-white rounded-xl border border-[#E1E7E0] shadow-2xs overflow-hidden"
              >
                {/* Session Header */}
                <div className="p-4 bg-[#FAFBF9] border-b border-[#E1E7E0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-[#245B4A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#245B4A]">
                          {session.startTime} · {session.durationMinutes} min
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[#E6EFE8] text-[#245B4A] font-semibold border border-[#C6DDD0]">
                          {session.sessionType}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#202923] mt-0.5">{session.title}</h3>
                    </div>
                  </div>

                  <div className="no-print flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        setEditingSession(session);
                        setIsAddingSession(false);
                      }}
                      className="p-1.5 text-[#245B4A] hover:bg-[#E6EFE8] rounded-md transition-colors"
                      title="Edit Session"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteSessionId(session.id)}
                      className="p-1.5 text-[#68746B] hover:text-[#C65C48] rounded-md transition-colors"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Session Content */}
                <div className="p-5 space-y-4 text-xs">
                  <div>
                    <h4 className="font-bold text-[#4A554E] uppercase tracking-wider text-[10px] mb-1">
                      Shared Classroom Objective
                    </h4>
                    <p className="text-[#202923] leading-relaxed font-medium">
                      {session.sharedObjective}
                    </p>
                  </div>

                  {/* Differentiated Grade Tasks Grid */}
                  <div>
                    <h4 className="font-bold text-[#4A554E] uppercase tracking-wider text-[10px] mb-2">
                      Differentiated Grade Activities
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {session.gradeTasks.map((gt) => (
                        <div key={gt.grade} className="p-3 bg-[#FAFBF9] rounded-lg border border-[#E1E7E0] space-y-1">
                          <span className="font-bold text-[#245B4A] text-xs block">{gt.grade}</span>
                          <p className="text-[#4A554E] text-[11px] leading-relaxed">{gt.task}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Required Materials & Teacher Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#E1E7E0]">
                    <div>
                      <span className="font-bold text-[#68746B] block text-[10px] uppercase">
                        Low-Cost Materials
                      </span>
                      <span className="text-[#202923] font-medium mt-0.5 block">
                        {session.resources.join(', ') || 'Chalk and blackboard'}
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-[#68746B] block text-[10px] uppercase">
                        Teacher Notes / Management Strategy
                      </span>
                      <p className="text-[#68746B] italic mt-0.5 text-[11px]">
                        "{session.teachingNotes}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SESSION EDIT MODAL */}
      {editingSession && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-[#E1E7E0] overflow-hidden">
            <div className="p-4 bg-[#FAFBF9] border-b border-[#E1E7E0] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#202923]">
                {isAddingSession ? 'Add Scheduled Lesson' : 'Edit Lesson Session'}
              </h3>
              <button
                onClick={() => setEditingSession(null)}
                className="text-xs text-[#68746B] hover:text-[#202923]"
              >
                Cancel
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#202923] mb-1">Day</label>
                  <select
                    value={editingSession.day}
                    onChange={(e) => setEditingSession({ ...editingSession, day: e.target.value as any })}
                    className="w-full p-2 border border-[#E1E7E0] rounded-md"
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#202923] mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    step={5}
                    min={15}
                    max={120}
                    value={editingSession.durationMinutes}
                    onChange={(e) => setEditingSession({ ...editingSession, durationMinutes: parseInt(e.target.value) || 30 })}
                    className="w-full p-2 border border-[#E1E7E0] rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#202923] mb-1">Session Title</label>
                <input
                  type="text"
                  value={editingSession.title}
                  onChange={(e) => setEditingSession({ ...editingSession, title: e.target.value })}
                  className="w-full p-2 border border-[#E1E7E0] rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202923] mb-1">Session Format</label>
                <select
                  value={editingSession.sessionType}
                  onChange={(e) => setEditingSession({ ...editingSession, sessionType: e.target.value as any })}
                  className="w-full p-2 border border-[#E1E7E0] rounded-md"
                >
                  <option value="Shared Lesson">Shared Lesson (Whole Room)</option>
                  <option value="Grade-Specific Stations">Grade-Specific Stations</option>
                  <option value="Peer Learning">Peer Learning (Cross-Grade Pairs)</option>
                  <option value="Formative Check & Review">Formative Check & Review</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#202923] mb-1">Shared Objective</label>
                <textarea
                  rows={2}
                  value={editingSession.sharedObjective}
                  onChange={(e) => setEditingSession({ ...editingSession, sharedObjective: e.target.value })}
                  className="w-full p-2 border border-[#E1E7E0] rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202923] mb-1">Differentiated Grade Tasks</label>
                <div className="space-y-2">
                  {editingSession.gradeTasks.map((gt, idx) => (
                    <div key={gt.grade} className="flex items-center gap-2">
                      <span className="w-16 font-semibold text-[#245B4A]">{gt.grade}:</span>
                      <input
                        type="text"
                        value={gt.task}
                        onChange={(e) => {
                          const updated = [...editingSession.gradeTasks];
                          updated[idx].task = e.target.value;
                          setEditingSession({ ...editingSession, gradeTasks: updated });
                        }}
                        className="flex-1 p-1.5 border border-[#E1E7E0] rounded-md"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#202923] mb-1">Materials (comma separated)</label>
                <input
                  type="text"
                  value={editingSession.resources.join(', ')}
                  onChange={(e) => setEditingSession({ ...editingSession, resources: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full p-2 border border-[#E1E7E0] rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202923] mb-1">Teacher Management Notes</label>
                <input
                  type="text"
                  value={editingSession.teachingNotes}
                  onChange={(e) => setEditingSession({ ...editingSession, teachingNotes: e.target.value })}
                  className="w-full p-2 border border-[#E1E7E0] rounded-md"
                />
              </div>
            </div>

            <div className="p-4 bg-[#FAFBF9] border-t border-[#E1E7E0] flex justify-end gap-2.5">
              <button
                onClick={() => setEditingSession(null)}
                className="px-3.5 py-1.5 text-xs text-[#4A554E]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSessionEdit}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteSessionId}
        title="Delete Lesson Session"
        description="Are you sure you want to remove this session from your weekly schedule?"
        confirmLabel="Delete"
        isDestructive
        onConfirm={confirmDeleteSession}
        onCancel={() => setDeleteSessionId(null)}
      />

      {/* Teacher Plan Approval Bar */}
      <div className="no-print p-5 bg-white rounded-xl border border-[#E1E7E0] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-[#202923]">Teacher Plan Approval</h4>
          <p className="text-xs text-[#68746B] mt-0.5">
            The teacher retains full authority. Review, adapt durations, and mark as approved.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4A554E] bg-white border border-[#E1E7E0] hover:bg-[#FAFBF9] rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Regenerate Plan</span>
          </button>

          <button
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4A554E] bg-white border border-[#E1E7E0] hover:bg-[#FAFBF9] rounded-lg transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-[#245B4A]" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleApprovePlan}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg shadow-xs transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            <span>{activePlan.status === 'Approved' ? 'Plan Approved (Update)' : 'Approve Plan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
