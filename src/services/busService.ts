import { Bus, BusStatus } from '../types';
import { apiClient } from './apiClient';
import { realtimeService } from './realtimeService';

class BusService {
  public async getBuses(): Promise<Bus[]> {
    return realtimeService.fetchBusesFromApi();
  }

  public async getBusById(id: string): Promise<Bus | undefined> {
    try {
      const bus = await apiClient.get<Bus>(`/api/buses/${id}`);
      return bus;
    } catch {
      return realtimeService.getBusById(id);
    }
  }

  public async createBus(busData: Omit<Bus, 'id' | 'lastLocation' | 'lastSyncTimestamp'>): Promise<Bus> {
    try {
      const newBus = await apiClient.post<Bus>('/api/buses', {
        busNumber: busData.busNumber,
        plateNumber: busData.plateNumber,
        capacity: busData.capacity,
        model: busData.model,
        currentRouteId: busData.currentRouteId,
        status: busData.status,
      });

      const current = realtimeService.getBuses();
      realtimeService.setBuses([newBus, ...current]);
      return newBus;
    } catch (err) {
      console.warn('Backend create bus error, using client fallback:', err);
      const fallback: Bus = {
        ...busData,
        id: 'bus_' + Date.now().toString().slice(-4),
        lastLocation: {
          lat: 34.0537,
          lng: -118.2570,
          accuracy: 5,
          speed: 0,
          heading: 0,
          timestamp: new Date().toISOString(),
        },
        lastSyncTimestamp: new Date().toISOString(),
        gpsStatus: 'GPS_ACTIVE',
        networkStatus: 'NETWORK_ONLINE',
        etaConfidence: 'SCHEDULED',
      };
      const current = realtimeService.getBuses();
      realtimeService.setBuses([fallback, ...current]);
      return fallback;
    }
  }

  public async updateBus(id: string, updates: Partial<Bus>): Promise<Bus | undefined> {
    try {
      const updated = await apiClient.put<Bus>(`/api/buses/${id}`, updates);
      const current = realtimeService.getBuses();
      realtimeService.setBuses(current.map((b) => (b.id === id ? { ...b, ...updated } : b)));
      return updated;
    } catch (err) {
      console.warn('Backend update bus error:', err);
      const current = realtimeService.getBuses();
      let updated: Bus | undefined;
      const next = current.map((b) => {
        if (b.id === id) {
          updated = { ...b, ...updates };
          return updated;
        }
        return b;
      });
      realtimeService.setBuses(next);
      return updated;
    }
  }

  public async updateStatus(id: string, status: BusStatus): Promise<void> {
    await this.updateBus(id, { status });
  }

  public async deleteBus(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/buses/${id}`);
    } catch (err) {
      console.warn('Backend delete bus error:', err);
    }
    const current = realtimeService.getBuses();
    realtimeService.setBuses(current.filter((b) => b.id !== id));
    return true;
  }
}

export const busService = new BusService();
