
import { config } from 'dotenv';
config();

const API_URL = 'http://localhost:4000/api';
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'Visittrack2024!'; // Default per README/env.example if missing

async function main() {
    console.log('Verifying permissions...');

    // 1. Login as Admin
    console.log('Logging in as admin...');
    const adminRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS })
    });

    if (!adminRes.ok) {
        console.error('Failed to login as admin', await adminRes.text());
        process.exit(1);
    }

    const adminData = await adminRes.json() as any;
    const adminToken = adminData.token;
    console.log('Admin logged in. Token received.');

    // 2. Create Test Role
    const roleName = `test-role-${Date.now()}`;
    console.log(`Creating role: ${roleName}...`);
    const roleRes = await fetch(`${API_URL}/roles`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            name: roleName,
            permissions: ['visitors:view'] // Start with view only
        })
    });

    if (!roleRes.ok) {
        console.error('Failed to create role', await roleRes.text());
        process.exit(1);
    }

    const roleData = await roleRes.json() as any;
    const roleId = roleData.id;
    console.log(`Role created. ID: ${roleId}`);

    // 3. Create Test User
    const testUser = `testuser-${Date.now()}`;
    const testPass = 'password123';
    console.log(`Creating user: ${testUser}...`);
    // Note: users endpoint expects 'role' as name (string)! 
    // Wait, my users endpoint implementation:
    // router.post('/', ... { role } = req.body ... roleName = String(role).toLowerCase() ... Role.findOne({ where: { name: roleName } })
    // So I must pass the role NAME.

    // Wait, my users endpoint restricts role to 'staff', 'officer'?
    // Let's check users.ts
    // Line 24: if (!['staff','officer'].includes(roleName)) ... return error Invalid role.
    // Oh no! The users endpoint is HARDCODED to allow only 'staff' or 'officer'!
    // I need to fix users.ts to allow dynamic roles!

    console.log('Checking users endpoint restriction...');
    // If verifying fails here, I know I found a bug/missing migration.

    const userRes = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            username: testUser,
            password: testPass,
            role: roleName
        })
    });

    if (!userRes.ok) {
        console.error('Failed to create user (expected if users.ts restriction is not lifted)', await userRes.text());
        // I will not exit here, but mark as failure.
        // Actually I should fix the code.
    } else {
        console.log('User created successfully.');
    }

    // If user creation failed, I can't proceed with login as test user.
    // I will check if I should update users.ts first.
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
