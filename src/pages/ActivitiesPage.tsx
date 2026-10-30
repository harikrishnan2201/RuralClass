import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { Storage } from '../lib/storage';
import { Activity, ClassroomConfig, WeeklyPlan, LessonSession } from '../types';

export const ActivitiesPage: React.FC = () => {
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
          <span className="text-xs uppercase tracking-wider text-[#68746B] font-semibold">Low-Resource Pedagogy</span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#202923] tracking-tight mt-1">
            Activities & Resources
          </h2>
          <p className="text-sm text-[#4A554E] mt-1">
            Zero-cost, tactile learning activities designed for rural multi-grade classrooms without electricity.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#245B4A] bg-[#E6EFE8] px-3 py-1.5 rounded-lg border border-[#C6DDD0] font-medium">
          <PackageCheck className="w-4 h-4" />
          <span>Classroom Materials Filter Active</span>
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
              placeholder="Search activities, concepts, or materials (e.g. pebbles, paper, multiplication)..."
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
            <span>Only activities matching school inventory</span>
          </label>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#F0F4F1]">
          <span className="text-xs text-[#68746B] font-medium">Filter by:</span>

          {/* Grade */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="text-xs bg-white border border-[#E1E7E0] rounded-md px-2.5 py-1 text-[#202923]"
          >
            <option value="All">All Grades</option>
            <option value="Class 3">Class 3</option>
            <option value="Class 4">Class 4</option>
            <option value="Class 5">Class 5</option>
          </select>

          {/* Duration */}
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(e.target.value)}
            className="text-xs bg-white border border-[#E1E7E0] rounded-md px-2.5 py-1 text-[#202923]"
          >
            <option value="All">All Durations</option>
            <option value="Short">Quick (&le;20 min)</option>
            <option value="Medium">Standard (25–30 min)</option>
            <option value="Long">Extended (&gt;30 min)</option>
          </select>

          {/* Material */}
          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className="text-xs bg-white border border-[#E1E7E0] rounded-md px-2.5 py-1 text-[#202923]"
          >
            <option value="All">All Materials</option>
            <option value="Paper">Paper</option>
            <option value="Pebbles">Pebbles / Stones</option>
            <option value="Bottle caps">Bottle caps</option>
            <option value="Sticks">Sticks</option>
            <option value="Chalk">Chalk & Blackboard</option>
          </select>

          <span className="text-[11px] text-[#68746B] ml-auto">
            Showing {filteredActivities.length} of {activities.length} activities
          </span>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredActivities.map((activity) => (
          <div
            key={activity.id}
            className="bg-white rounded-xl border border-[#E1E7E0] shadow-2xs hover:border-[#245B4A]/50 transition-all flex flex-col justify-between overflow-hidden"
          >
            {/* Top Details */}
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#245B4A]">
                    <span>{activity.grades.join(', ')}</span>
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
                  Required Low-Cost Materials
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
                  Differentiated Grade Adaptations
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
                  Step-by-Step Classroom Guide
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
              <span className="text-[11px] text-[#68746B]">Tested in multi-grade rural schools</span>
              <button
                onClick={() => setSelectedActivityForPlan(activity)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg transition-colors shadow-2xs"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Add to Weekly Plan</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add to Weekly Plan */}
      {selectedActivityForPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-[#E1E7E0] overflow-hidden">
            <div className="p-4 bg-[#FAFBF9] border-b border-[#E1E7E0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-[#245B4A]" />
                <h3 className="font-bold text-sm text-[#202923]">Schedule Activity</h3>
              </div>
              <button
                onClick={() => setSelectedActivityForPlan(null)}
                className="text-xs text-[#68746B] hover:text-[#202923]"
              >
                Cancel
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-[#68746B]">Activity:</span>
                <div className="font-bold text-sm text-[#202923] mt-0.5">
                  {selectedActivityForPlan.title}
                </div>
                <div className="text-[11px] text-[#68746B]">
                  Duration: {selectedActivityForPlan.durationMinutes} min · {selectedActivityForPlan.grades.join(', ')}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#202923] mb-1">Select School Day</label>
                <select
                  value={targetDay}
                  onChange={(e) => setTargetDay(e.target.value as any)}
                  className="w-full p-2 border border-[#E1E7E0] rounded-md bg-white font-medium text-xs"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#202923] mb-1">Time Slot (approximate)</label>
                <input
                  type="time"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  className="w-full p-2 border border-[#E1E7E0] rounded-md bg-white font-mono text-xs"
                />
              </div>

              <div className="p-3 bg-[#FAFBF9] rounded-lg border border-[#E1E7E0] text-[11px] text-[#4A554E]">
                This activity will be added as a differentiated session on {targetDay} with tasks populated for {selectedActivityForPlan.grades.join(', ')}.
              </div>
            </div>

            <div className="p-4 bg-[#FAFBF9] border-t border-[#E1E7E0] flex justify-end gap-2.5">
              <button
                onClick={() => setSelectedActivityForPlan(null)}
                className="px-3.5 py-1.5 text-xs text-[#4A554E]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddToPlan}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg"
              >
                Confirm & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
