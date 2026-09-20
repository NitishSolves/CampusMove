import { Trip } from '../types';
import { apiClient } from './apiClient';
import { locationService } from './locationService';
import { realtimeService } from './realtimeService';
import { socketService } from './socketService';
import { mockTrips } from '../mock/trips';

const ACTIVE_TRIP_KEY = 'smart_campus_bus_active_trip';

class TripService {
  private trips: Trip[] = [...mockTrips];
  private activeTrip: Trip | null = null;
  private listeners: ((trip: Trip | null) => void)[] = [];

  constructor() {
    const saved = localStorage.getItem(ACTIVE_TRIP_KEY);
    if (saved) {
      try {
        this.activeTrip = JSON.parse(saved);
      } catch {
        this.activeTrip = null;
      }
    }

    // Refresh active trip and history from backend
    this.refreshActiveTripFromApi();
    this.fetchTripHistory();

    // Listen to real-time events from Socket.IO
    socketService.on('trip:started', (tripData: any) => {
      this.fetchTripHistory();
    });

    socketService.on('trip:ended', () => {
      this.fetchTripHistory();
    });
  }

  public getActiveTrip(): Trip | null {
    return this.activeTrip;
  }

  public getTripHistory(): Trip[] {
    return [...this.trips];
  }

  public subscribeActiveTrip(listener: (trip: Trip | null) => void): () => void {
    this.listeners.push(listener);
    listener(this.activeTrip);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public async refreshActiveTripFromApi(): Promise<Trip | null> {
    try {
      const res = await apiClient.get<{ activeTrip: Trip | null }>('/api/trips/active');
      this.activeTrip = res.activeTrip;
      this.persistActiveTrip();
      this.notify();
      return this.activeTrip;
    } catch {
      return this.activeTrip;
    }
  }

  public async fetchTripHistory(): Promise<Trip[]> {
    try {
      const res = await apiClient.get<Trip[]>('/api/trips');
      if (Array.isArray(res)) {
        this.trips = res;
        this.notify();
        return this.trips;
      }
    } catch (err) {
      console.warn('Could not load trip history from API:', err);
    }
    return this.trips;
  }

  public async startTrip(
    busId: string,
    driverId: string,
    routeId: string,
    collegeId = 'college_apex',
    useSimulation = false
  ): Promise<Trip> {
    try {
      const res = await apiClient.post<{ success: boolean; trip: any; bus: any }>('/api/trips/start', {
        busId,
        routeId,
        collegeId,
      });

      const serverTrip = res.trip;
      const newTrip: Trip = {
        id: serverTrip.id,
        collegeId: serverTrip.college_id || collegeId,
        busId: serverTrip.bus_id || busId,
        driverId: serverTrip.driver_id || driverId,
        routeId: serverTrip.route_id || routeId,
        startTime: serverTrip.start_time || new Date().toISOString(),
        status: 'IN_PROGRESS',
        currentOccupancy: 0,
        initialOccupancy: 0,
        totalLocationsLogged: 0,
        syncedLocationsCount: 0,
        queuedLocationsCount: 0,
        distanceCoveredKm: 0,
      };

      this.activeTrip = newTrip;
      this.trips.unshift(newTrip);
      this.persistActiveTrip();
      this.notify();

      // Start browser GPS tracking
      await locationService.startTracking(newTrip.id, busId, driverId, useSimulation);

      return newTrip;
    } catch (err: any) {
      console.warn('Backend start trip error, using client fallback:', err);
      // Fallback
      const fallbackTrip: Trip = {
        id: 'trip_' + Date.now().toString(),
        collegeId,
        busId,
        driverId,
        routeId,
        startTime: new Date().toISOString(),
        status: 'IN_PROGRESS',
        currentOccupancy: 0,
        initialOccupancy: 0,
        totalLocationsLogged: 0,
        syncedLocationsCount: 0,
        queuedLocationsCount: 0,
        distanceCoveredKm: 0,
      };

      this.activeTrip = fallbackTrip;
      this.trips.unshift(fallbackTrip);
      this.persistActiveTrip();
      this.notify();

      await locationService.startTracking(fallbackTrip.id, busId, driverId, useSimulation);
      return fallbackTrip;
    }
  }

  public async updateOccupancy(deltaOrAbsolute: number, isAbsolute = false): Promise<number> {
    if (!this.activeTrip) return 0;

    try {
      const res = await apiClient.post<{ currentOccupancy: number; capacity: number }>('/api/trips/occupancy', {
        delta: isAbsolute ? undefined : deltaOrAbsolute,
        absoluteCount: isAbsolute ? deltaOrAbsolute : undefined,
      });

      this.activeTrip.currentOccupancy = res.currentOccupancy;
      this.persistActiveTrip();
      this.notify();
      return res.currentOccupancy;
    } catch {
      const bus = realtimeService.getBusById(this.activeTrip.busId);
      const capacity = bus?.capacity || 45;

      let newCount = isAbsolute ? deltaOrAbsolute : this.activeTrip.currentOccupancy + deltaOrAbsolute;
      newCount = Math.max(0, Math.min(capacity, newCount));

      this.activeTrip.currentOccupancy = newCount;
      this.persistActiveTrip();
      this.notify();

      return newCount;
    }
  }

  public async endTrip(): Promise<boolean> {
    if (!this.activeTrip) return false;

    try {
      await apiClient.post('/api/trips/end', {
        tripId: this.activeTrip.id,
      });
    } catch (err) {
      console.warn('API end trip error:', err);
    }

    // Stop location tracking
    locationService.stopTracking();

    const endedTrip = {
      ...this.activeTrip,
      status: 'COMPLETED' as const,
      endTime: new Date().toISOString(),
    };

    this.trips = this.trips.map((t) => (t.id === endedTrip.id ? endedTrip : t));
    this.activeTrip = null;
    localStorage.removeItem(ACTIVE_TRIP_KEY);
    this.notify();

    return true;
  }

  private persistActiveTrip(): void {
    if (this.activeTrip) {
      localStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify(this.activeTrip));
    } else {
      localStorage.removeItem(ACTIVE_TRIP_KEY);
    }
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.activeTrip));
  }
}

export const tripService = new TripService();
