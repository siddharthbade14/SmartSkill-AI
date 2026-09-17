import { useState, useEffect } from 'react';
import { api } from './services/api';
import type { User } from './types';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Navbar } from './components/common/Navbar';
import { AuthModal } from './components/common/AuthModal';
import { AIChatAssistant } from './components/common/AIChatAssistant';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LearnerDashboard } from './components/learner/LearnerDashboard';
import { ToastProvider, useToast } from './components/common/Toast';
import { ThemeProvider } from './components/common/ThemeProvider';
import { StatCounter } from './components/common/StatCounter';
import { EvaluatorTour } from './components/common/EvaluatorTour';
import { 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Award,
  Brain,
  ExternalLink,
  TrendingUp,
  Users,
  ClipboardCheck,
  GraduationCap,
  Zap,
  Rocket
} from 'lucide-react';

export function AppInner() {
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('hitl');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [chatAssistantOpen, setChatAssistantOpen] = useState<boolean>(false);
  const [evaluatorTourOpen, setEvaluatorTourOpen] = useState<boolean>(false);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  const isLoginRoute = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      path === '/login' ||
      path === '/signin' ||
      path.endsWith('/login') ||
      search.includes('auth=login') ||
      search.includes('login=true') ||
      hash === '#login'
    );
  };

  useEffect(() => {
    initAuth();

    // Check if evaluator tour is requested via URL
    if (typeof window !== 'undefined') {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (search.includes('tour') || hash.includes('tour')) {
        setEvaluatorTourOpen(true);
      }
    }

    // Listen for browser Back/Forward navigation
    const handlePopState = () => {
      if (isLoginRoute()) {
        setAuthModalOpen(true);
      } else {
        setAuthModalOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const initAuth = async () => {
    try {
      const directLoginRequested = isLoginRoute();
      const stored = api.getStoredUser();

      if (directLoginRequested) {
        // Direct link to login page requested: show login modal
        setAuthModalOpen(true);
        if (stored) {
          setCurrentUser(stored);
        }
      } else if (stored) {
        setCurrentUser(stored);
        setActiveTab(stored.role === 'admin' ? 'hitl' : 'assessments');
      } else {
        // Unauthenticated visitor: stay on official portal landing page
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Auth initialization issue:', err);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleOpenAuth = () => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.history.pushState({}, '', '/login');
    }
    setAuthModalOpen(true);
  };

  const handleCloseAuth = () => {
    if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/signin')) {
      window.history.pushState({}, '', '/');
    }
    setAuthModalOpen(false);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab(user.role === 'admin' ? 'hitl' : 'assessments');
    if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/signin')) {
      window.history.pushState({}, '', '/');
    }
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    api.clearAuth();
    setCurrentUser(null);
    setActiveTab('hitl');
    toast.info('Signed Out', 'You have been logged out of the portal session.');
  };

  const handleSwitchRole = async (targetRole: 'admin' | 'learner') => {
    try {
      if (targetRole === 'admin') {
        const auth = await api.login('admin@mospi.gov.in', 'Admin@123');
        setCurrentUser(auth.user);
        setActiveTab('hitl');
        toast.success('Switched to Admin Trainer', 'Welcome, Dr. Arvind Saxena (NSSTA MoSPI)');
      } else {
        const auth = await api.login('officer@mospi.gov.in', 'Learner@123');
        setCurrentUser(auth.user);
        setActiveTab('assessments');
        toast.success('Switched to Learner Officer', 'Welcome, Pooja Sharma (Field Operations)');
      }
    } catch (err) {
      toast.error('Role switch failed', String(err));
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
          onOpenAuth={handleOpenAuth}
          onStartTour={() => setEvaluatorTourOpen(true)}
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
              {/* Ambient glowing orb blobs */}
              <div className="hero-orb hero-orb-1 animate-orb-1" />
              <div className="hero-orb hero-orb-2 animate-orb-2" />
              <div className="hero-orb hero-orb-3 animate-orb-3" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/60 via-indigo-50/30 to-transparent pointer-events-none" />

              <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 text-center relative z-10">
                <div className="animate-bounce-in inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-bold tracking-wide mb-6 shadow-md border border-slate-700 animate-float">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>MoSPI Official Statistics • iGOT Karmayogi Micro-Learning</span>
                </div>

                <h1 className="animate-fade-up text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-5 sm:mb-6 max-w-4xl mx-auto leading-[1.15]">
                  AI-Orchestrated Competency Assurance for{' '}
                  <span className="animate-text-shimmer">Official Statistics</span>
                </h1>

                <p className="animate-fade-up-d1 text-sm sm:text-lg text-slate-600 max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal">
                  Ingests dense government manuals, extracts tabular matrices via OCR, generates grounded questions using Gemini Pro at temperature 0.0, and puts expert trainers in the loop before deploying to iGOT Karmayogi.
                </p>

                <div className="animate-fade-up-d2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto mb-14 sm:mb-16 px-1">
                  <button
                    onClick={() => setEvaluatorTourOpen(true)}
                    className="btn-primary px-5 sm:px-7 py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 border-2 border-amber-300 text-slate-950 text-sm sm:text-base font-black rounded-xl shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2.5 sm:gap-3 active:scale-95 animate-subtle-pulse cursor-pointer"
                  >
                    <Rocket className="w-5 h-5 text-slate-950 shrink-0" />
                    <span>Start Evaluator Tour (3-Min Walkthrough)</span>
                  </button>

                  <button
                    onClick={() => handleSwitchRole('admin')}
                    className="btn-primary px-5 sm:px-7 py-3.5 sm:py-4 bg-[#0B2545] hover:bg-slate-900 border border-slate-800 text-white text-sm sm:text-base font-bold rounded-xl shadow-md flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer active:scale-95"
                  >
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>Admin Trainer (HITL)</span>
                  </button>

                  <button
                    onClick={() => handleSwitchRole('learner')}
                    className="btn-primary px-5 sm:px-7 py-3.5 sm:py-4 bg-[#0F766E] hover:bg-teal-800 border border-teal-800 text-white text-sm sm:text-base font-bold rounded-xl shadow-md flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer active:scale-95"
                  >
                    <BookOpen className="w-5 h-5 text-emerald-300 shrink-0" />
                    <span>Learner Officer (iGOT)</span>
                  </button>
                </div>

                {/* Modern 4 Pillars Grid */}
                <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left mb-16">
                  <div className="feature-card animate-fade-up card-glow-blue bg-gradient-to-br from-white to-blue-50/60 p-6 rounded-2xl border border-blue-200/80">
                    <div className="feature-icon w-12 h-12 rounded-xl bg-blue-100/80 border border-blue-300 text-blue-900 flex items-center justify-center mb-4">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2 font-sans">OCR & Tabular Ingestion</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      Extracts prose narrative and statistical matrices from complex government publications without loss of context.
                    </p>
                  </div>

                  <div className="feature-card animate-fade-up card-glow-amber bg-gradient-to-br from-white to-amber-50/60 p-6 rounded-2xl border border-amber-200/80">
                    <div className="feature-icon w-12 h-12 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 flex items-center justify-center mb-4">
                      <Brain className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2 font-sans">Zero-Hallucination AI</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      Leverages Gemini Pro at temperature 0.0 with strict Pydantic schemas to produce fully grounded MCQs citing page sources.
                    </p>
                  </div>

                  <div className="feature-card animate-fade-up card-glow-purple bg-gradient-to-br from-white to-purple-50/60 p-6 rounded-2xl border border-purple-200/80">
                    <div className="feature-icon w-12 h-12 rounded-xl bg-purple-100/80 border border-purple-300 text-purple-900 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2 font-sans">Admin HITL Verification</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      Empowers trainers to modify, approve, or reject AI questions before pushing to the published question bank.
                    </p>
                  </div>

                  <div className="feature-card animate-fade-up card-glow-green bg-gradient-to-br from-white to-emerald-50/60 p-6 rounded-2xl border border-emerald-200/80">
                    <div className="feature-icon w-12 h-12 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 flex items-center justify-center mb-4">
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

                  <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="pipeline-card p-5 rounded-xl bg-sky-50/70 border border-sky-200/90">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <span className="pipeline-step-num w-6 h-6 rounded-lg bg-[#0B2545] text-white flex items-center justify-center text-xs font-black shadow-md">
                          1
                        </span>
                        <span className="text-sm font-bold text-slate-900">Doc Ingestion</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        PDF manuals uploaded to NSSTA secure vault; OCR extracts prose narrative and statistical tables.
                      </p>
                    </div>

                    <div className="pipeline-card p-5 rounded-xl bg-indigo-50/70 border border-indigo-200/90">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <span className="pipeline-step-num w-6 h-6 rounded-lg bg-[#0B2545] text-white flex items-center justify-center text-xs font-black shadow-md">
                          2
                        </span>
                        <span className="text-sm font-bold text-slate-900">Gemini Pro AI</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        Deterministic MCQ generation (temp 0.0) with strict source citation binding to prevent hallucinations.
                      </p>
                    </div>

                    <div className="pipeline-card p-5 rounded-xl bg-amber-50/70 border border-amber-200/90">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <span className="pipeline-step-num w-6 h-6 rounded-lg bg-[#0B2545] text-white flex items-center justify-center text-xs font-black shadow-md">
                          3
                        </span>
                        <span className="text-sm font-bold text-slate-900">HITL Review</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        Domain experts audit, edit, approve, or reject questions prior to publication in the official bank.
                      </p>
                    </div>

                    <div className="pipeline-card p-5 rounded-xl bg-emerald-50/70 border border-emerald-200/90">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <span className="pipeline-step-num w-6 h-6 rounded-lg bg-[#0B2545] text-white flex items-center justify-center text-xs font-black shadow-md">
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

                {/* ── ANIMATED STAT COUNTERS ── */}
                <div className="stat-section rounded-3xl border border-slate-200/80 p-8 mb-8 shadow-md">
                  <div className="text-center mb-6">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Live Platform Statistics</span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">SmartSkill AI — By the Numbers</h2>
                  </div>
                  <div className="stagger-children grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <StatCounter end={1247} suffix="+" label="Questions Generated" sublabel="AI-curated MCQs" icon={<Brain className="w-7 h-7" />} color="blue" />
                    <StatCounter end={94} suffix="%" label="Approval Rate" sublabel="Expert HITL verified" icon={<ClipboardCheck className="w-7 h-7" />} color="emerald" />
                    <StatCounter end={312} suffix="+" label="Officers Trained" sublabel="Civil services" icon={<Users className="w-7 h-7" />} color="amber" />
                    <StatCounter end={3} suffix=" Ministries" label="Onboarded" sublabel="MoSPI · NSSTA · iGOT" icon={<GraduationCap className="w-7 h-7" />} color="purple" />
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

        {/* ── ENHANCED FOOTER ── */}
        <footer className="bg-white border-t border-slate-200/80 mt-auto">
          {/* Top footer strip */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-black text-slate-900 tracking-tight">SmartSkill<span className="text-blue-600">AI</span></span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">MoSPI</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                  AI-orchestrated capacity building for civil services and official statistics. Built for iGOT Karmayogi competency framework.
                </p>
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <span className="sih-badge">
                    <Zap className="w-3 h-3" />
                    Smart India Hackathon 2026
                  </span>
                </div>
              </div>

              {/* Links */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Quick Links</p>
                <div className="space-y-2">
                  {[
                    { label: 'iGOT Karmayogi Portal', href: 'https://igotkarmayogi.gov.in' },
                    { label: 'MoSPI Official', href: 'https://mospi.gov.in' },
                    { label: 'NSSTA', href: 'https://mospi.gov.in/nssta' },
                    { label: 'GitHub Repository', href: 'https://github.com/siddharthbade14/SmartSkill-AI' },
                  ].map(link => (
                    <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-700 link-underline transition group">
                      <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Technology Stack</p>
                <div className="flex flex-wrap gap-2">
                  {['React 18', 'FastAPI', 'Gemini Pro', 'Python', 'Vercel', 'iGOT API'].map(tech => (
                    <span key={tech} className="badge-hover px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-100 px-4 py-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 font-medium">
              <span>© 2026 SmartSkill AI · National Statistical Systems Training Academy (NSSTA) · MoSPI · iGOT Karmayogi</span>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 font-bold">System Operational</span>
              </div>
            </div>
          </div>
        </footer>

        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={handleCloseAuth}
          onSuccess={handleAuthSuccess}
        />

        {/* Floating MoSPI AI Chatbot Assistant (Gemini 3.8 Flash) */}
        <AIChatAssistant
          user={currentUser}
          isOpen={chatAssistantOpen}
          onClose={() => setChatAssistantOpen(false)}
          onOpen={() => setChatAssistantOpen(true)}
        />

        {/* Interactive 3-Minute Evaluator Walkthrough Tour */}
        <EvaluatorTour
          isOpen={evaluatorTourOpen}
          onClose={() => setEvaluatorTourOpen(false)}
          onSwitchRole={handleSwitchRole}
          setActiveTab={setActiveTab}
          onOpenChat={() => setChatAssistantOpen(true)}
        />
      </div>
    </ErrorBoundary>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
