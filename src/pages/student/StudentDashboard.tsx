import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { BusCard, RouteCard, NotificationCard } from '../../components/common/Cards';
import {
  Navigation,
  Bus as BusIcon,
  Bell,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  MapPin,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { currentUser, currentCollege, buses, routes, notifications, emergencyAlerts } = useApp();

  const activeBuses = buses.filter((b) => b.status === 'ACTIVE');
  const primaryRoute = routes.find((r) => r.id === 'route_blue') || routes[0];
  const activeAlert = emergencyAlerts.find((a) => a.status === 'ACTIVE');
  const recentNotifications = notifications.slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-700/60 border border-blue-500/40 text-xs font-semibold text-blue-100 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Campus Transit Active • {currentCollege.campusName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Welcome back, {currentUser?.name || 'Student'}!
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
            {activeBuses.length} campus shuttles are actively circulating. Shuttles are running on
            regular scheduled weekday headways.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              to="/student/live"
              className="px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-blue-600" />
              <span>Open Live Bus Map</span>
            </Link>
            <Link
              to="/student/routes"
              className="px-4 py-2 bg-blue-800/80 hover:bg-blue-700/80 text-white border border-blue-600/50 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Route Timetables</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Emergency Incident Alert Banner if active */}
      {activeAlert && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-rose-950">
                Transit Advisory: Incident on {activeAlert.routeName}
              </h4>
              <span className="text-[11px] font-semibold text-rose-700 uppercase">
                Active Alert
              </span>
            </div>
            <p className="text-xs text-rose-800 mt-0.5">
              Bus {activeAlert.busNumber} has signaled a service pause. Safety teams are on-site. Expect
              slight frequency adjustments.
            </p>
          </div>
        </div>
      )}

      {/* Primary Next Bus Highlight Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BusIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Next Recommended Route</h3>
              <p className="text-xs text-slate-500">Based on your Central Quad campus location</p>
            </div>
          </div>
          <Link
            to="/student/routes"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5"
          >
            All routes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {primaryRoute && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="md:col-span-2">
              <RouteCard
                route={primaryRoute}
                activeBusesCount={activeBuses.filter((b) => b.currentRouteId === primaryRoute.id).length}
                onSelect={() => {}}
              />
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Nearest Upcoming Stop
                </div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Central Quad Transit Hub</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Bus 104 arriving in ~3 mins (LIVE GPS)</p>
              </div>

              <Link
                to="/student/live"
                className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg text-center shadow-2xs transition-colors"
              >
                Track Bus 104 Live
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Active Operating Buses Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Operating Campus Buses</h3>
            <p className="text-xs text-slate-500">Live positions broadcasted by driver devices</p>
          </div>
          <Link
            to="/student/live"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Full Map View <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeBuses.map((bus) => {
            const route = routes.find((r) => r.id === bus.currentRouteId);
            return (
              <BusCard
                key={bus.id}
                bus={bus}
                route={route}
                onSelect={() => {}}
              />
            );
          })}
        </div>
      </div>

      {/* Recent Transport Announcements */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transport Notices & Advisories</h3>
              <p className="text-xs text-slate-500">Broadcasted by College Fleet Operations</p>
            </div>
          </div>
          <Link
            to="/student/notifications"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
          >
            View all notices <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentNotifications.map((notif) => (
            <NotificationCard key={notif.id} notification={notif} />
          ))}
        </div>
      </div>
    </div>
  );
};
