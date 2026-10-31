import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  AlertCircle,
  Sparkles,
  Plus,
  Edit2,
  Check,
  CheckCircle2,
  Printer,
  ChevronRight,
  UserCheck,
  BookOpen,
  Clock,
  HeartHandshake,
  RotateCcw,
  X,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import { Storage } from '../lib/storage';
import { Student, Topic, ClassroomConfig, PersonalizedPlan } from '../types';
import { WEAK_THRESHOLD } from '../shared/constants';
import { StatusBadge } from '../components/common/StatusBadge';
import { localizeGrade } from '../shared/contentLocalization';

export const StudentRecordsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [classroom] = useState<ClassroomConfig>(Storage.getClassroom());
  const [students, setStudents] = useState<Student[]>(Storage.getStudents());
  const [topics] = useState<Topic[]>(Storage.getTopics());
  const [settings] = useState(Storage.getSettings());

  // Filters & Search
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [sectionFilter, setSectionFilter] = useState<string>('All');
  const [checkinFilter, setCheckinFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const availableSections = Array.from(new Set(students.map(s => s.section).filter(Boolean))) as string[];
  const hasSections = availableSections.length > 0;

  // Inline Score Editing State
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState<number>(50);

  // Personalized Plan Modal
  const [selectedStudentForPlan, setSelectedStudentForPlan] = useState<Student | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Student Modal
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('Class 3');
  const [newStudentSection, setNewStudentSection] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');

  useEffect(() => {
    const handleStorageChange = () => {
      setStudents(Storage.getStudents());
    };
    window.addEventListener('ruralclass_storage_change', handleStorageChange);
    return () => window.removeEventListener('ruralclass_storage_change', handleStorageChange);
  }, []);

  // Filter students
  const filteredStudents = students.filter(s => {
    if (gradeFilter !== 'All' && s.grade !== gradeFilter) return false;
    if (sectionFilter !== 'All' && s.section !== sectionFilter) return false;
    if (checkinFilter && !s.needsCheckin) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q);
    }
    return true;
  });

  // Derived metrics
  const totalCount = students.length;
  const flaggedCount = students.filter(s => s.needsCheckin).length;
  const mentorCount = students.filter(s => s.peerRole === 'Peer Mentor').length;
  const classAvg = Math.round(students.reduce((acc, s) => acc + s.averageScore, 0) / (totalCount || 1));

  // Quick Inline Save for Student Marks
  const handleSaveInlineScore = (studentId: string, topicId: string) => {
    Storage.updateStudentScore(studentId, topicId, scoreInput);
    setEditingStudentId(null);
    setEditingTopicId(null);
    setToastMessage(t('students.toasts.scoreUpdated'));
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle 5-Minute Check-in status
  const handleToggleCheckin = (student: Student) => {
    const updated = students.map(s =>
      s.id === student.id ? { ...s, needsCheckin: !s.needsCheckin } : s
    );
    Storage.saveStudents(updated);
    setStudents(updated);
  };

  // Generate or open Personalized AI Plan
  const handleOpenPersonalizedPlan = async (student: Student) => {
    setSelectedStudentForPlan(student);
  };

  const currentLangCode = i18n.language.startsWith('ta') ? 'ta' : i18n.language.startsWith('hi') ? 'hi' : 'en';

  const handleGenerateAIPlan = async (student: Student) => {
    setIsGeneratingPlan(true);
    try {
      // Hard Rule 4: Do not send student names to AI unless shareStudentNamesWithAI is on
      const studentPayload = settings.shareStudentNamesWithAI
        ? student
        : {
            ...student,
            name: `Student Roll ${student.rollNo}`
          };

      const res = await fetch('/api/ai/personalized-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: studentPayload,
          classroom,
          topics,
          students,
          language: currentLangCode
        })
      });
      const data = await res.json();
      if (data.plan) {
        // Keep actual student name in local UI state
        const planWithStudent = {
          ...data.plan,
          studentName: student.name
        };
        const updated = students.map(s =>
          s.id === student.id ? { ...s, personalizedPlan: planWithStudent } : s
        );
        Storage.saveStudents(updated);
        setStudents(updated);
        setSelectedStudentForPlan({ ...student, personalizedPlan: planWithStudent });
        setToastMessage(t('students.toasts.planGenerated', { name: student.name }));
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error('Error generating personalized plan:', err);
      setToastMessage('Could not connect to AI service. Loaded standard pedagogical plan.');
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Hard Rule: Only teacher click sets "Approved"
  const handleApprovePlan = (student: Student) => {
    if (!student.personalizedPlan) return;
    const approvedPlan = {
      ...student.personalizedPlan,
      status: 'Approved' as const
    };
    const updated = students.map(s =>
      s.id === student.id ? { ...s, personalizedPlan: approvedPlan } : s
    );
    Storage.saveStudents(updated);
    setStudents(updated);
    setSelectedStudentForPlan({ ...student, personalizedPlan: approvedPlan });
    setToastMessage(t('students.toasts.planApproved', { name: student.name }));
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add new student
  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;

    // Default topic scores based on grade
    const gradeTopics = topics.filter(t => t.grade === newStudentGrade);
    const initialScores: Record<string, number> = {};
    gradeTopics.forEach(t => {
      initialScores[t.id] = 50;
    });

    const newStudent: Student = {
      id: `stud-${Date.now()}`,
      rollNo: newStudentRoll || `${parseInt(newStudentGrade.replace(/\D/g, '')) * 100 + students.length + 1}`,
      name: newStudentName.trim(),
      grade: newStudentGrade,
      section: newStudentSection.trim() || undefined,
      attendancePct: 90,
      topicScores: initialScores,
      averageScore: 50,
      needsCheckin: true,
      peerRole: 'Steady Learner',
      notes: 'Newly enrolled student',
      lastAssessmentDate: new Date().toISOString().split('T')[0]
    };

    const updated = [...students, newStudent];
    Storage.saveStudents(updated);
    setStudents(updated);
    setIsAddStudentOpen(false);
    setNewStudentName('');
    setNewStudentSection('');
    setNewStudentRoll('');
    setToastMessage(t('students.toasts.studentAdded', { name: newStudent.name }));
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="no-print p-3.5 rounded-lg bg-[#F0F7F2] border border-[#C3DEC9] text-[#1E563E] text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#245B4A]" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="font-bold text-xs">×</button>
        </div>
      )}

      {/* Header */}
      <div className="no-print flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#E1E7E0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[#68746B] font-semibold">{t('nav.students')}</span>
            <span className="text-xs text-[#68746B]">·</span>
            <span className="text-xs text-[#245B4A] font-semibold">{t('common.teacherInControl')}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#202923] tracking-tight mt-1">
            {t('students.title')}
          </h2>
          <p className="text-sm text-[#4A554E] mt-1">
            {t('students.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <Link
            to="/import"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#245B4A] bg-[#E8F2EC] hover:bg-[#D5E7DC] rounded-lg border border-[#C3DEC9] transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{t('import.title', 'Import Roster')}</span>
          </Link>

          <a
            href={`/api/export/students.xlsx?lang=${i18n.language}`}
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors shadow-2xs"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600" />
            <span>Excel</span>
          </a>

          <a
            href={`/api/export/students.html?lang=${i18n.language}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-gray-600" />
            <span>{t('weeklyPlanner.printButton', 'Print PDF')}</span>
          </a>

          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t('students.addStudent')}</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="no-print grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-[#E1E7E0] shadow-2xs">
          <span className="text-xs font-medium text-[#68746B]">{t('students.statsTotal')}</span>
          <div className="text-xl font-bold text-[#202923] font-mono mt-1">{totalCount}</div>
          <p className="text-[11px] text-[#68746B] mt-0.5">Across {classroom.grades.map(g => localizeGrade(g, i18n.language)).join(', ')}</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#F5C9C0] shadow-2xs bg-[#FFFDFD]">
          <span className="text-xs font-semibold text-[#C65C48] flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{t('students.statsFlagged')}</span>
          </span>
          <div className="text-xl font-bold text-[#C65C48] font-mono mt-1">{flaggedCount}</div>
          <p className="text-[11px] text-[#68746B] mt-0.5">Priority attention for morning checks</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E1E7E0] shadow-2xs">
          <span className="text-xs font-medium text-[#245B4A] flex items-center gap-1">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>{t('students.statsMentors')}</span>
          </span>
          <div className="text-xl font-bold text-[#245B4A] font-mono mt-1">{mentorCount}</div>
          <p className="text-[11px] text-[#68746B] mt-0.5">Older students paired with younger</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E1E7E0] shadow-2xs">
          <span className="text-xs font-medium text-[#68746B]">{t('students.statsAverage')}</span>
          <div className="text-xl font-bold text-[#202923] font-mono mt-1">{classAvg}%</div>
          <p className="text-[11px] text-[#68746B] mt-0.5">Auto-computed from topic marks</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="no-print bg-white p-4 rounded-xl border border-[#E1E7E0] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Grade filter */}
          <div className="flex items-center gap-1 bg-[#F2F6F3] p-1 rounded-lg border border-[#E1E7E0]">
            <button
              onClick={() => setGradeFilter('All')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                gradeFilter === 'All'
                  ? 'bg-white text-[#202923] shadow-2xs font-semibold'
                  : 'text-[#68746B] hover:text-[#202923]'
              }`}
            >
              {t('common.all')}
            </button>
            {classroom.grades.map(g => (
              <button
                key={g}
                onClick={() => setGradeFilter(g)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  gradeFilter === g
                    ? 'bg-white text-[#202923] shadow-2xs font-semibold'
                    : 'text-[#68746B] hover:text-[#202923]'
                }`}
              >
                {localizeGrade(g, i18n.language)}
              </button>
            ))}
          </div>

          {/* Section filter (only visible when sections exist) */}
          {hasSections && (
            <div className="flex items-center gap-1 bg-[#F2F6F3] p-1 rounded-lg border border-[#E1E7E0]">
              <span className="text-[11px] font-semibold text-[#68746B] px-1.5">{t('students.section', 'Section')}:</span>
              <button
                onClick={() => setSectionFilter('All')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                  sectionFilter === 'All'
                    ? 'bg-white text-[#202923] shadow-2xs font-semibold'
                    : 'text-[#68746B] hover:text-[#202923]'
                }`}
              >
                {t('common.all')}
              </button>
              {availableSections.map(sec => (
                <button
                  key={sec}
                  onClick={() => setSectionFilter(sec)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    sectionFilter === sec
                      ? 'bg-white text-[#202923] shadow-2xs font-semibold'
                      : 'text-[#68746B] hover:text-[#202923]'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          )}

          {/* Toggle: Only Flagged for Check-in */}
          <button
            onClick={() => setCheckinFilter(!checkinFilter)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              checkinFilter
                ? 'bg-[#FDF2F0] text-[#C65C48] border-[#F5C9C0] font-semibold'
                : 'bg-white text-[#68746B] border-[#E1E7E0] hover:bg-[#FAFBF9]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{t('students.filterCheckin')} ({flaggedCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#68746B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('students.searchPlaceholder')}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E1E7E0] rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-[#245B4A]"
          />
        </div>
      </div>

      {/* Main Student Records Table */}
      <div className="bg-white rounded-xl border border-[#E1E7E0] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-[#E1E7E0]">
            <thead className="bg-[#FAFBF9] text-[#68746B] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">{t('students.table.rollNo')} & {t('students.table.name')}</th>
                <th className="px-3 py-3">{t('students.table.grade')}</th>
                <th className="px-4 py-3">Topic Marks</th>
                <th className="px-3 py-3">{t('students.table.averageScore')}</th>
                <th className="px-3 py-3 text-center">{t('students.table.checkin')}</th>
                <th className="px-3 py-3">{t('students.table.peerRole')}</th>
                <th className="px-4 py-3 text-right">{t('students.table.actions')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E1E7E0] text-[#202923]">
              {filteredStudents.map((student) => {
                const gradeTopics = topics.filter(t => t.grade === student.grade);

                return (
                  <tr key={student.id} className="hover:bg-[#FAFBF9] transition-colors">
                    {/* Student Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#E6EFE8] text-[#245B4A] flex items-center justify-center font-bold text-xs shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#202923] flex items-center gap-1.5">
                            <span>{student.name}</span>
                            <span className="text-[10px] text-[#68746B] font-mono font-normal">#{student.rollNo}</span>
                          </div>
                          {student.notes && (
                            <p className="text-[11px] text-[#68746B] truncate max-w-xs">{student.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Grade & Section */}
                    <td className="px-3 py-3 font-semibold text-[#4A554E] whitespace-nowrap">
                      {localizeGrade(student.grade, i18n.language)}{student.section ? ` - ${student.section}` : ''}
                    </td>

                    {/* Editable Topic Marks Column */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {gradeTopics.map((topic) => {
                          const score = student.topicScores[topic.id] ?? 50;
                          const isEditing = editingStudentId === student.id && editingTopicId === topic.id;

                          if (isEditing) {
                            return (
                              <div
                                key={topic.id}
                                className="flex items-center gap-1 bg-[#F2F6F3] p-1 rounded border border-[#245B4A]"
                              >
                                <span className="text-[10px] font-bold text-[#245B4A] truncate max-w-20">
                                  {topic.name.substring(0, 10)}:
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={scoreInput}
                                  onChange={(e) => setScoreInput(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                  className="w-12 text-xs font-mono p-0.5 border border-[#245B4A] rounded text-center bg-white"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveInlineScore(student.id, topic.id)}
                                  className="p-1 text-white bg-[#245B4A] hover:bg-[#194738] rounded"
                                  title="Save mark"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingStudentId(null);
                                    setEditingTopicId(null);
                                  }}
                                  className="p-1 text-[#68746B] hover:text-[#202923]"
                                  title="Cancel"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          }

                          let scoreColor = 'bg-[#F0F7F2] text-[#245B4A] border-[#C3DEC9]';
                          if (score < 50) scoreColor = 'bg-[#FDF2F0] text-[#C65C48] border-[#F5C9C0] font-bold';
                          else if (score < 75) scoreColor = 'bg-[#FEF8ED] text-[#D97706] border-[#F7E2B5]';

                          return (
                            <button
                              key={topic.id}
                              onClick={() => {
                                setEditingStudentId(student.id);
                                setEditingTopicId(topic.id);
                                setScoreInput(score);
                              }}
                              className={`px-2 py-0.5 rounded text-[11px] border font-mono transition-all hover:scale-105 ${scoreColor}`}
                              title={`Click to edit mark for ${topic.name}`}
                            >
                              <span className="text-[#68746B] font-sans mr-1">{topic.name.substring(0, 8)}..:</span>
                              <span>{score}%</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Overall Average */}
                    <td className="px-3 py-3 font-mono font-bold whitespace-nowrap">
                      <span className={student.averageScore < 50 ? 'text-[#C65C48]' : 'text-[#202923]'}>
                        {student.averageScore}%
                      </span>
                    </td>

                    {/* Check-in Flag toggle */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleCheckin(student)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors border ${
                          student.needsCheckin
                            ? 'bg-[#FDF2F0] text-[#C65C48] border-[#F5C9C0]'
                            : 'bg-white text-[#68746B] border-[#E1E7E0] hover:bg-[#FAFBF9]'
                        }`}
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span>{student.needsCheckin ? 'Flagged (5 min)' : 'None'}</span>
                      </button>
                    </td>

                    {/* Peer Pairing */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          student.peerRole === 'Peer Mentor'
                            ? 'bg-[#E6EFE8] text-[#245B4A]'
                            : student.peerRole === 'Needs Support'
                            ? 'bg-[#FDF2F0] text-[#C65C48]'
                            : 'bg-[#F3F4F6] text-[#68746B]'
                        }`}>
                          {student.peerRole === 'Peer Mentor' ? t('students.peerRoles.peerMentor') : student.peerRole === 'Needs Support' ? t('students.peerRoles.needsSupport') : t('students.peerRoles.steadyLearner')}
                        </span>
                        {student.pairedStudentName && (
                          <div className="text-[10px] text-[#68746B] truncate max-w-36">
                            Buddy: {student.pairedStudentName}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions: View / Generate Plan */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenPersonalizedPlan(student)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#245B4A] bg-[#E6EFE8] hover:bg-[#D5E5D8] rounded-lg transition-colors border border-[#C6DDD0]"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>{student.personalizedPlan ? t('students.planModal.title', { name: '' }).trim() || 'Plan' : t('students.planModal.generatePlan')}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PERSONALIZED PLAN DRAWER MODAL */}
      {selectedStudentForPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-[#E1E7E0] overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-4 bg-[#FAFBF9] border-b border-[#E1E7E0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D97706]" />
                <h3 className="font-bold text-sm text-[#202923]">
                  {t('students.planModal.title', { name: selectedStudentForPlan.name })}
                </h3>
                <span className="text-xs font-semibold text-[#245B4A]">({localizeGrade(selectedStudentForPlan.grade, i18n.language)})</span>
              </div>
              <button
                onClick={() => setSelectedStudentForPlan(null)}
                className="p-1 text-[#68746B] hover:text-[#202923]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              {selectedStudentForPlan.personalizedPlan ? (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="p-3 bg-[#FAFBF9] rounded-lg border border-[#E1E7E0] flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#68746B]">{t('students.planModal.targetTopic')}</span>
                      <div className="font-bold text-sm text-[#245B4A] mt-0.5">
                        {selectedStudentForPlan.personalizedPlan.targetTopic}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedStudentForPlan.personalizedPlan.source === 'ai' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#245B4A] bg-[#EBF3ED] px-2 py-0.5 rounded border border-[#C6DDD0]">
                          <Sparkles className="w-2.5 h-2.5" />
                          {t('common.sourceAi')}
                        </span>
                      ) : (
                        <span
                          className="text-[10px] font-medium text-[#68746B] bg-[#F5F5F0] px-2 py-0.5 rounded border border-[#E1E7E0]"
                          title={selectedStudentForPlan.personalizedPlan.reason ? `${t('common.sourceBuiltinDesc')} (${selectedStudentForPlan.personalizedPlan.reason})` : t('common.sourceBuiltinDesc')}
                        >
                          {t('common.sourceBuiltin')}
                        </span>
                      )}

                      {selectedStudentForPlan.personalizedPlan.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E563E] bg-[#E6EFE8] px-2.5 py-1 rounded-md border border-[#C6DDD0]">
                          <Check className="w-3.5 h-3.5" />
                          {t('students.planModal.approvedByTeacher')}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-[#9A6208] bg-[#FEF8ED] px-2.5 py-1 rounded-md border border-[#F7E2B5]">
                          {t('students.planModal.awaitingApproval')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Diagnosed Root Gap (Concept Bridge) */}
                  <div className="p-3.5 bg-[#FAFBF9] rounded-lg border border-[#E1E7E0] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A554E] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#245B4A]" />
                      <span>{t('students.planModal.rootDiagnosis')}</span>
                    </span>
                    <p className="text-[#202923] leading-relaxed">
                      {selectedStudentForPlan.personalizedPlan.diagnosedRootGap}
                    </p>
                  </div>

                  {/* 5-Minute Check-in Activity */}
                  <div className="p-3.5 bg-[#FEF8ED] rounded-lg border border-[#F7E2B5] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A6208] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>{t('students.planModal.checkinTitle')}</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#D97706]">{t('common.minutesShort', { count: 5 })}</span>
                    </div>

                    <h4 className="font-bold text-xs text-[#202923]">
                      {selectedStudentForPlan.personalizedPlan.checkinActivity.title}
                    </h4>

                    <p className="text-[#4A554E] leading-relaxed">
                      {selectedStudentForPlan.personalizedPlan.checkinActivity.instruction}
                    </p>

                    <div className="text-[11px] text-[#68746B]">
                      <strong>{t('students.planModal.materials')}:</strong> {selectedStudentForPlan.personalizedPlan.checkinActivity.materials.join(', ')}
                    </div>
                  </div>

                  {/* Independent Station Task */}
                  <div className="p-3 bg-[#FAFBF9] rounded-lg border border-[#E1E7E0] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A554E]">
                      {t('students.planModal.stationTask')}
                    </span>
                    <p className="text-[#4A554E] leading-relaxed">
                      {selectedStudentForPlan.personalizedPlan.independentStationTask}
                    </p>
                  </div>

                  {/* Suggested Peer Buddy Pairing */}
                  <div className="p-3 bg-[#FAFBF9] rounded-lg border border-[#E1E7E0] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A554E] flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-[#245B4A]" />
                      <span>{t('students.planModal.peerStrategy')}</span>
                    </span>
                    <div className="flex items-center gap-2 font-semibold text-[#202923] mt-1">
                      <span>{t('students.planModal.buddy')}: {selectedStudentForPlan.personalizedPlan.suggestedPeerBuddy.name}</span>
                      <span className="text-[10px] text-[#245B4A] bg-[#E6EFE8] px-1.5 py-0.2 rounded">
                        {localizeGrade(selectedStudentForPlan.personalizedPlan.suggestedPeerBuddy.grade, i18n.language)}
                      </span>
                    </div>
                    <p className="text-[#68746B] text-[11px] mt-0.5 leading-relaxed">
                      {selectedStudentForPlan.personalizedPlan.suggestedPeerBuddy.guidance}
                    </p>
                  </div>

                  {/* Teacher Encouragement Tip */}
                  <div className="p-3 bg-[#F0F7F2] rounded-lg border border-[#C3DEC9] text-[#1E563E] text-[11px] leading-relaxed">
                    <strong>{t('students.planModal.teacherTip')}:</strong> {selectedStudentForPlan.personalizedPlan.teacherTip}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#E6EFE8] text-[#245B4A] flex items-center justify-center mx-auto">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-[#202923]">{t('students.planModal.noPlanYet')}</h4>
                  <p className="text-xs text-[#68746B] max-w-sm mx-auto">
                    {t('students.planModal.noPlanDesc', { name: selectedStudentForPlan.name })}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-[#FAFBF9] border-t border-[#E1E7E0] flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4A554E] bg-white border border-[#E1E7E0] rounded-lg"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t('students.planModal.printPlan')}</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedStudentForPlan.personalizedPlan && selectedStudentForPlan.personalizedPlan.status !== 'Approved' && (
                  <button
                    onClick={() => handleApprovePlan(selectedStudentForPlan)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E563E] hover:bg-[#164330] rounded-lg shadow-xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('students.planModal.approvePlan')}</span>
                  </button>
                )}

                <button
                  onClick={() => handleGenerateAIPlan(selectedStudentForPlan)}
                  disabled={isGeneratingPlan}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#E8AE48]" />
                  <span>{isGeneratingPlan ? t('common.loading') : selectedStudentForPlan.personalizedPlan ? t('students.planModal.regeneratePlan') : t('students.planModal.generatePlan')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-[#E1E7E0] overflow-hidden">
            <div className="p-4 bg-[#FAFBF9] border-b border-[#E1E7E0] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#202923]">{t('students.addStudent')}</h3>
              <button onClick={() => setIsAddStudentOpen(false)} className="text-xs text-[#68746B]">{t('common.cancel')}</button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#202923] mb-1">{t('students.table.name')} *</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full p-2 border border-[#E1E7E0] rounded-md"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#202923] mb-1">{t('students.table.grade')}</label>
                  <select
                    value={newStudentGrade}
                    onChange={(e) => setNewStudentGrade(e.target.value)}
                    className="w-full p-2 border border-[#E1E7E0] rounded-md bg-white"
                  >
                    {classroom.grades.map(g => (
                      <option key={g} value={g}>{localizeGrade(g, i18n.language)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#202923] mb-1">{t('students.section', 'Section')}</label>
                  <input
                    type="text"
                    value={newStudentSection}
                    onChange={(e) => setNewStudentSection(e.target.value)}
                    placeholder="e.g. A"
                    className="w-full p-2 border border-[#E1E7E0] rounded-md"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#202923] mb-1">{t('students.table.rollNo')}</label>
                  <input
                    type="text"
                    value={newStudentRoll}
                    onChange={(e) => setNewStudentRoll(e.target.value)}
                    placeholder="e.g. 305"
                    className="w-full p-2 border border-[#E1E7E0] rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAFBF9] border-t border-[#E1E7E0] flex justify-end gap-2.5">
              <button
                onClick={() => setIsAddStudentOpen(false)}
                className="px-3.5 py-1.5 text-xs text-[#4A554E]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddStudent}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
