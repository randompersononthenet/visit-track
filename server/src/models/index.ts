import { sequelize } from '../lib/db';
export { Permission } from './Permission';
export { RolePermission } from './RolePermission';
export { Role } from './Role';
export { User } from './User';
export { Visitor } from './Visitor';
export { Personnel } from './Personnel';
export { VisitLog } from './VisitLog';
export { Violation } from './Violation';
export { AuditLog } from './AuditLog';

export async function syncSchema() {
  const shouldSync = process.env.SYNC_DB === 'true' || process.env.NODE_ENV === 'development';
  if (!shouldSync) return;
  await sequelize.sync({ alter: true });
  console.log('Database schema synced');
}
