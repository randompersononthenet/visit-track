import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sequelize } from '../lib/db';
import { Role } from '../models/Role';
import { User } from '../models/User';
import { syncSchema } from '../models';

async function main() {
  await sequelize.authenticate();
  await syncSchema();

  const roles = ['admin', 'officer', 'staff', 'warden', 'analyst'] as const;
  for (const name of roles) {
    await Role.findOrCreate({ where: { name } });
  }

  async function ensureUser(roleName: typeof roles[number], username: string, password: string) {
    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) throw new Error(`${roleName} role missing`);
    const passwordHash = await bcrypt.hash(password, 10);
    await User.findOrCreate({
      where: { username },
      defaults: { username, passwordHash, roleId: role.id },
    });
  }

  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const staffUser = process.env.STAFF_USERNAME || 'staff';
  const staffPass = process.env.STAFF_PASSWORD || 'staff123';
  const officerUser = process.env.OFFICER_USERNAME || 'officer';
  const officerPass = process.env.OFFICER_PASSWORD || 'officer123';
  const wardenUser = process.env.WARDEN_USERNAME || 'warden';
  const wardenPass = process.env.WARDEN_PASSWORD || 'warden123';
  const analystUser = process.env.ANALYST_USERNAME || 'analyst';
  const analystPass = process.env.ANALYST_PASSWORD || 'analyst123';

  await ensureUser('admin', adminUser, adminPass);
  await ensureUser('staff', staffUser, staffPass);
  await ensureUser('officer', officerUser, officerPass);
  await ensureUser('warden', wardenUser, wardenPass);
  await ensureUser('analyst', analystUser, analystPass);

  console.log('Seed complete. Users created (or existed):', {
    admin: adminUser,
    staff: staffUser,
    officer: officerUser,
    warden: wardenUser,
    analyst: analystUser,
  });
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
