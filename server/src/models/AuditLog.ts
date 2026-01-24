import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../lib/db';

export interface AuditLogAttributes {
  id: number;
  actorId: number | null;
  actorUsername: string | null;
  action: string; // e.g., 'create','update','delete','reset_password','disable','enable'
  entityType: string; // e.g., 'user','visitor','personnel'
  entityId: number | null;
  details?: object | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type AuditLogCreation = Optional<AuditLogAttributes, 'id'|'actorId'|'actorUsername'|'entityId'|'details'>;

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreation> implements AuditLogAttributes {
  declare id: number;
  declare actorId: number | null;
  declare actorUsername: string | null;
  declare action: string;
  declare entityType: string;
  declare entityId: number | null;
  declare details: object | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    actorId: { type: DataTypes.INTEGER, allowNull: true, field: 'actor_id' },
    actorUsername: { type: DataTypes.STRING(64), allowNull: true, field: 'actor_username' },
    action: { type: DataTypes.STRING(32), allowNull: false },
    entityType: { type: DataTypes.STRING(32), allowNull: false, field: 'entity_type' },
    entityId: { type: DataTypes.INTEGER, allowNull: true, field: 'entity_id' },
    details: { type: DataTypes.JSONB, allowNull: true },
  },
  { sequelize, tableName: 'audit_logs', underscored: true }
);
