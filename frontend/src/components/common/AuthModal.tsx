import React, { useState } from 'react';
import { api } from '../../services/api';
import type { User } from '../../types';
import { ShieldCheck, UserCheck, Lock, Mail, User as UserIcon, Building2, AlertCircle, X } from 'lucide-react';
import { SmartSkillLogo } from './SmartSkillLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Ministry of Statistics & Programme Implementation (MoSPI)');
  const [role, setRole] = useState<'admin' | 'learner'>('learner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await api.register({
          email,
          password,
          full_name: fullName,
          role,
          department,
        });
      }
      // Log in
      const auth = await api.login(email, password);
      onSuccess(auth.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* National Emblem & Top Accent */}
        <div className="h-2 bg-gradient-to-r from-[#0B2545] via-[#134E4A] to-amber-500" />
        
        <div className="p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <SmartSkillLogo size="lg" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-sans">
              {isRegister ? 'Government Trainee Registration' : 'Sign in to SmartSkill AI'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              MoSPI / iGOT Karmayogi Competency Assessment Portal
            </p>
          </div>

          {/* Quick 1-Click Demo Evaluation Buttons */}
          <div className="mb-6 p-4 bg-amber-50/80 border border-amber-200 rounded-xl">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-3 flex items-center gap-1.5">
              <span>⚡ One-Click Evaluator Sign-In:</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@mospi.gov.in', 'Admin@123')}
                disabled={loading}
                className="flex items-center justify-between p-3.5 bg-white hover:bg-blue-50/60 border border-blue-200 hover:border-blue-400 rounded-xl text-left transition shadow-2xs group active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Admin Trainer (NSSTA MoSPI)</div>
                    <div className="text-xs text-slate-500 font-medium">Dr. Arvind Saxena • admin@mospi.gov.in</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700 group-hover:translate-x-0.5 transition">Login →</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('officer@mospi.gov.in', 'Learner@123')}
                disabled={loading}
                className="flex items-center justify-between p-3.5 bg-white hover:bg-emerald-50/60 border border-emerald-200 hover:border-emerald-400 rounded-xl text-left transition shadow-2xs group active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Learner Officer (Field Operations)</div>
                    <div className="text-xs text-slate-500 font-medium">Pooja Sharma • officer@mospi.gov.in</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition">Login →</span>
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-xs font-bold text-slate-400 uppercase tracking-wider absolute">
              Or Use Credentials
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
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
                      className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition ${
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
                      className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition ${
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
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
              disabled={loading}
              className="w-full py-3 bg-[#0B2545] hover:bg-slate-900 border border-slate-800 text-white text-sm font-bold rounded-xl transition shadow-md mt-4 disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-slate-600 hover:text-[#0B2545] font-semibold"
            >
              {isRegister
                ? 'Already registered? Sign in here'
                : 'Need a new trainee account? Register here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
