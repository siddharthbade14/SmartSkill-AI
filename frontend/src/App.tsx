import { useState, useEffect } from 'react';
import { api } from './services/api';
import type { User } from './types';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Navbar } from './components/common/Navbar';
import { AuthModal } from './components/common/AuthModal';
import { AIChatAssistant } from './components/common/AIChatAssistant';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LearnerDashboard } from './components/learner/LearnerDashboard';
import { 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Award,
  Brain
} from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('hitl');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [chatAssistantOpen, setChatAssistantOpen] = useState<boolean>(false);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const stored = api.getStoredUser();
      if (stored) {
        setCurrentUser(stored);
        setActiveTab(stored.role === 'admin' ? 'hitl' : 'assessments');
      } else {
        // Automatically sign in as default Admin Trainer for immediate zero-friction evaluation
        try {
          const auth = await api.login('admin@mospi.gov.in', 'Admin@123');
          setCurrentUser(auth.user);
          setActiveTab('hitl');
        } catch {
          // If backend is not seeded yet, leave as unauthenticated landing
        }
      }
    } catch (err) {
      console.error('Auth initialization issue:', err);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleLogout = () => {
    api.clearAuth();
    setCurrentUser(null);
    setActiveTab('hitl');
  };

  const handleSwitchRole = async (targetRole: 'admin' | 'learner') => {
    try {
      if (targetRole === 'admin') {
        const auth = await api.login('admin@mospi.gov.in', 'Admin@123');
        setCurrentUser(auth.user);
        setActiveTab('hitl');
      } else {
        const auth = await api.login('officer@mospi.gov.in', 'Learner@123');
        setCurrentUser(auth.user);
        setActiveTab('assessments');
      }
    } catch (err) {
      alert('Role switch failed: ' + err);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
        {/* Navigation Bar */}
        <Navbar
          user={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchRole}
          onOpenAuth={() => setAuthModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1">
          {loadingUser ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm font-semibold text-slate-700">Initializing SmartSkill AI Portal...</p>
              </div>
            </div>
          ) : !currentUser ? (
            /* Unauthenticated Landing Hero */
            <div className="relative overflow-hidden">
              {/* Subtle ambient light gradient in background */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/60 via-indigo-50/30 to-transparent pointer-events-none" />

              <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-bold tracking-wide mb-6 shadow-md border border-slate-700">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>MoSPI Official Statistics • iGOT Karmayogi Micro-Learning</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-6 max-w-4xl mx-auto leading-[1.15]">
                  AI-Orchestrated Competency Assurance for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0B2545] via-blue-800 to-teal-700">Official Statistics</span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
                  Ingests dense government manuals, extracts tabular matrices via OCR, generates grounded questions using Gemini Pro at temperature 0.0, and puts expert trainers in the loop before deploying to iGOT Karmayogi.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
                  <button
                    onClick={() => handleSwitchRole('admin')}
                    className="btn-primary px-7 py-4 bg-[#0B2545] hover:bg-slate-900 border border-slate-800 text-white text-sm sm:text-base font-bold rounded-xl shadow-md flex items-center gap-3"
                  >
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    Enter as Admin Trainer (HITL Curation)
                  </button>

                  <button
                    onClick={() => handleSwitchRole('learner')}
                    className="btn-primary px-7 py-4 bg-[#0F766E] hover:bg-teal-800 border border-teal-800 text-white text-sm sm:text-base font-bold rounded-xl shadow-md flex items-center gap-3"
                  >
                    <BookOpen className="w-5 h-5 text-emerald-300" />
                    Enter as Learner Officer (Assessment & iGOT)
                  </button>
                </div>

                {/* Modern 4 Pillars Grid with Distinct Subtle Background Tints */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left mb-16">
                  <div className="feature-card card-glow-blue bg-gradient-to-br from-white to-blue-50/60 p-6 rounded-2xl border border-blue-200/80 shadow-xs">
                    <div className="feature-icon w-12 h-12 rounded-xl bg-blue-100/80 border border-blue-300 text-blue-900 flex items-center justify-center mb-4 shadow-2xs">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2 font-sans">OCR & Tabular Ingestion</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      Extracts prose narrative and statistical matrices from complex government publications without loss of context.
                    </p>
                  </div>

                  <div className="feature-card card-glow-amber bg-gradient-to-br from-white to-amber-50/60 p-6 rounded-2xl border border-amber-200/80 shadow-xs">
                    <div className="feature-icon w-12 h-12 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 flex items-center justify-center mb-4 shadow-2xs">
                      <Brain className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2 font-sans">Zero-Hallucination AI</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      Leverages Gemini Pro at temperature 0.0 with strict Pydantic schemas to produce fully grounded MCQs citing page sources.
                    </p>
                  </div>

                  <div className="feature-card card-glow-purple bg-gradient-to-br from-white to-purple-50/60 p-6 rounded-2xl border border-purple-200/80 shadow-xs">
                    <div className="feature-icon w-12 h-12 rounded-xl bg-purple-100/80 border border-purple-300 text-purple-900 flex items-center justify-center mb-4 shadow-2xs">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2 font-sans">Admin HITL Verification</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      Empowers trainers to modify, approve, or reject AI questions before pushing to the published question bank.
                    </p>
                  </div>

                  <div className="feature-card card-glow-green bg-gradient-to-br from-white to-emerald-50/60 p-6 rounded-2xl border border-emerald-200/80 shadow-xs">
                    <div className="feature-icon w-12 h-12 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 flex items-center justify-center mb-4 shadow-2xs">
                      <Award className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2 font-sans">iGOT Remediation Engine</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      Pinpoints granular competency gaps and directly connects civil service officers to relevant iGOT Karmayogi modules.
                    </p>
                  </div>
                </div>

                {/* Systematic Pipeline Lifecycle Strip with Minimal Colored Background Separation */}
                <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm text-left">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1">
                        Operational Architecture
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        The 4-Stage Capacity Building Pipeline
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs">
                      GovTech End-to-End
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="pipeline-card p-5 rounded-xl bg-sky-50/70 border border-sky-200/90 shadow-2xs">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <span className="w-6 h-6 rounded-lg bg-[#0B2545] text-white flex items-center justify-center text-xs font-black shadow-2xs">
                          1
                        </span>
                        <span className="text-sm font-bold text-slate-900">Doc Ingestion</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        PDF manuals uploaded to NSSTA secure vault; OCR extracts prose narrative and statistical tables.
                      </p>
                    </div>

                    <div className="pipeline-card p-5 rounded-xl bg-indigo-50/70 border border-indigo-200/90 shadow-2xs">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <span className="w-6 h-6 rounded-lg bg-[#0B2545] text-white flex items-center justify-center text-xs font-black shadow-2xs">
                          2
                        </span>
                        <span className="text-sm font-bold text-slate-900">Gemini Pro AI</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        Deterministic MCQ generation (temp 0.0) with strict source citation binding to prevent hallucinations.
                      </p>
                    </div>

                    <div className="pipeline-card p-5 rounded-xl bg-amber-50/70 border border-amber-200/90 shadow-2xs">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <span className="w-6 h-6 rounded-lg bg-[#0B2545] text-white flex items-center justify-center text-xs font-black shadow-2xs">
                          3
                        </span>
                        <span className="text-sm font-bold text-slate-900">HITL Review</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        Domain experts audit, edit, approve, or reject questions prior to publication in the official bank.
                      </p>
                    </div>

                    <div className="pipeline-card p-5 rounded-xl bg-emerald-50/70 border border-emerald-200/90 shadow-2xs">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <span className="w-6 h-6 rounded-lg bg-[#0B2545] text-white flex items-center justify-center text-xs font-black shadow-2xs">
                          4
                        </span>
                        <span className="text-sm font-bold text-slate-900">iGOT Remediation</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        Officers test skills; gaps auto-link to targeted Karmayogi civil service courses for targeted remediation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : currentUser.role === 'admin' ? (
            activeTab === 'learner-view' ? (
              <LearnerDashboard initialTab="assessments" />
            ) : (
              <AdminDashboard initialTab={activeTab} />
            )
          ) : (
            <LearnerDashboard initialTab={activeTab} />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/80 py-6 px-4 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800 tracking-tight">SmartSkill AI</span>
              <span className="text-slate-300">•</span>
              <span>Capacity Building for Civil Services & Official Statistics</span>
            </div>
            <div className="text-slate-400 text-[11px] font-medium">
              National Statistical Systems Training Academy (NSSTA) • MoSPI • iGOT Karmayogi
            </div>
          </div>
        </footer>

        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setActiveTab(user.role === 'admin' ? 'hitl' : 'assessments');
          }}
        />

        {/* Floating MoSPI AI Chatbot Assistant (Gemini 3.8 Flash) */}
        <AIChatAssistant
          user={currentUser}
          isOpen={chatAssistantOpen}
          onClose={() => setChatAssistantOpen(false)}
          onOpen={() => setChatAssistantOpen(true)}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
