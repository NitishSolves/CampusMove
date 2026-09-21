import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { MapView } from '../../components/map/MapView';
import { BusStatusBadge, ETAIndicator, OccupancyIndicator } from '../../components/common/StatusBadges';
import { EmptyState } from '../../components/common/States';
import { FilterBar } from '../../components/common/Inputs';
import { Bus as BusIcon, MapPin, Clock, Radio, Compass } from 'lucide-react';

export const StudentLiveBuses: React.FC = () => {
  const { buses, routes } = useApp();
  const [selectedBusId, setSelectedBusId] = useState<string | undefined>(undefined);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ALL');

  const activeBuses = buses.filter((b) => b.status === 'ACTIVE');

  const getTimeSinceUpdate = (timestamp: string): { text: string; diffMinutes: number } => {
    if (!timestamp) return { text: 'Unknown', diffMinutes: 999 };
    const diffMs = Math.max(0, new Date().getTime() - new Date(timestamp).getTime());
    const diffMin = Math.floor(diffMs / 60000);
    let text = 'Just now';
    if (diffMin === 1) text = '1 min ago';
    else if (diffMin > 1 && diffMin < 60) text = `${diffMin} min ago`;
    else if (diffMin >= 60) text = `${Math.floor(diffMin / 60)}h ago`;
    return { text, diffMinutes: diffMin };
  };

  const filteredBuses = activeBuses.filter((b) => {
    if (selectedRouteId === 'ALL') return true;
    return b.currentRouteId === selectedRouteId;
  });

  const selectedBus = buses.find((b) => b.id === selectedBusId) || filteredBuses[0];
  const selectedBusRoute = routes.find((r) => r.id === selectedBus?.currentRouteId);

  const routeFilters = [
    { id: 'ALL', label: 'All Routes', count: activeBuses.length },
    ...routes.map((r) => ({
      id: r.id, label: r.code,
      count: activeBuses.filter((b) => b.currentRouteId === r.id).length,
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Live Bus Tracking</h2>
          <p className="text-xs text-slate-500">
            {activeBuses.length > 0
              ? 'Real-time telemetry from driver devices'
              : 'No buses are currently active'}
          </p>
        </div>
        {activeBuses.length > 0 && (
          <FilterBar filters={routeFilters} activeFilter={selectedRouteId} onFilterChange={(id) => {
            setSelectedRouteId(id);
            if (id !== 'ALL') {
              const busOnRoute = activeBuses.find((b) => b.currentRouteId === id);
              if (busOnRoute) setSelectedBusId(busOnRoute.id);
            }
          }} />
        )}
      </div>

      {activeBuses.length === 0 ? (
        <EmptyState
          title="No buses currently running"
          description="Active buses will appear on the map once drivers start their trips. Check back when service is running."
          icon={BusIcon}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 relative">
            <MapView
              buses={filteredBuses}
              routes={routes}
              selectedBusId={selectedBusId}
              selectedRouteId={selectedRouteId !== 'ALL' ? selectedRouteId : undefined}
              onSelectBus={(b) => setSelectedBusId(b.id)}
              heightClass="h-[520px] sm:h-[580px]"
            />

            <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center gap-2 overflow-x-auto pb-1">
              {filteredBuses.map((bus) => {
                const route = routes.find((r) => r.id === bus.currentRouteId);
                const isSelected = selectedBusId === bus.id;
                return (
                  <button key={bus.id} onClick={() => setSelectedBusId(bus.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 shadow-md transition-all cursor-pointer backdrop-blur-md ${isSelected ? 'bg-slate-900 text-white ring-2 ring-blue-500' : 'bg-white/95 text-slate-800 hover:bg-white'}`}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: route?.color || '#2563EB' }} />
                    <span>{bus.busNumber}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {selectedBus ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <BusIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{selectedBus.busNumber}</h3>
                      <p className="text-xs text-slate-500">{selectedBus.model} • {selectedBus.plateNumber}</p>
                    </div>
                  </div>
                  <BusStatusBadge status={selectedBus.status} />
                </div>

                {selectedBusRoute ? (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Current Route</div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedBusRoute.color }} />
                      <span>{selectedBusRoute.code} — {selectedBusRoute.name}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No route assigned</div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                    <div className="text-[11px] font-semibold text-blue-700 uppercase flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Next Stop
                    </div>
                    <div className="font-bold text-xs text-slate-900 mt-1 truncate">
                      {selectedBus.nextStop?.stopName || '—'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Arrival ETA
                    </div>
                    <div className="mt-1">
                      <ETAIndicator seconds={selectedBus.etaToNextStopSeconds} confidence={selectedBus.etaConfidence} />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                  <OccupancyIndicator current={selectedBus.currentOccupancy} capacity={selectedBus.capacity} />
                </div>

                {(() => {
                  const updateInfo = getTimeSinceUpdate(selectedBus.lastSyncTimestamp);
                  return (
                    <div className={`p-3 rounded-xl border text-xs ${updateInfo.diffMinutes < 2 ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900' : updateInfo.diffMinutes < 5 ? 'border-amber-200 bg-amber-50/70 text-amber-900' : 'border-slate-300 bg-slate-100 text-slate-700'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[11px] uppercase">Last update:</span>
                        <span className="font-bold font-mono">{updateInfo.text}</span>
                      </div>
                      {updateInfo.diffMinutes >= 2 && (
                        <p className="text-[11px] text-amber-700 font-semibold mt-1">Data may be delayed or stale</p>
                      )}
                    </div>
                  );
                })()}

                <div className="text-xs space-y-2 pt-2 border-t border-slate-100 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-emerald-500" />GPS:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedBus.gpsStatus === 'GPS_ACTIVE' ? 'Live' : selectedBus.gpsStatus === 'LOCATION_STALE' ? 'Stale' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 text-slate-400" />Speed:</span>
                    <span className="font-semibold text-slate-800">{selectedBus.speedKmh || 0} km/h</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                Select a bus on the map to view details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
