import { Router } from 'express';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { requirePermission } from '../middleware/permissions';

import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.use(requirePermission('roles:manage'));

router.get('/', async (req, res) => {
    try {
        const roles = await Role.findAll({
            include: [{ model: Permission, as: 'permissions' }],
            order: [['id', 'ASC']]
        });
        res.json(roles);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

router.post('/', async (req, res) => {
    const { name, permissions } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    try {
        const role = await Role.create({ name });
        if (permissions && Array.isArray(permissions)) {
            const perms = await Permission.findAll({ where: { slug: permissions } });
            await (role as any).setPermissions(perms);
        }
        const result = await Role.findByPk(role.id, { include: ['permissions'] });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, permissions } = req.body;

    try {
        const role = await Role.findByPk(id);
        if (!role) return res.status(404).json({ error: 'Role not found' });

        // Prevent renaming admin role to something else if we rely on 'admin' slug checks?
        // Actually we rely on 'role.name === admin' bypass. So we should probably prevent renaming 'admin'.
        if (role.name === 'admin' && name && name !== 'admin') {
            return res.status(400).json({ error: 'Cannot rename the admin role' });
        }

        if (name) await role.update({ name });
        if (permissions && Array.isArray(permissions)) {
            const perms = await Permission.findAll({ where: { slug: permissions } });
            await (role as any).setPermissions(perms);
        }

        await role.reload({ include: ['permissions'] });
        res.json(role);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const role = await Role.findByPk(id);
        if (!role) return res.status(404).json({ error: 'Role not found' });

        if (role.name === 'admin') {
            return res.status(403).json({ error: 'Cannot delete admin role' });
        }

        await role.destroy();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

export default router;
