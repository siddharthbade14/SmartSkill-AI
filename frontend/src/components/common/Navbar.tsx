import React, { useState, useEffect, useRef } from 'react';
import type { User } from '../../types';
import { api } from '../../services/api';
import { SmartSkillLogo } from './SmartSkillLogo';
import { useTheme } from './ThemeProvider';
import { 
  LogOut, 
  ArrowRightLeft, 
  Sparkles, 
  X, 
  ChevronDown,
  ShieldCheck, 
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
  KeyRound, 
  Moon, 
  Sun, 
  Rocket 
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onSwitchRole: (role: 'admin' | 'learner') => void;
  onOpenAuth: () => void;
  onStartTour?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  setActiveTab,
  onLogout,
  onSwitchRole,
  onOpenAuth,
  onStartTour,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
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

  // Click outside to close user menu dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close user menu or help modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isHelpModalOpen) {
          setIsHelpModalOpen(false);
        } else if (isUserMenuOpen) {
          setIsUserMenuOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpModalOpen, isUserMenuOpen]);

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

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MINIMAL TOP HEADER (BRAND ON LEFT, CLEAN PROFILE DROPDOWN ON RIGHT)     */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 navbar-highlight text-white transition-all duration-200 shadow-md">
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

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>iGOT Accredited</span>
            </span>
          </div>
        </div>

        {/* Essential Header Bar (Ultra-Clean: Brand Logo on Left, User Profile / Auth on Right) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-17 gap-4">
            
            {/* LEFT SIDE: BRAND LOGO & SITE NAME */}
            <div 
              className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group min-w-0"
              onClick={() => user && setActiveTab(user.role === 'admin' ? 'hitl' : 'assessments')}
              title="SmartSkill AI Home"
            >
              {/* Official Vector Logo */}
              <div className="shrink-0">
                <SmartSkillLogo size="md" />
              </div>
              
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-base sm:text-xl font-black text-white tracking-tight font-sans truncate">
                    SmartSkill<span className="text-amber-400">AI</span>
                  </span>
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase bg-blue-500/25 text-blue-200 border border-blue-400/30 shrink-0">
                    MoSPI
                  </span>
                </div>
                <span className="text-xs text-slate-300 font-medium tracking-tight hidden sm:block truncate">
                  Official Statistics Micro-Learning & Competency Engine
                </span>
              </div>
            </div>

            {/* RIGHT SIDE: CLEAN USER PROFILE MENU OR SIGN IN */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {user ? (
                /* Sleek User Profile Dropdown Button & Popover */
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border text-white shadow-xs transition active:scale-98 cursor-pointer ${
                      isUserMenuOpen 
                        ? 'bg-white/20 border-white/40 ring-2 ring-white/20' 
                        : 'bg-white/10 hover:bg-white/20 border-white/20'
                    }`}
                    aria-label="User account menu"
                    aria-expanded={isUserMenuOpen}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-xs border ${
                      user.role === 'admin' 
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-400/40' 
                        : 'bg-gradient-to-br from-teal-600 to-emerald-700 border-teal-400/40'
                    }`}>
                      {user.full_name.charAt(0)}
                    </div>

                    <div className="text-left hidden sm:block">
                      <div className="text-xs font-bold text-white leading-tight truncate max-w-[130px]">
                        {user.full_name.split(' ')[0]} {user.full_name.split(' ')[1] || ''}
                      </div>
                      <div className="text-[10px] text-slate-300 font-medium">
                        {user.role === 'admin' ? 'Senior Trainer' : 'Statistical Officer'}
                      </div>
                    </div>

                    <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-white' : ''}`} />
                  </button>

                  {/* Dropdown Menu Card */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                      {/* Officer Identity Header */}
                      <div className="p-4 bg-gradient-to-br from-slate-900 via-[#0B2545] to-blue-950 text-white border-b border-blue-900/60">
                        <div className="flex items-start gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm border shrink-0 ${
                            user.role === 'admin'
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-400/40'
                              : 'bg-gradient-to-br from-teal-600 to-emerald-700 border-teal-400/40'
                          }`}>
                            {user.full_name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-white truncate">{user.full_name}</div>
                            <div className="text-xs text-slate-300 truncate">{user.email}</div>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                user.role === 'admin'
                                  ? 'bg-blue-500/30 text-blue-200 border-blue-400/40'
                                  : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                              }`}>
                                {user.role === 'admin' ? 'NSSTA Trainer (Admin)' : 'Field Officer (Learner)'}
                              </span>
                            </div>
                          </div>
                        </div>
                        {user.department && (
                          <div className="mt-2.5 pt-2 border-t border-blue-900/60 text-[11px] text-slate-300/90 font-medium truncate">
                            {user.department}
                          </div>
                        )}
                      </div>

                      {/* Action Menu List */}
                      <div className="p-2 space-y-1">
                        {/* 1. Evaluator Tour */}
                        {onStartTour && (
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onStartTour();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-amber-50/80 transition group cursor-pointer"
                          >
                            <span className="w-7 h-7 rounded-lg bg-amber-100/80 border border-amber-300 text-amber-900 flex items-center justify-center group-hover:scale-105 transition shrink-0">
                              <Rocket className="w-3.5 h-3.5 text-amber-700" />
                            </span>
                            <div className="text-left">
                              <div>Start Evaluator Tour</div>
                              <div className="text-[10px] text-slate-500 font-normal">Interactive 3-min guided walkthrough</div>
                            </div>
                          </button>
                        )}

                        {/* 2. Quick Role Switch */}
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onSwitchRole(user.role === 'admin' ? 'learner' : 'admin');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-blue-50/80 transition group cursor-pointer"
                        >
                          <span className="w-7 h-7 rounded-lg bg-blue-100/80 border border-blue-300 text-blue-900 flex items-center justify-center group-hover:scale-105 transition shrink-0">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-700" />
                          </span>
                          <div className="text-left">
                            <div>Switch to {user.role === 'admin' ? 'Learner Officer' : 'Admin Trainer'}</div>
                            <div className="text-[10px] text-slate-500 font-normal">Test opposite role interface</div>
                          </div>
                        </button>

                        {/* 3. Theme Toggle */}
                        <button
                          onClick={() => {
                            toggleTheme();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition group cursor-pointer"
                        >
                          <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center group-hover:scale-105 transition shrink-0">
                            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-600" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
                          </span>
                          <div className="text-left flex-1 flex items-center justify-between">
                            <div>Theme Mode</div>
                            <span className="text-[11px] font-semibold text-slate-500">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                          </div>
                        </button>

                        {/* 4. Help & Support */}
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsHelpModalOpen(true);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-emerald-50/80 transition group cursor-pointer"
                        >
                          <span className="w-7 h-7 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-900 flex items-center justify-center group-hover:scale-105 transition shrink-0">
                            <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
                          </span>
                          <div className="text-left">
                            <div>Help & Support Desk</div>
                            <div className="text-[10px] text-slate-500 font-normal">Queries to smartskillai3@gmail.com</div>
                          </div>
                        </button>
                      </div>

                      {/* Sign Out Footer */}
                      <div className="p-2 border-t border-slate-100 bg-slate-50/70">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                        >
                          <span className="w-7 h-7 rounded-lg bg-red-100/80 border border-red-200 text-red-700 flex items-center justify-center shrink-0">
                            <LogOut className="w-3.5 h-3.5" />
                          </span>
                          <span>Sign Out of Portal</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Unauthenticated View: Minimal Tour + Sign In */
                <div className="flex items-center gap-2">
                  {onStartTour && (
                    <button
                      onClick={onStartTour}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <Rocket className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                      <span className="hidden sm:inline">Evaluator Tour</span>
                      <span className="sm:hidden">Tour</span>
                    </button>
                  )}
                  <button
                    onClick={onOpenAuth}
                    className="px-4 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-md border border-blue-400/40 active:scale-95 cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HELP & SUPPORT MODAL DIALOG                                            */}
      {/* ========================================================================= */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#040E1B] border border-blue-900/80 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
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
