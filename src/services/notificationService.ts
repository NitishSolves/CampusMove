import { CampusNotification, NotificationCategory, NotificationPriority } from '../types';
import { apiClient } from './apiClient';
import { socketService } from './socketService';
import { mockNotifications } from '../mock/notifications';

class NotificationService {
  private notifications: CampusNotification[] = [...mockNotifications];
  private listeners: ((items: CampusNotification[]) => void)[] = [];

  constructor() {
    this.fetchNotificationsFromApi();

    // Listen to real-time broadcast
    socketService.on('notification:new', (notif: CampusNotification) => {
      this.notifications.unshift(notif);
      this.notify();
    });
  }

  public async fetchNotificationsFromApi(): Promise<CampusNotification[]> {
    try {
      const data = await apiClient.get<CampusNotification[]>('/api/notifications');
      if (Array.isArray(data)) {
        this.notifications = data;
        this.notify();
        return this.notifications;
      }
    } catch {
      // Fallback to cache
    }
    return this.notifications;
  }

  public getNotifications(): CampusNotification[] {
    return [...this.notifications];
  }

  public subscribe(listener: (items: CampusNotification[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.notifications);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public async markAsRead(id: string): Promise<void> {
    try {
      await apiClient.put(`/api/notifications/${id}/read`);
    } catch (err) {
      console.warn('Mark read error:', err);
    }
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.notify();
  }

  public async markAllAsRead(): Promise<void> {
    this.notifications = this.notifications.map((n) => ({ ...n, isRead: true }));
    this.notify();
  }

  public async createNotification(data: {
    collegeId: string;
    title: string;
    message: string;
    category: NotificationCategory;
    priority: NotificationPriority;
    routeId?: string;
    busId?: string;
  }): Promise<CampusNotification> {
    try {
      const res = await apiClient.post<CampusNotification>('/api/notifications/broadcast', data);
      this.notifications.unshift(res);
      this.notify();
      return res;
    } catch {
      const newNotif: CampusNotification = {
        id: 'notif_' + Date.now().toString(),
        ...data,
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      this.notifications.unshift(newNotif);
      this.notify();
      return newNotif;
    }
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.notifications));
  }
}

export const notificationService = new NotificationService();
