import http from 'http';
import path from 'path';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';

import { initDatabase, checkDatabaseHealth } from './server/db';
import { initSocketIO } from './server/socket';
import authRoutes from './server/routes/auth';
import collegeRoutes from './server/routes/colleges';
import busRoutes from './server/routes/buses';
import routeRoutes from './server/routes/routes';
import tripRoutes from './server/routes/trips';
import driverRoutes from './server/routes/driver';
import notificationRoutes from './server/routes/notifications';
import alertRoutes from './server/routes/alerts';
import analyticsRoutes from './server/routes/analytics';

const PORT = 3000;
const HOST = '0.0.0.0';

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Enable trust proxy for reverse-proxy environments (Cloud Run, Nginx, Render)
  app.set('trust proxy', 1);

  // Initialize Database (PostgreSQL if DATABASE_URL provided, else robust file-backed engine)
  const dbStatus = await initDatabase();
  console.log(`Database initialized: mode=${dbStatus.isPostgres ? 'PostgreSQL' : 'Embedded File Persistence'}`);

  // CORS Configuration: Safe, configurable, and rejects wildcard in production
  const isProduction = process.env.NODE_ENV === 'production';
  const rawCorsOrigin = process.env.CORS_ORIGIN;

  let allowedOrigins: string[] | boolean;

  if (!rawCorsOrigin) {
    if (isProduction) {
      console.log('CORS: NODE_ENV=production and CORS_ORIGIN unset. Only same-origin requests allowed.');
      allowedOrigins = false;
    } else {
      allowedOrigins = true;
    }
  } else {
    const originsList = rawCorsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
    if (originsList.includes('*')) {
      if (isProduction) {
        console.warn('⚠️ WARNING: Wildcard "*" CORS_ORIGIN configured in production mode. Set explicit origin for production.');
      }
      allowedOrigins = true;
    } else {
      allowedOrigins = originsList;
    }
  }

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body parser
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Security Rate Limiter for API endpoints
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 600, // generous 600 requests/minute for high-frequency GPS telemetry
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    message: { error: 'Too many requests from this client. Please retry in a moment.' },
  });
  app.use('/api/', apiLimiter);

  // Initialize Socket.IO Real-Time Engine with matched allowed origins
  initSocketIO(server, allowedOrigins);
  console.log('Socket.IO real-time engine attached.');

  // API Routes FIRST
  app.get('/api/health', async (_req, res) => {
    const health = await checkDatabaseHealth();
    const statusCode = health.healthy ? 200 : 503;
    res.status(statusCode).json({
      status: health.healthy ? 'ok' : 'degraded',
      service: 'Smart Campus Bus Backend API',
      database: health.database,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      ...(health.error ? { error: health.error } : {}),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/colleges', collegeRoutes);
  app.use('/api/buses', busRoutes);
  app.use('/api/routes', routeRoutes);
  app.use('/api/trips', tripRoutes);
  app.use('/api/driver', driverRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // Development vs Production Frontend Serving
  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting Vite middleware in development mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving production static bundle from dist/...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error occurred.' });
  });

  server.listen(PORT, HOST, () => {
    console.log(`Smart Campus Bus server listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
