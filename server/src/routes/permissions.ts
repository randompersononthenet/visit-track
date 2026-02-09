import { Router } from 'express';
import { Permission } from '../models/Permission';
import { requirePermission } from '../middleware/permissions';

import { requireAuth } from '../middleware/auth';

const router = Router();

// Only those who can manage roles can see available permissions
router.use(requireAuth);
router.use(requirePermission('roles:manage'));

router.get('/', async (req, res) => {
    try {
        const perms = await Permission.findAll({ order: [['slug', 'ASC']] });
        res.json(perms);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

export default router;
