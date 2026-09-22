import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return 'campusmove_production_fallback_jwt_secret_key_minimum_64_characters_long_for_serverless_deployments';
  }

  return secret;
}

export interface AuthenticatedUser {
  userId: string;
  collegeId: string;
  role: 'STUDENT' | 'DRIVER' | 'ADMIN';
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function signToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      userId: user.userId,
      collegeId: user.collegeId,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthenticatedUser | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthenticatedUser;
  } catch (err) {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
    return;
  }

  req.user = decoded;
  next();
}

export function requireRole(allowedRoles: ('STUDENT' | 'DRIVER' | 'ADMIN')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access forbidden: role '${req.user.role}' is not authorized for this endpoint. Required: [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
}

export function enforceTenantIsolation(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  // If request targets a specific college ID parameter or body field, enforce match with user's college
  const targetCollegeId = req.params.collegeId || req.query.collegeId || req.body?.collegeId;

  if (targetCollegeId && targetCollegeId !== req.user.collegeId) {
    res.status(403).json({
      error: `Multi-Tenant Isolation Breach: You cannot access operational transportation data of college '${targetCollegeId}' with credentials from '${req.user.collegeId}'.`,
    });
    return;
  }

  next();
}
