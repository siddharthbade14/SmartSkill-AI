import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  FileText, 
  Brain, 
  ShieldCheck, 
  ClipboardCheck, 
  Award, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  Layers,
  ArrowRight
} from 'lucide-react';

export interface EvaluatorTourProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchRole: (role: 'admin' | 'learner') => void;
  setActiveTab: (tab: string) => void;
  onOpenChat: () => void;
}

interface TourStep {
  stepNumber: number;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
  description: string;
  technicalHighlights: string[];
  roleAction?: 'admin' | 'learner';
  tabAction?: string;
  chatAction?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    stepNumber: 1,
    badge: 'SIH 2024 · Problem Statement Showcase',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    title: 'Welcome Evaluator & Hackathon Judges!',
    subtitle: 'End-to-End Civil Service Micro-Learning & Competency Assurance',
    icon: Rocket,
    description: 
      'SmartSkill AI transforms dense government publications (CPI, WPI, PLFS, NAS) into deterministic, psychometrically sound micro-learning quizzes with Human-in-the-Loop (HITL) quality gates and automatic iGOT Karmayogi remediation.',
    technicalHighlights: [
      'Dual Role Architecture: Senior Admin Trainer (NSSTA) & Field Learner Officer (FOD)',
      'Deterministic AI Question Generator powered by Google Gemini 3.8 Flash (Temp 0.0)',
      'Mandatory Source Citations binding every question to publication page numbers',
      'Automated Competency Diagnostic Mapping directly to iGOT Karmayogi course modules'
    ]
  },
  {
    stepNumber: 2,
    badge: 'Stage 1: Document Processing Pipeline',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    title: 'OCR Ingestion of Dense Government Manuals',
    subtitle: 'Extracting prose and statistical matrices without context loss',
    icon: FileText,
    description: 
      'Official statistical manuals contain intricate formulas, definitions, and dense tabular matrices. Our ingestion engine extracts both narrative text and tabular structures while maintaining hierarchical context.',
    technicalHighlights: [
      'Automated extraction of tables and prose sections from multi-page PDFs',
      'Preserves row-column relationships essential for statistical calculation questions',
      'Sample Ingested Document: MoSPI Consumer Price Index (CPI) Manual 2024',
      'Real-time document status & metadata tracking in the Document Registry'
    ],
    roleAction: 'admin',
    tabAction: 'documents'
  },
  {
    stepNumber: 3,
    badge: 'Stage 2: Gemini 3.8 Flash Engine',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    title: 'Zero-Hallucination Question Synthesis',
    subtitle: 'Enforcing temperature 0.0 with strict Pydantic JSON schemas',
    icon: Brain,
    description: 
      'Government training requires factual precision. By enforcing temperature 0.0 and structured output schemas, questions are strictly grounded in the publication. The AI is structurally prevented from inventing facts.',
    technicalHighlights: [
      'Enforced Gemini temperature 0.0 prevents generative drift and hallucinations',
      'Generates 4 high-discrimination MCQ options with plausible statistical distractors',
      'Mandatory citation binding: Every item explicitly cites the source page and table',
      'Generates educational rationale explaining both correct and incorrect choices'
    ],
    roleAction: 'admin',
    tabAction: 'hitl'
  },
  {
    stepNumber: 4,
    badge: 'Stage 3: NSSTA Quality Gate',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    title: 'Admin Trainer Human-in-the-Loop (HITL) Audit',
    subtitle: 'Domain experts curate, edit, and approve before publication',
    icon: ShieldCheck,
    description: 
      'No AI-generated question is ever published directly to learners. Senior trainers from NSSTA audit each item in a dedicated queue, modify wording, add reviewer notes, or reject subpar items.',
    technicalHighlights: [
      'Interactive HITL Curation Queue with single-click Approve / Reject / Edit',
      'Inline question and explanation editing with instant preview',
      'Reviewer pedagogical audit notes logged per question item',
      'Bulk approval & Quiz Publishing workflow to release vetted items to trainees'
    ],
    roleAction: 'admin',
    tabAction: 'hitl'
  },
  {
    stepNumber: 5,
    badge: 'Stage 4: Officer Competency Testing',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    title: 'Learner Assessment & Instant Diagnostics',
    subtitle: 'Real-time psychometric evaluation with source grounding',
    icon: ClipboardCheck,
    description: 
      'Learner officers (e.g. Pooja Sharma, Junior Statistical Officer) take interactive assessments with real-time feedback, showing the authoritative MoSPI page citation and reasoning for every answer.',
    technicalHighlights: [
      'Interactive micro-learning interface with difficulty ratings (Basic to Advanced)',
      'Immediate answer validation with grounded source manual page citations',
      'Dynamic score tallying and performance percentage calculation',
      'Sub-competency diagnostic tracking (e.g. CPI Weightage, Laspeyres Index, FOD Sampling)'
    ],
    roleAction: 'learner',
    tabAction: 'assessments'
  },
  {
    stepNumber: 6,
    badge: 'Stage 5: Capacity Building & Remediation',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    title: 'Direct iGOT Karmayogi Course Remediation',
    subtitle: 'Closing diagnostic gaps with official civil service curriculum',
    icon: Award,
    description: 
      'The core hackathon deliverable: When an officer answers incorrectly, SmartSkill AI detects the specific competency gap and dynamically surfaces direct, clickable course recommendations on iGOT Karmayogi.',
    technicalHighlights: [
      'Automated competency gap tagging tied directly to Mission Karmayogi taxonomy',
      'Surfaces targeted course modules (e.g. MoSPI Official Statistics, Index Theory)',
      'Clickable external links dispatching officers to igotkarmayogi.gov.in',
      'Empowers continuous on-the-job professional development for government personnel'
    ],
    roleAction: 'learner',
    tabAction: 'assessments'
  },
  {
    stepNumber: 7,
    badge: '24/7 Technical Support & Exploration',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    title: 'Embedded MoSPI AI Assistant & Freely Explore',
    subtitle: 'Gemini 3.8 Flash answers official statistical methodology questions',
    icon: Sparkles,
    description: 
      'You are all set! Evaluators can now test the live platform freely: inspect the HITL question queue, switch between Admin and Learner roles, ask the floating AI chatbot statistical queries, or toggle Dark Mode.',
    technicalHighlights: [
      'Pre-configured starter prompts: CPI vs WPI, Ingestion Pipeline, HITL Quality',
      'One-click demo logins & Google SSO authentication enabled',
      'Persistent dark mode with obsidian glassmorphism theme',
      'Direct linkable login route: /login for easy bookmarking and testing'
    ],
    chatAction: true
  }
];

