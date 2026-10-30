import React, { useState } from 'react';
import {
  School,
  BookOpen,
  PackageCheck,
  CheckCircle2,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  ChevronRight,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';
import { Storage } from '../lib/storage';
import { ClassroomConfig, Topic } from '../types';
import { AVAILABLE_RESOURCE_OPTIONS } from '../data/initialData';
import { StatusBadge } from '../components/common/StatusBadge';

export const ClassroomSetupPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [classroom, setClassroom] = useState<ClassroomConfig>(Storage.getClassroom());
  const [topics, setTopics] = useState<Topic[]>(Storage.getTopics());
  const [newGradeInput, setNewGradeInput] = useState('');
  const [customResourceInput, setCustomResourceInput] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New topic modal/form states
  const [editingTopic, setEditingTopic] = useState<Partial<Topic> | null>(null);
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  // Step 1: Add grade
  const handleAddGrade = () => {
    const trimmed = newGradeInput.trim();
    if (!trimmed) return;
    if (classroom.grades.includes(trimmed)) {
      setErrorMessage('This grade is already added.');
      return;
    }
    setClassroom({
      ...classroom,
      grades: [...classroom.grades, trimmed]
    });
    setNewGradeInput('');
    setErrorMessage(null);
  };

  const handleRemoveGrade = (gradeToRemove: string) => {
    if (classroom.grades.length <= 1) {
      setErrorMessage('Classroom must have at least one grade.');
      return;
    }
    setClassroom({
      ...classroom,
      grades: classroom.grades.filter(g => g !== gradeToRemove)
    });
    setErrorMessage(null);
  };

  // Step 3: Toggle Resource
  const handleToggleResource = (res: string) => {
    const exists = classroom.resources.includes(res);
    setClassroom({
      ...classroom,
      resources: exists
        ? classroom.resources.filter(r => r !== res)
        : [...classroom.resources, res]
    });
  };

  const handleAddCustomResource = () => {
    const trimmed = customResourceInput.trim();
    if (!trimmed) return;
    if (classroom.resources.includes(trimmed)) return;
    setClassroom({
      ...classroom,
      resources: [...classroom.resources, trimmed]
    });
    setCustomResourceInput('');
  };

  // Step 2: Topics Management
  const handleSaveTopic = () => {
    if (!editingTopic || !editingTopic.name || !editingTopic.grade) {
      setErrorMessage('Please provide topic name and select a grade.');
      return;
    }

    if (editingTopic.id) {
      // Edit existing
      setTopics(topics.map(t => t.id === editingTopic.id ? (editingTopic as Topic) : t));
    } else {
      // Create new
      const newTopic: Topic = {
        id: `topic-${Date.now()}`,
        grade: editingTopic.grade || classroom.grades[0],
        subject: editingTopic.subject || 'Mathematics',
        name: editingTopic.name,
        status: editingTopic.status || 'In Progress',
        progress: editingTopic.progress ?? 50,
        understandingLevel: editingTopic.understandingLevel ?? 50,
        prerequisiteTopicName: editingTopic.prerequisiteTopicName || '',
        notes: editingTopic.notes || ''
      };
      setTopics([...topics, newTopic]);
    }

    setEditingTopic(null);
    setIsAddingTopic(false);
    setErrorMessage(null);
  };

  const handleDeleteTopic = (id: string) => {
    setTopics(topics.filter(t => t.id !== id));
  };

  // Final Save
  const handleSaveAll = () => {
    if (!classroom.name.trim()) {
      setErrorMessage('Please enter a classroom name.');
      setCurrentStep(1);
      return;
    }
    if (classroom.grades.length === 0) {
      setErrorMessage('Please include at least one grade.');
      setCurrentStep(1);
      return;
    }

    Storage.saveClassroom(classroom);
    Storage.saveTopics(topics);

    setSuccessMessage('Classroom configuration and topic progress saved successfully!');
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleResetDemo = () => {
    Storage.resetToDefaults();
    setClassroom(Storage.getClassroom());
    setTopics(Storage.getTopics());
    setSuccessMessage('Restored standard demo classroom settings.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#E1E7E0]">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#68746B] font-semibold">Configuration Wizard</span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#202923] tracking-tight mt-1">
            Classroom Setup
          </h2>
          <p className="text-sm text-[#4A554E] mt-1">
            Configure grades, subject syllabus topics, and available low-cost materials.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4A554E] bg-white border border-[#E1E7E0] hover:bg-[#F2F6F3] rounded-lg transition-colors self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#68746B]" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-lg bg-[#F0F7F2] border border-[#C3DEC9] text-[#1E563E] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#245B4A]" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-[#FDF2F0] border border-[#F5C9C0] text-[#A63A26] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#C65C48]" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Wizard Step Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#FAFBF9] p-2 rounded-xl border border-[#E1E7E0]">
        {[
          { step: 1, label: '1. Classroom Info', icon: School },
          { step: 2, label: '2. Topic Progress', icon: BookOpen },
          { step: 3, label: '3. Resources', icon: PackageCheck },
          { step: 4, label: '4. Review & Save', icon: CheckCircle2 },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentStep === item.step;
          const isDone = currentStep > item.step;

          return (
            <button
              key={item.step}
              onClick={() => setCurrentStep(item.step as any)}
              className={`flex items-center gap-2 p-3 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-white border border-[#245B4A] shadow-xs text-[#202923]'
                  : isDone
                  ? 'bg-transparent text-[#245B4A] hover:bg-white/60'
                  : 'bg-transparent text-[#68746B] hover:bg-white/40'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${
                  isActive
                    ? 'bg-[#245B4A] text-white'
                    : isDone
                    ? 'bg-[#E6EFE8] text-[#245B4A]'
                    : 'bg-[#E1E7E0] text-[#68746B]'
                }`}
              >
                {item.step}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold truncate">{item.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* STEP 1: Classroom Information */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-[#E1E7E0] p-6 space-y-6 shadow-2xs">
          <div>
            <h3 className="text-base font-bold text-[#202923]">Classroom Basic Information</h3>
            <p className="text-xs text-[#68746B] mt-0.5">
              Specify your school environment, grades sharing the same room, and teaching hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1.5">
                Classroom / School Name *
              </label>
              <input
                type="text"
                value={classroom.name}
                onChange={(e) => setClassroom({ ...classroom, name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#E1E7E0] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#245B4A]"
                placeholder="e.g. Rural Learning Centre"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1.5">
                Primary Subject Focus
              </label>
              <select
                value={classroom.subjects[0] || 'Mathematics'}
                onChange={(e) => setClassroom({ ...classroom, subjects: [e.target.value] })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#E1E7E0] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#245B4A]"
              >
                <option value="Mathematics">Mathematics (Foundational Numeracy)</option>
                <option value="Science">General Science & Nature</option>
                <option value="Language">Language & Foundational Literacy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1.5">
                School Days Per Week
              </label>
              <input
                type="number"
                min={1}
                max={6}
                value={classroom.daysPerWeek}
                onChange={(e) => setClassroom({ ...classroom, daysPerWeek: Math.max(1, Math.min(6, parseInt(e.target.value) || 5)) })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#E1E7E0] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#245B4A]"
              />
              <span className="text-[11px] text-[#68746B] mt-1 block">Usually Monday to Friday (5 days)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1.5">
                Available Teaching Hours Per Day
              </label>
              <input
                type="number"
                min={1}
                max={8}
                value={classroom.hoursPerDay}
                onChange={(e) => setClassroom({ ...classroom, hoursPerDay: Math.max(1, Math.min(8, parseInt(e.target.value) || 3)) })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#E1E7E0] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#245B4A]"
              />
              <span className="text-[11px] text-[#68746B] mt-1 block">
                Total weekly capacity: {classroom.daysPerWeek * classroom.hoursPerDay} teaching hours
              </span>
            </div>
          </div>

          {/* Grades Managed Section */}
          <div className="pt-4 border-t border-[#E1E7E0]">
            <label className="block text-xs font-semibold text-[#202923] mb-2">
              Grades Sharing This Classroom ({classroom.grades.length} grades)
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {classroom.grades.map((grade) => (
                <div
                  key={grade}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E6EFE8] text-[#245B4A] rounded-lg text-xs font-semibold border border-[#C6DDD0]"
                >
                  <span>{grade}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveGrade(grade)}
                    className="p-0.5 hover:text-[#C65C48] rounded transition-colors"
                    title={`Remove ${grade}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="text"
                value={newGradeInput}
                onChange={(e) => setNewGradeInput(e.target.value)}
                placeholder="e.g. Class 2 or Class 6"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#E1E7E0] rounded-lg"
              />
              <button
                type="button"
                onClick={handleAddGrade}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Grade</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#E1E7E0]">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg transition-colors"
            >
              <span>Continue to Topic Progress</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Topic Progress */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-[#E1E7E0] p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#202923]">Grade-wise Topic Progress</h3>
              <p className="text-xs text-[#68746B] mt-0.5">
                Track topic status and understanding levels across all grades in the room.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingTopic({
                  grade: classroom.grades[0] || 'Class 3',
                  subject: classroom.subjects[0] || 'Mathematics',
                  status: 'In Progress',
                  progress: 50,
                  understandingLevel: 50
                });
                setIsAddingTopic(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Topic</span>
            </button>
          </div>

          {/* Inline Edit/Add Form */}
          {isAddingTopic && editingTopic && (
            <div className="p-4 bg-[#FAFBF9] rounded-lg border border-[#245B4A]/30 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#245B4A]">
                  {editingTopic.id ? 'Edit Topic' : 'Add New Curriculum Topic'}
                </h4>
                <button
                  onClick={() => {
                    setIsAddingTopic(false);
                    setEditingTopic(null);
                  }}
                  className="text-xs text-[#68746B] hover:text-[#202923]"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#202923] mb-1">Grade</label>
                  <select
                    value={editingTopic.grade}
                    onChange={(e) => setEditingTopic({ ...editingTopic, grade: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E1E7E0] rounded-md"
                  >
                    {classroom.grades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#202923] mb-1">Topic Name *</label>
                  <input
                    type="text"
                    value={editingTopic.name || ''}
                    onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                    placeholder="e.g. Fractions of a Set"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E1E7E0] rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#202923] mb-1">Status</label>
                  <select
                    value={editingTopic.status}
                    onChange={(e) => setEditingTopic({ ...editingTopic, status: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E1E7E0] rounded-md"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-[#202923] mb-1">
                    <span>Understanding Level (Observed): {editingTopic.understandingLevel}%</span>
                    <span className="text-[#68746B]">{editingTopic.understandingLevel! < 50 ? 'Needs Attention' : editingTopic.understandingLevel! < 75 ? 'Developing' : 'Strong'}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={editingTopic.understandingLevel}
                    onChange={(e) => setEditingTopic({ ...editingTopic, understandingLevel: parseInt(e.target.value) })}
                    className="w-full accent-[#245B4A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#202923] mb-1">Prerequisite Topic / Foundation</label>
                  <input
                    type="text"
                    value={editingTopic.prerequisiteTopicName || ''}
                    onChange={(e) => setEditingTopic({ ...editingTopic, prerequisiteTopicName: e.target.value })}
                    placeholder="e.g. Equal sharing or Single-digit multiplication"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E1E7E0] rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#202923] mb-1">Teacher Notes / Common Difficulties</label>
                <input
                  type="text"
                  value={editingTopic.notes || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, notes: e.target.value })}
                  placeholder="e.g. Students confuse denominator with number of objects"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E1E7E0] rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTopic(false);
                    setEditingTopic(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-[#4A554E] bg-white border border-[#E1E7E0] rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTopic}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-md"
                >
                  Save Topic
                </button>
              </div>
            </div>
          )}

          {/* Topics Table by Grade */}
          <div className="space-y-4">
            {classroom.grades.map((grade) => {
              const gradeTopics = topics.filter(t => t.grade === grade);

              return (
                <div key={grade} className="border border-[#E1E7E0] rounded-lg overflow-hidden">
                  <div className="bg-[#FAFBF9] px-4 py-2.5 border-b border-[#E1E7E0] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#202923]">{grade} Topics ({gradeTopics.length})</span>
                    <span className="text-[11px] text-[#68746B]">
                      Average understanding: {gradeTopics.length > 0 ? Math.round(gradeTopics.reduce((s, t) => s + t.understandingLevel, 0) / gradeTopics.length) : 0}%
                    </span>
                  </div>

                  {gradeTopics.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#68746B]">
                      No topics added for {grade} yet. Click "Add New Topic" above.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E1E7E0]">
                      {gradeTopics.map((topic) => (
                        <div key={topic.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAFBF9]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#202923]">{topic.name}</span>
                              <span className="text-[11px] text-[#68746B]">· {topic.status}</span>
                            </div>
                            {topic.prerequisiteTopicName && (
                              <p className="text-[11px] text-[#4A554E]">
                                <span className="text-[#68746B]">Prerequisite:</span> {topic.prerequisiteTopicName}
                              </p>
                            )}
                            {topic.notes && (
                              <p className="text-[11px] text-[#68746B] italic">"{topic.notes}"</p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <StatusBadge level={topic.understandingLevel} />
                            <button
                              onClick={() => {
                                setEditingTopic(topic);
                                setIsAddingTopic(true);
                              }}
                              className="px-2 py-1 text-xs font-medium text-[#245B4A] hover:bg-[#E6EFE8] rounded transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTopic(topic.id)}
                              className="p-1 text-[#68746B] hover:text-[#C65C48] rounded transition-colors"
                              title="Delete topic"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-[#E1E7E0]">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#4A554E] bg-white border border-[#E1E7E0] rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg transition-colors"
            >
              <span>Continue to Resources</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Classroom Resources */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border border-[#E1E7E0] p-6 space-y-6 shadow-2xs">
          <div>
            <h3 className="text-base font-bold text-[#202923]">Classroom Resources & Environmental Constraints</h3>
            <p className="text-xs text-[#68746B] mt-0.5">
              Select items available in your school. RuralClass prioritizes zero-cost activities matching these items.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {AVAILABLE_RESOURCE_OPTIONS.map((item) => {
              const isChecked = classroom.resources.includes(item);

              return (
                <div
                  key={item}
                  onClick={() => handleToggleResource(item)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-[#F2F6F3] border-[#245B4A] text-[#202923]'
                      : 'bg-white border-[#E1E7E0] text-[#68746B] hover:border-[#C6DDD0]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // handled by parent div
                    className="w-4 h-4 rounded text-[#245B4A] accent-[#245B4A]"
                  />
                  <span className="text-xs font-medium select-none">{item}</span>
                </div>
              );
            })}
          </div>

          {/* Custom Resource Input */}
          <div className="pt-4 border-t border-[#E1E7E0]">
            <label className="block text-xs font-semibold text-[#202923] mb-2">
              Add Other Local Teaching Materials
            </label>
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={customResourceInput}
                onChange={(e) => setCustomResourceInput(e.target.value)}
                placeholder="e.g. Coconut shells, Matchsticks, Mud tablets"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#E1E7E0] rounded-lg"
              />
              <button
                type="button"
                onClick={handleAddCustomResource}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Material</span>
              </button>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#E1E7E0]">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#4A554E] bg-white border border-[#E1E7E0] rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg transition-colors"
            >
              <span>Review Summary</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review & Final Save */}
      {currentStep === 4 && (
        <div className="bg-white rounded-xl border border-[#E1E7E0] p-6 space-y-6 shadow-2xs">
          <div>
            <h3 className="text-base font-bold text-[#202923]">Configuration Review</h3>
            <p className="text-xs text-[#68746B] mt-0.5">
              Review your multi-grade classroom parameters before updating the planner.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-[#FAFBF9] border border-[#E1E7E0]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#68746B]">Classroom</span>
              <div className="mt-1 font-bold text-sm text-[#202923]">{classroom.name}</div>
              <p className="text-xs text-[#68746B] mt-1">
                {classroom.daysPerWeek} days/week · {classroom.hoursPerDay} hrs/day ({classroom.daysPerWeek * classroom.hoursPerDay} total hrs)
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#FAFBF9] border border-[#E1E7E0]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#68746B]">Grades Managed</span>
              <div className="mt-1 font-bold text-sm text-[#245B4A]">{classroom.grades.join(', ')}</div>
              <p className="text-xs text-[#68746B] mt-1">{topics.length} total curriculum topics entered</p>
            </div>

            <div className="p-4 rounded-lg bg-[#FAFBF9] border border-[#E1E7E0]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#68746B]">Available Materials</span>
              <div className="mt-1 font-bold text-sm text-[#202923]">{classroom.resources.length} items logged</div>
              <p className="text-xs text-[#68746B] mt-1 truncate">{classroom.resources.slice(0, 3).join(', ')}...</p>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-[#E1E7E0] space-y-2">
            <h4 className="text-xs font-bold text-[#202923]">Topics Identified as Needing Attention (&lt;50% understanding):</h4>
            <div className="flex flex-wrap gap-2">
              {topics.filter(t => t.understandingLevel < 50).map(t => (
                <div key={t.id} className="text-xs px-2.5 py-1 bg-[#FDF2F0] text-[#A63A26] border border-[#F5C9C0] rounded-md font-medium">
                  {t.grade}: {t.name} ({t.understandingLevel}%)
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E1E7E0]">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 text-xs font-medium text-[#4A554E] bg-white border border-[#E1E7E0] rounded-lg"
            >
              Edit Information
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetDemo}
                className="px-3 py-2 text-xs font-medium text-[#68746B] hover:text-[#202923] rounded-lg"
              >
                Reset Demo Data
              </button>
              <button
                onClick={handleSaveAll}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Classroom Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
