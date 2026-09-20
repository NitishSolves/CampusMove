import { Route, Stop } from '../types';
import { apiClient } from './apiClient';
import { mockRoutes, mockStops } from '../mock/routes';

class RouteService {
  private routes: Route[] = [...mockRoutes];
  private stops: Stop[] = [...mockStops];

  constructor() {
    this.fetchRoutesFromApi();
  }

  public async fetchRoutesFromApi(): Promise<Route[]> {
    try {
      const data = await apiClient.get<Route[]>('/api/routes');
      if (Array.isArray(data) && data.length > 0) {
        this.routes = data;
        const allStops: Stop[] = [];
        data.forEach((r) => {
          if (Array.isArray(r.stops)) allStops.push(...r.stops);
        });
        if (allStops.length > 0) this.stops = allStops;
        return this.routes;
      }
    } catch (err) {
      console.warn('Could not fetch routes from API:', err);
    }
    return this.routes;
  }

  public async getRoutes(): Promise<Route[]> {
    return this.fetchRoutesFromApi();
  }

  public async getRouteById(id: string): Promise<Route | undefined> {
    try {
      const route = await apiClient.get<Route>(`/api/routes/${id}`);
      return route;
    } catch {
      return this.routes.find((r) => r.id === id);
    }
  }

  public async getStops(): Promise<Stop[]> {
    return [...this.stops];
  }

  public async createRoute(routeData: Omit<Route, 'id'>): Promise<Route> {
    try {
      const created = await apiClient.post<Route>('/api/routes', routeData);
      this.routes.push(created);
      return created;
    } catch (err) {
      console.warn('Backend create route error:', err);
      const newRoute: Route = {
        ...routeData,
        id: 'route_' + Date.now().toString().slice(-4),
      };
      this.routes.push(newRoute);
      return newRoute;
    }
  }

  public async updateRoute(id: string, updates: Partial<Route>): Promise<Route | undefined> {
    const idx = this.routes.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;

    this.routes[idx] = {
      ...this.routes[idx],
      ...updates,
    };
    return this.routes[idx];
  }

  public async deleteRoute(id: string): Promise<boolean> {
    this.routes = this.routes.filter((r) => r.id !== id);
    return true;
  }

  public async addStopToRoute(routeId: string, stop: Stop): Promise<Route | undefined> {
    const route = await this.getRouteById(routeId);
    if (!route) return undefined;

    const updatedStops = [...route.stops, stop];
    return this.updateRoute(routeId, { stops: updatedStops });
  }

  public async reorderStops(routeId: string, orderedStopIds: string[]): Promise<Route | undefined> {
    const route = await this.getRouteById(routeId);
    if (!route) return undefined;

    const stopMap = new Map(route.stops.map((s) => [s.id, s]));
    const newStops: Stop[] = [];

    orderedStopIds.forEach((id, index) => {
      const stop = stopMap.get(id);
      if (stop) {
        newStops.push({ ...stop, sequence: index + 1 });
      }
    });

    return this.updateRoute(routeId, { stops: newStops });
  }
}

export const routeService = new RouteService();
