import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../lib/db';
import { Visitor } from './Visitor';
import { Personnel } from './Personnel';
import { User } from './User';

export interface VisitLogAttributes {
  id: number;
  visitorId?: number | null;
  personnelId?: number | null;
  handledByUserId?: number | null;
  timeIn: Date;
  timeOut?: Date | null;
  durationSeconds?: number | null;
  purpose?: string | null;
  notes?: string | null;
}

type VisitLogCreation = Optional<VisitLogAttributes, 'id' | 'timeOut' | 'purpose' | 'notes' | 'visitorId' | 'personnelId' | 'handledByUserId'>;

export class VisitLog extends Model<VisitLogAttributes, VisitLogCreation> implements VisitLogAttributes {
  declare id: number;
  /**
   * Reference to the Visitor. Null if this log is for Personnel.
   * Only one of `visitorId` or `personnelId` should be set.
   */
  declare visitorId: number | null | undefined;
  /**
   * Reference to the Personnel. Null if this log is for a Visitor.
   */
  declare personnelId: number | null | undefined;
  declare handledByUserId: number | null | undefined;
  declare timeIn: Date;
  declare timeOut: Date | null | undefined;
  declare durationSeconds: number | null | undefined;
  declare purpose: string | null | undefined;
  declare notes: string | null | undefined;

  declare visitor?: Visitor;
  declare personnel?: Personnel;
}

VisitLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    visitorId: { type: DataTypes.INTEGER, allowNull: true, field: 'visitor_id', references: { model: 'visitors', key: 'id' } },
    personnelId: { type: DataTypes.INTEGER, allowNull: true, field: 'personnel_id', references: { model: 'personnel', key: 'id' } },
    handledByUserId: { type: DataTypes.INTEGER, allowNull: true, field: 'handled_by_user_id', references: { model: 'users', key: 'id' } },
    timeIn: { type: DataTypes.DATE, allowNull: false, field: 'time_in' },
    timeOut: { type: DataTypes.DATE, allowNull: true, field: 'time_out' },
    durationSeconds: { type: DataTypes.INTEGER, allowNull: true, field: 'duration_seconds' },
    purpose: { type: DataTypes.STRING(150), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize, tableName: 'visit_logs', underscored: true, indexes: [
      { fields: ['visitor_id', 'time_in'] },
      { fields: ['time_in'] }
    ]
  }
);

VisitLog.belongsTo(Visitor, { foreignKey: 'visitorId', as: 'visitor' });
VisitLog.belongsTo(Personnel, { foreignKey: 'personnelId', as: 'personnel' });
VisitLog.belongsTo(User, { foreignKey: 'handledByUserId', as: 'handledBy' });

Visitor.hasMany(VisitLog, { foreignKey: 'visitorId', as: 'visitLogs' });
Personnel.hasMany(VisitLog, { foreignKey: 'personnelId', as: 'visitLogs' });
User.hasMany(VisitLog, { foreignKey: 'handledByUserId', as: 'handledVisitLogs' });
