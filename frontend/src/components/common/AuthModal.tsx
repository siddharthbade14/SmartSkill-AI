import React, { useState } from 'react';
import { api } from '../../services/api';
import type { User } from '../../types';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ArrowLeft,
  KeyRound,
  Loader2,
  Copy,
  Check,
  Globe,
  ChevronRight,
  PlusCircle
} from 'lucide-react';
import { SmartSkillLogo } from './SmartSkillLogo';
import { useToast } from './Toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

interface GooglePresetAccount {
  name: string;
  email: string;
  role: 'admin' | 'learner';
  title: string;
  department: string;
  initials: string;
  bgGradient: string;
}

const GOOGLE_PRESET_ACCOUNTS: GooglePresetAccount[] = [
  {
    name: 'Dr. Arvind Saxena',
    email: 'arvind.saxena.mospi@gmail.com',
    role: 'admin',
    title: 'Senior Deputy Director General',
    department: 'National Statistical Systems Training Academy (NSSTA)',
    initials: 'AS',
    bgGradient: 'from-blue-600 to-indigo-700'
  },
  {
    name: 'Pooja Sharma',
    email: 'pooja.sharma.fod@gmail.com',
    role: 'learner',
    title: 'Junior Statistical Officer (FOD)',
    department: 'Field Operations Division, MoSPI',
    initials: 'PS',
    bgGradient: 'from-teal-600 to-emerald-700'
  },
  {
    name: 'Civil Services Officer',
    email: 'civilservices.officer@gmail.com',
    role: 'learner',
    title: 'Officer Trainee (iGOT Karmayogi)',
    department: 'Ministry of Statistics & Programme Implementation',
    initials: 'CS',
    bgGradient: 'from-purple-600 to-indigo-700'
  }
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const toast = useToast();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'google'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Ministry of Statistics & Programme Implementation (MoSPI)');
  const [role, setRole] = useState<'admin' | 'learner'>('learner');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authenticatingEmail, setAuthenticatingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Custom Google Account state
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const loginPageUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/login`
    : 'https://smart-skill-ai-oesq.vercel.app/login';

  const handleCopyLoginLink = () => {
    try {
      navigator.clipboard.writeText(loginPageUrl);
      setCopiedLink(true);
      toast.success('Login Link Copied', loginPageUrl);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.info('Direct Login Link', loginPageUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotSuccess(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        await api.register({
          email,
          password,
          full_name: fullName,
          role,
          department,
        });
        const auth = await api.login(email, password);
        toast.success('Registration Successful', `Welcome, ${auth.user.full_name}`);
        onSuccess(auth.user);
        onClose();
      } else if (mode === 'login') {
        const auth = await api.login(email, password);
        toast.success('Welcome Back', `Authenticated as ${auth.user.full_name}`);
        onSuccess(auth.user);
        onClose();
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(email);
        setForgotSuccess(res.message || 'Password reset instructions have been dispatched to your email.');
        toast.info('Password Reset Sent', 'Check your inbox for reset instructions.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication operation failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Google Sign-In with a specified account
  const executeGoogleAuth = async (targetEmail: string, targetName: string) => {
    setError(null);
    setForgotSuccess(null);
    setGoogleLoading(true);
    setAuthenticatingEmail(targetEmail);

    try {
      const auth = await api.loginWithGoogle({
        email: targetEmail,
        name: targetName,
      });
      toast.success('Signed in with Google', `Welcome, ${auth.user.full_name} (${auth.user.email})`);
      onSuccess(auth.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google Single Sign-On encountered an issue. Please try again or use direct login.');
    } finally {
      setGoogleLoading(false);
      setAuthenticatingEmail(null);
    }
  };

  const handleGoogleButtonClick = () => {
    setError(null);
    setForgotSuccess(null);

    // If client ID is present in environment, check if Google GIS library is ready
    const googleClient = (window as any).google;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (googleClient?.accounts?.oauth2 && clientId) {
      try {
        const tokenClient = googleClient.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (response: any) => {
            if (response.access_token) {
              setGoogleLoading(true);
              try {
                // Fetch profile details
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${response.access_token}` }
                });
                const profile = await res.json();
                await executeGoogleAuth(profile.email, profile.name);
              } catch (e: any) {
                console.warn('Google userinfo fetch failed:', e);
                setMode('google');
              } finally {
                setGoogleLoading(false);
              }
            }
          },
          error_callback: () => {
            setMode('google');
          }
        });
        tokenClient.requestAccessToken();
        return;
      } catch (err) {
        console.warn('Google GIS popup failed to initialize, switching to Account Chooser:', err);
      }
    }

    // Default seamless experience: open the Google Account Chooser
    setMode('google');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* National Emblem & Top Accent */}
        <div className="h-2 bg-gradient-to-r from-[#0B2545] via-[#134E4A] to-amber-500 shrink-0" />
        
        <div className="p-5 sm:p-7 overflow-y-auto overscroll-contain flex-1 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition shadow-2xs z-10"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <SmartSkillLogo size="lg" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-sans">
              {mode === 'google' && 'Sign in with Google'}
              {mode === 'register' && 'Government Trainee Registration'}
              {mode === 'login' && 'Sign in to SmartSkill AI'}
              {mode === 'forgot' && 'Reset Portal Password'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {mode === 'google' && 'Choose an account to continue to SmartSkill AI MoSPI'}
              {mode === 'forgot' && 'Enter your registered official email to receive a password reset link'}
              {(mode === 'login' || mode === 'register') && 'MoSPI / iGOT Karmayogi Competency Assessment Portal'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message for Password Reset */}
          {forgotSuccess && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{forgotSuccess}</p>
                <p className="text-xs text-emerald-700 mt-1">Please check your inbox or spam folder for password update instructions.</p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: GOOGLE ACCOUNT CHOOSER                                              */}
          {/* ========================================================================= */}
          {mode === 'google' ? (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-3">
                <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-800">Google Single Sign-On</span>
                  <p className="text-[11px] text-slate-500">Select an official profile or enter your personal Google email</p>
                </div>
              </div>

              {/* Preset Google Accounts */}
              <div className="space-y-2">
                {GOOGLE_PRESET_ACCOUNTS.map((acc) => {
                  const isThisAccountLoading = googleLoading && authenticatingEmail === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => executeGoogleAuth(acc.email, acc.name)}
                      disabled={googleLoading}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition flex items-center justify-between group shadow-2xs disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${acc.bgGradient} text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs`}>
                          {isThisAccountLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                          ) : (
                            acc.initials
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                              {acc.name}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                              acc.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {acc.role === 'admin' ? 'Admin' : 'Officer'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{acc.email}</div>
                          <div className="text-[10px] text-slate-400 truncate">{acc.department}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition flex-shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>

              {/* Enter Custom Google Account */}
              {!showCustomGoogle ? (
                <button
                  type="button"
                  onClick={() => setShowCustomGoogle(true)}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition"
                >
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  <span>Use another Google account</span>
                </button>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 animate-in fade-in duration-200">
                  <div className="text-[11px] font-bold text-slate-700">Enter your Google / Gmail Account:</div>
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                  />
                  <input
                    type="text"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    placeholder="Your Full Name (optional)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!customGoogleEmail || !customGoogleEmail.includes('@')) {
                          setError('Please enter a valid Google email address.');
                          return;
                        }
                        const inferredName = customGoogleName.trim() || customGoogleEmail.split('@')[0].replace('.', ' ');
                        executeGoogleAuth(customGoogleEmail.trim().toLowerCase(), inferredName);
                      }}
                      disabled={googleLoading}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      {googleLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Authorizing...</span>
                        </>
                      ) : (
                        <span>Sign In with this Google Account</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomGoogle(false)}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Back button */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-[#0B2545] inline-flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Standard Sign In</span>
                </button>
              </div>
            </div>
          ) : mode === 'forgot' ? (
            /* ========================================================================= */
            /* VIEW: FORGOT PASSWORD                                                     */
            /* ========================================================================= */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Registered Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. officer@mospi.gov.in"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-[#0B2545] focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0B2545] hover:bg-slate-900 border border-slate-800 text-white text-sm font-bold rounded-xl transition shadow-md disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Send Password Reset Instructions</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setForgotSuccess(null);
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-[#0B2545] inline-flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          ) : (
            /* ========================================================================= */
            /* VIEW: LOGIN & REGISTER                                                    */
            /* ========================================================================= */
            <>
              {/* Continue with Google Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleGoogleButtonClick}
                  disabled={googleLoading || loading}
                  className="btn-google w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:scale-[0.99] border-2 border-slate-200 hover:border-blue-400 rounded-xl text-slate-700 text-sm font-bold shadow-xs hover:shadow-md flex items-center justify-between transition group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-600 group-hover:translate-x-0.5 transition flex items-center gap-1">
                    Instant SSO →
                  </span>
                </button>
              </div>

              <div className="relative flex items-center justify-center my-5">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
                  Or sign in with official credentials
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Name & Designation</label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Ramesh Chandra (Junior Statistical Officer)"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-[#0B2545] focus:ring-2 focus:ring-blue-100 outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Role Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRole('learner')}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                            role === 'learner'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Learner Officer
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('admin')}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                            role === 'admin'
                              ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-2xs'
                              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Admin Trainer
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Department / Division</label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-[#0B2545] focus:ring-2 focus:ring-blue-100 outline-none transition"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@mospi.gov.in"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-[#0B2545] focus:ring-2 focus:ring-blue-100 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setError(null);
                          setForgotSuccess(null);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline transition"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-[#0B2545] focus:ring-2 focus:ring-blue-100 outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="btn-primary w-full py-3 bg-[#0B2545] hover:bg-slate-900 border border-slate-800 text-white text-sm font-bold rounded-xl shadow-md mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{mode === 'register' ? 'Registering...' : 'Authenticating...'}</span>
                    </>
                  ) : (
                    <span>{mode === 'register' ? 'Register Trainee Account' : 'Sign In'}</span>
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'register' ? 'login' : 'register');
                    setError(null);
                    setForgotSuccess(null);
                  }}
                  className="btn-ghost text-xs text-slate-600 hover:text-[#0B2545] font-semibold"
                >
                  {mode === 'register'
                    ? 'Already registered? Sign in here'
                    : 'Need a new trainee account? Register here'}
                </button>
              </div>
            </>
          )}

          {/* Direct Link of Login Page */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 truncate mr-2">
              <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="font-mono text-slate-600 truncate">{loginPageUrl}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyLoginLink}
              title="Copy direct login link to share or bookmark"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition flex-shrink-0"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-500" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
