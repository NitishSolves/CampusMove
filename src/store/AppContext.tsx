import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  User,
  UserRole,
  College,
  Bus,
  Route,
  Trip,
  CampusNotification,
  EmergencyAlert,
} from '../types';
import { authService } from '../services/authService';
import { apiClient } from '../services/apiClient';
import { realtimeService } from '../services/realtimeService';
import { routeService } from '../services/routeService';
import { tripService } from '../services/tripService';
import { locationService, LocationServiceState } from '../services/locationService';
import { notificationService } from '../services/notificationService';
import { adminService } from '../services/adminService';
import { mockColleges, defaultCollege } from '../mock/colleges';

interface AppContextType {
  currentUser: User | null;
  role: UserRole;
  currentCollege: College;
  colleges: College[];
  switchCollege: (collegeId: string) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  loginAs: (role: UserRole) => Promise<void>;

  // Data
  buses: Bus[];
  routes: Route[];
  trips: Trip[];
  activeTrip: Trip | null;
  notifications: CampusNotification[];
  unreadCount: number;
  emergencyAlerts: EmergencyAlert[];
  activeEmergencyCount: number;

  // Location / GPS / Network
  locationState: LocationServiceState;
  toggleSimulatedOffline: (simulate: boolean) => void;

  // Refresh & Reset
  refreshData: () => Promise<void>;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [currentCollege, setCurrentCollege] = useState<College>(defaultCollege);
  const [buses, setBuses] = useState<Bus[]>(realtimeService.getBuses());
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>(tripService.getTripHistory());
  const [activeTrip, setActiveTrip] = useState<Trip | null>(tripService.getActiveTrip());
  const [notifications, setNotifications] = useState<CampusNotification[]>(notificationService.getNotifications());
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>(adminService.getEmergencyAlerts());
  const [locationState, setLocationState] = useState<LocationServiceState>(locationService.getState());

  useEffect(() => {
    if (currentUser?.collegeId) {
      const found = mockColleges.find((c) => c.id === currentUser.collegeId);
      if (found) {
        setCurrentCollege(found);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    // Subscriptions
    const unsubAuth = authService.subscribe(setCurrentUser);
    const unsubBuses = realtimeService.subscribeBuses(setBuses);
    const unsubTrips = tripService.subscribeActiveTrip((trip) => {
      setActiveTrip(trip);
      setTrips(tripService.getTripHistory());
    });
    const unsubLoc = locationService.subscribe(setLocationState);
    const unsubNotif = notificationService.subscribe(setNotifications);
    const unsubAlerts = adminService.subscribeAlerts(setEmergencyAlerts);

    // Initial load
    routeService.getRoutes().then(setRoutes);

    return () => {
      unsubAuth();
      unsubBuses();
      unsubTrips();
      unsubLoc();
      unsubNotif();
      unsubAlerts();
    };
  }, []);

  // Trip Recovery After Disconnect (Task 2.3)
  useEffect(() => {
    const recoverActiveTrip = async () => {
      try {
        const response = await apiClient.get<{ activeTrip: Trip | null }>('/api/trips/active');
        if (response && response.activeTrip) {
          setActiveTrip(response.activeTrip);
          if (response.activeTrip.status === 'IN_PROGRESS') {
            locationService.startTracking(
              response.activeTrip.id,
              response.activeTrip.busId,
              currentUser?.id || ''
            );
          }
        }
      } catch (err) {
        console.warn('Failed to recover active trip on connect:', err);
      }
    };

    if (currentUser?.role === 'DRIVER') {
      recoverActiveTrip();
    }
  }, [currentUser]);

  // Persistent storage for active trip
  useEffect(() => {
    if (activeTrip) {
      localStorage.setItem('smart_campus_bus_active_trip', JSON.stringify(activeTrip));
    } else {
      localStorage.removeItem('smart_campus_bus_active_trip');
    }
  }, [activeTrip]);

  const role: UserRole = currentUser?.role || 'STUDENT';

  const switchRole = (newRole: UserRole) => {
    authService.switchRole(newRole);
  };

  const loginAs = async (targetRole: UserRole) => {
    await authService.login('', targetRole);
  };

  const logout = () => {
    authService.logout();
  };

  const switchCollege = (collegeId: string) => {
    const found = mockColleges.find((c) => c.id === collegeId);
    if (found) {
      setCurrentCollege(found);
    }
  };

  const toggleSimulatedOffline = (simulate: boolean) => {
    locationService.toggleSimulatedOffline(simulate);
  };

  const refreshData = async () => {
    const r = await routeService.getRoutes();
    setRoutes(r);
    setBuses(realtimeService.getBuses());
    setTrips(tripService.getTripHistory());
  };

  const resetAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const activeEmergencyCount = useMemo(
    () => emergencyAlerts.filter((a) => a.status === 'ACTIVE').length,
    [emergencyAlerts]
  );

  const value: AppContextType = {
    currentUser,
    role,
    currentCollege,
    colleges: mockColleges,
    switchCollege,
    switchRole,
    logout,
    loginAs,
    buses,
    routes,
    trips,
    activeTrip,
    notifications,
    unreadCount,
    emergencyAlerts,
    activeEmergencyCount,
    locationState,
    toggleSimulatedOffline,
    refreshData,
    resetAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
