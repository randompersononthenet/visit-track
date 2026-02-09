import 'dotenv/config';
import { sequelize } from '../lib/db';
import { Permission } from '../models/Permission';
import { Role } from '../models/Role';
import { syncSchema } from '../models';

const PERMISSIONS = [
    // Visitors
    { slug: 'visitors:view', description: 'View visitors' },
    { slug: 'visitors:create', description: 'Create visitors' },
    { slug: 'visitors:update', description: 'Update visitors' },
    { slug: 'visitors:delete', description: 'Delete visitors (soft)' },
    { slug: 'visitors:delete:hard', description: 'Permanently delete visitors' },
    { slug: 'visitors:restore', description: 'Restore soft-deleted visitors' },

    // Personnel
    { slug: 'personnel:view', description: 'View personnel' },
    { slug: 'personnel:create', description: 'Create personnel' },
    { slug: 'personnel:update', description: 'Update personnel' },
    { slug: 'personnel:delete', description: 'Delete personnel (soft)' },
    { slug: 'personnel:delete:hard', description: 'Permanently delete personnel' },
    { slug: 'personnel:restore', description: 'Restore soft-deleted personnel' },

    // Logs & Reports
    { slug: 'logs:view', description: 'View visit logs' },
    { slug: 'reports:view', description: 'View reports' },

    // Analytics
    { slug: 'analytics:view', description: 'View analytics dashboard' },

    // Users & Roles
    { slug: 'users:manage', description: 'Manage users' },
    { slug: 'roles:manage', description: 'Manage dynamic roles and permissions' },
    { slug: 'audit:view', description: 'View audit logs' },

    // Operations
    { slug: 'scan:perform', description: 'Perform QR scans' },
    { slug: 'prereg:manage', description: 'Manage pre-registrations' },
    { slug: 'uploads:manage', description: 'Manage uploads' },
    { slug: 'violations:view', description: 'View violations' },
    { slug: 'violations:manage', description: 'Manage violations (create/edit/delete)' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
    admin: ['*'],
    staff: [
        'visitors:view', 'visitors:create', 'visitors:update', 'visitors:delete', 'visitors:restore',
        'personnel:view', 'personnel:create', 'personnel:update', 'personnel:delete', 'personnel:restore',
        'scan:perform', 'prereg:manage', 'uploads:manage',
        'logs:view', 'reports:view', 'analytics:view',
        'violations:view', 'violations:manage'
    ],
    officer: [
        'visitors:view', 'personnel:view', 'scan:perform', 'violations:view'
    ],
    warden: [
        'visitors:view', 'personnel:view', 'logs:view', 'reports:view', 'analytics:view'
    ],
    analyst: [
        'visitors:view', 'personnel:view', 'logs:view', 'reports:view', 'analytics:view'
    ]
};

async function main() {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Syncing schema...');
    await syncSchema();

    // 1. Create permissions
    const permissionMap = new Map<string, Permission>();
    for (const p of PERMISSIONS) {
        const [perm] = await Permission.findOrCreate({
            where: { slug: p.slug },
            defaults: p
        });
        permissionMap.set(p.slug, perm);
    }
    console.log(`Ensured ${permissionMap.size} permissions exist.`);

    // 2. Assign to roles
    for (const [roleName, slugs] of Object.entries(ROLE_PERMISSIONS)) {
        const role = await Role.findOne({ where: { name: roleName } });
        if (!role) {
            console.warn(`Role ${roleName} not found, skipping assignment.`);
            // If roles don't exist yet (fresh install), we might want to create them.
            // But assuming existing install, we skip.
            // If we want to support fresh install, we should create them.
            // let's create them if they don't exist, just in case.
            const [newRole] = await Role.findOrCreate({ where: { name: roleName } });
            await assignPermissions(newRole, slugs, permissionMap);
        } else {
            await assignPermissions(role, slugs, permissionMap);
        }
    }

    console.log('Seeding complete.');
    await sequelize.close();
}

async function assignPermissions(role: Role, slugs: string[], permissionMap: Map<string, Permission>) {
    let toAssign: Permission[] = [];
    if (slugs.includes('*')) {
        toAssign = Array.from(permissionMap.values());
    } else {
        toAssign = slugs.map(s => permissionMap.get(s)).filter(p => !!p) as Permission[];
    }

    // setPermissions comes from mixin
    await (role as any).setPermissions(toAssign);
    console.log(`Assigned ${toAssign.length} permissions to role '${role.name}'`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
