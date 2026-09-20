import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { MapView } from '../../components/map/MapView';
import { Bus, Route } from '../../types';
import { BusStatusBadge, GPSStatusBadge } from '../../components/common/StatusBadges';
import { adminService } from '../../services/adminService';
import {
  Bus as BusIcon,
  Navigation,
  Radio,
  Clock,
  Compass,
  Users,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  X,
  Filter,
} from 'lucide-react';

export const AdminLiveFleet: React.FC = () => {
  const { buses, routes } = useApp();
  const [selectedBusId, setSelectedBusId] = useState<string | undefined>('bus_104');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [routeFilter, setRouteFilter] = useState<string>('ALL');

  const filteredBuses = buses.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (routeFilter !== 'ALL' && b.currentRouteId !== routeFilter) return false;
    return true;
  });

  const selectedBus = buses.find((b) => b.id === selectedBusId) || buses[0];
  const selectedBusRoute = routes.find((r) => r.id === selectedBus?.currentRouteId);

  const handleStatusChange = (newStatus: any) => {
    if (!selectedBus) return;
    adminService.updateBusStatus(selectedBus.id, newStatus);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Campus Fleet Operations Map</h2>
          <p className="text-xs text-slate-500">Live GPS tracking and fleet dispatch monitor</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">In Service (Active)</option>
            <option value="IDLE">Idle / Reserve</option>
            <option value="MAINTENANCE">In Maintenance</option>
            <option value="OFFLINE">Offline</option>
          </select>

          {/* Route Filter */}
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Campus Routes</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} - {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Map + Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MapView
            buses={filteredBuses}
            routes={routes}
            selectedBusId={selectedBusId}
            selectedRouteId={routeFilter !== 'ALL' ? routeFilter : undefined}
            onSelectBus={(b) => setSelectedBusId(b.id)}
            heightClass="h-[550px] sm:h-[620px]"
          />
        </div>

        {/* Selected Bus Telemetry Inspector */}
        <div className="space-y-4">
          {selectedBus ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                    <BusIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{selectedBus.busNumber}</h3>
                    <p className="text-xs text-slate-500">
                      {selectedBus.model} • {selectedBus.plateNumber}
                    </p>
                  </div>
                </div>
                <BusStatusBadge status={selectedBus.status} />
              </div>

              {/* Driver & Route */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase block mb-0.5">
                    Assigned Driver
                  </span>
                  <span className="font-bold text-slate-900">{selectedBus.driverName || 'Unassigned'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase block mb-0.5">
                    Operating Line
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedBusRoute ? selectedBusRoute.code : 'None'}
                  </span>
                </div>
              </div>

              {/* Telemetry Details */}
              <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Compass className="w-4 h-4" /> Live Coordinates:
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedBus.lastLocation.lat.toFixed(5)}, {selectedBus.lastLocation.lng.toFixed(5)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Navigation className="w-4 h-4" /> Speed & Heading:
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedBus.speedKmh || 0} km/h • {selectedBus.heading || 0}°
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-4 h-4" /> Heartbeat Ping:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {new Date(selectedBus.lastSyncTimestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Users className="w-4 h-4" /> Occupancy Load:
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedBus.currentOccupancy} / {selectedBus.capacity} (
                    {Math.round((selectedBus.currentOccupancy / selectedBus.capacity) * 100)}%)
                  </span>
                </div>
              </div>

              {/* Quick Status Command Actions */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Dispatcher Fleet Controls
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      handleStatusChange(selectedBus.status === 'ACTIVE' ? 'IDLE' : 'ACTIVE')
                    }
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                  >
                    {selectedBus.status === 'ACTIVE' ? 'Set to Idle' : 'Activate Service'}
                  </button>
                  <button
                    onClick={() =>
                      handleStatusChange(
                        selectedBus.status === 'MAINTENANCE' ? 'IDLE' : 'MAINTENANCE'
                      )
                    }
                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                  >
                    {selectedBus.status === 'MAINTENANCE' ? 'Clear Shop' : 'Flag Maintenance'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              Select a bus on the map to inspect live telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
