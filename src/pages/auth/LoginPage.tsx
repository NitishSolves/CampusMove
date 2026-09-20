import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { UserRole } from '../../types';
import {
  Bus,
  Lock,
  Mail,
  Eye,
  EyeOff,
  GraduationCap,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { currentCollege, loginAs, switchRole } = useApp();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('STUDENT');
  const [email, setEmail] = useState('alex.chen@apex.edu');
  const [password, setPassword] = useState('campuspass123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleSelect = (targetRole: UserRole) => {
    setRole(targetRole);
    setErrorMessage(null);
    if (targetRole === 'STUDENT') {
      setEmail('alex.chen@apex.edu');
    } else if (targetRole === 'DRIVER') {
      setEmail('marcus.vance@transit.apex.edu');
    } else {
      setEmail('admin@apex.edu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both your institutional email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await loginAs(role);
      switchRole(role);
      if (role === 'STUDENT') navigate('/student');
      else if (role === 'DRIVER') navigate('/driver');
      else navigate('/admin');
    } catch {
      setErrorMessage('Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* College & Product Header */}
        <div className="bg-slate-900 text-white p-6 text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 mx-auto flex items-center justify-center text-white mb-3 shadow-md">
            <Bus className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Smart Campus Bus</h2>
          <p className="text-xs text-slate-300 mt-1">
            {currentCollege.name} • Transit Portal
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleRoleSelect('STUDENT')}
            className={`py-3 flex flex-col items-center gap-1 transition-colors cursor-pointer ${
              role === 'STUDENT'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect('DRIVER')}
            className={`py-3 flex flex-col items-center gap-1 transition-colors cursor-pointer ${
              role === 'DRIVER'
                ? 'bg-white text-emerald-600 border-b-2 border-emerald-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>Driver</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect('ADMIN')}
            className={`py-3 flex flex-col items-center gap-1 transition-colors cursor-pointer ${
              role === 'ADMIN'
                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Campus Email / Institutional ID
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                id="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="you@apex.edu"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-button"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign in as {role.charAt(0) + role.slice(1).toLowerCase()}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Demo Access Buttons */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick Demo Access
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleRoleSelect('STUDENT')}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-700 text-center cursor-pointer"
              >
                Student Demo
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('DRIVER')}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-700 text-center cursor-pointer"
              >
                Driver Demo
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('ADMIN')}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-700 text-center cursor-pointer"
              >
                Admin Demo
              </button>
            </div>
          </div>
        </form>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
          Single Sign-On (SSO) & Multi-Campus Transit Cloud
        </div>
      </div>
    </div>
  );
};
