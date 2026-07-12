import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: { id: string; role: 'admin' | 'user'; department?: string };
}

export const JWT_SECRET = process.env.JWT_SECRET || 'change-this-hackathon-secret';

/**
 * Verifies the JWT sent as `Authorization: Bearer <token>` and attaches the
 * decoded payload ({ id, role, department }) to req.user.
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = payload as AuthRequest['user'];
    next();
  });
}

/**
 * RBAC: EcoSphere Admin ("Manager") only.
 * Admins: master data, challenge lifecycle, CSR/Challenge approvals,
 * governance (audits/compliance issues), full reports access.
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  next();
}

/**
 * RBAC: any authenticated user (Admin OR standard Employee).
 * Used to guard "must be logged in" routes where both roles are allowed but
 * the ACTUAL data returned/scoped differs by role (handled inside the route
 * handler itself, e.g. "employees only see their own participation records").
 */
export function requireUser(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  next();
}
