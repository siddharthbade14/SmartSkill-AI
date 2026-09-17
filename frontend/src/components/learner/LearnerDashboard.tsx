import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { 
  Quiz, 
  QuizDetailLearner, 
  AssessmentResult, 
  AttemptSummary,
  CourseRecommendation
} from '../../types';
import { 
  BookOpen, 
  Clock, 
  Award, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft, 
  ExternalLink,
  Target,
  FileCheck,
  TrendingUp,
  History,
  GraduationCap,
  ShieldCheck,
  X
} from 'lucide-react';

interface LearnerDashboardProps {
  initialTab?: string;
}

export const LearnerDashboard: React.FC<LearnerDashboardProps> = ({ initialTab = 'assessments' }) => {
  const [activeView, setActiveView] = useState<'catalog' | 'test' | 'result' | 'history'>(
    initialTab === 'history' ? 'history' : 'catalog'
  );

  // Available Quizzes
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Active Assessment State
  const [activeQuiz, setActiveQuiz] = useState<QuizDetailLearner | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: string }>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Result & Diagnostics State
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

  // iGOT Enrollment Simulation State
  const [enrolledCourse, setEnrolledCourse] = useState<CourseRecommendation | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Record<string, boolean>>({});

  // History State
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadAvailableQuizzes();
    loadAttempts();
  }, []);

  // Countdown timer for active assessment
  useEffect(() => {
    if (activeView !== 'test' || !activeQuiz) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAssessment(); // auto-submit on timeout
          return 0;
        }
        return prev - 1;
      });
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeView, activeQuiz, userAnswers]);

  const loadAvailableQuizzes = async () => {
    setLoadingCatalog(true);
    try {
      const data = await api.getAvailableQuizzes();
      setAvailableQuizzes(data);
    } catch (err) {
      console.error('Failed to load available quizzes:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const loadAttempts = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.getAttempts();
      setAttempts(data);
    } catch (err) {
      console.error('Failed to load attempts history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleStartQuiz = async (quizId: number) => {
    try {
      const quizDetail = await api.startQuiz(quizId);
      setActiveQuiz(quizDetail);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setTimeRemainingSeconds(quizDetail.time_limit_minutes * 60);
      setElapsedSeconds(0);
      setActiveView('test');
    } catch (err: any) {
      alert('Could not start assessment: ' + err.message);
      loadAvailableQuizzes();
    }
  };

  const handleSelectOption = (questionId: number, option: string) => {
    setUserAnswers({
      ...userAnswers,
      [questionId]: option,
    });
  };

  const handleSubmitAssessment = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);

    try {
      const formattedAnswers = Object.entries(userAnswers).map(([qId, opt]) => ({
        question_id: Number(qId),
        selected_option: opt,
      }));

      const result = await api.submitQuiz(activeQuiz.id, {
        time_spent_seconds: elapsedSeconds,
        answers: formattedAnswers,
      });

      setAssessmentResult(result);
      setActiveView('result');
      await loadAttempts();
    } catch (err: any) {
      alert('Error submitting assessment: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewAttemptDetail = async (attemptId: number) => {
    try {
      const result = await api.getAttemptDetail(attemptId);
      setAssessmentResult(result);
      setActiveView('result');
    } catch (err: any) {
      alert('Failed to load attempt details: ' + err.message);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. CATALOG VIEW */}
      {activeView === 'catalog' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-white via-emerald-50/20 to-slate-50 rounded-2xl border border-emerald-200/80 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 flex items-center justify-center shadow-2xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 font-sans tracking-tight">
                  Government Micro-Learning Competency Catalog
                </h1>
              </div>
              <p className="text-sm text-slate-600 font-medium">
                MoSPI / iGOT Karmayogi Accredited Statistical Knowledge & Quality Standard Modules
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveView('history');
                  loadAttempts();
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-bold rounded-xl transition shadow-2xs active:scale-95"
              >
                <History className="w-4 h-4 text-slate-500" />
                My Assessment History ({attempts.length})
              </button>
            </div>
          </div>

          {loadingCatalog ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
              <div className="w-10 h-10 border-3 border-[#0B2545] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-medium">Fetching verified assessment modules...</p>
            </div>
          ) : availableQuizzes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <BookOpen className="w-14 h-14 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">No Published Quizzes Available</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Admin trainers are currently reviewing question drafts in the HITL queue. Please check back shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition shadow-xs hover:shadow-subtle flex flex-col justify-between overflow-hidden group"
                >
                  <div className="h-1.5 bg-gradient-to-r from-[#0B2545] to-[#134E4A]" />
                  <div className="p-6 sm:p-7">
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs">
                        {quiz.target_competency}
                      </span>
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {quiz.time_limit_minutes} Mins
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#0B2545] transition font-sans">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-5 line-clamp-2 leading-relaxed font-normal">
                      {quiz.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-100/90 rounded-xl border border-slate-200 text-center mb-5">
                      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                        <span className="text-xs text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">Questions</span>
                        <span className="text-base font-black text-slate-900">{quiz.total_questions} MCQs</span>
                      </div>
                      <div className="bg-white border border-emerald-200 rounded-xl p-3 shadow-2xs">
                        <span className="text-xs text-emerald-800 uppercase font-extrabold tracking-wider block mb-0.5">Passing Score</span>
                        <span className="text-base font-black text-emerald-700">{quiz.passing_percentage}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 sm:p-7 pt-0">
                    <button
                      onClick={() => handleStartQuiz(quiz.id)}
                      className="w-full py-3 bg-[#0B2545] hover:bg-slate-900 border border-slate-800 text-white text-sm font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Target className="w-4 h-4" />
                      Begin Competency Assessment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. ACTIVE ASSESSMENT SESSION VIEW */}
      {activeView === 'test' && activeQuiz && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Session Progress Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1">
                Active Assessment Session
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-sans">{activeQuiz.title}</h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Countdown Timer with crisp border */}
              <div className={`px-4 py-2.5 rounded-xl flex items-center gap-2 border font-mono text-base font-bold shadow-2xs ${
                timeRemainingSeconds < 180 
                  ? 'bg-red-50 text-red-700 border-red-300 animate-pulse' 
                  : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}>
                <Clock className="w-5 h-5" />
                <span>{formatTime(timeRemainingSeconds)}</span>
              </div>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to exit the assessment? Answers will not be recorded.')) {
                    setActiveView('catalog');
                  }
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-red-300 hover:bg-red-50 text-slate-700 hover:text-red-700 font-bold text-sm transition shadow-2xs active:scale-95"
              >
                Exit Test
              </button>
            </div>
          </div>

          {/* Main Question Interface */}
          {activeQuiz.questions.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              {/* Progress Bar & Counter */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm font-bold text-slate-700 mb-2">
                  <span>Question Progress</span>
                  <span>{Object.keys(userAnswers).length} of {activeQuiz.questions.length} Answered</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-gradient-to-r from-[#0B2545] to-teal-600 transition-all duration-300 ease-out rounded-full" 
                    style={{ width: `${(Object.keys(userAnswers).length / activeQuiz.questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Metadata */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#0B2545] border border-blue-900 text-white flex items-center justify-center text-sm font-black shadow-2xs">
                    {currentQuestionIndex + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200 shadow-2xs">
                    {activeQuiz.questions[currentQuestionIndex].competency_tag}
                  </span>
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {activeQuiz.questions[currentQuestionIndex].difficulty}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed mb-6 font-sans">
                {activeQuiz.questions[currentQuestionIndex].question_text}
              </h3>

              {/* Options Selection with Bordered Cards and larger fonts */}
              <div className="space-y-3.5 mb-8">
                {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                  const currentQ = activeQuiz.questions[currentQuestionIndex];
                  const optText = currentQ[`option_${optKey.toLowerCase()}` as keyof typeof currentQ] as string;
                  const isSelected = userAnswers[currentQ.id] === optKey;

                  return (
                    <button
                      key={optKey}
                      onClick={() => handleSelectOption(currentQ.id, optKey)}
                      className={`w-full p-4 sm:p-5 rounded-xl border-2 text-left transition-all duration-150 flex items-center justify-between gap-4 active:scale-99 ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50/50 border-[#0B2545] ring-2 ring-blue-100 text-slate-950 shadow-sm'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black transition flex-shrink-0 border shadow-2xs ${
                          isSelected ? 'bg-[#0B2545] border-blue-900 text-white' : 'bg-white text-slate-700 border-slate-300'
                        }`}>
                          {optKey}
                        </div>
                        <span className="text-sm sm:text-base font-normal leading-relaxed">{optText}</span>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-emerald-600 border border-emerald-700 text-white flex items-center justify-center flex-shrink-0 animate-in zoom-in-50 duration-150 shadow-2xs">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls & Palette */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition disabled:opacity-30 flex items-center gap-1.5 shadow-2xs active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <button
                    onClick={() => {
                      setCurrentQuestionIndex((prev) => Math.min(activeQuiz.questions.length - 1, prev + 1));
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    disabled={currentQuestionIndex === activeQuiz.questions.length - 1}
                    className="px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition disabled:opacity-30 flex items-center gap-1.5 shadow-2xs active:scale-95"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Question Navigator Dots */}
                <div className="flex items-center gap-2 flex-wrap">
                  {activeQuiz.questions.map((q, idx) => {
                    const isAnswered = Boolean(userAnswers[q.id]);
                    const isCurrent = currentQuestionIndex === idx;

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold border transition ${
                          isCurrent
                            ? 'ring-2 ring-blue-200 bg-[#0B2545] border-blue-900 text-white'
                            : isAnswered
                            ? 'bg-emerald-600 border-emerald-700 text-white shadow-2xs'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Final Submit */}
                <div>
                  <button
                    onClick={handleSubmitAssessment}
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 border border-emerald-700 text-white text-sm font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-95"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Evaluating Responses...
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-5 h-5" />
                        Submit Assessment ({Object.keys(userAnswers).length}/{activeQuiz.questions.length} Answered)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. POST-ASSESSMENT RESULT & GAP DIAGNOSTICS VIEW */}
      {activeView === 'result' && assessmentResult && (
        <div className="space-y-8 animate-in fade-in">
          {/* Top Score Banner */}
          <div className="bg-gradient-to-br from-white via-blue-50/25 to-slate-50 rounded-3xl border border-blue-200/80 p-8 shadow-xs relative overflow-hidden">
            <div className="h-2 absolute top-0 left-0 right-0 bg-gradient-to-r from-[#0B2545] via-[#134E4A] to-amber-500" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow-2xs border ${
                    assessmentResult.passed 
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                      : 'bg-amber-50 text-amber-900 border-amber-300'
                  }`}>
                    {assessmentResult.passed ? 'Assessment Passed' : 'Remediation Required'}
                  </span>
                  <span className="px-3 py-1 rounded-lg text-xs font-medium text-slate-500 bg-white border border-slate-200 shadow-2xs">
                    Completed on {new Date(assessmentResult.completed_at).toLocaleDateString()}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1.5 font-sans">
                  {assessmentResult.quiz_title}
                </h1>
                <p className="text-sm text-slate-600 font-medium">
                  MoSPI Micro-Learning Assessment Performance Report & iGOT Remediation Strategy
                </p>
              </div>

              {/* Score Display Box */}
              <div className="flex items-center gap-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-center">
                  <div className="text-5xl font-black text-[#0B2545]">
                    {assessmentResult.percentage}%
                  </div>
                  <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block mt-1">Total Score</span>
                </div>

                <div className="h-12 w-px bg-slate-200" />

                <div className="space-y-2 text-sm font-medium">
                  <div className="flex items-center justify-between gap-4 text-slate-600">
                    <span>Correct Items:</span>
                    <strong className="text-emerald-700 font-bold text-base">{assessmentResult.score} / {assessmentResult.total_questions}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-slate-600">
                    <span>Time Taken:</span>
                    <strong className="text-slate-900 font-bold">{formatTime(assessmentResult.time_spent_seconds)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Competency Gap Analysis Grid with Distinct Minimal Background Tints */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Competency Breakdown Meter */}
            <div className="bg-gradient-to-br from-white to-blue-50/35 rounded-2xl border border-blue-200/80 p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100/80 border border-blue-300 text-[#0B2545] flex items-center justify-center shadow-2xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-sans">
                  MoSPI Competency Domain Breakdown
                </h3>
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed font-normal">
                Identifies operational strengths and areas requiring knowledge reinforcement as per National Statistical Standards.
              </p>

              <div className="space-y-4">
                {assessmentResult.competency_breakdown.map((comp) => {
                  const isMastered = comp.status === 'Mastered';
                  const isNeedsRevision = comp.status === 'Needs Revision';

                  return (
                    <div key={comp.competency} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-slate-900">{comp.competency}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-xs font-medium">
                            {comp.correct} of {comp.total} Correct
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider border shadow-2xs ${
                            isMastered
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : isNeedsRevision
                              ? 'bg-red-50 text-red-900 border-red-300'
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}>
                            {comp.status} ({comp.percentage}%)
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isMastered ? 'bg-emerald-600' : isNeedsRevision ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${comp.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Curated iGOT Karmayogi Recommendations */}
            <div className="bg-gradient-to-br from-white to-amber-50/35 rounded-2xl border border-amber-200/80 p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 flex items-center justify-center shadow-2xs">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-sans">
                  Targeted iGOT Karmayogi Courses
                </h3>
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed font-normal">
                Micro-learning courses dynamically recommended to bridge identified knowledge gaps.
              </p>

              <div className="space-y-4">
                {assessmentResult.recommendations.map((rec) => (
                  <div
                    key={rec.course_id}
                    className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-2xs flex flex-col justify-between gap-3.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono text-slate-700 font-bold text-xs">
                          {rec.course_id}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {rec.duration}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5 font-sans">{rec.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3 font-normal">
                        {rec.reason}
                      </p>
                      <span className="text-xs font-bold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                        {rec.provider}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Target Competency: <strong className="text-slate-700">{rec.competency}</strong>
                      </span>
                      <button
                        onClick={() => {
                          setEnrolledCourse(rec);
                          setEnrolledCourseIds(prev => ({ ...prev, [rec.course_id]: true }));
                        }}
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition shadow-xs cursor-pointer active:scale-95 ${
                          enrolledCourseIds[rec.course_id]
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700'
                            : 'bg-[#0B2545] hover:bg-slate-900 border border-slate-800 text-white'
                        }`}
                      >
                        {enrolledCourseIds[rec.course_id] ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>Enrolled on iGOT ✓</span>
                          </>
                        ) : (
                          <>
                            <GraduationCap className="w-4 h-4 text-amber-300" />
                            <span>Enroll on iGOT</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Question-by-Question Pedagogical Review */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 mb-6 font-sans">
              Item-by-Item Review & Grounded Explanations
            </h3>

            <div className="space-y-6">
              {assessmentResult.detailed_answers.map((ans, idx) => (
                <div
                  key={ans.question_id}
                  className={`p-6 rounded-2xl border transition shadow-2xs ${
                    ans.is_correct ? 'bg-emerald-50/40 border-emerald-300' : 'bg-red-50/40 border-red-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700">
                        #{idx + 1}
                      </span>
                      {ans.is_correct ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black text-emerald-900 bg-white border border-emerald-300 shadow-2xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black text-red-900 bg-white border border-red-300 shadow-2xs">
                          <XCircle className="w-4 h-4 text-red-600" />
                          Incorrect
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200">
                        {ans.competency_tag}
                      </span>
                    </div>

                    {ans.source_reference && (
                      <span className="px-3 py-1 rounded-lg text-xs text-slate-600 bg-white border border-slate-200 shadow-2xs font-medium">
                        {ans.source_reference}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mb-3.5 leading-relaxed font-sans">
                    {ans.question_text}
                  </h4>

                  <div className="flex flex-wrap items-center gap-4 text-sm mb-4 font-medium">
                    <span className="text-slate-700">
                      Your Selection: <strong className={ans.is_correct ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>Option {ans.selected_option}</strong>
                    </span>
                    {!ans.is_correct && (
                      <span className="text-slate-700">
                        Correct Answer: <strong className="text-emerald-700 font-bold">Option {ans.correct_option}</strong>
                      </span>
                    )}
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed shadow-2xs">
                    <strong className="text-slate-900 block mb-1 font-bold">Pedagogical Explanation:</strong>
                    {ans.explanation}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 flex justify-end">
              <button
                onClick={() => {
                  setActiveQuiz(null);
                  setActiveView('catalog');
                }}
                className="px-6 py-3 bg-[#0B2545] hover:bg-slate-900 border border-slate-800 text-white text-sm font-bold rounded-xl transition shadow-xs active:scale-95"
              >
                Return to Course Catalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. HISTORY VIEW */}
      {activeView === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-sans">Your Completed Assessments</h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Historical performance records and gap analysis reports</p>
            </div>
            <button
              onClick={() => setActiveView('catalog')}
              className="px-5 py-2.5 bg-[#0B2545] hover:bg-slate-900 border border-slate-800 text-white text-sm font-bold rounded-xl transition shadow-xs active:scale-95"
            >
              Browse Catalog
            </button>
          </div>

          {loadingHistory ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm shadow-xs">
              Loading past attempts...
            </div>
          ) : attempts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm shadow-xs">
              You haven't completed any assessments yet. Select a module from the catalog to begin.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-6 py-4">Module Name</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4">Percentage</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {attempts.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4 font-bold text-slate-900">{att.quiz_title}</td>
                        <td className="px-6 py-4 text-slate-500 font-normal">
                          {new Date(att.completed_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-800">
                          {att.score} / {att.total_questions}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{att.percentage}%</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider border shadow-2xs ${
                            att.passed ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}>
                            {att.passed ? 'PASSED' : 'NEEDS REVISION'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewAttemptDetail(att.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-sm rounded-lg transition shadow-2xs active:scale-95"
                          >
                            View Diagnostic Report →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      {/* SIMULATED iGOT KARMAYOGI ENROLLMENT MODAL */}
      {enrolledCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ boxShadow: '0 25px 60px -15px rgba(11, 37, 69, 0.4)' }}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0B2545] via-slate-900 to-indigo-950 text-white p-6 relative">
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enrolled in iGOT Karmayogi MoSPI Micro-Module</span>
                </div>
                <button
                  onClick={() => setEnrolledCourse(null)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                {enrolledCourse.title}
              </h3>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-300 font-mono">
                <span className="px-2 py-0.5 rounded bg-white/10 text-amber-300 font-bold">{enrolledCourse.course_id}</span>
                <span>•</span>
                <span>{enrolledCourse.duration}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium">Provider:</span>
                  <span className="font-bold text-slate-800 text-right">{enrolledCourse.provider}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium">Target Competency:</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{enrolledCourse.competency}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium">Diagnostic Reason:</span>
                  <span className="text-slate-700 text-right">{enrolledCourse.reason}</span>
                </div>
              </div>

              {/* Real-time Accreditation & Sync Badge */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                    Synchronized with MoSPI Civil Services Framework
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                    This course is registered to your officer training record. Module progress is tracked towards your annual NSSTA capacity building credits.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href={enrolledCourse.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#0B2545] to-indigo-800 hover:from-slate-900 hover:to-indigo-900 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
                >
                  <span>Open on Live iGOT Portal</span>
                  <ExternalLink className="w-4 h-4 text-amber-300" />
                </a>

                <button
                  onClick={() => setEnrolledCourse(null)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
