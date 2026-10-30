import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  GitMerge,
  ArrowRight,
  Info,
  CalendarPlus,
  HelpCircle,
  Layers,
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { Storage } from '../lib/storage';
import { ConceptNode, ClassroomConfig } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const ConceptBridgeMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [classroom] = useState<ClassroomConfig>(Storage.getClassroom());
  const [nodes, setNodes] = useState<ConceptNode[]>(Storage.getConceptNodes());
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);

  // Viewport transformation controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [gradeFilter, setGradeFilter] = useState<string>('All');

  // Query parameter detection (from Learning Gaps page "Explore Root Cause")
  useEffect(() => {
    const topicParam = searchParams.get('topic');
    const gradeParam = searchParams.get('grade');
    if (topicParam) {
      const match = nodes.find(n => 
        n.name.toLowerCase().includes(topicParam.toLowerCase()) ||
        topicParam.toLowerCase().includes(n.name.toLowerCase())
      );
      if (match) {
        setSelectedNode(match);
      }
    } else if (!selectedNode && nodes.length > 0) {
      // Default to Class 5 Decimals or Class 3 Fractions to immediately highlight the core bridge story
      const defaultNode = nodes.find(n => n.id === 'node-c5-dec') || nodes[0];
      setSelectedNode(defaultNode);
    }
  }, [searchParams, nodes]);

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 1.8));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.6));
  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Node filtering
  const visibleNodes = nodes.filter(n => {
    if (gradeFilter !== 'All' && n.grade !== gradeFilter) return false;
    return true;
  });

  // Calculate connection curves between nodes
  const connections: { from: ConceptNode; to: ConceptNode; isHighlighted: boolean }[] = [];
  nodes.forEach(node => {
    node.nextConcepts.forEach(nextId => {
      const target = nodes.find(n => n.id === nextId);
      if (target) {
        const isHighlighted = selectedNode && (
          selectedNode.id === node.id || 
          selectedNode.id === target.id ||
          (selectedNode.prerequisites.includes(node.id) && selectedNode.id === target.id) ||
          (node.id === selectedNode.id && target.prerequisites.includes(selectedNode.id))
        );
        connections.push({ from: node, to: target, isHighlighted: !!isHighlighted });
      }
    });
  });

  // Action: Create lesson from this gap
  const handleCreateLesson = () => {
    if (!selectedNode) return;
    // Route to Weekly Planner with pre-selected topic
    navigate(`/weekly-planner?focusTopicId=${encodeURIComponent(selectedNode.id)}&focusTopicName=${encodeURIComponent(selectedNode.name)}&grade=${encodeURIComponent(selectedNode.grade)}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#E1E7E0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[#245B4A] font-bold">Signature Feature</span>
            <span className="text-xs text-[#68746B]">·</span>
            <span className="text-xs text-[#68746B]">Pedagogical Learning Paths</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#202923] tracking-tight mt-1">
            Concept Bridge Map
          </h2>
          <p className="text-sm text-[#4A554E] mt-1">
            See how learning connects across grades. Uncover why an older student struggles by tracing prerequisite roots.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 bg-white px-3.5 py-2 rounded-lg border border-[#E1E7E0] text-xs shadow-2xs">
          <span className="font-semibold text-[#202923]">Legend:</span>
          <div className="flex items-center gap-1.5 text-[#C65C48]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C65C48]"></span>
            <span>Needs Attention (&lt;50%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#D97706]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
            <span>Developing (50–74%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#245B4A]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#245B4A]"></span>
            <span>Strong (≥75%)</span>
          </div>
        </div>
      </div>

      {/* Main Graph & Drawer Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Canvas (8 cols on desktop) */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-xl border border-[#E1E7E0] shadow-2xs overflow-hidden">
          {/* Canvas Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#FAFBF9] border-b border-[#E1E7E0]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#4A554E] flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#245B4A]" />
                <span>Filter Grade:</span>
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-[#E1E7E0]">
                {['All', 'Class 3', 'Class 4', 'Class 5'].map(g => (
                  <button
                    key={g}
                    onClick={() => setGradeFilter(g)}
                    className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                      gradeFilter === g
                        ? 'bg-[#245B4A] text-white shadow-xs'
                        : 'text-[#68746B] hover:text-[#202923]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas Zoom Controls */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-[#E1E7E0]">
              <button
                onClick={handleZoomIn}
                className="p-1 text-[#4A554E] hover:text-[#202923] hover:bg-[#F2F6F3] rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-[#68746B] px-1 select-none">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomOut}
                className="p-1 text-[#4A554E] hover:text-[#202923] hover:bg-[#F2F6F3] rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-3 bg-[#E1E7E0] mx-0.5" />
              <button
                onClick={handleReset}
                className="p-1 text-[#4A554E] hover:text-[#202923] hover:bg-[#F2F6F3] rounded"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <div className="relative w-full h-[540px] bg-[#FAFBF9] overflow-hidden select-none">
            {/* Grade Column Swimlanes Headers */}
            <div className="absolute top-0 inset-x-0 h-9 bg-white/80 backdrop-blur-xs border-b border-[#E1E7E0] grid grid-cols-3 z-10 text-xs font-bold text-[#4A554E] text-center items-center">
              <div className="border-r border-[#E1E7E0] flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#245B4A]/60"></span>
                <span>Class 3 (Foundations)</span>
              </div>
              <div className="border-r border-[#E1E7E0] flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D97706]/60"></span>
                <span>Class 4 (Applications)</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C65C48]/60"></span>
                <span>Class 5 (Synthesis)</span>
              </div>
            </div>

            {/* Subtle column background guides */}
            <div className="absolute inset-0 grid grid-cols-3 pointer-events-none">
              <div className="border-r border-dashed border-[#E1E7E0]/80 h-full"></div>
              <div className="border-r border-dashed border-[#E1E7E0]/80 h-full"></div>
              <div className="h-full"></div>
            </div>

            {/* Scalable Canvas Group */}
            <svg
              className="w-full h-full cursor-grab active:cursor-grabbing"
              viewBox="0 0 850 560"
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: 'top left',
                transition: 'transform 150ms ease-out'
              }}
            >
              <defs>
                {/* Marker for default directional arrows */}
                <marker
                  id="arrow-default"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#A4B3A8" />
                </marker>

                {/* Marker for active highlighted connection */}
                <marker
                  id="arrow-active"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#245B4A" />
                </marker>

                {/* Glow filter for highlighted bridge path */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Render Connection Edges */}
              {connections.map((conn, idx) => {
                // Node card width is ~190, height ~80
                const startX = conn.from.x + 190;
                const startY = conn.from.y + 40;
                const endX = conn.to.x;
                const endY = conn.to.y + 40;

                // Bezier curve controls
                const dx = (endX - startX) * 0.5;
                const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

                return (
                  <path
                    key={`conn-${idx}`}
                    d={pathData}
                    fill="none"
                    stroke={conn.isHighlighted ? '#245B4A' : '#CBD6CE'}
                    strokeWidth={conn.isHighlighted ? 3 : 1.75}
                    strokeDasharray={conn.isHighlighted ? 'none' : '4 3'}
                    markerEnd={conn.isHighlighted ? 'url(#arrow-active)' : 'url(#arrow-default)'}
                    filter={conn.isHighlighted ? 'url(#glow)' : undefined}
                    className="transition-all duration-200"
                  />
                );
              })}

              {/* Render Nodes */}
              {visibleNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isParentOfSelected = selectedNode?.prerequisites.includes(node.id);
                const isChildOfSelected = selectedNode?.nextConcepts.includes(node.id);

                let borderColor = '#E1E7E0';
                let headerBg = '#FAFBF9';
                let indicatorColor = '#245B4A';

                if (node.understandingLevel < 50) {
                  indicatorColor = '#C65C48';
                  headerBg = '#FDF2F0';
                  if (isSelected) borderColor = '#C65C48';
                } else if (node.understandingLevel < 75) {
                  indicatorColor = '#D97706';
                  headerBg = '#FEF8ED';
                  if (isSelected) borderColor = '#D97706';
                } else {
                  indicatorColor = '#245B4A';
                  headerBg = '#F0F7F2';
                  if (isSelected) borderColor = '#245B4A';
                }

                if (isSelected) {
                  borderColor = '#202923';
                }

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer group"
                  >
                    {/* Selected Halo Ring */}
                    {isSelected && (
                      <rect
                        x="-4"
                        y="-4"
                        width="198"
                        height="88"
                        rx="12"
                        fill="none"
                        stroke="#245B4A"
                        strokeWidth="2.5"
                        strokeDasharray="5 3"
                        className="animate-pulse"
                      />
                    )}

                    {/* Node Card Container */}
                    <rect
                      x="0"
                      y="0"
                      width="190"
                      height="80"
                      rx="8"
                      fill="#FFFFFF"
                      stroke={isSelected ? '#245B4A' : borderColor}
                      strokeWidth={isSelected ? '2' : '1.5'}
                      className="shadow-sm transition-all group-hover:stroke-[#245B4A]"
                    />

                    {/* Card Header Strip */}
                    <rect
                      x="0"
                      y="0"
                      width="190"
                      height="24"
                      rx="8"
                      fill={headerBg}
                      className="clip-top"
                    />

                    {/* Grade Badge */}
                    <text
                      x="10"
                      y="16"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#202923"
                    >
                      {node.grade}
                    </text>

                    {/* Understanding % */}
                    <text
                      x="180"
                      y="16"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="end"
                      fill={indicatorColor}
                      fontFamily="monospace"
                    >
                      {node.understandingLevel}%
                    </text>

                    {/* Concept Title */}
                    <text
                      x="10"
                      y="42"
                      fontSize="11.5"
                      fontWeight="bold"
                      fill="#202923"
                    >
                      {node.name.length > 22 ? node.name.substring(0, 20) + '...' : node.name}
                    </text>

                    {/* Status Text & Category */}
                    <text
                      x="10"
                      y="62"
                      fontSize="9.5"
                      fill="#68746B"
                    >
                      {node.status} · {node.category}
                    </text>

                    {/* Status Circle Indicator */}
                    <circle
                      cx="175"
                      cy="60"
                      r="4"
                      fill={indicatorColor}
                    />

                    {/* Relationship Badge Tooltips for Parents/Children */}
                    {isParentOfSelected && (
                      <g transform="translate(0, -18)">
                        <rect x="0" y="0" width="105" height="15" rx="3" fill="#245B4A" />
                        <text x="5" y="11" fontSize="8.5" fill="#FFFFFF" fontWeight="bold">
                          ▲ Prerequisite Root
                        </text>
                      </g>
                    )}
                    {isChildOfSelected && (
                      <g transform="translate(85, -18)">
                        <rect x="0" y="0" width="105" height="15" rx="3" fill="#D97706" />
                        <text x="5" y="11" fontSize="8.5" fill="#FFFFFF" fontWeight="bold">
                          ▼ Downstream Concept
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Quick Guidance Kicker */}
          <div className="p-3 bg-[#FAFBF9] border-t border-[#E1E7E0] text-xs text-[#68746B] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#245B4A]" />
              <span>Click any node to reveal the root cause behind cross-grade learning barriers.</span>
            </div>
            <span className="font-mono text-[11px]">{visibleNodes.length} Concepts Mapped</span>
          </div>
        </div>

        {/* Selected Concept Deep-Dive Drawer (4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedNode ? (
            <div className="bg-white rounded-xl border border-[#E1E7E0] shadow-2xs overflow-hidden">
              {/* Drawer Header */}
              <div className="p-4 bg-[#FAFBF9] border-b border-[#E1E7E0]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#68746B]">
                    Concept Bridge Node
                  </span>
                  <StatusBadge level={selectedNode.understandingLevel} />
                </div>
                <h3 className="text-base font-bold text-[#202923] mt-1.5 leading-snug">
                  {selectedNode.name}
                </h3>
                <p className="text-xs text-[#245B4A] font-semibold mt-0.5">
                  {selectedNode.grade} · {selectedNode.category}
                </p>
              </div>

              {/* Drawer Body */}
              <div className="p-5 space-y-4">
                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A554E] mb-1">
                    Concept Definition
                  </h4>
                  <p className="text-xs text-[#4A554E] leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>

                {/* Why Connection Matters (The Educational Insight) */}
                <div className="p-3.5 bg-[#FAFBF9] rounded-lg border border-[#E1E7E0] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#202923]">
                    <GitMerge className="w-3.5 h-3.5 text-[#245B4A]" />
                    <span>Cross-Grade Bridge Significance</span>
                  </div>
                  <p className="text-xs text-[#4A554E] leading-relaxed">
                    {selectedNode.rootCauseContext}
                  </p>
                </div>

                {/* Prerequisite & Downstream Linkages */}
                <div className="space-y-2 pt-2 border-t border-[#E1E7E0]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A554E]">
                    Connected Concepts
                  </h4>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="font-semibold text-[#68746B] min-w-24">Prerequisites:</span>
                      <span className="text-[#202923]">
                        {selectedNode.prerequisites.length > 0
                          ? selectedNode.prerequisites.map(pid => nodes.find(n => n.id === pid)?.name).join(', ')
                          : 'Foundational entry point (No earlier pre-requisite in this map)'}
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <span className="font-semibold text-[#68746B] min-w-24">Downstream:</span>
                      <span className="text-[#202923]">
                        {selectedNode.nextConcepts.length > 0
                          ? selectedNode.nextConcepts.map(nid => nodes.find(n => n.id === nid)?.name).join(', ')
                          : 'Culminating concept in this bridge model'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Suggested Teaching Action */}
                <div className="pt-2 border-t border-[#E1E7E0] space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A554E]">
                    Suggested Multi-Grade Action
                  </h4>
                  <p className="text-xs text-[#245B4A] font-medium leading-relaxed bg-[#F2F6F3] p-2.5 rounded-lg border border-[#C6DDD0]">
                    {selectedNode.suggestedAction}
                  </p>
                </div>

                {/* Primary Action Button: "Create a Lesson From This Gap" */}
                <div className="pt-3 border-t border-[#E1E7E0]">
                  <button
                    onClick={handleCreateLesson}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg shadow-xs transition-colors"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    <span>Create a Lesson From This Gap</span>
                  </button>
                  <p className="text-[11px] text-center text-[#68746B] mt-1.5">
                    Transfers this concept into the Weekly Planner with differentiated grade tasks.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl border border-[#E1E7E0] text-xs text-[#68746B]">
              Select a node on the map to explore prerequisite foundations and generate a bridge lesson.
            </div>
          )}

          {/* Quick Pedagogical Note Card */}
          <div className="p-4 bg-[#FAFBF9] rounded-xl border border-[#E1E7E0] text-xs text-[#4A554E] space-y-2">
            <h4 className="font-bold text-[#202923] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Multi-Grade Teaching Tip</span>
            </h4>
            <p className="text-[11px] text-[#68746B] leading-relaxed">
              When Class 5 struggles with Decimals (42%), reteaching the decimal formula often fails. The Concept Bridge Map proves the root breakdown happened in Class 3's equal partition intuition. Launching a Monday paper-folding lesson serves all three grades at once.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
