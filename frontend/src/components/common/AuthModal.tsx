import React, { useState } from 'react';
import { api } from '../../services/api';
import type { User } from '../../types';
import { 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ArrowLeft,
  KeyRound,
  Sparkles,
  Loader2
} from 'lucide-react';
import { SmartSkillLogo } from './SmartSkillLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Ministry of Statistics & Programme Implementation (MoSPI)');
  const [role, setRole] = useState<'admin' | 'learner'>('learner');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

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
        onSuccess(auth.user);
        onClose();
      } else if (mode === 'login') {
        const auth = await api.login(email, password);
        onSuccess(auth.user);
        onClose();
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(email);
        setForgotSuccess(res.message || 'Password reset instructions have been dispatched to your email.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication operation failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setForgotSuccess(null);
    setLoading(true);
    try {
      const auth = await api.login(demoEmail, demoPass);
      onSuccess(auth.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setForgotSuccess(null);
    setGoogleLoading(true);
    try {
      // Authenticate / auto-provision Google SSO session
      const auth = await api.loginWithGoogle({
        email: email && email.includes('@') ? email : 'officer.google@mospi.gov.in',
        name: fullName || 'Civil Services Officer (Google SSO)',
      });
      onSuccess(auth.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google Single Sign-On encountered an issue. Please try again or use direct login.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* National Emblem & Top Accent */}
        <div className="h-2 bg-gradient-to-r from-[#0B2545] via-[#134E4A] to-amber-500" />
        
        <div className="p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition shadow-2xs"
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
              {mode === 'register' && 'Government Trainee Registration'}
              {mode === 'login' && 'Sign in to SmartSkill AI'}
              {mode === 'forgot' && 'Reset Portal Password'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {mode === 'forgot' 
                ? 'Enter your registered official email to receive a password reset link' 
                : 'MoSPI / iGOT Karmayogi Competency Assessment Portal'}
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

          {/* FORGOT PASSWORD VIEW */}
          {mode === 'forgot' ? (
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
            /* LOGIN & REGISTER VIEW */
            <>
              {/* Continue with Google Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="btn-google w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-700 text-sm font-semibold shadow-2xs flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      <span>Authenticating with Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick 1-Click Demo Evaluation Buttons */}
              <div className="mb-5 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>One-Click Evaluator Demo Sign-In:</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('admin@mospi.gov.in', 'Admin@123')}
                    disabled={loading || googleLoading}
                    className="demo-btn flex items-center justify-between p-2.5 bg-white hover:bg-blue-50/60 border border-blue-200 hover:border-blue-400 rounded-lg text-left shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-4 h-4 text-blue-700" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight">Admin Trainer (NSSTA MoSPI)</div>
                        <div className="text-[11px] text-slate-500 font-medium leading-tight">Dr. Arvind Saxena • admin@mospi.gov.in</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-blue-700 group-hover:translate-x-0.5 transition">Login →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin('officer@mospi.gov.in', 'Learner@123')}
                    disabled={loading || googleLoading}
                    className="demo-btn flex items-center justify-between p-2.5 bg-white hover:bg-emerald-50/60 border border-emerald-200 hover:border-emerald-400 rounded-lg text-left shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight">Learner Officer (Field Operations)</div>
                        <div className="text-[11px] text-slate-500 font-medium leading-tight">Pooja Sharma • officer@mospi.gov.in</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 group-hover:translate-x-0.5 transition">Login →</span>
                  </button>
                </div>
              </div>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
                  Or use email credentials
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
        </div>
      </div>
    </div>
  );
};
