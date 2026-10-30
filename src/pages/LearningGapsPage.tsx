import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TrendingDown,
  GitMerge,
  Filter,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Info,
  CalendarPlus,
  BookOpen,
  Edit2,
  Check
} from 'lucide-react';
import { Storage } from '../lib/storage';
import { Topic, ClassroomConfig } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const LearningGapsPage: React.FC = () => {
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<ClassroomConfig>(Storage.getClassroom());
  const [topics, setTopics] = useState<Topic[]>(Storage.getTopics());

  // Filters
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isEditingPrereq, setIsEditingPrereq] = useState(false);
  const [prereqInput, setPrereqInput] = useState('');

  useEffect(() => {
    const handleStorageChange = () => {
      setClassroom(Storage.getClassroom());
      setTopics(Storage.getTopics());
    };
    window.addEventListener('ruralclass_storage_change', handleStorageChange);
    return () => window.removeEventListener('ruralclass_storage_change', handleStorageChange);
  }, []);

  // Filtered topics
  const filteredTopics = topics.filter(t => {
    if (!classroom.grades.includes(t.grade)) return false;
    if (gradeFilter !== 'All' && t.grade !== gradeFilter) return false;
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    return true;
  });

  const weakTopics = filteredTopics.filter(t => t.understandingLevel < 55);

  // Default selection
  useEffect(() => {
    if (!selectedTopic && filteredTopics.length > 0) {
      // Pick lowest understanding topic
      const sorted = [...filteredTopics].sort((a, b) => a.understandingLevel - b.understandingLevel);
      setSelectedTopic(sorted[0]);
    }
  }, [filteredTopics, selectedTopic]);

  // Chart data
  const chartData = filteredTopics.map(t => ({
    name: `${t.grade.replace('Class ', 'C')}: ${t.name.length > 15 ? t.name.substring(0, 13) + '..' : t.name}`,
    fullName: `${t.grade} · ${t.name}`,
    understanding: t.understandingLevel,
    grade: t.grade,
    rawName: t.name
  }));

  // Grade averages for radar/summary chart
  const gradeSummaryData = classroom.grades.map(grade => {
    const gTopics = topics.filter(t => t.grade === grade);
    const avg = gTopics.length > 0 ? Math.round(gTopics.reduce((s, t) => s + t.understandingLevel, 0) / gTopics.length) : 0;
    return {
      grade,
      average: avg,
      fullMark: 100
    };
  });

  const getBarColor = (val: number) => {
    if (val < 50) return '#C65C48'; // Red Needs Attention
    if (val < 75) return '#D97706'; // Amber Developing
    return '#245B4A'; // Forest Green Strong
  };

  const handleMarkReviewed = (topicId: string) => {
    const updated = topics.map(t => t.id === topicId ? { ...t, reviewed: !t.reviewed } : t);
    setTopics(updated);
    Storage.saveTopics(updated);
    if (selectedTopic?.id === topicId) {
      setSelectedTopic({ ...selectedTopic, reviewed: !selectedTopic.reviewed });
    }
  };

  const handleSavePrerequisite = () => {
    if (!selectedTopic) return;
    const updated = topics.map(t => t.id === selectedTopic.id ? { ...t, prerequisiteTopicName: prereqInput } : t);
    setTopics(updated);
    Storage.saveTopics(updated);
    setSelectedTopic({ ...selectedTopic, prerequisiteTopicName: prereqInput });
    setIsEditingPrereq(false);
  };

  const handleExploreRootCause = (topic: Topic) => {
    // Navigate to concept map and highlight relevant node
    navigate(`/concept-bridge-map?topic=${encodeURIComponent(topic.name)}&grade=${encodeURIComponent(topic.grade)}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#E1E7E0]">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#68746B] font-semibold">Diagnostic Analytics</span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#202923] tracking-tight mt-1">
            Learning Gap Analysis
          </h2>
          <p className="text-sm text-[#4A554E] mt-1">
            Evaluate topic mastery across grades and uncover root-cause prerequisite connections.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#68746B] bg-[#FAFBF9] px-3 py-1.5 rounded-lg border border-[#E1E7E0]">
          <Info className="w-3.5 h-3.5 text-[#245B4A]" />
          <span>Fictional sample scores for teacher decision support</span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E1E7E0] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#68746B] font-medium">
            <Filter className="w-3.5 h-3.5 text-[#245B4A]" />
            <span>Filters:</span>
          </div>

          {/* Grade filter */}
          <div className="flex items-center gap-1 bg-[#F7F9F7] p-1 rounded-lg border border-[#E1E7E0]">
            <button
              onClick={() => setGradeFilter('All')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                gradeFilter === 'All'
                  ? 'bg-white text-[#202923] shadow-2xs font-semibold'
                  : 'text-[#68746B] hover:text-[#202923]'
              }`}
            >
              All Grades
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
                {g}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-[#E1E7E0] rounded-lg px-2.5 py-1.5 text-[#202923] font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Not Started">Not Started</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C65C48]"></span>
            <span className="text-[#68746B]">&lt;50% Needs Attention</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
            <span className="text-[#68746B]">50–74% Developing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#245B4A]"></span>
            <span className="text-[#68746B]">≥75% Strong</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Bar Chart & Grade Summary */}
        <div className="lg:col-span-8 space-y-6">
          {/* Chart 1: Topic Understanding Across Grades */}
          <div className="bg-white p-5 rounded-xl border border-[#E1E7E0] shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#202923]">Topic Understanding Percentage</h3>
                <p className="text-xs text-[#68746B] mt-0.5">Click any bar to inspect root cause prerequisite dependencies</p>
              </div>
              <span className="text-xs font-mono font-medium text-[#68746B]">Target: 75% Mastery</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 30 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      const clicked = filteredTopics.find(t => t.name === e.activePayload[0].payload.rawName);
                      if (clicked) setSelectedTopic(clicked);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E1E7E0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#68746B' }}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#68746B' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2.5 border border-[#E1E7E0] rounded-lg shadow-md text-xs">
                            <p className="font-bold text-[#202923]">{data.fullName}</p>
                            <p className="text-[#245B4A] font-semibold mt-1">Understanding: {data.understanding}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="understanding" radius={[4, 4, 0, 0]} cursor="pointer">
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getBarColor(entry.understanding)}
                        stroke={selectedTopic?.name === entry.rawName ? '#202923' : 'none'}
                        strokeWidth={2}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Topics Requiring Immediate Attention List */}
          <div className="bg-white rounded-xl border border-[#E1E7E0] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#E1E7E0] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#202923]">Prioritized Learning Gaps ({weakTopics.length} Topics)</h3>
                <p className="text-xs text-[#68746B] mt-0.5">Foundational concepts requiring focused intervention</p>
              </div>
              <span className="text-[11px] text-[#C65C48] font-semibold bg-[#FDF2F0] px-2.5 py-1 rounded-md border border-[#F5C9C0]">
                Under 55% Threshold
              </span>
            </div>

            <div className="divide-y divide-[#E1E7E0]">
              {weakTopics.map((topic) => {
                const isSelected = selectedTopic?.id === topic.id;

                return (
                  <div
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic)}
                    className={`p-4 transition-all cursor-pointer ${
                      isSelected ? 'bg-[#F2F6F3] border-l-4 border-l-[#245B4A]' : 'hover:bg-[#FAFBF9]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#202923]">{topic.grade}</span>
                          <span className="text-xs text-[#68746B]">·</span>
                          <span className="text-sm font-semibold text-[#202923]">{topic.name}</span>
                          {topic.reviewed && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[#245B4A] bg-[#E6EFE8] px-1.5 py-0.5 rounded font-medium">
                              <Check className="w-3 h-3" /> Reviewed
                            </span>
                          )}
                        </div>

                        {topic.prerequisiteTopicName && (
                          <p className="text-xs text-[#4A554E]">
                            <span className="text-[#68746B]">Root Dependency:</span> {topic.prerequisiteTopicName}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                        <StatusBadge level={topic.understandingLevel} />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExploreRootCause(topic);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#245B4A] hover:bg-[#E6EFE8] px-2.5 py-1 rounded-md transition-colors"
                        >
                          <span>Explore Root Cause</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Prerequisite Panel & Root Cause Deep Dive */}
        <div className="lg:col-span-4 space-y-6">
          {selectedTopic ? (
            <div className="bg-white rounded-xl border border-[#E1E7E0] shadow-2xs overflow-hidden">
              <div className="p-4 bg-[#FAFBF9] border-b border-[#E1E7E0]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#68746B]">
                  Deep Dive Inspection
                </span>
                <h3 className="text-base font-bold text-[#202923] mt-1">
                  {selectedTopic.name}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs font-semibold text-[#245B4A]">{selectedTopic.grade}</span>
                  <span className="text-xs text-[#68746B]">·</span>
                  <StatusBadge level={selectedTopic.understandingLevel} />
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Root Cause Diagnosis */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A554E] mb-1.5">
                    Why is this happening?
                  </h4>
                  <div className="p-3 bg-[#FAFBF9] rounded-lg border border-[#E1E7E0] text-xs text-[#4A554E] leading-relaxed">
                    {selectedTopic.notes || (
                      selectedTopic.name.toLowerCase().includes('dec') 
                        ? 'Students lack fraction partitioning intuition from earlier classes. Decimal place values appear as arbitrary point notation.'
                        : selectedTopic.name.toLowerCase().includes('word')
                        ? 'Students struggle to translate contextual language into operations. They need physical roleplay with everyday market items.'
                        : 'Students treat fraction numbers as separate quantities rather than an equal partition of a single whole.'
                    )}
                  </div>
                </div>

                {/* Prerequisite Link Section */}
                <div className="pt-2 border-t border-[#E1E7E0]">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A554E]">
                      Prerequisite Foundation
                    </h4>
                    {!isEditingPrereq && (
                      <button
                        onClick={() => {
                          setPrereqInput(selectedTopic.prerequisiteTopicName || '');
                          setIsEditingPrereq(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-[#245B4A] hover:underline"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Link</span>
                      </button>
                    )}
                  </div>

                  {isEditingPrereq ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={prereqInput}
                        onChange={(e) => setPrereqInput(e.target.value)}
                        className="w-full text-xs p-2 border border-[#245B4A] rounded-md"
                        placeholder="Enter prerequisite concept..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setIsEditingPrereq(false)}
                          className="px-2 py-1 text-xs text-[#68746B]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSavePrerequisite}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-[#245B4A] rounded"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#FEF8ED] border border-[#F7E2B5] rounded-lg text-xs text-[#9A6208]">
                      <strong>Prerequisite:</strong> {selectedTopic.prerequisiteTopicName || 'None explicitly linked yet'}
                    </div>
                  )}
                </div>

                {/* Recommended Next Actions */}
                <div className="pt-2 border-t border-[#E1E7E0] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A554E]">
                    Recommended Teaching Step
                  </h4>
                  <ul className="text-xs text-[#4A554E] space-y-1.5 list-disc pl-4">
                    <li>Anchor in shared whole-class tactile lesson before independent practice.</li>
                    <li>Utilize low-cost materials (paper folds, courtyard pebbles, bottle caps).</li>
                    <li>Pair with a mentor student from Class 5 during station exercises.</li>
                  </ul>
                </div>

                {/* Interactive Action Buttons */}
                <div className="pt-4 border-t border-[#E1E7E0] space-y-2">
                  <button
                    onClick={() => handleExploreRootCause(selectedTopic)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg transition-colors shadow-2xs"
                  >
                    <GitMerge className="w-4 h-4" />
                    <span>Explore Root Cause in Concept Map</span>
                  </button>

                  <button
                    onClick={() => handleMarkReviewed(selectedTopic.id)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4A554E] bg-white border border-[#E1E7E0] hover:bg-[#FAFBF9] rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 text-[#245B4A]" />
                    <span>{selectedTopic.reviewed ? 'Mark as Pending' : 'Mark as Reviewed by Teacher'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl border border-[#E1E7E0] text-xs text-[#68746B]">
              Select a topic from the chart or list to view root-cause prerequisites.
            </div>
          )}

          {/* Grade Summary Card */}
          <div className="bg-white p-5 rounded-xl border border-[#E1E7E0] shadow-2xs">
            <h4 className="text-xs font-bold text-[#202923] uppercase tracking-wider mb-3">
              Grade Mastery Balance
            </h4>
            <div className="space-y-3">
              {gradeSummaryData.map((item) => (
                <div key={item.grade} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#202923]">{item.grade}</span>
                    <span className="font-mono text-[#68746B]">{item.average}% avg</span>
                  </div>
                  <div className="w-full bg-[#E1E7E0] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.average}%`,
                        backgroundColor: getBarColor(item.average)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
