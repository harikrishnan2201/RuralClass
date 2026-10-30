import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderArchive,
  CalendarCheck,
  Clock,
  Trash2,
  Copy,
  ExternalLink,
  Edit2,
  Plus,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Storage } from '../lib/storage';
import { WeeklyPlan } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

export const SavedPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<WeeklyPlan[]>(Storage.getSavedPlans());
  const [activePlan, setActivePlan] = useState<WeeklyPlan>(Storage.getActivePlan());

  // Editing metadata
  const [editingPlan, setEditingPlan] = useState<{ id: string; name: string; notes?: string } | null>(null);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      setPlans(Storage.getSavedPlans());
      setActivePlan(Storage.getActivePlan());
    };
    window.addEventListener('ruralclass_storage_change', handleStorageChange);
    return () => window.removeEventListener('ruralclass_storage_change', handleStorageChange);
  }, []);

  const handleOpenPlan = (plan: WeeklyPlan) => {
    Storage.saveActivePlan(plan);
    setActivePlan(plan);
    navigate('/weekly-planner');
  };

  const handleDuplicatePlan = (plan: WeeklyPlan) => {
    const copy: WeeklyPlan = {
      ...plan,
      id: `plan-copy-${Date.now()}`,
      name: `${plan.name} (Copy)`,
      weekLabel: 'Next Week',
      status: 'Draft',
      approvedDate: undefined,
      lastUpdated: new Date().toISOString()
    };
    const updated = [copy, ...plans];
    Storage.saveSavedPlans(updated);
    setPlans(updated);
    setToastMessage(`Duplicated "${plan.name}" successfully!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const confirmDeletePlan = () => {
    if (!deletePlanId) return;
    const updated = plans.filter(p => p.id !== deletePlanId);
    Storage.saveSavedPlans(updated);
    setPlans(updated);
    setDeletePlanId(null);
    setToastMessage('Plan deleted.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSaveRename = () => {
    if (!editingPlan) return;
    const updated = plans.map(p =>
      p.id === editingPlan.id ? { ...p, name: editingPlan.name, notes: editingPlan.notes } : p
    );
    Storage.saveSavedPlans(updated);
    setPlans(updated);

    if (activePlan.id === editingPlan.id) {
      const updatedActive = { ...activePlan, name: editingPlan.name, notes: editingPlan.notes };
      Storage.saveActivePlan(updatedActive);
      setActivePlan(updatedActive);
    }

    setEditingPlan(null);
    setToastMessage('Plan details updated.');
    setTimeout(() => setToastMessage(null), 2500);
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
          <span className="text-xs uppercase tracking-wider text-[#68746B] font-semibold">Curriculum Archive</span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#202923] tracking-tight mt-1">
            Saved Teaching Plans
          </h2>
          <p className="text-sm text-[#4A554E] mt-1">
            Manage, duplicate, and archive approved multi-grade weekly schedules.
          </p>
        </div>

        <button
          onClick={() => navigate('/weekly-planner')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg shadow-xs transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </button>
      </div>

      {/* Empty State */}
      {plans.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E1E7E0] p-12 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-[#E6EFE8] text-[#245B4A] flex items-center justify-center mx-auto">
            <FolderArchive className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#202923]">No Saved Plans Found</h3>
          <p className="text-xs text-[#68746B] max-w-sm mx-auto leading-relaxed">
            You don't have any saved teaching plans in storage. Generate a plan from the Weekly Planner to get started.
          </p>
          <button
            onClick={() => navigate('/weekly-planner')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#245B4A] rounded-lg"
          >
            Go to Weekly Planner
          </button>
        </div>
      ) : (
        /* Plans List */
        <div className="grid grid-cols-1 gap-4">
          {plans.map((plan) => {
            const isActive = activePlan.id === plan.id;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl border transition-all p-5 shadow-2xs ${
                  isActive ? 'border-[#245B4A] ring-1 ring-[#245B4A]/20' : 'border-[#E1E7E0] hover:border-[#C6DDD0]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-bold text-[#202923]">{plan.name}</h3>
                      <StatusBadge status={plan.status} />
                      {isActive && (
                        <span className="text-[10px] bg-[#E6EFE8] text-[#245B4A] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          Active in Planner
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#68746B]">
                      <span>{plan.weekLabel}</span>
                      <span>·</span>
                      <span>{plan.classroomName}</span>
                      <span>·</span>
                      <span className="font-semibold text-[#202923]">{plan.gradesCovered.join(', ')}</span>
                      <span>·</span>
                      <span className="font-mono">{plan.sessions.length} sessions ({plan.totalPlannedHours} hrs)</span>
                    </div>

                    {plan.notes && (
                      <p className="text-xs text-[#4A554E] italic mt-1">"{plan.notes}"</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    <button
                      onClick={() => handleOpenPlan(plan)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg transition-colors shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Plan</span>
                    </button>

                    <button
                      onClick={() => setEditingPlan({ id: plan.id, name: plan.name, notes: plan.notes })}
                      className="p-1.5 text-[#4A554E] hover:text-[#202923] hover:bg-[#F2F6F3] rounded-md transition-colors"
                      title="Rename or Edit Notes"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDuplicatePlan(plan)}
                      className="p-1.5 text-[#4A554E] hover:text-[#202923] hover:bg-[#F2F6F3] rounded-md transition-colors"
                      title="Duplicate for Next Week"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeletePlanId(plan.id)}
                      className="p-1.5 text-[#68746B] hover:text-[#C65C48] hover:bg-[#FDF2F0] rounded-md transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-[#E1E7E0] overflow-hidden">
            <div className="p-4 bg-[#FAFBF9] border-b border-[#E1E7E0] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#202923]">Edit Plan Details</h3>
              <button onClick={() => setEditingPlan(null)} className="text-xs text-[#68746B]">Cancel</button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#202923] mb-1">Plan Name</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full p-2 border border-[#E1E7E0] rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202923] mb-1">Teacher Pedagogical Notes</label>
                <textarea
                  rows={3}
                  value={editingPlan.notes || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, notes: e.target.value })}
                  className="w-full p-2 border border-[#E1E7E0] rounded-md"
                  placeholder="e.g. Focused on fraction strip bridge for Classes 3, 4 and 5."
                />
              </div>
            </div>

            <div className="p-4 bg-[#FAFBF9] border-t border-[#E1E7E0] flex justify-end gap-2.5">
              <button
                onClick={() => setEditingPlan(null)}
                className="px-3 py-1.5 text-xs text-[#4A554E]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRename}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#245B4A] rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Dialog */}
      <ConfirmationModal
        isOpen={!!deletePlanId}
        title="Delete Saved Plan"
        description="Are you sure you want to permanently delete this teaching plan from your saved plans?"
        confirmLabel="Delete Plan"
        isDestructive
        onConfirm={confirmDeletePlan}
        onCancel={() => setDeletePlanId(null)}
      />
    </div>
  );
};
