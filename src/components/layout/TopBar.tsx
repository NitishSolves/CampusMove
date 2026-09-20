import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import {
  Bell,
  Building2,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Shield,
  Bus as BusIcon,
  GraduationCap,
  WifiOff,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const TopBar: React.FC<{ onOpenMobileMenu?: () => void }> = () => {
  const {
    currentUser,
    role,
    currentCollege,
    colleges,
    switchCollege,
    switchRole,
    logout,
    unreadCount,
    activeEmergencyCount,
    locationState,
  } = useApp();

  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const navigate = useNavigate();

  const handleRoleSwitch = (newRole: 'STUDENT' | 'DRIVER' | 'ADMIN') => {
    switchRole(newRole);
    setShowRoleDropdown(false);
    if (newRole === 'STUDENT') navigate('/student');
    else if (newRole === 'DRIVER') navigate('/driver');
    else if (newRole === 'ADMIN') navigate('/admin');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Institution Context & Campus */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              id="college-switcher-button"
              onClick={() => setShowCollegeDropdown(!showCollegeDropdown)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentCollege.shortCode}
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-900 leading-none">
                    {currentCollege.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-[11px] text-slate-500">{currentCollege.campusName}</span>
              </div>
            </button>

            {showCollegeDropdown && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-fade-in">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Campus / Institution
                </div>
                {colleges.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      switchCollege(c.id);
                      setShowCollegeDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-start gap-2.5 hover:bg-slate-50 text-xs cursor-pointer ${
                      currentCollege.id === c.id ? 'bg-blue-50/70 text-blue-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-[10px] text-slate-500">{c.campusName}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Network Offline Indicator if disconnected */}
          {(locationState.networkStatus === 'NETWORK_OFFLINE' ||
            locationState.isSimulatedOffline) && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-medium">
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span>Offline Mode • Storing locally</span>
            </div>
          )}
        </div>

        {/* Right: Role Switcher Demo Bar, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher (For easy demo evaluator testing) */}
          <div className="relative">
            <button
              id="role-switcher-button"
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
            >
              {role === 'STUDENT' && <GraduationCap className="w-3.5 h-3.5 text-blue-600" />}
              {role === 'DRIVER' && <BusIcon className="w-3.5 h-3.5 text-emerald-600" />}
              {role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-indigo-600" />}
              <span className="hidden xs:inline">Role:</span>
              <span className="font-bold text-slate-900">{role}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Experience (Demo)
                </div>
                <button
                  onClick={() => handleRoleSwitch('STUDENT')}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 text-xs cursor-pointer ${
                    role === 'STUDENT' ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <div>
                    <div>Student View</div>
                    <div className="text-[10px] font-normal text-slate-500">Live map, ETAs, alerts</div>
                  </div>
                </button>
                <button
                  onClick={() => handleRoleSwitch('DRIVER')}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 text-xs cursor-pointer ${
                    role === 'DRIVER' ? 'bg-emerald-50 font-bold text-emerald-700' : 'text-slate-700'
                  }`}
                >
                  <BusIcon className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div>Driver Terminal</div>
                    <div className="text-[10px] font-normal text-slate-500">GPS tracking, offline sync</div>
                  </div>
                </button>
                <button
                  onClick={() => handleRoleSwitch('ADMIN')}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 text-xs cursor-pointer ${
                    role === 'ADMIN' ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-700'
                  }`}
                >
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div>Admin Portal</div>
                    <div className="text-[10px] font-normal text-slate-500">Fleet map, routes, metrics</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Notifications link */}
          <Link
            to={role === 'ADMIN' ? '/admin/alerts' : role === 'DRIVER' ? '/driver' : '/student/notifications'}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Notifications & Alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
            {activeEmergencyCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-600 animate-ping" />
            )}
          </Link>

          {/* User info & logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-600 text-xs font-bold border border-slate-300">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <div className="text-xs font-bold text-slate-800">{currentUser?.name}</div>
              <div className="text-[10px] text-slate-500">{currentUser?.email}</div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout session"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
