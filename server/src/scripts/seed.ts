import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sequelize } from '../lib/db';
import { Role } from '../models/Role';
import { User } from '../models/User';
import { syncSchema } from '../models';

async function main() {
  await sequelize.authenticate();
  await syncSchema();

  const roles = ['admin', 'officer', 'staff'] as const;
  for (const name of roles) {
    await Role.findOrCreate({ where: { name } });
  }

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const role = await Role.findOne({ where: { name: 'admin' } });
  if (!role) throw new Error('Admin role missing');

  const passwordHash = await bcrypt.hash(password, 10);
  await User.findOrCreate({
    where: { username },
    defaults: { username, passwordHash, roleId: role.id },
  });

  console.log('Seed complete. Admin:', username);
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
