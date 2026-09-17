import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { DocumentItem, DocumentDetail, Quiz, QuestionAdmin } from '../../types';
import { 
  FileUp, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Save, 
  CheckCheck, 
  FileText, 
  Clock, 
  AlertCircle,
  Eye,
  Layers,
  ShieldCheck,
  BookOpen,
  Trash2,
  Copy,
  RotateCcw
} from 'lucide-react';

interface AdminDashboardProps {
  initialTab?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialTab = 'hitl' }) => {
  const [subTab, setSubTab] = useState<'hitl' | 'documents' | 'quizzes'>(
    initialTab === 'documents' || initialTab === 'quizzes' ? initialTab : 'hitl'
  );

  // Documents state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentDetail | null>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Quizzes state
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);

  // AI Generator state
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [genDocId, setGenDocId] = useState<number>(0);
  const [genTitle, setGenTitle] = useState('');
  const [genQuestionsCount, setGenQuestionsCount] = useState<number>(4);
  const [genCompetency, setGenCompetency] = useState<string>('Statistical Methodology & Data Governance');
  const [genDifficulty, setGenDifficulty] = useState<string>('Intermediate');
  const [generating, setGenerating] = useState(false);

  // HITL Queue state
  const [pendingQuestions, setPendingQuestions] = useState<QuestionAdmin[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<QuestionAdmin>>({});
  const [reviewerNotes, setReviewerNotes] = useState<{ [id: number]: string }>({});
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [loadingHITL, setLoadingHITL] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
    loadQuizzes();
    loadPendingQuestions();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await api.getDocuments();
      setDocuments(data);
      if (data.length > 0 && genDocId === 0) {
        setGenDocId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const loadQuizzes = async () => {
    try {
      const data = await api.getQuizzes();
      setQuizzes(data);
      if (data.length > 0 && selectedQuizId === null) {
        setSelectedQuizId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    }
  };

  const loadPendingQuestions = async (quizId?: number) => {
    setLoadingHITL(true);
    try {
      const data = await api.getPendingQuestions(quizId);
      setPendingQuestions(data);
    } catch (err) {
      console.error('Failed to load pending questions:', err);
    } finally {
      setLoadingHITL(false);
    }
  };

  // Upload handler
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadError(null);

    try {
      await api.uploadDocument(uploadTitle || uploadFile.name, uploadFile);
      setUploadTitle('');
      setUploadFile(null);
      await loadDocuments();
      setActionSuccess('Manual PDF uploaded & ingested successfully with OCR extraction.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // View document details
  const handleViewDoc = async (id: number) => {
    try {
      const doc = await api.getDocument(id);
      setSelectedDoc(doc);
      setDocModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch document:', err);
    }
  };

  // AI Quiz Generation Handler
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genDocId) return;
    setGenerating(true);

    try {
      const newQuiz = await api.generateQuiz({
        document_id: genDocId,
        title: genTitle || undefined,
        num_questions: genQuestionsCount,
        target_competency: genCompetency,
        difficulty: genDifficulty,
      });

      setGenModalOpen(false);
      setGenTitle('');
      await loadQuizzes();
      setSelectedQuizId(newQuiz.id);
      await loadPendingQuestions(newQuiz.id);
      setSubTab('hitl');
      setActionSuccess(`Generated ${newQuiz.questions.length} grounded questions at temperature 0.0. Added to HITL Review Queue.`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert('Generation error: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // HITL Single Question Review Action
  const handleReviewAction = async (questionId: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const notes = reviewerNotes[questionId] || undefined;
      const isEditing = editingQuestionId === questionId;
      const { review_status: _unused, ...cleanForm } = editForm;
      const finalStatus: 'APPROVED' | 'REJECTED' | 'MODIFIED' = isEditing && status === 'APPROVED' ? 'MODIFIED' : status;

      await api.reviewQuestion(questionId, {
        review_status: finalStatus,
        reviewer_notes: notes,
        ...(isEditing ? cleanForm : {}),
      });

      setEditingQuestionId(null);
      setEditForm({});
      await loadPendingQuestions(selectedQuizId || undefined);
      await loadQuizzes();

      setActionSuccess(`Question #${questionId} marked as ${status}.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert('Review action failed: ' + err.message);
    }
  };

  // HITL Bulk Review
  const handleBulkApprove = async () => {
    if (selectedQuestionIds.length === 0) return;
    try {
      await api.bulkReviewQuestions(selectedQuestionIds, 'APPROVE', 'Bulk approved by Senior Trainer.');
      setSelectedQuestionIds([]);
      await loadPendingQuestions(selectedQuizId || undefined);
      await loadQuizzes();
      setActionSuccess(`Bulk approved ${selectedQuestionIds.length} questions.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert('Bulk action failed: ' + err.message);
    }
  };

  // Publish Quiz
  const handlePublishQuiz = async (quizId: number) => {
    try {
      await api.publishQuiz(quizId);
      await loadQuizzes();
      setActionSuccess(`Quiz #${quizId} is now PUBLISHED and available for learner assessments.`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert('Publishing failed: ' + err.message);
    }
  };

  const handleUnpublishQuiz = async (quizId: number) => {
    try {
      await api.unpublishQuiz(quizId);
      await loadQuizzes();
      setActionSuccess(`Quiz #${quizId} reverted to 'UNDER_REVIEW' for revisions.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert('Unpublish failed: ' + err.message);
    }
  };

  const handleCloneQuiz = async (quizId: number) => {
    try {
      const cloned = await api.cloneQuiz(quizId);
      await loadQuizzes();
      setActionSuccess(`Created draft clone "${cloned.title}" in queue.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert('Clone failed: ' + err.message);
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!window.confirm(`Are you sure you want to permanently delete Assessment #${quizId}? This will remove all associated questions.`)) {
      return;
    }
    try {
      await api.deleteQuiz(quizId);
      await loadQuizzes();
      await loadPendingQuestions();
      setActionSuccess(`Assessment #${quizId} was permanently deleted.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleDeleteDocument = async (docId: number, filename: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete manual "${filename}"?`)) {
      return;
    }
    try {
      await api.deleteDocument(docId);
      await loadDocuments();
      setActionSuccess(`Manual "${filename}" was deleted successfully.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert('Failed to delete manual: ' + err.message);
    }
  };

  useEffect(() => {
    if (initialTab === 'documents' || initialTab === 'quizzes' || initialTab === 'hitl') {
      setSubTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Subheader & Navigation */}
      <div className="bg-gradient-to-br from-white via-blue-50/25 to-slate-50 rounded-2xl border border-blue-200/80 p-6 sm:p-7 mb-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 rounded-xl bg-blue-100/80 border border-blue-300 flex items-center justify-center text-blue-900 shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black text-slate-900 font-sans tracking-tight">
                Admin Trainer & HITL Curation Dashboard
              </h1>
            </div>
            <p className="text-sm text-slate-600 font-medium">
              National Statistical Systems Training Academy (NSSTA) • Official MoSPI Manual Ingestion & Verification
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setGenModalOpen(true)}
              disabled={documents.length === 0}
              className="inline-flex items-center gap-2.5 px-5 py-3 bg-[#0B2545] hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition shadow-md border border-slate-800 disabled:opacity-50 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Generate Grounded MCQs (Temp 0.0)
            </button>
          </div>
        </div>

        {/* Sub Navigation (Systematic Bordered Tabs) */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-200/80">
          <button
            onClick={() => setSubTab('hitl')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition border ${
              subTab === 'hitl'
                ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className={`w-5 h-5 rounded-md flex items-center justify-center border ${
              subTab === 'hitl' ? 'bg-amber-400/20 border-amber-300/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
            <span>HITL Review Queue</span>
            {pendingQuestions.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-400 text-slate-900 text-xs font-black rounded-full border border-amber-500">
                {pendingQuestions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('documents')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition border ${
              subTab === 'documents'
                ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className={`w-5 h-5 rounded-md flex items-center justify-center border ${
              subTab === 'documents' ? 'bg-teal-400/20 border-teal-300/40 text-teal-300' : 'bg-teal-50 border-teal-200 text-teal-700'
            }`}>
              <FileText className="w-3.5 h-3.5" />
            </span>
            <span>Manual Ingestion Pipeline ({documents.length})</span>
          </button>

          <button
            onClick={() => setSubTab('quizzes')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition border ${
              subTab === 'quizzes'
                ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className={`w-5 h-5 rounded-md flex items-center justify-center border ${
              subTab === 'quizzes' ? 'bg-indigo-400/20 border-indigo-300/40 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
            }`}>
              <Layers className="w-3.5 h-3.5" />
            </span>
            <span>Quiz Management ({quizzes.length})</span>
          </button>
        </div>
      </div>

      {/* Systematic Executive KPI Metrics Strip with Distinct Subtle Background Colors */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-white to-blue-50/70 rounded-2xl border border-blue-200/90 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100/80 border border-blue-300 flex items-center justify-center text-blue-900 flex-shrink-0 shadow-2xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Ingested Manuals</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{documents.length} Manuals</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-indigo-50/70 rounded-2xl border border-indigo-200/90 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100/80 border border-indigo-300 flex items-center justify-center text-indigo-900 flex-shrink-0 shadow-2xs">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Active Modules</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{quizzes.length} Quizzes</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-amber-50/80 rounded-2xl border border-amber-300/90 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100/80 border border-amber-300 flex items-center justify-center text-amber-900 flex-shrink-0 shadow-2xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block mb-0.5">Pending HITL</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-950">{pendingQuestions.length} Items</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-emerald-50/70 rounded-2xl border border-emerald-200/90 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100/80 border border-emerald-300 flex items-center justify-center text-emerald-900 flex-shrink-0 shadow-2xs">
            <CheckCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-0.5">Approval Status</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-900">
              {quizzes.filter(q => q.status === 'PUBLISHED').length} Published
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: HITL REVIEW QUEUE */}
      {subTab === 'hitl' && (
        <div className="space-y-6">
          {/* Controls & Filters Bar with subtle background tint */}
          <div className="bg-slate-100/90 p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-slate-800">Filter by Module:</label>
              <select
                value={selectedQuizId || ''}
                onChange={(e) => {
                  const qId = e.target.value ? Number(e.target.value) : null;
                  setSelectedQuizId(qId);
                  loadPendingQuestions(qId || undefined);
                }}
                className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 shadow-2xs outline-none focus:border-[#0B2545] focus:ring-2 focus:ring-blue-100 transition"
              >
                <option value="">All Pending Questions</option>
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    Quiz #{q.id}: {q.title.slice(0, 45)}... ({q.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Bulk Actions */}
            {pendingQuestions.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (selectedQuestionIds.length === pendingQuestions.length) {
                      setSelectedQuestionIds([]);
                    } else {
                      setSelectedQuestionIds(pendingQuestions.map((q) => q.id));
                    }
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-sm font-bold text-slate-800 rounded-xl shadow-2xs transition active:scale-95"
                >
                  {selectedQuestionIds.length === pendingQuestions.length ? 'Deselect All' : 'Select All'}
                </button>

                <button
                  onClick={handleBulkApprove}
                  disabled={selectedQuestionIds.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 border border-emerald-700 text-white text-sm font-bold rounded-xl transition shadow-xs disabled:opacity-40 active:scale-95"
                >
                  <CheckCheck className="w-4 h-4" />
                  Bulk Approve ({selectedQuestionIds.length})
                </button>
              </div>
            )}
          </div>

          {/* Pending Questions List */}
          {loadingHITL ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <div className="w-10 h-10 border-3 border-[#0B2545] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-medium">Loading pending questions from queue...</p>
            </div>
          ) : pendingQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Queue is Clear</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-5 font-normal">
                No items are currently awaiting review. Generate new deterministic MCQs from an ingested manual or view published modules.
              </p>
              <button
                onClick={() => setGenModalOpen(true)}
                className="px-6 py-3 bg-[#0B2545] hover:bg-slate-900 border border-slate-800 text-white text-sm font-bold rounded-xl transition shadow-xs active:scale-95"
              >
                Generate New Questions
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingQuestions.map((q) => {
                const isEditing = editingQuestionId === q.id;
                const isSelected = selectedQuestionIds.includes(q.id);

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-2xl border transition overflow-hidden ${
                      isSelected ? 'border-blue-600 ring-2 ring-blue-100 shadow-md' : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Top Metadata Header with subtle cool tint */}
                    <div className="bg-slate-100/90 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                            } else {
                              setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== q.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                        <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                          Item #{q.id}
                        </span>
                        <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                          {q.review_status}
                        </span>
                        <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-200/70 text-slate-700 border border-slate-300/70">
                          {q.difficulty}
                        </span>
                        <span className="px-3 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200">
                          {q.competency_tag}
                        </span>
                      </div>

                      {q.source_reference && (
                        <div className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 shadow-2xs flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-blue-700" />
                          <span>{q.source_reference}</span>
                        </div>
                      )}
                    </div>

                    {/* Question Content Body */}
                    <div className="p-6 sm:p-7">
                      {isEditing ? (
                        /* Edit Form */
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Question Prompt:</label>
                            <textarea
                              rows={2}
                              value={editForm.question_text ?? q.question_text}
                              onChange={(e) => setEditForm({ ...editForm, question_text: e.target.value })}
                              className="w-full p-3.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#0B2545] focus:ring-2 focus:ring-blue-100 outline-none transition font-medium"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                              const key = `option_${opt.toLowerCase()}` as keyof QuestionAdmin;
                              return (
                                <div key={opt} className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                  <span className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-xs font-black text-slate-700 flex-shrink-0 shadow-2xs">
                                    {opt}
                                  </span>
                                  <input
                                    type="text"
                                    value={editForm[key] !== undefined ? String(editForm[key]) : String(q[key])}
                                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                                    className="flex-1 p-1 text-sm bg-transparent border-none outline-none font-medium text-slate-800"
                                  />
                                </div>
                              );
                            })}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Correct Option:</label>
                              <select
                                value={editForm.correct_option ?? q.correct_option}
                                onChange={(e) => setEditForm({ ...editForm, correct_option: e.target.value })}
                                className="w-full p-2.5 text-sm bg-white border border-slate-300 rounded-xl outline-none font-semibold text-slate-800"
                              >
                                <option value="A">Option A</option>
                                <option value="B">Option B</option>
                                <option value="C">Option C</option>
                                <option value="D">Option D</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty:</label>
                              <select
                                value={editForm.difficulty ?? q.difficulty}
                                onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                                className="w-full p-2.5 text-sm bg-white border border-slate-300 rounded-xl outline-none font-semibold text-slate-800"
                              >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Competency Domain:</label>
                              <input
                                type="text"
                                value={editForm.competency_tag ?? q.competency_tag}
                                onChange={(e) => setEditForm({ ...editForm, competency_tag: e.target.value })}
                                className="w-full p-2.5 text-sm bg-white border border-slate-300 rounded-xl outline-none font-medium text-slate-800"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Pedagogical Explanation:</label>
                            <textarea
                              rows={2}
                              value={editForm.explanation ?? q.explanation}
                              onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                              className="w-full p-3.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#0B2545] outline-none font-medium"
                            />
                          </div>
                        </div>
                      ) : (
                        /* Read-Only Preview */
                        <div>
                          <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-5 leading-relaxed font-sans">
                            {q.question_text}
                          </h4>

                          {/* Structured 2x2 Option Grid with crisp letter badges and increased font size */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-5">
                            {[
                              { label: 'A', text: q.option_a },
                              { label: 'B', text: q.option_b },
                              { label: 'C', text: q.option_c },
                              { label: 'D', text: q.option_d },
                            ].map((opt) => {
                              const isCorrect = q.correct_option === opt.label;
                              return (
                                <div
                                  key={opt.label}
                                  className={`p-4 rounded-xl border text-sm flex items-start gap-3.5 transition ${
                                    isCorrect
                                      ? 'bg-emerald-50/80 border-2 border-emerald-400 text-emerald-950 font-medium shadow-2xs'
                                      : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <span
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 shadow-2xs border ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white border-emerald-700'
                                        : 'bg-white text-slate-700 border-slate-300'
                                    }`}
                                  >
                                    {opt.label}
                                  </span>
                                  <span className="flex-1 leading-relaxed text-sm sm:text-base font-normal">{opt.text}</span>
                                  {isCorrect && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black uppercase tracking-wider">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                      Correct
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Pedagogical Rationale Panel with subtle soft blue separation */}
                          <div className="bg-blue-50/60 p-4 sm:p-5 rounded-xl border border-blue-200 text-sm text-slate-800 leading-relaxed flex items-start gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-300 text-blue-900 flex items-center justify-center flex-shrink-0 shadow-2xs">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <span className="font-black text-blue-950 text-xs uppercase tracking-wider block mb-1">
                                Pedagogical Rationale & Alignment:
                              </span>
                              <p className="text-slate-700 font-medium leading-relaxed">{q.explanation}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Reviewer Note Input & Action Bar with subtle background tint */}
                      <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                          <input
                            type="text"
                            placeholder="Add optional reviewer note (e.g. Verified against Manual Chapter 2)..."
                            value={reviewerNotes[q.id] || ''}
                            onChange={(e) => setReviewerNotes({ ...reviewerNotes, [q.id]: e.target.value })}
                            className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-[#0B2545] focus:ring-2 focus:ring-blue-100 transition placeholder:text-slate-400 font-medium"
                          />
                        </div>

                        {/* Action Buttons with Crisp Borders */}
                        <div className="flex items-center gap-2.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => {
                                  setEditingQuestionId(null);
                                  setEditForm({});
                                }}
                                className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-xl transition shadow-2xs active:scale-95"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReviewAction(q.id, 'APPROVED')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 border border-blue-800 text-white text-sm font-bold rounded-xl transition shadow-xs active:scale-95"
                              >
                                <Save className="w-4 h-4" />
                                Save & Approve
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingQuestionId(q.id);
                                  setEditForm(q);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-sm font-bold rounded-xl transition shadow-2xs active:scale-95"
                              >
                                <Edit3 className="w-4 h-4 text-slate-500" />
                                Edit
                              </button>

                              <button
                                onClick={() => handleReviewAction(q.id, 'REJECTED')}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-300 text-red-800 text-sm font-bold rounded-xl transition shadow-2xs active:scale-95"
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                                Reject
                              </button>

                              <button
                                onClick={() => handleReviewAction(q.id, 'APPROVED')}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 border border-emerald-700 text-white text-sm font-bold rounded-xl transition shadow-xs active:scale-95"
                              >
                                <CheckCircle2 className="w-4 h-4 text-white" />
                                Approve
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANUAL INGESTION PIPELINE */}
      {subTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Upload Form with subtle background separation */}
          <div className="bg-gradient-to-br from-white to-teal-50/40 p-6 sm:p-7 rounded-2xl border border-teal-200/90 shadow-xs h-fit">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-teal-100/80 border border-teal-300 text-teal-900 flex items-center justify-center shadow-2xs">
                <FileUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Upload Government Manual</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed font-normal">
              Ingests PDF documents, applies OCR & tabular extraction to convert official publications into grounded learning schemas.
            </p>

            {uploadError && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-sm text-red-700 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Manual Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MoSPI Survey Instructions Handbook 2026"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0B2545] focus:ring-2 focus:ring-blue-100 transition font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Select File (PDF, TXT, MD)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.txt,.md"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border file:border-teal-300 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-900 hover:file:bg-teal-100 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="w-full py-3 bg-[#0B2545] hover:bg-slate-900 border border-slate-800 text-white text-sm font-bold rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2.5 active:scale-95"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Extracting Prose & Tables...
                  </>
                ) : (
                  <>
                    <FileUp className="w-4 h-4" />
                    Process & Ingest Manual
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Ingested Documents Directory */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center justify-between">
              <span>Ingested Reference Publications ({documents.length})</span>
              <span className="text-xs font-normal text-slate-500">Stored in secure NSSTA repository</span>
            </h3>

            {documents.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200/90 text-center text-slate-500 text-xs shadow-xs">
                No manuals ingested yet.
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">{doc.title}</h4>
                        <div className="flex flex-wrap items-center gap-2.5 mt-2 text-xs text-slate-500">
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-medium">
                            {doc.filename}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs">
                            {(doc.file_size_bytes / 1024).toFixed(1)} KB
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
                            {doc.page_count} Pages
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-xs">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleViewDoc(doc.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-bold rounded-xl transition shadow-2xs active:scale-95"
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                        Inspect OCR
                      </button>

                      <button
                        onClick={() => {
                          setGenDocId(doc.id);
                          setGenTitle(`Assessment: ${doc.title.slice(0, 30)}`);
                          setGenModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0B2545] hover:bg-slate-900 border border-slate-800 text-white text-sm font-bold rounded-xl transition shadow-xs active:scale-95"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        Generate MCQs
                      </button>

                      <button
                        onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                        title="Delete Ingested Manual"
                        className="p-2.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl transition shadow-2xs active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: QUIZ MANAGEMENT */}
      {subTab === 'quizzes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-slate-800">
              Micro-Learning Modules & Question Banks ({quizzes.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {quizzes.map((quiz) => {
              const isPublished = quiz.status === 'PUBLISHED';

              return (
                <div
                  key={quiz.id}
                  className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${
                          isPublished
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                            : 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                        }`}
                      >
                        {quiz.status}
                      </span>
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {quiz.time_limit_minutes} Mins
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-900 mb-2 font-sans">{quiz.title}</h4>
                    <p className="text-sm text-slate-600 mb-5 leading-relaxed font-normal">{quiz.description}</p>

                    <div className="bg-slate-100/90 p-4 rounded-xl border border-slate-200 grid grid-cols-3 text-center gap-2.5 mb-5">
                      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                        <span className="text-xs text-slate-500 uppercase block font-extrabold tracking-wider">Total Items</span>
                        <span className="text-base font-black text-slate-900">{quiz.total_questions}</span>
                      </div>
                      <div className="bg-white border border-emerald-200 rounded-xl p-3 shadow-2xs">
                        <span className="text-xs text-emerald-800 uppercase block font-extrabold tracking-wider">Approved</span>
                        <span className="text-base font-black text-emerald-700">{quiz.approved_questions}</span>
                      </div>
                      <div className="bg-white border border-amber-200 rounded-xl p-3 shadow-2xs">
                        <span className="text-xs text-amber-800 uppercase block font-extrabold tracking-wider">Pending HITL</span>
                        <span className="text-base font-black text-amber-700">{quiz.pending_questions}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedQuizId(quiz.id);
                        loadPendingQuestions(quiz.id);
                        setSubTab('hitl');
                      }}
                      className="flex-1 min-w-[120px] py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition text-center shadow-2xs active:scale-95"
                    >
                      Review HITL ({quiz.pending_questions})
                    </button>

                    {isPublished ? (
                      <button
                        onClick={() => handleUnpublishQuiz(quiz.id)}
                        className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl transition text-center shadow-2xs active:scale-95 flex items-center gap-1.5"
                        title="Revert module to Under Review for revisions"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                        Unpublish
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublishQuiz(quiz.id)}
                        disabled={quiz.approved_questions === 0}
                        className="flex-1 min-w-[120px] py-2.5 px-3 bg-[#0B2545] hover:bg-slate-900 border border-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs text-center disabled:opacity-50 active:scale-95"
                        title={quiz.approved_questions === 0 ? "Approve questions in HITL before publishing" : "Make available to all officers"}
                      >
                        Publish ({quiz.approved_questions} Approved)
                      </button>
                    )}

                    <button
                      onClick={() => handleCloneQuiz(quiz.id)}
                      className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl transition shadow-2xs active:scale-95"
                      title="Clone Quiz into Draft"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="p-2.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-600 rounded-xl transition shadow-2xs active:scale-95"
                      title="Permanently Delete Assessment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: AI QUESTION GENERATION */}
      {genModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 sm:p-8 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Deterministic Question Generation</h3>
              </div>
              <button
                onClick={() => setGenModalOpen(false)}
                className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 font-bold transition"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed font-normal">
                <strong className="font-bold text-blue-900">Temperature 0.0 Enforced:</strong> Ensures strict alignment with government manual citations and eliminates speculative hallucinations.
              </span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Source Manual</label>
                <select
                  value={genDocId}
                  onChange={(e) => setGenDocId(Number(e.target.value))}
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none font-semibold text-slate-800 focus:border-[#0B2545] focus:ring-2 focus:ring-blue-100"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.page_count} Pages)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Quiz Module Title</label>
                <input
                  type="text"
                  placeholder="e.g. Statistical Auditing & Field Verification Level 1"
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none font-medium text-slate-800 focus:border-[#0B2545] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Number of Questions</label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={genQuestionsCount}
                    onChange={(e) => setGenQuestionsCount(Number(e.target.value))}
                    className="w-full p-2 text-xs bg-white border border-slate-300 rounded-xl outline-none font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Difficulty Level</label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value)}
                    className="w-full p-2 text-xs bg-white border border-slate-300 rounded-xl outline-none font-semibold text-slate-800"
                  >
                    <option value="Beginner">Beginner (Foundational)</option>
                    <option value="Intermediate">Intermediate (Operational)</option>
                    <option value="Advanced">Advanced (Supervisory/Audit)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Target MoSPI Competency Domain</label>
                <select
                  value={genCompetency}
                  onChange={(e) => setGenCompetency(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none font-semibold text-slate-800 focus:border-[#0B2545] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Statistical Methodology & Data Governance">Statistical Methodology & Data Governance</option>
                  <option value="Sampling Frame & Design">Sampling Frame & Design</option>
                  <option value="Data Quality Control & Field Verification">Data Quality Control & Field Verification</option>
                  <option value="National Accounts Statistics">National Accounts Statistics</option>
                  <option value="Price Statistics & Indices">Price Statistics & Indices</option>
                  <option value="Data Governance & Audit">Data Governance & Audit</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full py-2.5 bg-[#0B2545] hover:bg-slate-900 border border-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {generating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Executing Gemini Pro Extraction (Temp 0.0)...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Generate Grounded MCQs
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT EXTRACTED DOCUMENT KNOWLEDGE */}
      {docModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 p-6 sm:p-8 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedDoc.title}</h3>
                <span className="text-xs text-slate-500">
                  {selectedDoc.filename} • {selectedDoc.page_count} Pages Ingested
                </span>
              </div>
              <button
                onClick={() => setDocModalOpen(false)}
                className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 font-bold transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Extracted Prose Narrative:
                </h4>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {selectedDoc.extracted_text || 'No text extracted.'}
                </div>
              </div>

              {selectedDoc.extracted_tables_json && selectedDoc.extracted_tables_json !== '[]' && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Extracted Tabular Matrices:
                  </h4>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedDoc.extracted_tables_json}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setDocModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition shadow-2xs active:scale-95"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
