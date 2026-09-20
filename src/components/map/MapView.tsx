import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Bus, Route, Stop } from '../../types';

interface MapViewProps {
  buses: Bus[];
  routes: Route[];
  selectedBusId?: string;
  selectedRouteId?: string;
  onSelectBus?: (bus: Bus) => void;
  onSelectStop?: (stop: Stop) => void;
  center?: [number, number];
  zoom?: number;
  heightClass?: string;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  buses,
  routes,
  selectedBusId,
  selectedRouteId,
  onSelectBus,
  onSelectStop,
  center = [34.0537, -118.2570],
  zoom = 15,
  heightClass = 'h-[500px]',
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const busMarkersRef = useRef<Record<string, L.Marker>>({});
  const routeLayersRef = useRef<Record<string, L.Polyline>>({});
  const stopMarkersRef = useRef<Record<string, L.Marker>>({});

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Standard clean OpenStreetMap CartoDB Positron / OSM tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Re-add zoom control on bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Route Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old polylines
    Object.values(routeLayersRef.current).forEach((p) => map.removeLayer(p));
    routeLayersRef.current = {};

    routes.forEach((route) => {
      const isSelected = selectedRouteId === route.id;
      const opacity = selectedRouteId ? (isSelected ? 0.9 : 0.25) : 0.7;
      const weight = isSelected ? 5 : 3.5;

      const polyline = L.polyline(route.pathCoordinates, {
        color: route.color,
        weight,
        opacity,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polyline.bindTooltip(
        `<div class="font-bold text-xs">${route.code} — ${route.name}</div>`,
        { sticky: true }
      );

      routeLayersRef.current[route.id] = polyline;
    });
  }, [routes, selectedRouteId]);

  // Update Stop Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old stops
    Object.values(stopMarkersRef.current).forEach((m) => map.removeLayer(m));
    stopMarkersRef.current = {};

    // Collect all stops
    const stopsMap = new Map<string, Stop>();
    routes.forEach((r) => {
      r.stops.forEach((s) => {
        if (!stopsMap.has(s.id)) stopsMap.set(s.id, s);
      });
    });

    stopsMap.forEach((stop) => {
      const stopIcon = L.divIcon({
        className: 'custom-stop-icon',
        html: `
          <div class="relative flex items-center justify-center group cursor-pointer" title="${stop.name}">
            <div class="w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-700 shadow-md transition-transform transform group-hover:scale-125"></div>
          </div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon }).addTo(map);
      marker.bindTooltip(
        `<div class="text-xs font-semibold text-slate-900">${stop.name}</div><div class="text-[10px] text-slate-500">${stop.landmark || 'Bus Stop'}</div>`,
        { direction: 'top', offset: [0, -6] }
      );

      marker.on('click', () => {
        if (onSelectStop) onSelectStop(stop);
      });

      stopMarkersRef.current[stop.id] = marker;
    });
  }, [routes, onSelectStop]);

  // Update Bus Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old bus markers that are no longer in buses list
    const currentBusIds = new Set(buses.map((b) => b.id));
    Object.keys(busMarkersRef.current).forEach((id) => {
      if (!currentBusIds.has(id)) {
        map.removeLayer(busMarkersRef.current[id]);
        delete busMarkersRef.current[id];
      }
    });

    buses.forEach((bus) => {
      if (bus.status === 'OFFLINE' || bus.status === 'MAINTENANCE') {
        if (busMarkersRef.current[bus.id]) {
          map.removeLayer(busMarkersRef.current[bus.id]);
          delete busMarkersRef.current[bus.id];
        }
        return;
      }

      const isSelected = selectedBusId === bus.id;
      const lat = bus.lastLocation.lat;
      const lng = bus.lastLocation.lng;
      const heading = bus.heading || 0;
      const route = routes.find((r) => r.id === bus.currentRouteId);
      const routeColor = route ? route.color : '#2563EB';

      // Status pill color
      const statusColor =
        bus.status === 'ACTIVE'
          ? 'bg-emerald-500'
          : bus.status === 'IDLE'
          ? 'bg-amber-500'
          : 'bg-slate-400';

      const busIconHtml = `
        <div class="relative flex flex-col items-center justify-center cursor-pointer transition-all">
          <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md mb-0.5 ${
            isSelected ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : ''
          }" style="background-color: ${routeColor};">
            <span class="w-1.5 h-1.5 rounded-full ${statusColor} animate-ping"></span>
            <span>${bus.busNumber}</span>
          </div>
          <div class="w-7 h-7 rounded-full bg-white shadow-lg border-2 border-slate-800 flex items-center justify-center text-slate-800 transform ${
            isSelected ? 'scale-115' : ''
          }">
            <div style="transform: rotate(${heading}deg);" class="transition-transform duration-500">
              <svg class="w-4 h-4 text-blue-600 fill-current" viewBox="0 0 24 24">
                <polygon points="12,2 22,22 12,17 2,22" />
              </svg>
            </div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'bus-marker-wrapper',
        html: busIconHtml,
        iconSize: [50, 48],
        iconAnchor: [25, 40],
      });

      if (busMarkersRef.current[bus.id]) {
        // Move marker smoothly
        const marker = busMarkersRef.current[bus.id];
        marker.setLatLng([lat, lng]);
        marker.setIcon(customIcon);
      } else {
        const marker = L.marker([lat, lng], { icon: customIcon, zIndexOffset: 100 }).addTo(map);
        marker.on('click', () => {
          if (onSelectBus) onSelectBus(bus);
        });
        busMarkersRef.current[bus.id] = marker;
      }
    });
  }, [buses, routes, selectedBusId, onSelectBus]);

  // Center map on selected bus or route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedBusId) {
      const bus = buses.find((b) => b.id === selectedBusId);
      if (bus) {
        map.flyTo([bus.lastLocation.lat, bus.lastLocation.lng], 16, { duration: 0.8 });
      }
    } else if (selectedRouteId) {
      const route = routes.find((r) => r.id === selectedRouteId);
      if (route && route.pathCoordinates.length > 0) {
        const bounds = L.latLngBounds(route.pathCoordinates);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [selectedBusId, selectedRouteId]);

  return (
    <div className={`relative w-full ${heightClass} ${className} rounded-2xl overflow-hidden border border-slate-200 shadow-2xs`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Legend Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-1.5 text-[11px] text-slate-700">
        <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between gap-3">
          <span>Campus Transit Fleet</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-2xs" />
          <span>BL-01 North Loop</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-600 border border-white shadow-2xs" />
          <span>RD-02 South Connector</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white shadow-2xs" />
          <span>GR-03 Metro Express</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-700" />
          <span>Campus Bus Stop</span>
        </div>
      </div>
    </div>
  );
};
