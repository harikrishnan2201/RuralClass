import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Upload, 
  FileSpreadsheet, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  AlertTriangle, 
  AlertCircle, 
  Undo2, 
  FileDown, 
  Trash2, 
  Plus, 
  History, 
  Sparkles,
  HelpCircle,
  ClipboardPaste,
  Filter,
  CheckSquare,
  Square,
  Layers
} from 'lucide-react';
import { Storage } from '../lib/storage';
import { localizeGrade, localizeTopicName } from '../shared/contentLocalization';

interface ColumnSuggestion {
  header: string;
  field: 'rollNumber' | 'studentName' | 'grade' | 'section' | 'topic' | 'score' | 'attendancePct' | 'notes' | 'topicScore' | 'ignore';
  topicId?: string;
}

interface EditableStudentRow {
  rollNumber: string;
  name: string;
  grade: string;
  section?: string;
  scores: Record<string, number>;
  attendancePct?: number;
  notes?: string;
  errors?: string[];
  warnings?: string[];
}

export const ImportWizardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Selected target entity
  const queryEntity = searchParams.get('entity');
  const [selectedEntity, setSelectedEntity] = useState<string>(
    queryEntity && ['students', 'attendance', 'timetable', 'classroom', 'topics', 'activities'].includes(queryEntity)
      ? queryEntity
      : 'students'
  );

  // Import enabled status (Separability guard)
  const [isImportEnabled, setIsImportEnabled] = useState<boolean>(true);

  // Wizard step state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Parsed results
  const [parseSource, setParseSource] = useState<'ai' | 'fallback'>('fallback');
  const [, setParseReason] = useState<string | undefined>();
  const [, setHeaders] = useState<string[]>([]);
  const [columnSuggestions, setColumnSuggestions] = useState<ColumnSuggestion[]>([]);
  const [previewRows, setPreviewRows] = useState<EditableStudentRow[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string | number>[]>([]);

  // "What We Found" group & dataset checklist
  const [detectedGroups, setDetectedGroups] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [filterInstruction, setFilterInstruction] = useState<string>('');
  const [isApplyingFilter, setIsApplyingFilter] = useState<boolean>(false);

  // Step 4 Commit settings
  const [commitMode, setCommitMode] = useState<'merge' | 'replace'>('merge');
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState<{ count: number; jobId: string } | null>(null);

  // Undo and History
  const [canUndo, setCanUndo] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);
  const [historyJobs, setHistoryJobs] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const availableTopics = Storage.getTopics();

  useEffect(() => {
    checkImportStatus();
    fetchHistory();
  }, []);

  const checkImportStatus = async () => {
    try {
      const res = await fetch('/api/import/status');
      if (res.ok) {
        const data = await res.json();
        setIsImportEnabled(Boolean(data.enabled));
      }
    } catch {
      // Offline: assume enabled
      setIsImportEnabled(true);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/import/history');
      if (res.ok) {
        const jobs = await res.json();
        setHistoryJobs(jobs);
        const hasSnapshot = jobs.some((j: any) => j.snapshot);
        setCanUndo(hasSnapshot);
      }
    } catch {
      // offline
    }
  };

  // Step 1: File selection & upload
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setParseError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/import/parse', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson?.error?.message || 'Failed to parse file');
      }

      const data = await res.json();
      processParsedData(data);
    } catch (err) {
      setParseError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  // Step 1: Paste table data
  const handleParsePasted = async () => {
    if (!pastedText.trim()) {
      setParseError('Please paste some table or spreadsheet data first.');
      return;
    }
    setParseError(null);
    setIsUploading(true);

    try {
      const res = await fetch('/api/import/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pastedText,
          filename: 'pasted_table.csv'
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson?.error?.message || 'Failed to parse pasted data');
      }

      const data = await res.json();
      processParsedData(data);
    } catch (err) {
      setParseError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const processParsedData = (data: any) => {
    setParseSource(data.source || 'fallback');
    setParseReason(data.reason);
    setHeaders(data.headers || []);
    setColumnSuggestions(data.columnSuggestions || []);
    const initialRows: EditableStudentRow[] = data.previewRows || [];
    setPreviewRows(initialRows);
    setRawRows(data.rows || []);

    // Extract detected groups (e.g. Sections, Grades, or Multi-Sheets)
    const groups = new Set<string>();
    initialRows.forEach(r => {
      if (r.section) {
        groups.add(`${r.grade} Section ${r.section}`);
      } else if (r.grade) {
        groups.add(r.grade);
      }
    });

    const groupsArr = Array.from(groups);
    setDetectedGroups(groupsArr);
    setSelectedGroups(new Set(groupsArr)); // default: all checked

    setCurrentStep(2);
  };

  // Natural Language Filter Instruction
  const handleApplyFilterInstruction = async () => {
    if (!filterInstruction.trim()) return;
    setIsApplyingFilter(true);

    try {
      const res = await fetch('/api/import/filter-instruction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: filterInstruction,
          availableGroups: detectedGroups
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.selectedGroups)) {
          setSelectedGroups(new Set(data.selectedGroups));
        }
      }
    } catch {
      // Offline fallback: regex matching
      const lower = filterInstruction.toLowerCase();
      const matched = detectedGroups.filter(g => lower.includes(g.toLowerCase()));
      if (matched.length > 0) {
        setSelectedGroups(new Set(matched));
      }
    } finally {
      setIsApplyingFilter(false);
    }
  };

  // Step 2: Mapping adjustments
  const handleMappingChange = (header: string, newField: ColumnSuggestion['field'], topicId?: string) => {
    setColumnSuggestions(prev => prev.map(item => {
      if (item.header === header) {
        return { ...item, field: newField, topicId };
      }
      return item;
    }));
  };

  // Re-run normalization with updated column mappings
  const applyMappingToPreview = () => {
    const rollCol = columnSuggestions.find(c => c.field === 'rollNumber')?.header;
    const nameCol = columnSuggestions.find(c => c.field === 'studentName')?.header;
    const gradeCol = columnSuggestions.find(c => c.field === 'grade')?.header;
    const sectionCol = columnSuggestions.find(c => c.field === 'section')?.header;
    const scoreCol = columnSuggestions.find(c => c.field === 'score')?.header;
    const attCol = columnSuggestions.find(c => c.field === 'attendancePct')?.header;
    const topicCol = columnSuggestions.find(c => c.field === 'topic')?.header;
    const topicScoreCols = columnSuggestions.filter(c => c.field === 'topicScore');

    const updatedRows: EditableStudentRow[] = [];

    rawRows.forEach((r, idx) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      const roll = rollCol ? String(r[rollCol] || '').trim() : `R${idx + 1}`;
      const name = nameCol ? String(r[nameCol] || '').trim() : '';
      let grade = gradeCol ? String(r[gradeCol] || '').trim() : '';
      let section = sectionCol ? String(r[sectionCol] || '').trim() : undefined;
      const attVal = attCol ? Number(r[attCol]) : undefined;

      if (!name) errors.push('Student name is required');

      const gradeMatch = grade.match(/([345])/);
      if (gradeMatch) {
        grade = `Class ${gradeMatch[1]}`;
      } else if (!grade) {
        grade = 'Class 3';
        warnings.push('Grade defaulted to Class 3');
      }

      if (section) {
        section = section.replace(/^(?:Section|Sec|பிரிவு|वर्ग)\s*/i, '').trim().toUpperCase();
      }

      const scores: Record<string, number> = {};

      if (topicScoreCols.length > 0) {
        for (const tCol of topicScoreCols) {
          const val = r[tCol.header];
          if (val !== undefined && val !== '') {
            const num = Number(val);
            if (isNaN(num) || num < 0 || num > 100) {
              errors.push(`Score in '${tCol.header}' must be 0-100`);
            } else if (tCol.topicId) {
              scores[tCol.topicId] = Math.round(num);
            }
          }
        }
      }

      if (topicCol && scoreCol) {
        const topicVal = String(r[topicCol] || '').trim();
        const scoreVal = r[scoreCol];
        if (topicVal && scoreVal !== undefined && scoreVal !== '') {
          const num = Number(scoreVal);
          if (isNaN(num) || num < 0 || num > 100) {
            errors.push('Score must be 0-100');
          } else {
            const matchedT = availableTopics.find(t => 
              t.name.toLowerCase() === topicVal.toLowerCase() || t.id === topicVal
            );
            const key = matchedT ? matchedT.id : topicVal;
            scores[key] = Math.round(num);
          }
        }
      }

      // Check if group is selected (Hard Rule: unselected groups are never saved)
      const groupKey = section ? `${grade} Section ${section}` : grade;
      if (detectedGroups.length === 0 || selectedGroups.has(groupKey) || selectedGroups.has(grade)) {
        updatedRows.push({
          rollNumber: roll,
          name,
          grade,
          section,
          scores,
          attendancePct: !isNaN(Number(attVal)) ? Number(attVal) : undefined,
          errors: errors.length > 0 ? errors : undefined,
          warnings: warnings.length > 0 ? warnings : undefined
        });
      }
    });

    setPreviewRows(updatedRows);
    setCurrentStep(3);
  };

  // Step 3: Inline Cell Editing in Preview Table
  const handleCellEdit = (index: number, field: 'name' | 'rollNumber' | 'grade' | 'section', value: string) => {
    setPreviewRows(prev => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };
      const errs: string[] = [];
      if (!row.name.trim()) errs.push('Student name is required');
      row.errors = errs.length > 0 ? errs : undefined;
      next[index] = row;
      return next;
    });
  };

  const handleScoreEdit = (index: number, topicId: string, value: string) => {
    setPreviewRows(prev => {
      const next = [...prev];
      const row = { ...next[index] };
      const num = Number(value);
      const scores = { ...row.scores };

      if (value === '') {
        delete scores[topicId];
      } else if (!isNaN(num)) {
        scores[topicId] = Math.max(0, Math.min(100, Math.round(num)));
      }
      row.scores = scores;

      const errs: string[] = [];
      if (!row.name.trim()) errs.push('Student name is required');
      row.errors = errs.length > 0 ? errs : undefined;

      next[index] = row;
      return next;
    });
  };

  const handleDeleteRow = (index: number) => {
    setPreviewRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddRow = () => {
    setPreviewRows(prev => [
      ...prev,
      {
        rollNumber: `R${prev.length + 101}`,
        name: 'New Student',
        grade: 'Class 3',
        section: 'A',
        scores: {}
      }
    ]);
  };

  // Step 4: Commit
  const handleCommit = async () => {
    setIsCommitting(true);
    try {
      const cleanRows = previewRows.map(r => ({
        rollNumber: r.rollNumber,
        name: r.name,
        grade: r.grade,
        section: r.section || undefined,
        scores: r.scores,
        attendancePct: r.attendancePct
      }));

      const res = await fetch('/api/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: selectedEntity,
          mode: commitMode,
          rows: cleanRows,
          filename: file?.name || 'Pasted Data'
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson?.error?.message || 'Failed to commit import');
      }

      const data = await res.json();
      await Storage.initialize();
      setCommitSuccess({ count: data.count, jobId: data.jobId });
      await fetchHistory();
    } catch (err) {
      alert((err as Error).message || 'Failed to commit import');
    } finally {
      setIsCommitting(false);
    }
  };

  // Undo Handler
  const handleUndo = async () => {
    if (!window.confirm(i18n.language === 'ta' ? 'முந்தைய பதிவுகளை மீட்டமைக்கவா?' : i18n.language === 'hi' ? 'क्या आप पिछली स्थिति को पूर्ववत करना चाहते हैं?' : 'Revert to previous snapshot?')) {
      return;
    }

    try {
      const undone = await Storage.undoImport();
      setUndoMessage(i18n.language === 'ta' ? `${undone.restoredCount} பதிவுகள் மீட்டமைக்கப்பட்டன.` : i18n.language === 'hi' ? `${undone.restoredCount} रिकॉर्ड बहाल किए गए।` : `Successfully restored ${undone.restoredCount} records from snapshot.`);
      await fetchHistory();
    } catch (err) {
      alert((err as Error).message || 'Failed to undo');
    }
  };

  const validRowsCount = previewRows.filter(r => !r.errors || r.errors.length === 0).length;
  const errorRowsCount = previewRows.length - validRowsCount;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-blue-600" />
            {t('import.title')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{t('import.subtitle')}</p>
        </div>

        {canUndo && (
          <button
            onClick={handleUndo}
            className="inline-flex items-center gap-2 px-4 py-2 border border-amber-300 bg-amber-50 text-amber-800 text-sm font-medium rounded-lg hover:bg-amber-100 transition-colors shadow-sm"
          >
            <Undo2 className="w-4 h-4" />
            {t('import.undoLast')}
          </button>
        )}
      </div>

      {/* Separability Banner if disabled */}
      {!isImportEnabled && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{t('import.importDisabledBanner')}</span>
        </div>
      )}

      {undoMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center justify-between">
          <span>{undoMessage}</span>
          <button onClick={() => setUndoMessage(null)} className="text-emerald-600 font-bold hover:underline">✕</button>
        </div>
      )}

      {/* Target Entity Selector Pills */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          {t('import.selectEntity')}:
        </span>
        {[
          { id: 'students', label: t('import.entityStudents') },
          { id: 'attendance', label: t('import.entityAttendance') },
          { id: 'timetable', label: t('import.entityTimetable') },
          { id: 'classroom', label: t('import.entityClassroom') },
          { id: 'topics', label: t('import.entityTopics') },
          { id: 'activities', label: t('import.entityActivities') }
        ].map((ent) => (
          <button
            key={ent.id}
            onClick={() => setSelectedEntity(ent.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedEntity === ent.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {ent.label}
          </button>
        ))}
      </div>

      {/* 4-Step Progress Indicator */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        {[
          { step: 1, label: t('import.stepUpload') },
          { step: 2, label: t('import.stepMapping') },
          { step: 3, label: t('import.stepPreview') },
          { step: 4, label: t('import.stepConfirm') }
        ].map((s, idx) => (
          <React.Fragment key={s.step}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                currentStep === s.step 
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                  : currentStep > s.step 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 text-gray-500'
              }`}>
                {currentStep > s.step ? <Check className="w-4 h-4" /> : s.step}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${currentStep === s.step ? 'text-blue-900 font-bold' : 'text-gray-600'}`}>
                {s.label}
              </span>
            </div>
            {idx < 3 && <div className={`flex-1 h-0.5 mx-2 ${currentStep > idx + 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1: Upload or Paste */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Tabs: File Upload vs Paste Table */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'upload'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                {t('import.tabUpload')}
              </button>
              <button
                onClick={() => setActiveTab('paste')}
                className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'paste'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                {t('import.tabPaste')}
              </button>
            </div>

            {activeTab === 'upload' ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-blue-50/40 rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[300px]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf,.docx,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                />
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">{t('import.dragDrop')}</h3>
                <p className="text-sm text-gray-500 max-w-sm mb-4">
                  {t('import.supportedFormats', { max: 10 })}
                </p>
                <button 
                  type="button"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm"
                >
                  {t('common.browse', 'Select File')}
                </button>
              </div>
            ) : (
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    {t('import.tabPaste')}
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Copy cells from Excel, Google Sheets, or a CSV file and paste them directly into the box below:
                  </p>
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={t('import.pastePlaceholder')}
                    className="w-full text-xs font-mono p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleParsePasted}
                    disabled={isUploading || !pastedText.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{t('import.parsePasted')}</span>
                  </button>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="p-4 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Reading and validating data...</span>
              </div>
            )}

            {parseError && (
              <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="text-sm">{parseError}</span>
              </div>
            )}
          </div>

          {/* Right column: Templates and Security notices */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <FileDown className="w-4 h-4 text-emerald-600" />
                {t('export.templateStudents')}
              </h3>
              <p className="text-xs text-gray-500">
                Download formatted templates with sample data in English, Tamil, or Hindi:
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href={`/api/templates/${selectedEntity}?lang=en`}
                  download
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 flex items-center justify-between"
                >
                  <span className="capitalize">{selectedEntity} Template (English)</span>
                  <span className="text-blue-600">.xlsx</span>
                </a>
                <a
                  href={`/api/templates/${selectedEntity}?lang=ta`}
                  download
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 flex items-center justify-between"
                >
                  <span>மாதிரிப் படிவம் (தமிழ்)</span>
                  <span className="text-blue-600">.xlsx</span>
                </a>
                <a
                  href={`/api/templates/${selectedEntity}?lang=hi`}
                  download
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 flex items-center justify-between"
                >
                  <span>टेम्पलेट (हिन्दी)</span>
                  <span className="text-blue-600">.xlsx</span>
                </a>
              </div>
            </div>

            {/* Offline & Untrusted Data Protection Card */}
            <div className="bg-amber-50/70 p-5 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-2">
              <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                <HelpCircle className="w-4 h-4" />
                Offline-First & Security Shield
              </div>
              <p>• RuralClass works with <strong>no internet</strong> and parses files entirely locally.</p>
              <p>• Uploaded files are strictly treated as <strong>untrusted data</strong>, never executed or treated as AI prompt instructions.</p>
              <p>• Imported data is <strong>never auto-committed</strong> without your explicit preview and approval.</p>
            </div>

            {/* Recent Import Jobs */}
            {historyJobs.length > 0 && (
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Recent Import History
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {historyJobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="text-xs p-2 rounded bg-gray-50 border border-gray-100 flex justify-between items-center">
                      <div className="truncate pr-2">
                        <div className="font-medium text-gray-800 truncate">{job.filename}</div>
                        <div className="text-gray-400 text-[10px]">{new Date(job.importedAt).toLocaleDateString()} • {job.recordsCount} records</div>
                      </div>
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 uppercase font-medium">
                        {job.jobType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Column Mapping & What We Found Group Checklist */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* "What We Found" Group Checklist & Natural Language Filter */}
          {detectedGroups.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" />
                    {t('import.whatWeFound')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select which groups, sections, or classes to import into the roster:
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedGroups(new Set(detectedGroups))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    {t('import.selectAll')}
                  </button>
                  <button
                    onClick={() => setSelectedGroups(new Set())}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <Square className="w-3.5 h-3.5" />
                    {t('import.clearAll')}
                  </button>
                </div>
              </div>

              {/* Natural Language Filter Instruction Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={filterInstruction}
                  onChange={(e) => setFilterInstruction(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilterInstruction()}
                  placeholder={t('import.filterInstructionPlaceholder')}
                  className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <button
                  onClick={handleApplyFilterInstruction}
                  disabled={isApplyingFilter || !filterInstruction.trim()}
                  className="px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shrink-0"
                >
                  {t('import.applyFilter')}
                </button>
              </div>

              {/* Group Checkboxes */}
              <div className="flex flex-wrap gap-2 pt-1">
                {detectedGroups.map(grp => {
                  const isChecked = selectedGroups.has(grp);
                  return (
                    <label
                      key={grp}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const next = new Set(selectedGroups);
                          if (e.target.checked) next.add(grp);
                          else next.delete(grp);
                          setSelectedGroups(next);
                        }}
                        className="accent-blue-600 w-3.5 h-3.5"
                      />
                      <span>{grp}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Column Mapping Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Map Columns to Attributes</h2>
                <p className="text-sm text-gray-500">
                  RuralClass auto-detected the columns below. Confirm or update which column corresponds to each field:
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                parseSource === 'ai' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
              }`}>
                <Sparkles className="w-3 h-3" />
                {parseSource === 'ai' ? 'AI OCR' : 'Built-in Rules'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {columnSuggestions.map((col) => (
                <div key={col.header} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">File Column</div>
                  <div className="font-medium text-gray-900 truncate text-sm" title={col.header}>
                    {col.header}
                  </div>

                  <div className="pt-2">
                    <label className="text-xs text-gray-600 block mb-1">Maps to:</label>
                    <select
                      value={col.field === 'topicScore' && col.topicId ? `topic:${col.topicId}` : col.field}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith('topic:')) {
                          handleMappingChange(col.header, 'topicScore', val.replace('topic:', ''));
                        } else {
                          handleMappingChange(col.header, val as ColumnSuggestion['field']);
                        }
                      }}
                      className="w-full text-sm bg-white border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="studentName">Student Name (மாணவர் பெயர் / नाम)</option>
                      <option value="rollNumber">Roll Number (வரிசை எண் / रोल नंबर)</option>
                      <option value="grade">Grade / Class (வகுப்பு / कक्षा)</option>
                      <option value="section">Section (பிரிவு / अनुभाग)</option>
                      <option value="attendancePct">Attendance % (வருகை % / उपस्थिति %)</option>
                      <option value="score">General Score %</option>
                      <optgroup label="Curriculum Topics (Scores 0-100)">
                        {availableTopics.map(t => (
                          <option key={t.id} value={`topic:${t.id}`}>
                            {localizeGrade(t.grade, i18n.language)}: {localizeTopicName(t.name, i18n.language)}
                          </option>
                        ))}
                      </optgroup>
                      <option value="ignore">-- Ignore this column --</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={applyMappingToPreview}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm"
              >
                Review & Fix Errors
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Editable Preview Table */}
      {currentStep === 3 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>Interactive Preview & Edit</span>
                <span className="text-xs font-normal text-gray-500">(Hard Rule: Never auto-commit)</span>
              </h2>
              <p className="text-sm text-gray-500">
                Review and directly edit records below. Fix any red cells before committing to the database.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                {validRowsCount} Valid
              </span>
              {errorRowsCount > 0 && (
                <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {errorRowsCount} Need Attention
                </span>
              )}
              <button
                onClick={handleAddRow}
                className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
                <tr>
                  <th className="py-3 px-3 text-left w-20">Roll #</th>
                  <th className="py-3 px-3 text-left w-48">Name</th>
                  <th className="py-3 px-3 text-left w-28">Grade</th>
                  <th className="py-3 px-3 text-left w-24">Section</th>
                  {availableTopics.slice(0, 5).map(t => (
                    <th key={t.id} className="py-3 px-3 text-left min-w-[120px]">
                      {localizeTopicName(t.name, i18n.language)}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-left w-28">Status</th>
                  <th className="py-3 px-2 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {previewRows.map((row, idx) => {
                  const hasErr = row.errors && row.errors.length > 0;
                  return (
                    <tr key={idx} className={hasErr ? 'bg-rose-50/40' : 'hover:bg-gray-50/50'}>
                      {/* Roll Number */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.rollNumber}
                          onChange={(e) => handleCellEdit(idx, 'rollNumber', e.target.value)}
                          className="w-full text-xs font-mono bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded p-1"
                        />
                      </td>

                      {/* Name */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleCellEdit(idx, 'name', e.target.value)}
                          className={`w-full text-xs font-medium bg-transparent border rounded p-1 ${
                            !row.name.trim() 
                              ? 'border-rose-400 bg-rose-50 text-rose-900 font-bold' 
                              : 'border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white'
                          }`}
                        />
                      </td>

                      {/* Grade */}
                      <td className="py-2 px-3">
                        <select
                          value={row.grade}
                          onChange={(e) => handleCellEdit(idx, 'grade', e.target.value)}
                          className="w-full text-xs bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded p-1"
                        >
                          <option value="Class 3">{localizeGrade('Class 3', i18n.language)}</option>
                          <option value="Class 4">{localizeGrade('Class 4', i18n.language)}</option>
                          <option value="Class 5">{localizeGrade('Class 5', i18n.language)}</option>
                        </select>
                      </td>

                      {/* Section */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          placeholder="A/B/C"
                          value={row.section || ''}
                          onChange={(e) => handleCellEdit(idx, 'section', e.target.value.toUpperCase())}
                          className="w-full text-xs font-semibold bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded p-1"
                        />
                      </td>

                      {/* Topic Scores */}
                      {availableTopics.slice(0, 5).map(t => {
                        const scoreVal = row.scores[t.id];
                        return (
                          <td key={t.id} className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={scoreVal !== undefined ? scoreVal : ''}
                              placeholder="-"
                              onChange={(e) => handleScoreEdit(idx, t.id, e.target.value)}
                              className="w-16 text-xs text-center border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded p-1 font-mono"
                            />
                          </td>
                        );
                      })}

                      {/* Status / Errors */}
                      <td className="py-2 px-3">
                        {hasErr ? (
                          <span className="text-[11px] font-medium text-rose-700 bg-rose-100 px-2 py-0.5 rounded" title={row.errors?.join(', ')}>
                            {row.errors?.[0]}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Ready
                          </span>
                        )}
                      </td>

                      {/* Delete */}
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => handleDeleteRow(idx)}
                          className="text-gray-400 hover:text-rose-600 p-1"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Mapping
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              disabled={previewRows.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm"
            >
              Confirm Import Strategy
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Confirm & Commit */}
      {currentStep === 4 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          {!commitSuccess ? (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Choose Import Strategy</h2>
                <p className="text-sm text-gray-500">
                  Select how you want to apply the {previewRows.length} records into RuralClass:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  commitMode === 'merge' ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="mode"
                    value="merge"
                    checked={commitMode === 'merge'}
                    onChange={() => setCommitMode('merge')}
                    className="sr-only"
                  />
                  <div className="font-semibold text-gray-900 text-sm mb-1">Merge with Existing Records</div>
                  <p className="text-xs text-gray-500">
                    Updates attributes and marks for existing matching records, and adds newly found entries. Preserves untouched records.
                  </p>
                </label>

                <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  commitMode === 'replace' ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="mode"
                    value="replace"
                    checked={commitMode === 'replace'}
                    onChange={() => setCommitMode('replace')}
                    className="sr-only"
                  />
                  <div className="font-semibold text-gray-900 text-sm mb-1">Replace Existing Records</div>
                  <p className="text-xs text-gray-500">
                    Replaces the existing dataset with this import. A snapshot is automatically saved so you can <strong>Undo</strong> at any time.
                  </p>
                </label>
              </div>

              {selectedEntity === 'timetable' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                  ℹ️ <strong>Safety Guarantee:</strong> Timetable imports are always saved as a <strong>Draft</strong> plan and will never overwrite or disrupt your active weekly teaching plan.
                </div>
              )}

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs text-gray-600">
                <div className="font-semibold text-gray-800">Summary of Import:</div>
                <div>• Target Entity: <strong className="capitalize">{selectedEntity}</strong></div>
                <div>• Total rows to commit: <strong>{previewRows.length}</strong></div>
                <div>• Valid ready rows: <strong>{validRowsCount}</strong></div>
                {errorRowsCount > 0 && <div className="text-rose-600">• Rows with warnings/errors: <strong>{errorRowsCount}</strong></div>}
                <div>• Source: <strong>{file?.name || (activeTab === 'paste' ? 'Pasted Table' : 'Uploaded File')}</strong></div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Preview
                </button>
                <button
                  onClick={handleCommit}
                  disabled={isCommitting || previewRows.length === 0}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-2 shadow-sm"
                >
                  {isCommitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving to Database...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm & Commit Import
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Import Completed Successfully!</h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {commitSuccess.count} {selectedEntity} records have been successfully saved into RuralClass.
              </p>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    if (selectedEntity === 'timetable') navigate('/weekly-planner');
                    else if (selectedEntity === 'activities') navigate('/activities');
                    else if (selectedEntity === 'topics') navigate('/learning-gaps');
                    else if (selectedEntity === 'classroom') navigate('/classroom-setup');
                    else navigate('/students');
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm capitalize"
                >
                  View {selectedEntity}
                </button>
                <button
                  onClick={() => {
                    setCommitSuccess(null);
                    setCurrentStep(1);
                    setFile(null);
                    setPastedText('');
                    setPreviewRows([]);
                  }}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                >
                  Import Another File
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
