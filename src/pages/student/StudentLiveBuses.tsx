import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { Bus, Route, Stop } from '../../types';
import { MapView } from '../../components/map/MapView';
import { BusStatusBadge, ETAIndicator, OccupancyIndicator, RouteStatusBadge } from '../../components/common/StatusBadges';
import { FilterBar } from '../../components/common/Inputs';
import {
  Bus as BusIcon,
  Navigation,
  Clock,
  Radio,
  X,
  Compass,
  MapPin,
  RefreshCw,
  Info,
} from 'lucide-react';

export const StudentLiveBuses: React.FC = () => {
  const { buses, routes } = useApp();
  const [selectedBusId, setSelectedBusId] = useState<string | undefined>('bus_104');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ALL');

  const activeBuses = buses.filter((b) => b.status === 'ACTIVE');

  const getTimeSinceUpdate = (timestamp: string): { text: string; diffMinutes: number } => {
    if (!timestamp) return { text: 'Just now', diffMinutes: 0 };
    const now = new Date().getTime();
    const then = new Date(timestamp).getTime();
    const diffMs = Math.max(0, now - then);
    const diffMin = Math.floor(diffMs / 60000);

    let text = 'Just now';
    if (diffMin === 1) text = '1 minute ago';
    else if (diffMin > 1 && diffMin < 60) text = `${diffMin} minutes ago`;
    else if (diffMin >= 60) {
      const diffHours = Math.floor(diffMin / 60);
      text = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }

    return { text, diffMinutes: diffMin };
  };

  // Filter routes
  const filteredBuses = activeBuses.filter((b) => {
    if (selectedRouteId === 'ALL') return true;
    return b.currentRouteId === selectedRouteId;
  });

  const selectedBus = buses.find((b) => b.id === selectedBusId) || filteredBuses[0];
  const selectedBusRoute = routes.find((r) => r.id === selectedBus?.currentRouteId);

  const routeFilters = [
    { id: 'ALL', label: 'All Active Routes', count: activeBuses.length },
    ...routes.map((r) => ({
      id: r.id,
      label: r.code,
      count: activeBuses.filter((b) => b.currentRouteId === r.id).length,
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Top Header & Route Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Campus Live Bus Tracking</h2>
          <p className="text-xs text-slate-500">
            Real-time telemetry updated directly from driver smartphones
          </p>
        </div>

        <FilterBar
          filters={routeFilters}
          activeFilter={selectedRouteId}
          onFilterChange={(id) => {
            setSelectedRouteId(id);
            if (id !== 'ALL') {
              const busOnRoute = activeBuses.find((b) => b.currentRouteId === id);
              if (busOnRoute) setSelectedBusId(busOnRoute.id);
            }
          }}
        />
      </div>

      {/* Main Map + Side Inspector Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Container (Takes 2 cols on Desktop) */}
        <div className="lg:col-span-2 relative">
          <MapView
            buses={filteredBuses}
            routes={routes}
            selectedBusId={selectedBusId}
            selectedRouteId={selectedRouteId !== 'ALL' ? selectedRouteId : undefined}
            onSelectBus={(b) => setSelectedBusId(b.id)}
            heightClass="h-[520px] sm:h-[580px]"
          />

          {/* Quick floating bus pills on top of map for mobile quick select */}
          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {filteredBuses.map((bus) => {
              const route = routes.find((r) => r.id === bus.currentRouteId);
              const isSelected = selectedBusId === bus.id;
              return (
                <button
                  key={bus.id}
                  onClick={() => setSelectedBusId(bus.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 shadow-md transition-all cursor-pointer backdrop-blur-md ${
                    isSelected
                      ? 'bg-slate-900 text-white ring-2 ring-blue-500'
                      : 'bg-white/95 text-slate-800 hover:bg-white'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: route?.color || '#2563EB' }}
                  />
                  <span>{bus.busNumber}</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    {route ? route.code : 'Idle'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bus Detail Card (Right Column) */}
        <div className="space-y-4">
          {selectedBus ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
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

              {/* Route Info */}
              {selectedBusRoute ? (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Current Assigned Route
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: selectedBusRoute.color }}
                    />
                    <span>
                      {selectedBusRoute.code} — {selectedBusRoute.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {selectedBusRoute.description}
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">No assigned route</div>
              )}

              {/* ETA & Next Stop Card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Next Stop
                  </div>
                  <div className="font-bold text-xs text-slate-900 mt-1 truncate">
                    {selectedBus.nextStopId ? 'Engineering Complex' : 'Approaching Stop'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Arrival ETA
                  </div>
                  <div className="mt-1">
                    <ETAIndicator
                      seconds={selectedBus.etaToNextStopSeconds}
                      confidence={selectedBus.etaConfidence}
                    />
                  </div>
                </div>
              </div>

              {/* Occupancy Card */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                <OccupancyIndicator
                  current={selectedBus.currentOccupancy}
                  capacity={selectedBus.capacity}
                />
              </div>

              {/* Freshness & Timestamp Badge (Task 3.4) */}
              {(() => {
                const updateInfo = getTimeSinceUpdate(selectedBus.lastSyncTimestamp);
                return (
                  <div
                    className={`p-3 rounded-xl border text-xs transition-colors ${
                      updateInfo.diffMinutes < 2
                        ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                        : updateInfo.diffMinutes < 5
                        ? 'border-amber-200 bg-amber-50/70 text-amber-900'
                        : 'border-slate-300 bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[11px] uppercase tracking-wider">
                        Telemetry Freshness:
                      </span>
                      <span className="font-bold font-mono">
                        {updateInfo.text}
                      </span>
                    </div>
                    {updateInfo.diffMinutes >= 2 && (
                      <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                        ⚠️ Data may be delayed or stale
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Telemetry & GPS Info */}
              <div className="text-xs space-y-2 pt-2 border-t border-slate-100 text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-500" />
                    GPS Connection:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedBus.gpsStatus === 'GPS_ACTIVE' ? 'Active Live Signal' : 'Degraded Signal'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-slate-400" /> Speed & Bearing:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedBus.speedKmh || 26} km/h • {selectedBus.heading || 45}°
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Last Device Ping:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedBus.lastSyncTimestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              Select a bus marker on the map to view real-time telemetry.
            </div>
          )}

          {/* Quick Route Status Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Campus Lines Status
            </h4>
            <div className="space-y-2">
              {routes.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRouteId(r.id)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="font-bold text-slate-800">{r.code}</span>
                    <span className="text-slate-500 truncate max-w-[130px]">{r.name}</span>
                  </div>
                  <RouteStatusBadge status={r.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
