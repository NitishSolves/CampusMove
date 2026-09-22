import { Route, Stop } from '../types';
import { apiClient } from './apiClient';

class RouteService {
  private routes: Route[] = [];
  private stops: Stop[] = [];

  constructor() { this.fetchRoutesFromApi(); }

  public async fetchRoutesFromApi(): Promise<Route[]> {
    try {
      const data = await apiClient.get<Route[]>('/api/routes');
      if (Array.isArray(data) && data.length > 0) {
        this.routes = data;
        const allStops: Stop[] = [];
        data.forEach((r) => { if (Array.isArray(r.stops)) allStops.push(...r.stops); });
        if (allStops.length > 0) this.stops = allStops;
      }
    } catch (err) { console.warn('Could not fetch routes:', err); }
    return this.routes;
  }

  public async getRoutes(): Promise<Route[]> { return this.fetchRoutesFromApi(); }

  public async getRouteById(id: string): Promise<Route | undefined> {
    try { return await apiClient.get<Route>(`/api/routes/${id}`); }
    catch { return this.routes.find((r) => r.id === id); }
  }

  public async getStops(): Promise<Stop[]> { return [...this.stops]; }

  public async createRoute(routeData: Omit<Route, 'id'>): Promise<Route> {
    try {
      const created = await apiClient.post<Route>('/api/routes', routeData);
      this.routes.push(created); return created;
    } catch {
      const nr: Route = { ...routeData, id: 'route_' + Date.now().toString().slice(-4) };
      this.routes.push(nr); return nr;
    }
  }

  public async updateRoute(id: string, updates: Partial<Route>): Promise<Route | undefined> {
    const idx = this.routes.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.routes[idx] = { ...this.routes[idx], ...updates };
    return this.routes[idx];
  }

  public async deleteRoute(id: string): Promise<boolean> {
    this.routes = this.routes.filter((r) => r.id !== id); return true;
  }

  public async addStopToRoute(routeId: string, stop: Stop): Promise<Route | undefined> {
    const route = await this.getRouteById(routeId);
    if (!route) return undefined;
    return this.updateRoute(routeId, { stops: [...route.stops, stop] });
  }

  public async reorderStops(routeId: string, orderedStopIds: string[]): Promise<Route | undefined> {
    const route = await this.getRouteById(routeId);
    if (!route) return undefined;
    const sm = new Map(route.stops.map((s) => [s.id, s]));
    const ns: Stop[] = [];
    orderedStopIds.forEach((id, i) => { const s = sm.get(id); if (s) ns.push({ ...s, sequence: i + 1 }); });
    return this.updateRoute(routeId, { stops: ns });
  }
}
export const routeService = new RouteService();
