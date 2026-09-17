import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { api } from '../../services/api';
import { SmartSkillLogo } from './SmartSkillLogo';
import { 
  LogOut, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Award,
  Layers,
  ArrowRightLeft,
  Sparkles,
  Menu,
  X,
  PanelLeftClose,
  ChevronRight,
  ShieldCheck,
  Building2,
  HelpCircle,
  Mail,
  Copy,
  Check,
  Send,
  ExternalLink,
  MessageSquare,
  FileQuestion,
  LifeBuoy,
  Loader2,
  KeyRound
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onSwitchRole: (role: 'admin' | 'learner') => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onSwitchRole,
  onOpenAuth,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  
  // Support Query Form State
  const [queryCategory, setQueryCategory] = useState('General Inquiries & Portal Access');
  const [querySubject, setQuerySubject] = useState('');
  const [queryMessage, setQueryMessage] = useState('');
  const [senderName, setSenderName] = useState(user?.full_name || '');
  const [senderEmail, setSenderEmail] = useState(user?.email || '');
  const [isSubmittingQuery, setIsSubmittingQuery] = useState(false);
  const [querySuccessMessage, setQuerySuccessMessage] = useState<string | null>(null);
  const [queryErrorMessage, setQueryErrorMessage] = useState<string | null>(null);

  // Update prefilled info when user changes
  useEffect(() => {
    if (user) {
      if (!senderName) setSenderName(user.full_name);
      if (!senderEmail) setSenderEmail(user.email);
    }
  }, [user]);

  // Close drawer or help modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isHelpModalOpen) {
          setIsHelpModalOpen(false);
        } else if (isDrawerOpen) {
          setIsDrawerOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, isHelpModalOpen]);

  // Copy email to clipboard helper
  const copySupportEmail = () => {
    navigator.clipboard.writeText('smartskillai3@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // Submit query directly to backend API and dispatch to smartskillai3@gmail.com
  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryMessage.trim()) return;

    setIsSubmittingQuery(true);
    setQuerySuccessMessage(null);
    setQueryErrorMessage(null);

    const emailToUse = senderEmail.trim() || user?.email || 'visitor@mospi.gov.in';
    const nameToUse = senderName.trim() || user?.full_name || 'Portal User';

    try {
      // 1. Post to backend API
      const result = await api.sendSupportQuery({
        name: nameToUse,
        email: emailToUse,
        category: queryCategory,
        subject: querySubject.trim() || `${queryCategory} Assistance`,
        message: queryMessage.trim(),
        role: user?.role === 'admin' ? 'Senior Trainer (Admin)' : user?.role === 'learner' ? 'Statistical Officer (Learner)' : 'Portal Visitor',
        department: user?.department || 'MoSPI'
      });

      setQuerySuccessMessage(
        result.message || 'Your query has been submitted directly to smartskillai3@gmail.com. Our team has received your message and will reply to your email.'
      );

      // Form is submitted silently and cleanly via API without launching Outlook
      setQuerySubject('');
      setQueryMessage('');
    } catch (err: any) {
      console.error('Support query error:', err);
      setQueryErrorMessage(
        'Could not submit via API. Please check connection or email us directly at smartskillai3@gmail.com.'
      );
    } finally {
      setIsSubmittingQuery(false);
    }
  };

  const handleNavClick = (tabKey: string) => {
    setActiveTab(tabKey);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MINIMAL TOP HEADER (NO HORIZONTAL NAV - SITE NAME, LOGO & ESSENTIALS)  */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 navbar-highlight text-white transition-all duration-200">
        {/* Tricolor National Identity Strip */}
        <div className="tricolor-accent w-full" />

        {/* Top Ministry Status Bar */}
        <div className="bg-[#040E1B] text-slate-300 px-4 sm:px-8 py-1.5 text-xs flex justify-between items-center tracking-wide font-medium border-b border-blue-950/70">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse border border-emerald-300"></span>
              <span className="font-bold text-white tracking-normal text-[11px] sm:text-xs">भारत सरकार | Government of India</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden md:inline font-normal text-xs">
              सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय (MoSPI)
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button 
              onClick={() => setIsHelpModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/30 text-blue-200 text-xs font-medium transition cursor-pointer"
              title="Open Support Query Form (smartskillai3@gmail.com)"
            >
              <Mail className="w-3 h-3 text-blue-300" />
              <span className="hidden sm:inline">Queries:</span>
              <span className="font-mono">smartskillai3@gmail.com</span>
            </button>

            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>iGOT Accredited</span>
            </span>
          </div>
        </div>

        {/* Essential Header Bar (Clean: Menu Toggle + Logo/Brand on Left, Essentials on Right) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-17 gap-4">
            
            {/* LEFT SIDE: UPPER MENU TOGGLE + MATCHING LOGO & SITE NAME */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Upper Menu Button to Toggle Vertical Drawer */}
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl border text-sm font-bold shadow-md transition-all duration-150 active:scale-95 ${
                  isDrawerOpen
                    ? 'bg-blue-600 text-white border-blue-400/60 shadow-blue-900/40 ring-2 ring-blue-400/30'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30'
                }`}
                title={isDrawerOpen ? 'Hide Navigation Menu' : 'Open Navigation Menu'}
                aria-label={isDrawerOpen ? 'Hide Navigation Menu' : 'Open Navigation Menu'}
              >
                {isDrawerOpen ? (
                  <PanelLeftClose className="w-5 h-5 text-amber-400" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
                )}
                <span className="font-bold tracking-tight text-xs sm:text-sm">
                  {isDrawerOpen ? 'Hide Menu' : 'Menu'}
                </span>
              </button>

              {/* Matching Brand Logo & Site Name */}
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => user && setActiveTab(user.role === 'admin' ? 'hitl' : 'assessments')}
                title="SmartSkill AI Home"
              >
                {/* Official Vector Logo */}
                <SmartSkillLogo size="md" />
                
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl font-black text-white tracking-tight font-sans">
                      SmartSkill<span className="text-amber-400">AI</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase bg-blue-500/25 text-blue-200 border border-blue-400/30">
                      MoSPI
                    </span>
                  </div>
                  <span className="text-xs text-slate-300 font-medium tracking-tight hidden sm:block">
                    Official Statistics Micro-Learning & Competency Engine
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: ESSENTIAL CONTROLS ONLY (HELP & SUPPORT, ROLE SWITCHER, PROFILE) */}
            <div className="flex items-center gap-2.5 sm:gap-3">

              {/* Help & Support Button */}
              <button
                onClick={() => setIsHelpModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-200 hover:text-white text-xs sm:text-sm font-bold shadow-xs transition backdrop-blur-xs cursor-pointer"
                title="Help & Support (Queries to smartskillai3@gmail.com)"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Help & Support</span>
              </button>

              {user ? (
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {/* Quick Role Switcher Button */}
                  <button
                    onClick={() => onSwitchRole(user.role === 'admin' ? 'learner' : 'admin')}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs sm:text-sm font-bold text-white shadow-xs transition backdrop-blur-xs"
                    title={`Logged in as ${user.role}. Click to switch role.`}
                  >
                    <span className="w-5 h-5 rounded-lg bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-blue-200">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </span>
                    <span className="hidden xl:inline">
                      {user.role === 'admin' ? 'Switch to Learner' : 'Switch to Admin'}
                    </span>
                  </button>

                  {/* User Profile Avatar Pill */}
                  <div className="flex items-center gap-2 pl-2.5 border-l border-blue-900/80">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-xs border ${
                      user.role === 'admin' 
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-400/40' 
                        : 'bg-gradient-to-br from-teal-600 to-emerald-700 border-teal-400/40'
                    }`}>
                      {user.full_name.charAt(0)}
                    </div>

                    <div className="hidden 2xl:block text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white leading-tight truncate max-w-[120px]">
                          {user.full_name.split(' ')[0]} {user.full_name.split(' ')[1] || ''}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                          user.role === 'admin'
                            ? 'bg-blue-500/20 text-blue-200 border-blue-400/40'
                            : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                        }`}>
                          {user.role === 'admin' ? 'Trainer' : 'Officer'}
                        </span>
                      </div>
                    </div>

                    {/* Sign Out Button */}
                    <button
                      onClick={onLogout}
                      title="Sign Out"
                      className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-red-500/25 border border-white/15 hover:border-red-400/40 rounded-xl transition shadow-xs"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="px-4 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-md border border-blue-400/40 active:scale-95"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BACKDROP OVERLAY                                                       */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 transition-opacity duration-300"
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ========================================================================= */}
      {/* 3. VERTICAL NAVIGATION DRAWER (LEFT SIDE)                                 */}
      {/* ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 sm:w-88 drawer-highlight flex flex-col transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar Navigation Drawer"
      >
        {/* Tricolor National Accent at Top of Drawer */}
        <div className="tricolor-accent w-full" />

        {/* Drawer Header with Matching Logo & Hide Button */}
        <div className="p-5 border-b border-blue-900/70 flex items-center justify-between gap-3 bg-[#040E1B]/80">
          <div className="flex items-center gap-3">
            <SmartSkillLogo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white tracking-tight">
                  SmartSkill<span className="text-amber-400">AI</span>
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-blue-500/25 text-blue-200 border border-blue-400/30">
                  MoSPI
                </span>
              </div>
              <span className="text-xs text-slate-300 font-medium">
                National Statistics Academy
              </span>
            </div>
          </div>

          {/* Button to Hide Navigation Drawer */}
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition shadow-xs flex items-center gap-1 text-xs font-bold"
            title="Hide Navigation Drawer"
            aria-label="Hide Navigation Drawer"
          >
            <PanelLeftClose className="w-5 h-5 text-amber-400" />
            <span className="hidden sm:inline">Hide</span>
          </button>
        </div>

        {/* Ministry Information Banner */}
        <div className="px-5 py-3 bg-blue-950/40 border-b border-blue-900/50 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
            <Building2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="truncate">Ministry of Statistics & PI (MoSPI)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-amber-300/90 font-medium">
            <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span>iGOT Karmayogi Competency Framework</span>
          </div>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
          {/* Main Navigation Items */}
          <div>
            <div className="px-3 mb-3 text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Main Navigation</span>
              {user && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {user.role === 'admin' ? 'Admin / Trainer' : 'Learner / Officer'}
                </span>
              )}
            </div>

            {user ? (
              <div className="space-y-2">
                {user.role === 'admin' ? (
                  <>
                    {/* HITL Review Queue */}
                    <button
                      onClick={() => handleNavClick('hitl')}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left font-bold transition-all duration-150 border ${
                        activeTab === 'hitl'
                          ? 'bg-blue-600 text-white shadow-lg border-blue-400/50 ring-2 ring-blue-400/20'
                          : 'text-slate-200 hover:text-white hover:bg-white/10 border-transparent hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shadow-2xs ${
                          activeTab === 'hitl'
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'bg-amber-400/15 border-amber-400/30 text-amber-300'
                        }`}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold leading-tight">HITL Review Queue</div>
                          <div className={`text-xs font-normal ${activeTab === 'hitl' ? 'text-blue-100' : 'text-slate-400'}`}>
                            Validate & curate generated MCQs
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${activeTab === 'hitl' ? 'text-white' : 'text-slate-500'}`} />
                    </button>

                    {/* Manual Ingestion */}
                    <button
                      onClick={() => handleNavClick('documents')}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left font-bold transition-all duration-150 border ${
                        activeTab === 'documents'
                          ? 'bg-blue-600 text-white shadow-lg border-blue-400/50 ring-2 ring-blue-400/20'
                          : 'text-slate-200 hover:text-white hover:bg-white/10 border-transparent hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shadow-2xs ${
                          activeTab === 'documents'
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'bg-teal-400/15 border-teal-400/30 text-teal-300'
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold leading-tight">Manual Ingestion</div>
                          <div className={`text-xs font-normal ${activeTab === 'documents' ? 'text-blue-100' : 'text-slate-400'}`}>
                            Upload government manuals & OCR
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${activeTab === 'documents' ? 'text-white' : 'text-slate-500'}`} />
                    </button>

                    {/* Quiz Bank */}
                    <button
                      onClick={() => handleNavClick('quizzes')}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left font-bold transition-all duration-150 border ${
                        activeTab === 'quizzes'
                          ? 'bg-blue-600 text-white shadow-lg border-blue-400/50 ring-2 ring-blue-400/20'
                          : 'text-slate-200 hover:text-white hover:bg-white/10 border-transparent hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shadow-2xs ${
                          activeTab === 'quizzes'
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'bg-indigo-400/15 border-indigo-400/30 text-indigo-300'
                        }`}>
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold leading-tight">Quiz Bank</div>
                          <div className={`text-xs font-normal ${activeTab === 'quizzes' ? 'text-blue-100' : 'text-slate-400'}`}>
                            Inspect published modules
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${activeTab === 'quizzes' ? 'text-white' : 'text-slate-500'}`} />
                    </button>

                    {/* Learner Portal View */}
                    <button
                      onClick={() => handleNavClick('learner-view')}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left font-bold transition-all duration-150 border ${
                        activeTab === 'learner-view'
                          ? 'bg-blue-600 text-white shadow-lg border-blue-400/50 ring-2 ring-blue-400/20'
                          : 'text-slate-200 hover:text-white hover:bg-white/10 border-transparent hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shadow-2xs ${
                          activeTab === 'learner-view'
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'bg-purple-400/15 border-purple-400/30 text-purple-300'
                        }`}>
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold leading-tight">Learner Portal View</div>
                          <div className={`text-xs font-normal ${activeTab === 'learner-view' ? 'text-blue-100' : 'text-slate-400'}`}>
                            Preview officer test interface
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${activeTab === 'learner-view' ? 'text-white' : 'text-slate-500'}`} />
                    </button>
                  </>
                ) : (
                  <>
                    {/* Available Assessments */}
                    <button
                      onClick={() => handleNavClick('assessments')}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left font-bold transition-all duration-150 border ${
                        activeTab === 'assessments'
                          ? 'bg-blue-600 text-white shadow-lg border-blue-400/50 ring-2 ring-blue-400/20'
                          : 'text-slate-200 hover:text-white hover:bg-white/10 border-transparent hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shadow-2xs ${
                          activeTab === 'assessments'
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'bg-teal-400/15 border-teal-400/30 text-teal-300'
                        }`}>
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold leading-tight">Available Assessments</div>
                          <div className={`text-xs font-normal ${activeTab === 'assessments' ? 'text-blue-100' : 'text-slate-400'}`}>
                            Official competency modules
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${activeTab === 'assessments' ? 'text-white' : 'text-slate-500'}`} />
                    </button>

                    {/* Diagnostics & iGOT History */}
                    <button
                      onClick={() => handleNavClick('history')}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left font-bold transition-all duration-150 border ${
                        activeTab === 'history'
                          ? 'bg-blue-600 text-white shadow-lg border-blue-400/50 ring-2 ring-blue-400/20'
                          : 'text-slate-200 hover:text-white hover:bg-white/10 border-transparent hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shadow-2xs ${
                          activeTab === 'history'
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'bg-amber-400/15 border-amber-400/30 text-amber-300'
                        }`}>
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold leading-tight">Diagnostics & Remediation</div>
                          <div className={`text-xs font-normal ${activeTab === 'history' ? 'text-blue-100' : 'text-slate-400'}`}>
                            Competency gaps & iGOT courses
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${activeTab === 'history' ? 'text-white' : 'text-slate-500'}`} />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-xs text-slate-300 mb-3 font-medium">
                  Sign in with your MoSPI credentials to access the curriculum and assessments.
                </p>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md border border-blue-400/40 transition"
                >
                  Sign In Now
                </button>
              </div>
            )}
          </div>


          {/* HELP & SUPPORT SECTION IN DRAWER */}
          <div className="pt-2 border-t border-blue-900/60">
            <div className="px-3 mb-2.5 text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />
              <span>Help & Support</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-blue-900/30 to-slate-900/60 border border-amber-400/30 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-white leading-tight">Have a query or need help?</div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Send queries directly to our technical team:
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
              </div>

              {/* Dedicated Support Email Box */}
              <div className="p-2.5 rounded-xl bg-[#040E1B] border border-blue-900/70 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Recipient Email</div>
                  <div className="text-xs font-mono font-bold text-amber-300 truncate select-all">smartskillai3@gmail.com</div>
                </div>
                <button
                  onClick={copySupportEmail}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px] font-bold flex-shrink-0"
                  title="Copy email to clipboard"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Action Buttons: Open Help Center & Direct Email */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setIsHelpModalOpen(true);
                  }}
                  className="w-full py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 border border-blue-400/40"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Help Center</span>
                </button>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=smartskillai3@gmail.com&su=SmartSkill%20AI%20Support%20Query"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Web Gmail</span>
                </a>
              </div>
            </div>
          </div>

          {/* Institutional Compliance Notice in Drawer */}
          <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-800/40 text-xs">
            <div className="flex items-center gap-2 text-slate-200 font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>MoSPI Verification</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
              All question schemas strictly conform to official MoSPI statistical manuals and iGOT Karmayogi competency frameworks.
            </p>
          </div>
        </div>

        {/* Drawer Footer with User Account & Switch Role */}
        {user && (
          <div className="p-4 border-t border-blue-900/70 bg-[#040E1B] space-y-3">
            {/* Persona Switcher in Drawer */}
            <button
              onClick={() => {
                onSwitchRole(user.role === 'admin' ? 'learner' : 'admin');
                setIsDrawerOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition shadow-xs"
            >
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                <span>Switch to {user.role === 'admin' ? 'Learner Officer' : 'Admin Trainer'}</span>
              </div>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/40">
                Switch
              </span>
            </button>

            {/* Officer Profile Details */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0 border ${
                  user.role === 'admin' 
                    ? 'bg-blue-600 border-blue-400/40' 
                    : 'bg-emerald-600 border-emerald-400/40'
                }`}>
                  {user.full_name.charAt(0)}
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-xs font-bold text-white truncate">
                    {user.full_name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {user.department.split('(')[0].trim()}
                  </div>
                </div>
              </div>

              {/* Sign Out Button in Drawer */}
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  onLogout();
                }}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-white hover:bg-red-500/25 border border-transparent hover:border-red-400/40 rounded-lg transition ml-2 flex-shrink-0"
              >
                <LogOut className="w-4 h-4 text-slate-300" />
              </button>
            </div>

            {/* Bottom Button to Hide Drawer */}
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white text-xs font-bold transition"
            >
              <PanelLeftClose className="w-4 h-4 text-amber-400" />
              <span>Hide Navigation Drawer</span>
            </button>
          </div>
        )}
      </aside>

      {/* ========================================================================= */}
      {/* 4. HELP & SUPPORT MODAL (Queries to smartskillai3@gmail.com)               */}
      {/* ========================================================================= */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#0B2545] border-2 border-blue-700/60 text-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Tricolor Bar */}
            <div className="tricolor-accent w-full" />

            {/* Modal Header with Matching Logo */}
            <div className="p-5 sm:p-6 border-b border-blue-900/80 bg-[#06162B] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SmartSkillLogo size="sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Help & Support Center
                    </h2>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      MoSPI Support
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    Queries and technical assistance for SmartSkill AI (Official Statistics)
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition shadow-xs flex-shrink-0"
                title="Close Help Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* Official Query Destination Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-900/50 via-[#0E3563]/40 to-slate-900/80 border-2 border-amber-400/40 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold mb-2">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Official Inquiries & Query Destination</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Your queries are routed directly to:
                    </h3>
                    <div className="text-sm sm:text-base font-mono font-black text-amber-300 mt-1 select-all">
                      smartskillai3@gmail.com
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={copySupportEmail}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-xs font-bold text-white shadow-xs transition"
                    >
                      {copiedEmail ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                      <span>{copiedEmail ? 'Email Copied!' : 'Copy Email'}</span>
                    </button>

                    <a
                      href="https://mail.google.com/mail/?view=cm&fs=1&to=smartskillai3@gmail.com&su=SmartSkill%20AI%20Support%20Query"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 border border-blue-400/50 text-xs font-bold text-white shadow-md transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open in Gmail (Web)</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Direct Query Dispatch Form with API Integration */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>Send a Query to <span className="font-mono text-amber-300">smartskillai3@gmail.com</span></span>
                </div>
                <p className="text-xs text-slate-300 font-normal">
                  Submit your query below. It is dispatched to the backend service and pre-formatted for direct Gmail delivery:
                </p>

                <form onSubmit={handleSendQuery} className="space-y-3.5">
                  {/* Sender Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Officer or User Name"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="w-full bg-[#06162B] border border-blue-900/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Your Email (for replies)</label>
                      <input
                        type="email"
                        required
                        placeholder="yourname@domain.gov.in"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        className="w-full bg-[#06162B] border border-blue-900/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Category Select */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Query Category</label>
                      <select
                        value={queryCategory}
                        onChange={(e) => setQueryCategory(e.target.value)}
                        className="w-full bg-[#06162B] border border-blue-900/80 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-hidden focus:border-blue-500"
                      >
                        <option value="General Inquiries & Portal Access">General Inquiries & Portal Access</option>
                        <option value="Manual Ingestion & OCR Processing">Manual Ingestion & OCR Processing</option>
                        <option value="HITL Question Curation & Validation">HITL Question Curation & Validation</option>
                        <option value="Competency Quizzes & Assessment Engine">Competency Quizzes & Assessment Engine</option>
                        <option value="iGOT Karmayogi Course Mapping">iGOT Karmayogi Course Mapping</option>
                        <option value="Report a Bug / Technical Glitch">Report a Bug / Technical Glitch</option>
                      </select>
                    </div>

                    {/* Subject Line */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Subject / Summary</label>
                      <input
                        type="text"
                        placeholder="Brief summary of your query..."
                        value={querySubject}
                        onChange={(e) => setQuerySubject(e.target.value)}
                        className="w-full bg-[#06162B] border border-blue-900/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Query Message Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Query Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Please explain your question or issue in detail..."
                      value={queryMessage}
                      onChange={(e) => setQueryMessage(e.target.value)}
                      className="w-full bg-[#06162B] border border-blue-900/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 resize-none font-normal"
                    />
                  </div>

                  {/* Feedback on Dispatch */}
                  {querySuccessMessage && (
                    <div className="p-3.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-emerald-300">Query Transmitted!</div>
                        <div>{querySuccessMessage}</div>
                      </div>
                    </div>
                  )}

                  {queryErrorMessage && (
                    <div className="p-3.5 bg-amber-500/20 border border-amber-400/40 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
                      <LifeBuoy className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>{queryErrorMessage}</div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsHelpModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-slate-300 hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingQuery}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 border border-blue-400/50 text-white text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-60"
                    >
                      {isSubmittingQuery ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Sending to smartskillai3@gmail.com...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-amber-300" />
                          <span>Send Query to smartskillai3@gmail.com</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Technical Guidance: How Gmail Inbox Delivery Works */}
              <div className="p-4 rounded-xl bg-[#040E1B] border border-blue-900/60 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Gmail Delivery Configuration</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Queries are automatically logged to the system audit trail and addressed to <strong>smartskillai3@gmail.com</strong>.
                  To enable automated direct backend SMTP dispatch without relying on client mail apps, a 16-character <strong>Gmail App Password</strong> can be configured in the backend environment.
                </p>
              </div>

              {/* Frequently Asked Inquiries (FAQ) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  <FileQuestion className="w-4 h-4 text-amber-400" />
                  <span>Frequently Asked Technical Guidance</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="font-bold text-white mb-1">How do I upload government manuals?</div>
                    <div className="text-slate-300 text-[11px] leading-relaxed font-normal">
                      Access the <strong>Manual Ingestion</strong> tab as an Admin Trainer. Upload PDF publications; the system extracts tables and text automatically.
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="font-bold text-white mb-1">What is Human-in-the-Loop (HITL)?</div>
                    <div className="text-slate-300 text-[11px] leading-relaxed font-normal">
                      Every AI-generated question enters the HITL queue for trainer review. Trainers can modify questions and approve or reject before publishing.
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="font-bold text-white mb-1">How is competency evaluated?</div>
                    <div className="text-slate-300 text-[11px] leading-relaxed font-normal">
                      Learner officers submit timed quizzes. The engine calculates percentage mastery and highlights competency domains needing reinforcement.
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="font-bold text-white mb-1">How does iGOT course mapping work?</div>
                    <div className="text-slate-300 text-[11px] leading-relaxed font-normal">
                      Competency gaps below 70% automatically trigger targeted course recommendations from the official iGOT Karmayogi catalog.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#06162B] border-t border-blue-900/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>MoSPI / NSSTA Statistical Capacity Building Project</span>
              </div>
              <div className="text-slate-300 font-mono text-[11px]">
                Support: <button onClick={copySupportEmail} className="text-amber-400 underline hover:text-amber-300 font-bold ml-1 cursor-pointer">smartskillai3@gmail.com</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
