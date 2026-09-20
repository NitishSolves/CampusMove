import { io, Socket } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../config/api';
import { getStoredToken } from './apiClient';

class SocketService {
  private socket: Socket | null = null;
  private currentCollegeId: string | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnected = false;

  public connect(collegeId?: string): Socket {
    if (this.socket && this.socket.connected) {
      if (collegeId && collegeId !== this.currentCollegeId) {
        this.currentCollegeId = collegeId;
        this.socket.emit('join:college', collegeId);
      }
      return this.socket;
    }

    const token = getStoredToken();
    this.currentCollegeId = collegeId || 'college_apex';

    this.socket = io(SOCKET_BASE_URL || window.location.origin, {
      path: '/socket.io/',
      auth: {
        token: token || undefined,
        collegeId: this.currentCollegeId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1500,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      if (this.currentCollegeId) {
        this.socket?.emit('join:college', this.currentCollegeId);
      }
      this.notifySubscribers('connection:status', { isConnected: true });
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.notifySubscribers('connection:status', { isConnected: false });
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connection warning:', err.message);
    });

    // Forward incoming server events to registered subscribers
    const forwardEvents = [
      'bus:updated',
      'bus:location',
      'bus:occupancy',
      'trip:started',
      'trip:ended',
      'emergency:alert',
      'emergency:admin_alert',
      'emergency:status',
      'notification:new',
    ];

    forwardEvents.forEach((evt) => {
      this.socket?.on(evt, (data: any) => {
        this.notifySubscribers(evt, data);
      });
    });

    return this.socket;
  }

  public setCollege(collegeId: string): void {
    this.currentCollegeId = collegeId;
    if (this.socket && this.socket.connected) {
      this.socket.emit('join:college', collegeId);
    }
  }

  public on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private notifySubscribers(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in socket event listener '${event}':`, err);
        }
      });
    }
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const socketService = new SocketService();
