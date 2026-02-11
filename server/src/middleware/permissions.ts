import type { Request, Response, NextFunction } from 'express';
import { Permission } from '../models/Permission';
import { Role } from '../models/Role';

export function requirePermission(slug: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user || !user.roleId) return res.status(401).json({ error: 'Unauthorized' });

        try {
            const role = await Role.findByPk(user.roleId, {
                include: [{ model: Permission, as: 'permissions' }]
            });

            if (!role) {
                return res.status(403).json({ error: 'Forbidden: Role not found' });
            }

            // Super Admin Bypass: The 'admin' role has implicit access to everything.
            if (role.name === 'admin') return next();

            // Check if the user's role has the required permission slug.
            const hasPermission = role.permissions?.some(p => p.slug === slug);
            if (hasPermission) return next();

            return res.status(403).json({ error: `Forbidden: Missing permission ${slug}` });
        } catch (err) {
            console.error('Permission check error:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    };
}
