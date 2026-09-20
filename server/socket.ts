import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from './middleware/auth';

let io: SocketIOServer | null = null;

export function initSocketIO(server: HttpServer, corsOrigin: string | string[] | boolean = true): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: corsOrigin === '*' ? true : corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io/',
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  io.on('connection', (socket: Socket) => {
    // Optional auth token from handshake query or headers
    const token = (socket.handshake.auth?.token || socket.handshake.query?.token) as string;
    let collegeId = (socket.handshake.auth?.collegeId || socket.handshake.query?.collegeId) as string;
    let userRole = 'GUEST';

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        collegeId = decoded.collegeId;
        userRole = decoded.role;
      }
    }

    // Default room subscription
    if (collegeId) {
      socket.join(`college:${collegeId}`);
      if (userRole === 'ADMIN') {
        socket.join(`college:${collegeId}:admin`);
      }
    }

    // Allow client to join explicit college channel (e.g. guest or student switching view)
    socket.on('join:college', (targetCollegeId: string) => {
      if (targetCollegeId) {
        // Leave any previous college rooms
        Array.from(socket.rooms).forEach((r) => {
          if (r.startsWith('college:')) socket.leave(r);
        });
        socket.join(`college:${targetCollegeId}`);
        if (userRole === 'ADMIN') {
          socket.join(`college:${targetCollegeId}:admin`);
        }
      }
    });

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// Broadcasting Helpers
export function broadcastBusUpdate(collegeId: string, busData: any) {
  if (!io) return;
  io.to(`college:${collegeId}`).emit('bus:updated', busData);
}

export function broadcastBusLocation(collegeId: string, locationData: any) {
  if (!io) return;
  io.to(`college:${collegeId}`).emit('bus:location', locationData);
}

export function broadcastOccupancyUpdate(collegeId: string, data: { busId: string; tripId?: string; currentOccupancy: number; capacity: number }) {
  if (!io) return;
  io.to(`college:${collegeId}`).emit('bus:occupancy', data);
}

export function broadcastTripStarted(collegeId: string, tripData: any) {
  if (!io) return;
  io.to(`college:${collegeId}`).emit('trip:started', tripData);
}

export function broadcastTripEnded(collegeId: string, tripData: any) {
  if (!io) return;
  io.to(`college:${collegeId}`).emit('trip:ended', tripData);
}

export function broadcastEmergencyAlert(collegeId: string, alert: any) {
  if (!io) return;
  // Broadcast to all college members so safety banner can alert them
  io.to(`college:${collegeId}`).emit('emergency:alert', alert);
  // Also target the admin room with priority sound/badge
  io.to(`college:${collegeId}:admin`).emit('emergency:admin_alert', alert);
}

export function broadcastEmergencyStatus(collegeId: string, data: any) {
  if (!io) return;
  io.to(`college:${collegeId}`).emit('emergency:status', data);
}

export function broadcastNotification(collegeId: string, notif: any) {
  if (!io) return;
  io.to(`college:${collegeId}`).emit('notification:new', notif);
}
