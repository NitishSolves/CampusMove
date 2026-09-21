import { Bus, EmergencyAlert, CampusNotification } from '../types';
import { apiClient } from './apiClient';
import { socketService } from './socketService';

type BusUpdateListener = (buses: Bus[]) => void;
type EmergencyListener = (alert: EmergencyAlert) => void;
type NotificationListener = (notif: CampusNotification) => void;

class RealtimeService {
  private buses: Bus[] = [];
  private busListeners: BusUpdateListener[] = [];
  private emergencyListeners: EmergencyListener[] = [];
  private notificationListeners: NotificationListener[] = [];
  private isConnectedToBackend = false;

  constructor() {
    // Listen to real-time events via Socket.IO
    socketService.on('bus:updated', (updatedBus: Bus) => {
      this.handleBusUpdated(updatedBus);
    });

    socketService.on('bus:location', (locData: any) => {
      this.handleBusLocationEvent(locData);
    });

    socketService.on('bus:occupancy', (data: { busId: string; currentOccupancy: number; capacity: number }) => {
      this.handleBusOccupancyEvent(data);
    });

    socketService.on('emergency:alert', (alert: EmergencyAlert) => {
      this.emergencyListeners.forEach((l) => l(alert));
    });

    socketService.on('emergency:admin_alert', (alert: EmergencyAlert) => {
      this.emergencyListeners.forEach((l) => l(alert));
    });

    socketService.on('notification:new', (notif: CampusNotification) => {
      this.notificationListeners.forEach((l) => l(notif));
    });

    socketService.on('connection:status', ({ isConnected }: { isConnected: boolean }) => {
      this.isConnectedToBackend = isConnected;
      if (isConnected) {
        this.fetchBusesFromApi();
      }
    });
  }

  public async fetchBusesFromApi(): Promise<Bus[]> {
    try {
      const data = await apiClient.get<Bus[]>('/api/buses');
      if (Array.isArray(data)) {
        this.buses = data;
        this.notifyBusListeners();
        return this.buses;
      }
    } catch (err) {
      console.warn('Could not fetch buses from API:', err);
    }
    return this.buses;
  }

  public getBuses(): Bus[] {
    return [...this.buses];
  }

  public getBusById(id: string): Bus | undefined {
    return this.buses.find((b) => b.id === id);
  }

  public subscribeBuses(listener: BusUpdateListener): () => void {
    this.busListeners.push(listener);
    listener(this.buses);
    return () => {
      this.busListeners = this.busListeners.filter((l) => l !== listener);
    };
  }

  public subscribeEmergency(listener: EmergencyListener): () => void {
    this.emergencyListeners.push(listener);
    return () => {
      this.emergencyListeners = this.emergencyListeners.filter((l) => l !== listener);
    };
  }

  public subscribeNotifications(listener: NotificationListener): () => void {
    this.notificationListeners.push(listener);
    return () => {
      this.notificationListeners = this.notificationListeners.filter((l) => l !== listener);
    };
  }

  public broadcastEmergency(alert: EmergencyAlert): void {
    this.emergencyListeners.forEach((l) => l(alert));
  }

  public broadcastNotification(notif: CampusNotification): void {
    this.notificationListeners.forEach((l) => l(notif));
  }

  public setBuses(newBuses: Bus[]): void {
    this.buses = newBuses;
    this.notifyBusListeners();
  }

  private handleBusUpdated(updatedBus: Bus): void {
    const idx = this.buses.findIndex((b) => b.id === updatedBus.id);
    if (idx !== -1) {
      this.buses[idx] = { ...this.buses[idx], ...updatedBus };
    } else {
      this.buses.push(updatedBus);
    }
    this.notifyBusListeners();
  }

  private handleBusLocationEvent(data: any): void {
    const { busId, lat, lng, speedKmh, heading, timestamp, gpsStatus, networkStatus, etaConfidence, isSimulated, upcomingEtas, nextStop } = data;
    this.buses = this.buses.map((b) => {
      if (b.id === busId) {
        return {
          ...b,
          lastLocation: {
            lat,
            lng,
            speed: (speedKmh || 0) / 3.6,
            heading: heading || 0,
            timestamp: timestamp || new Date().toISOString(),
          },
          speedKmh: speedKmh || b.speedKmh,
          heading: heading !== undefined ? heading : b.heading,
          lastSyncTimestamp: timestamp || new Date().toISOString(),
          gpsStatus: gpsStatus || b.gpsStatus,
          networkStatus: networkStatus || b.networkStatus,
          etaConfidence: etaConfidence || b.etaConfidence,
          isSimulated: isSimulated !== undefined ? isSimulated : b.isSimulated,
          upcomingEtas: upcomingEtas || b.upcomingEtas,
          nextStop: nextStop || b.nextStop,
        };
      }
      return b;
    });
    this.notifyBusListeners();
  }

  private handleBusOccupancyEvent(data: { busId: string; currentOccupancy: number; capacity: number }): void {
    this.buses = this.buses.map((b) => {
      if (b.id === data.busId) {
        return {
          ...b,
          currentOccupancy: data.currentOccupancy,
          capacity: data.capacity || b.capacity,
        };
      }
      return b;
    });
    this.notifyBusListeners();
  }

  private notifyBusListeners(): void {
    this.busListeners.forEach((l) => l([...this.buses]));
  }
}

export const realtimeService = new RealtimeService();
