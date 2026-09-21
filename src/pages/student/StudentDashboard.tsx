import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { BusCard, RouteCard, NotificationCard } from '../../components/common/Cards';
import { EmptyState } from '../../components/common/States';
import { Navigation, Bus as BusIcon, Bell, ArrowRight, MapPin } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { currentUser, currentCollege, buses, routes, notifications, isLoadingData } = useApp();

  const activeBuses = buses.filter((b) => b.status === 'ACTIVE');
  const primaryRoute = routes.length > 0 ? routes[0] : null;
  const recentNotifications = notifications.slice(0, 2);

  if (isLoadingData) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-white rounded-2xl border border-slate-200 p-6 h-40" />
        <div className="animate-pulse bg-white rounded-2xl border border-slate-200 p-6 h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-700/60 border border-blue-500/40 text-xs font-semibold text-blue-100 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Campus Transit • {currentCollege.campusName}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          Welcome{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}!
        </h2>
        <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
          {activeBuses.length > 0
            ? `${activeBuses.length} campus shuttle${activeBuses.length !== 1 ? 's' : ''} actively circulating.`
            : 'No buses are currently running. Check back soon.'}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link to="/student/live" className="px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span>Live Bus Map</span>
          </Link>
          <Link to="/student/routes" className="px-4 py-2 bg-blue-800/80 hover:bg-blue-700/80 text-white border border-blue-600/50 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors">
            <MapPin className="w-4 h-4" />
            <span>Routes &amp; Stops</span>
          </Link>
        </div>
      </div>

      {/* Active Buses Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Campus Buses</h3>
            <p className="text-xs text-slate-500">
              {activeBuses.length > 0
                ? 'Live positions from driver devices'
                : 'Track buses in real time once they start running'}
            </p>
          </div>
          <Link to="/student/live" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Map View <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeBuses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeBuses.map((bus) => {
              const route = routes.find((r) => r.id === bus.currentRouteId);
              return <BusCard key={bus.id} bus={bus} route={route} onSelect={() => {}} />;
            })}
          </div>
        ) : (
          <EmptyState
            title="No buses running"
            description="No campus shuttles are currently active. Buses will appear here once drivers start their trips."
            icon={BusIcon}
          />
        )}
      </div>

      {/* Routes Section */}
      {primaryRoute && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BusIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Routes</h3>
                <p className="text-xs text-slate-500">{routes.length} route{routes.length !== 1 ? 's' : ''} configured</p>
              </div>
            </div>
            <Link to="/student/routes" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5">
              All routes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <RouteCard route={primaryRoute} activeBusesCount={activeBuses.filter((b) => b.currentRouteId === primaryRoute.id).length} onSelect={() => {}} />
        </div>
      )}

      {/* Recent Notifications */}
      {recentNotifications.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Transport Notices</h3>
                <p className="text-xs text-slate-500">Campus fleet announcements</p>
              </div>
            </div>
            <Link to="/student/notifications" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentNotifications.map((notif) => <NotificationCard key={notif.id} notification={notif} />)}
          </div>
        </div>
      )}
    </div>
  );
};
