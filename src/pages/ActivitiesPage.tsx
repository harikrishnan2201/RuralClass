import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Search,
  Filter,
  Clock,
  PackageCheck,
  CalendarPlus,
  CheckCircle2,
  BookOpen,
  Users,
  ChevronDown,
  Layers,
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';
import { Storage } from '../lib/storage';
import { Activity, ClassroomConfig, WeeklyPlan, LessonSession } from '../types';
import { localizeGrade, localizeActivity, localizeResource } from '../shared/contentLocalization';

export const ActivitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [classroom] = useState<ClassroomConfig>(Storage.getClassroom());
  const [activities] = useState<Activity[]>(Storage.getActivities());

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [selectedDuration, setSelectedDuration] = useState<string>('All');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('All');
  const [onlyAvailableResources, setOnlyAvailableResources] = useState<boolean>(true);

  // Modal for "Add to Weekly Plan"
  const [activePlan, setActivePlan] = useState<WeeklyPlan>(Storage.getActivePlan());
  const [selectedActivityForPlan, setSelectedActivityForPlan] = useState<Activity | null>(null);
  const [targetDay, setTargetDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Tuesday');
  const [targetTime, setTargetTime] = useState('11:00');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = activity.title.toLowerCase().includes(q);
      const matchObj = activity.objective.toLowerCase().includes(q);
      const matchMat = activity.requiredMaterials.some(m => m.toLowerCase().includes(q));
      if (!matchTitle && !matchObj && !matchMat) return false;
    }

    // Grade filter
    if (selectedGrade !== 'All' && !activity.grades.includes(selectedGrade)) {
      return false;
    }

    // Duration filter
    if (selectedDuration === 'Short' && activity.durationMinutes > 20) return false;
    if (selectedDuration === 'Medium' && (activity.durationMinutes <= 20 || activity.durationMinutes > 30)) return false;
    if (selectedDuration === 'Long' && activity.durationMinutes <= 30) return false;

    // Material filter
    if (selectedMaterial !== 'All' && !activity.requiredMaterials.some(m => m.toLowerCase().includes(selectedMaterial.toLowerCase()))) {
      return false;
    }

    // Prioritize only available resources in classroom
    if (onlyAvailableResources) {
      const hasAllMaterials = activity.requiredMaterials.every(m =>
        classroom.resources.some(cr => cr.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(cr.toLowerCase()))
      );
      if (!hasAllMaterials) return false;
    }

    return true;
  });

  // Handle Add to Weekly Plan
  const handleConfirmAddToPlan = () => {
    if (!selectedActivityForPlan) return;

    const newSession: LessonSession = {
      id: `sess-act-${Date.now()}`,
      day: targetDay,
      startTime: targetTime,
      durationMinutes: selectedActivityForPlan.durationMinutes,
      title: selectedActivityForPlan.title,
      sessionType: selectedActivityForPlan.category === 'Peer Learning' ? 'Peer Learning' : 'Grade-Specific Stations',
      gradesInvolved: selectedActivityForPlan.grades,
      sharedObjective: selectedActivityForPlan.objective,
      gradeTasks: selectedActivityForPlan.adaptations.map(a => ({
        grade: a.grade,
        task: a.instruction
      })),
      resources: selectedActivityForPlan.requiredMaterials,
      teachingNotes: `Integrated from Low-Cost Activity Library. Step 1: ${selectedActivityForPlan.steps[0]}`
    };

    const updatedSessions = [...activePlan.sessions, newSession];
    const totalMinutes = updatedSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const updatedPlan: WeeklyPlan = {
      ...activePlan,
      sessions: updatedSessions,
      totalPlannedHours: Math.round((totalMinutes / 60) * 10) / 10,
      lastUpdated: new Date().toISOString()
    };

    Storage.saveActivePlan(updatedPlan);
    setActivePlan(updatedPlan);
    setToastMessage(`"${selectedActivityForPlan.title}" added to ${targetDay} schedule!`);
    setSelectedActivityForPlan(null);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-lg bg-[#F0F7F2] border border-[#C3DEC9] text-[#1E563E] text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#245B4A]" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="font-bold text-xs">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#E1E7E0]">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#68746B] font-semibold">{t('nav.activities')}</span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#202923] tracking-tight mt-1">
            {t('activities.title')}
          </h2>
          <p className="text-sm text-[#4A554E] mt-1">
            {t('activities.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/import?entity=activities')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4A554E] bg-white border border-[#E1E7E0] hover:bg-[#FAFBF9] rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('import.importActivities')}</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-[#245B4A] bg-[#E6EFE8] px-3 py-1.5 rounded-lg border border-[#C6DDD0] font-medium">
            <PackageCheck className="w-4 h-4" />
            <span>{t('activities.filterActive')}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#E1E7E0] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#68746B]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('activities.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E1E7E0] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#245B4A]"
            />
          </div>

          {/* Toggle: Match only available resources */}
          <label className="flex items-center gap-2 text-xs font-semibold text-[#202923] bg-[#FAFBF9] px-3 py-2 rounded-lg border border-[#E1E7E0] cursor-pointer">
            <input
              type="checkbox"
              checked={onlyAvailableResources}
              onChange={(e) => setOnlyAvailableResources(e.target.checked)}
              className="accent-[#245B4A] w-4 h-4"
            />
            <span>{t('activities.onlyInventoryMaterials')}</span>
          </label>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#F0F4F1]">
          <span className="text-xs text-[#68746B] font-medium">{t('activities.filterBy')}</span>

          {/* Grade */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="text-xs bg-white border border-[#E1E7E0] rounded-md px-2.5 py-1 text-[#202923]"
          >
            <option value="All">{t('common.all')}</option>
            {classroom.grades.map(g => (
              <option key={g} value={g}>{localizeGrade(g, i18n.language)}</option>
            ))}
          </select>

          {/* Duration */}
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(e.target.value)}
            className="text-xs bg-white border border-[#E1E7E0] rounded-md px-2.5 py-1 text-[#202923]"
          >
            <option value="All">{t('common.allDurations')}</option>
            <option value="Short">{t('activities.durationQuick')}</option>
            <option value="Medium">{t('activities.durationStandard')}</option>
            <option value="Long">{t('activities.durationExtended')}</option>
          </select>

          {/* Material */}
          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className="text-xs bg-white border border-[#E1E7E0] rounded-md px-2.5 py-1 text-[#202923]"
          >
            <option value="All">{t('common.allMaterials')}</option>
            <option value="Paper">{t('activities.materialPaper')}</option>
            <option value="Pebbles">{t('activities.materialPebbles')}</option>
            <option value="Bottle caps">{t('activities.materialBottleCaps')}</option>
            <option value="Sticks">{t('activities.materialSticks')}</option>
            <option value="Chalk">{t('activities.materialChalk')}</option>
          </select>

          <span className="text-[11px] text-[#68746B] ml-auto">
            {t('activities.showingActivitiesCount', { filtered: filteredActivities.length, total: activities.length })}
          </span>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredActivities.map((rawActivity) => {
          const activity = localizeActivity(rawActivity, i18n.language);
          return (
            <div
              key={activity.id}
              className="bg-white rounded-xl border border-[#E1E7E0] shadow-2xs hover:border-[#245B4A]/50 transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Top Details */}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#245B4A]">
                      <span>{activity.grades.map(g => localizeGrade(g, i18n.language)).join(', ')}</span>
                      <span>·</span>
                      <span className="text-[#68746B]">{activity.category}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#202923] mt-0.5 leading-snug">
                      {activity.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-mono font-medium text-[#68746B] bg-[#FAFBF9] px-2 py-1 rounded border border-[#E1E7E0] shrink-0">
                    <Clock className="w-3.5 h-3.5 text-[#245B4A]" />
                    <span>{activity.durationMinutes}m</span>
                  </div>
                </div>

                {/* Objective */}
                <p className="text-xs text-[#4A554E] leading-relaxed">
                  {activity.objective}
                </p>

                {/* Required Materials */}
                <div className="p-2.5 rounded-lg bg-[#FAFBF9] border border-[#E1E7E0] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#68746B]">
                    {t('activities.requiredLowCostMaterials')}
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {activity.requiredMaterials.map(mat => (
                      <span
                        key={mat}
                        className="text-[11px] px-2 py-0.5 rounded bg-white border border-[#E1E7E0] text-[#202923] font-medium"
                      >
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Multi-Grade Adaptations Accordion/Preview */}
                <div className="space-y-1.5 pt-2 border-t border-[#F0F4F1]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#68746B]">
                    {t('activities.differentiatedAdaptations')}
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {activity.adaptations.map((adapt) => (
                      <div key={adapt.grade} className="flex items-start gap-1.5">
                        <span className="font-bold text-[#245B4A] min-w-14">{adapt.grade}:</span>
                        <span className="text-[#4A554E] text-[11px] leading-relaxed">{adapt.instruction}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step By Step Instructions */}
                <div className="space-y-1 pt-2 border-t border-[#F0F4F1]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#68746B]">
                    {t('activities.stepByStepGuide')}
                  </span>
                  <ol className="text-[11px] text-[#4A554E] space-y-1 list-decimal pl-4 leading-relaxed">
                    {activity.steps.map((st, idx) => (
                      <li key={idx}>{st}</li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="p-3.5 bg-[#FAFBF9] border-t border-[#E1E7E0] flex items-center justify-between">
                <span className="text-[11px] text-[#68746B]">{t('activities.testedInRuralSchools')}</span>
                <button
                  onClick={() => setSelectedActivityForPlan(rawActivity)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>{t('activities.addToWeeklyPlan')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add to Weekly Plan */}
      {selectedActivityForPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-[#E1E7E0] overflow-hidden">
            <div className="p-4 bg-[#FAFBF9] border-b border-[#E1E7E0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-[#245B4A]" />
                <h3 className="font-bold text-sm text-[#202923]">{t('activities.scheduleActivity')}</h3>
              </div>
              <button
                onClick={() => setSelectedActivityForPlan(null)}
                className="text-xs text-[#68746B] hover:text-[#202923] cursor-pointer"
              >
                {t('common.cancel')}
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-[#68746B]">{t('nav.activities')}:</span>
                <div className="font-bold text-sm text-[#202923] mt-0.5">
                  {localizeActivity(selectedActivityForPlan, i18n.language).title}
                </div>
                <div className="text-[11px] text-[#68746B]">
                  {selectedActivityForPlan.durationMinutes}m · {selectedActivityForPlan.grades.map(g => localizeGrade(g, i18n.language)).join(', ')}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#202923] mb-1">{t('activities.selectSchoolDay')}</label>
                <select
                  value={targetDay}
                  onChange={(e) => setTargetDay(e.target.value as any)}
                  className="w-full p-2 border border-[#E1E7E0] rounded-md bg-white font-medium text-xs"
                >
                  <option value="Monday">{t('common.days.monday')}</option>
                  <option value="Tuesday">{t('common.days.tuesday')}</option>
                  <option value="Wednesday">{t('common.days.wednesday')}</option>
                  <option value="Thursday">{t('common.days.thursday')}</option>
                  <option value="Friday">{t('common.days.friday')}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#202923] mb-1">{t('activities.timeSlotApprox')}</label>
                <input
                  type="time"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  className="w-full p-2 border border-[#E1E7E0] rounded-md bg-white font-mono text-xs"
                />
              </div>

              <div className="p-3 bg-[#FAFBF9] rounded-lg border border-[#E1E7E0] text-[11px] text-[#4A554E]">
                {t('activities.scheduleModalNote', {
                  day: t(`common.days.${targetDay.toLowerCase()}` as any),
                  grades: selectedActivityForPlan.grades.map(g => localizeGrade(g, i18n.language)).join(', ')
                })}
              </div>
            </div>

            <div className="p-4 bg-[#FAFBF9] border-t border-[#E1E7E0] flex justify-end gap-2.5">
              <button
                onClick={() => setSelectedActivityForPlan(null)}
                className="px-3.5 py-1.5 text-xs text-[#4A554E] cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmAddToPlan}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg cursor-pointer"
              >
                {t('activities.confirmAndAdd')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
