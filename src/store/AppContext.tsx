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

const DEFAULT_COLLEGE: College = {
  id: 'college_apex',
  name: 'Apex State University',
  shortCode: 'ASU',
  campusName: 'Main Campus',
  centerLocation: { lat: 34.0537, lng: -118.2570 },
  defaultZoom: 15,
  timezone: 'America/Los_Angeles',
};

interface AppContextType {
  currentUser: User | null;
  role: UserRole;
  currentCollege: College;
  colleges: College[];
  switchCollege: (collegeId: string) => void;
  logout: () => void;
  isAuthenticated: boolean;

  // Data
  buses: Bus[];
  routes: Route[];
  trips: Trip[];
  activeTrip: Trip | null;
  notifications: CampusNotification[];
  unreadCount: number;
  emergencyAlerts: EmergencyAlert[];
  activeEmergencyCount: number;

  // Loading states
  isLoadingData: boolean;
  dataError: string | null;

  // Location / GPS / Network
  locationState: LocationServiceState;
  toggleSimulatedOffline: (simulateOffline: boolean) => void;

  // Refresh & Reset
  refreshData: () => Promise<void>;
  resetAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [currentCollege, setCurrentCollege] = useState<College>(DEFAULT_COLLEGE);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(tripService.getActiveTrip());
  const [notifications, setNotifications] = useState<CampusNotification[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [locationState, setLocationState] = useState<LocationServiceState>(locationService.getState());
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const isAuthenticated = authService.isAuthenticated();

  // Auth subscription
  useEffect(() => {
    const unsubAuth = authService.subscribe((user) => {
      setCurrentUser(user);
      if (user) {
        // Load data when user is authenticated
        loadAllData();
      } else {
        // Clear all data on logout
        setBuses([]);
        setRoutes([]);
        setTrips([]);
        setActiveTrip(null);
        setNotifications([]);
        setEmergencyAlerts([]);
        setIsLoadingData(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // Data subscriptions (only when authenticated)
  useEffect(() => {
    if (!currentUser) return;

    const unsubBuses = realtimeService.subscribeBuses(setBuses);
    const unsubTrips = tripService.subscribeActiveTrip((trip) => {
      setActiveTrip(trip);
      setTrips(tripService.getTripHistory());
    });
    const unsubLoc = locationService.subscribe(setLocationState);
    const unsubNotif = notificationService.subscribe(setNotifications);
    const unsubAlerts = adminService.subscribeAlerts(setEmergencyAlerts);

    // Load data
    loadAllData();

    return () => {
      unsubBuses();
      unsubTrips();
      unsubLoc();
      unsubNotif();
      unsubAlerts();
    };
  }, [currentUser]);

  // Trip Recovery After Disconnect (for drivers)
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

  const loadAllData = async () => {
    setIsLoadingData(true);
    setDataError(null);
    try {
      const [busesResult, routesResult] = await Promise.all([
        realtimeService.fetchBusesFromApi(),
        routeService.getRoutes(),
      ]);

      if (routesResult) setRoutes(routesResult);
      // Buses are auto-set through subscription

      setIsLoadingData(false);
    } catch (err: any) {
      setDataError(err.message || 'Failed to load data.');
      setIsLoadingData(false);
    }
  };

  const logout = () => {
    authService.logout();
  };

  const switchCollege = (collegeId: string) => {
    // In production, this would fetch the college data and associated resources
    setCurrentCollege(DEFAULT_COLLEGE);
  };

  const refreshData = async () => {
    await loadAllData();
    setBuses(realtimeService.getBuses());
    setTrips(tripService.getTripHistory());
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const activeEmergencyCount = useMemo(
    () => emergencyAlerts.filter((a) => a.status === 'ACTIVE').length,
    [emergencyAlerts]
  );

  const toggleSimulatedOffline = (simulateOffline: boolean) => {
    locationService.toggleSimulatedOffline(simulateOffline);
  };

  const resetAllData = async () => {
    localStorage.clear();
    locationService.stopTracking();
    await loadAllData();
  };

  const value: AppContextType = {
    currentUser,
    role,
    currentCollege,
    colleges: [DEFAULT_COLLEGE],
    switchCollege,
    logout,
    isAuthenticated,
    buses,
    routes,
    trips,
    activeTrip,
    notifications,
    unreadCount,
    emergencyAlerts,
    activeEmergencyCount,
    isLoadingData,
    dataError,
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
