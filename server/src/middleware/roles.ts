// Role-based access control middleware: allows only specified roles
// Use after `requireAuth` so `req.user.role` is present.
import type { Request, Response, NextFunction } from 'express';

/**
 * Ensure the authenticated user has one of the allowed roles.
 * Returns 401 if unauthenticated, 403 if role not permitted.
 */
export function requireRole(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as { role?: string } | undefined;
    if (!user || !user.role) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowed.includes(user.role)) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };
}
