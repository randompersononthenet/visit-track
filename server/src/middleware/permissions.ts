import type { Request, Response, NextFunction } from 'express';
import { Permission } from '../models/Permission';
import { Role } from '../models/Role';

export function requirePermission(slug: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user || !user.roleId) return res.status(401).json({ error: 'Unauthorized' });

        try {
            // Optimization: In a real high-traffic app, we would cache this (e.g., Redis or JWT claims).
            // For now, querying DB is safe and ensures immediate consistency.
            const role = await Role.findByPk(user.roleId, {
                include: [{ model: Permission, as: 'permissions' }]
            });

            if (!role) return res.status(403).json({ error: 'Forbidden: Role not found' });

            // Admin bypass: Admin role always has access (failsafe)
            if (role.name === 'admin') return next();

            const hasPermission = role.permissions?.some(p => p.slug === slug);
            if (hasPermission) return next();

            return res.status(403).json({ error: `Forbidden: Missing permission ${slug}` });
        } catch (err) {
            console.error('Permission check error:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    };
}
