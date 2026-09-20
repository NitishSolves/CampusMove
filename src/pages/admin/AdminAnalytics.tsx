import React from 'react';
import { useApp } from '../../store/AppContext';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  Bus,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const AdminAnalytics: React.FC = () => {
  const { buses, routes } = useApp();

  const hourlyRidership = [
    { hour: '07:00 AM', riders: 85 },
    { hour: '08:00 AM', riders: 340 },
    { hour: '09:00 AM', riders: 420 },
    { hour: '10:00 AM', riders: 210 },
    { hour: '11:00 AM', riders: 190 },
    { hour: '12:00 PM', riders: 380 },
    { hour: '01:00 PM', riders: 290 },
    { hour: '02:00 PM', riders: 240 },
    { hour: '03:00 PM', riders: 310 },
    { hour: '04:00 PM', riders: 360 },
    { hour: '05:00 PM', riders: 440 },
    { hour: '06:00 PM', riders: 220 },
  ];

  const maxRiders = Math.max(...hourlyRidership.map((h) => h.riders));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Transit Fleet Analytics & Performance</h2>
        <p className="text-xs text-slate-500">
          Campus ridership trends, headway reliability, and capacity metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            On-Time Headway Rate
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2 font-mono">
            94.8%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">±2 min schedule variance</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Daily Campus Commuters
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            3,485
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">+12% vs last term</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            GPS Signal Reliability
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-2 font-mono">
            99.2%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">3-second heartbeat latency</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Electric Fleet Share
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 mt-2 font-mono">
            40%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Zero-emission campus goal</p>
        </div>
      </div>

      {/* Hourly Ridership Bar Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Hourly Campus Ridership Distribution</h3>
            <p className="text-xs text-slate-500">Boarding frequency across peak campus class times</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
            Weekdays Average
          </span>
        </div>

        <div className="h-64 flex items-end gap-2 sm:gap-4 pt-8 pb-4 border-b border-slate-100">
          {hourlyRidership.map((item, idx) => {
            const heightPercent = Math.round((item.riders / maxRiders) * 100);
            const isPeak = item.riders > 350;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-slate-800 font-mono">
                  {item.riders}
                </div>
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    isPeak
                      ? 'bg-blue-600 group-hover:bg-blue-700'
                      : 'bg-slate-200 group-hover:bg-slate-300'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[9px] sm:text-[10px] text-slate-500 rotate-45 sm:rotate-0 mt-1 whitespace-nowrap">
                  {item.hour.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Route Utilization Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Line Capacity Utilization</h3>
        <div className="space-y-3">
          {routes.map((route) => {
            const percent = route.id === 'route_blue' ? 78 : route.id === 'route_red' ? 62 : 45;
            return (
              <div key={route.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: route.color }}
                    />
                    <span>
                      {route.code} — {route.name}
                    </span>
                  </div>
                  <span className="font-mono text-slate-800">{percent}% Avg Load</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ backgroundColor: route.color, width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
