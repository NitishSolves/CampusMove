import { User, UserRole } from '../types';
import { apiClient, setStoredToken, getStoredToken } from './apiClient';
import { socketService } from './socketService';

const AUTH_STORAGE_KEY = 'smart_campus_bus_auth_user';

class AuthService {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch {
        this.currentUser = null;
      }
    }

    // If user has token, verify profile with backend asynchronously
    if (getStoredToken()) {
      this.validateSession();
    } else {
      // Default demo user on fresh visit
      this.login('alex.chen@apex.edu', 'STUDENT').catch(() => {
        // Fallback default
      });
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public async login(
    email: string,
    role?: UserRole
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await apiClient.post<{ token: string; user: User }>('/api/auth/login', {
        email,
        role,
      });

      setStoredToken(res.token);
      this.currentUser = res.user;
      this.saveSession();
      this.notifyListeners();

      // Connect or join socket room for user's college
      socketService.connect(res.user.collegeId);

      return { success: true, user: res.user };
    } catch (err: any) {
      console.warn('API Login error:', err.message);
      return { success: false, error: err.message || 'Login failed.' };
    }
  }

  public async switchRole(role: UserRole): Promise<User | null> {
    try {
      const res = await apiClient.post<{ token: string; user: User }>('/api/auth/switch-role', {
        role,
        collegeId: this.currentUser?.collegeId || 'college_apex',
      });

      setStoredToken(res.token);
      this.currentUser = res.user;
      this.saveSession();
      this.notifyListeners();

      socketService.connect(res.user.collegeId);
      return res.user;
    } catch (err: any) {
      console.error('Role switch failed:', err);
      return this.currentUser;
    }
  }

  public logout(): void {
    setStoredToken(null);
    this.currentUser = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.notifyListeners();
  }

  public async getDemoAccounts(): Promise<{ role: UserRole; name: string; email: string; hint: string }[]> {
    try {
      return await apiClient.get('/api/auth/demo-accounts');
    } catch {
      return [
        { role: 'STUDENT', name: 'Alex Chen', email: 'alex.chen@apex.edu', hint: 'View live bus map, routes & ETAs' },
        { role: 'DRIVER', name: 'Marcus Vance', email: 'marcus.vance@transit.apex.edu', hint: 'Real GPS trip tracking & offline sync' },
        { role: 'ADMIN', name: 'Sarah Jenkins', email: 'admin@apex.edu', hint: 'Fleet map, routes, buses & announcements' },
      ];
    }
  }

  private async validateSession(): Promise<void> {
    try {
      const res = await apiClient.get<{ user: User }>('/api/auth/me');
      if (res.user) {
        this.currentUser = res.user;
        this.saveSession();
        this.notifyListeners();
        socketService.connect(res.user.collegeId);
      }
    } catch {
      // Token invalid or expired, clear session
      this.logout();
    }
  }

  private saveSession(): void {
    if (this.currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l(this.currentUser));
  }
}

export const authService = new AuthService();