export const EvaluatorTour: React.FC<EvaluatorTourProps> = ({
  isOpen,
  onClose,
  onSwitchRole,
  setActiveTab,
  onOpenChat,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    // Apply action for current step
    const currentStep = TOUR_STEPS[currentStepIndex];
    if (currentStep.roleAction) {
      onSwitchRole(currentStep.roleAction);
    }
    if (currentStep.tabAction) {
      setActiveTab(currentStep.tabAction);
    }
    if (currentStep.chatAction) {
      onOpenChat();
    }
  }, [currentStepIndex, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const IconComponent = currentStep.icon;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-gradient-to-br from-[#0B132B] via-[#0F172A] to-[#1E293B] border border-blue-500/40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-white my-auto">
        
        {/* National Emblem & Top Accent Strip */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-[#134E4A] to-blue-500 shrink-0" />

        {/* Ambient Top Glow Blob */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-32 bg-blue-500/20 blur-3xl pointer-events-none" />

        {/* Header - Fixed at top of modal */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-700/60 shrink-0 flex items-start justify-between gap-3 bg-[#0B132B]/90">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-600/30 border border-blue-400/40 flex items-center justify-center text-amber-300 shadow-md shrink-0">
              <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border uppercase tracking-wider ${currentStep.badgeColor} truncate`}>
                <Sparkles className="w-3 h-3 shrink-0" />
                <span className="truncate">{currentStep.badge}</span>
              </span>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                Stage {currentStep.stepNumber} of {TOUR_STEPS.length} · Live Demonstration
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-300 hover:text-white transition shadow-xs shrink-0"
            aria-label="Close tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-4">
          {/* Titles */}
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              {currentStep.title}
            </h2>
            <p className="text-xs sm:text-sm text-blue-200/90 font-medium mt-0.5">
              {currentStep.subtitle}
            </p>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-white/5 p-3 sm:p-3.5 rounded-xl border border-white/10">
            {currentStep.description}
          </p>

          {/* Technical Highlights / Proof Points */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Architectural Specifications & Evaluation Criteria:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentStep.technicalHighlights.map((point, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/60 text-xs text-slate-200"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls (Sticky at bottom) */}
        <div className="p-3.5 sm:p-5 border-t border-slate-700/60 shrink-0 bg-[#070D18]/95">
          {/* Progress Indicators (Interactive Dots) */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-3">
            {TOUR_STEPS.map((step, idx) => (
              <button
                key={step.stepNumber}
                onClick={() => setCurrentStepIndex(idx)}
                title={`Jump to ${step.title}`}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  idx === currentStepIndex 
                    ? 'w-6 sm:w-8 bg-amber-400 shadow-md shadow-amber-500/40' 
                    : idx < currentStepIndex 
                      ? 'w-1.5 sm:w-2 bg-blue-500' 
                      : 'w-1.5 sm:w-2 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 font-semibold transition px-2 py-1"
            >
              Exit Tour
            </button>

            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  onClick={handlePrev}
                  className="inline-flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition shadow-xs active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Previous</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-600/30 border border-blue-400/40 transition active:scale-95 cursor-pointer"
              >
                <span>{isLastStep ? 'Explore Live System 🎉' : 'Next Stage'}</span>
                {isLastStep ? <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
