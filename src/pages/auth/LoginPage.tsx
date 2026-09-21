import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { UserRole } from '../../types';
import { authService } from '../../services/authService';
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
  User as UserIcon,
  Phone,
  CreditCard,
  UserPlus,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { currentCollege, loginAs, switchRole } = useApp();
  const navigate = useNavigate();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('alex.chen@apex.edu');
  const [password, setPassword] = useState('campuspass123');
  const [studentId, setStudentId] = useState('');
  const [cdlNumber, setCdlNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRoleSelect = (targetRole: UserRole) => {
    setRole(targetRole);
    setErrorMessage(null);
    if (!isRegisterMode) {
      setPassword('ApexBus2025!');
      if (targetRole === 'STUDENT') {
        setEmail('alex.chen@apex.edu');
      } else if (targetRole === 'DRIVER') {
        setEmail('marcus.vance@transit.apex.edu');
      } else {
        setEmail('admin@apex.edu');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both your institutional email and password.');
      return;
    }

    if (isRegisterMode && !name.trim()) {
      setErrorMessage('Please provide your full name.');
      return;
    }

    if (isRegisterMode && password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (isRegisterMode) {
        const res = await authService.register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          collegeId: currentCollege.id,
          studentId: role === 'STUDENT' ? studentId.trim() || undefined : undefined,
          cdlNumber: role === 'DRIVER' ? cdlNumber.trim() || undefined : undefined,
          phone: phone.trim() || undefined,
        });

        if (!res.success) {
          setErrorMessage(res.error || 'Registration failed. Please verify your details.');
          return;
        }

        setSuccessMessage('Account registered successfully! Redirecting...');
        setTimeout(() => {
          if (role === 'STUDENT') navigate('/student');
          else if (role === 'DRIVER') navigate('/driver');
          else navigate('/admin');
        }, 600);
      } else {
        const res = await authService.login(email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Authentication failed. Please check your credentials.');
          return;
        }
        const userRole = res.user?.role || role;
        if (userRole === 'STUDENT') navigate('/student');
        else if (userRole === 'DRIVER') navigate('/driver');
        else navigate('/admin');
      }
    } catch {
      setErrorMessage(isRegisterMode ? 'Registration failed. Please try again.' : 'Authentication failed. Please verify credentials.');
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

        {/* Tab Header: Sign In vs Register */}
        <div className="flex border-b border-slate-200 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 transition-colors cursor-pointer ${
              !isRegisterMode
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'bg-slate-50 text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setErrorMessage(null);
              setName('');
              setPassword('');
              setEmail('');
            }}
            className={`flex-1 py-3 transition-colors cursor-pointer ${
              isRegisterMode
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'bg-slate-50 text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
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

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {isRegisterMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  id="register-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegisterMode}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Jordan Taylor"
                />
              </div>
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
                placeholder={isRegisterMode ? 'At least 8 characters' : '••••••••'}
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

          {isRegisterMode && role === 'STUDENT' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Student ID Number (Optional)
              </label>
              <div className="relative flex items-center">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  id="register-student-id-input"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="e.g. APX-98214"
                />
              </div>
            </div>
          )}

          {isRegisterMode && role === 'DRIVER' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                CDL / Driver License Number
              </label>
              <div className="relative flex items-center">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  id="register-cdl-input"
                  type="text"
                  value={cdlNumber}
                  onChange={(e) => setCdlNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="e.g. CDL-77491-VA"
                />
              </div>
            </div>
          )}

          <button
            id="login-submit-button"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : isRegisterMode ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create {role.charAt(0) + role.slice(1).toLowerCase()} Account</span>
              </>
            ) : (
              <>
                <span>Sign in as {role.charAt(0) + role.slice(1).toLowerCase()}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Demo Access Buttons (when in Sign In mode) */}
          {!isRegisterMode && (
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
          )}
        </form>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
          Single Sign-On (SSO) & Multi-Campus Transit Cloud
        </div>
      </div>
    </div>
  );
};
