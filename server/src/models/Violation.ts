import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../lib/db';
import { Visitor } from './Visitor';

export interface ViolationAttributes {
  id: number;
  visitorId: number;
  level: string;
  details?: string | null;
  recordedAt: Date;
}

type ViolationCreation = Optional<ViolationAttributes, 'id' | 'details' | 'recordedAt'>;

export class Violation extends Model<ViolationAttributes, ViolationCreation> implements ViolationAttributes {
  declare id: number;
  declare visitorId: number;
  declare level: string;
  declare details: string | null | undefined;
  declare recordedAt: Date;
}

Violation.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    visitorId: { type: DataTypes.INTEGER, allowNull: false, field: 'visitor_id', references: { model: 'visitors', key: 'id' } },
    level: { type: DataTypes.STRING(50), allowNull: false },
    details: { type: DataTypes.TEXT, allowNull: true },
    recordedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'recorded_at' },
  },
  { sequelize, tableName: 'violations', underscored: true }
);

Violation.belongsTo(Visitor, { foreignKey: 'visitorId', as: 'visitor' });
Visitor.hasMany(Violation, { foreignKey: 'visitorId', as: 'violations' });
