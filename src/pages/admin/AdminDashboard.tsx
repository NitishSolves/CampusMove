import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { adminService } from '../../services/adminService';
import { BusStatusBadge, RouteStatusBadge } from '../../components/common/StatusBadges';
import {
  Bus as BusIcon,
  Route as RouteIcon,
  Navigation,
  ShieldAlert,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Clock,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { currentCollege, buses, routes, emergencyAlerts, trips } = useApp();

  const activeBuses = buses.filter((b) => b.status === 'ACTIVE');
  const maintenanceBuses = buses.filter((b) => b.status === 'MAINTENANCE');
  const offlineBuses = buses.filter((b) => b.status === 'OFFLINE' || b.status === 'IDLE');
  const activeAlerts = emergencyAlerts.filter((a) => a.status === 'ACTIVE');

  // Compute fleet occupancy
  const totalCapacity = activeBuses.reduce((acc, b) => acc + b.capacity, 0);
  const currentTotalRiders = activeBuses.reduce((acc, b) => acc + b.currentOccupancy, 0);
  const avgOccupancyRate = totalCapacity > 0 ? Math.round((currentTotalRiders / totalCapacity) * 100) : 0;

  const handleAcknowledgeAlert = (alertId: string) => {
    adminService.acknowledgeAlert(alertId, 'Admin Dispatch Center');
  };

  const handleResolveAlert = (alertId: string) => {
    adminService.resolveAlert(alertId, 'Incident cleared by field responder.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operations Command Center</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {currentCollege.name} Fleet Overview
          </h2>
          <p className="text-xs text-slate-500">
            Real-time monitoring for campus shuttle transit & driver dispatch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/fleet"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>Live Fleet Map</span>
          </Link>
          <Link
            to="/admin/alerts"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Post Broadcast</span>
          </Link>
        </div>
      </div>

      {/* Emergency Incidents Banner if active */}
      {activeAlerts.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-rose-950">
                  {activeAlerts.length} Active Emergency Incident Reported
                </h4>
                <p className="text-xs text-rose-700">Immediate dispatch review recommended</p>
              </div>
            </div>
            <Link
              to="/admin/alerts"
              className="text-xs font-bold text-rose-800 hover:text-rose-950 underline"
            >
              Manage in Incidents Queue
            </Link>
          </div>

          <div className="space-y-2 pt-1">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white p-3.5 rounded-xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>Bus {alert.busNumber}</span>
                    <span>•</span>
                    <span>{alert.routeName}</span>
                    <span>•</span>
                    <span className="text-rose-600">{alert.reason}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Driver: {alert.driverName} • Reported at{' '}
                    {new Date(alert.timestamp).toLocaleTimeString()} • Coordinates: [
                    {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}]
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg cursor-pointer transition-colors text-xs"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition-colors text-xs"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active In-Service
            </span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <BusIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            {activeBuses.length}{' '}
            <span className="text-xs font-normal text-slate-400">/ {buses.length} buses</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {Math.round((activeBuses.length / buses.length) * 100)}% fleet deployed
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Fleet Capacity Load
            </span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            {avgOccupancyRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {currentTotalRiders} current riders on board
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lines Operating
            </span>
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <RouteIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            {routes.filter((r) => r.status === 'LIVE').length}{' '}
            <span className="text-xs font-normal text-slate-400">/ {routes.length} routes</span>
          </div>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">Headways nominal (10m)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Maintenance / Offline
            </span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            {maintenanceBuses.length + offlineBuses.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {maintenanceBuses.length} in shop • {offlineBuses.length} reserve idle
          </p>
        </div>
      </div>

      {/* Fleet Status Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Bus Telemetry & Driver Assignments</h3>
            <p className="text-xs text-slate-500">Live coordinates, occupancy, and GPS heartbeats</p>
          </div>
          <Link
            to="/admin/buses"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Manage Fleet <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Bus ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Line</th>
                <th className="py-3 px-4">Occupancy</th>
                <th className="py-3 px-4">GPS Health</th>
                <th className="py-3 px-4">Speed</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {buses.map((bus) => {
                const route = routes.find((r) => r.id === bus.currentRouteId);
                return (
                  <tr key={bus.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {bus.busNumber.split('-')[1]}
                        </div>
                        <div>
                          <div>{bus.busNumber}</div>
                          <div className="text-[10px] text-slate-400">{bus.model}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <BusStatusBadge status={bus.status} />
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      {route ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: route.color }}
                          />
                          <span>{route.code}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span>
                          {bus.currentOccupancy}/{bus.capacity}
                        </span>
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{
                              width: `${Math.round((bus.currentOccupancy / bus.capacity) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {bus.gpsStatus === 'GPS_ACTIVE' ? 'Active' : 'Degraded'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{bus.speedKmh || 0} km/h</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to="/admin/fleet"
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
