import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../lib/db';

export interface VisitorAttributes {
  id: number;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  fullName: string;
  contact?: string | null;
  idNumber?: string | null;
  relation?: string | null;
  qrCode?: string | null;
  photoUrl?: string | null;
  blacklistStatus?: boolean | null;
  riskLevel?: 'none' | 'low' | 'medium' | 'high' | null;
  flagReason?: string | null;
  flagUpdatedBy?: number | null;
  flagUpdatedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type VisitorCreation = Optional<VisitorAttributes, 'id'>;

export class Visitor extends Model<VisitorAttributes, VisitorCreation> implements VisitorAttributes {
  declare id: number;
  declare firstName: string | null | undefined;
  declare middleName: string | null | undefined;
  declare lastName: string | null | undefined;
  declare fullName: string;
  declare contact: string | null | undefined;
  declare idNumber: string | null | undefined;
  declare relation: string | null | undefined;
  declare qrCode: string | null | undefined;
  declare photoUrl: string | null | undefined;
  declare blacklistStatus: boolean | null | undefined;
  declare riskLevel: 'none' | 'low' | 'medium' | 'high' | null | undefined;
  declare flagReason: string | null | undefined;
  declare flagUpdatedBy: number | null | undefined;
  declare flagUpdatedAt: Date | null | undefined;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Visitor.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    firstName: { type: DataTypes.STRING(80), allowNull: true, field: 'first_name' },
    middleName: { type: DataTypes.STRING(80), allowNull: true, field: 'middle_name' },
    lastName: { type: DataTypes.STRING(80), allowNull: true, field: 'last_name' },
    fullName: { type: DataTypes.STRING(150), allowNull: false, field: 'full_name' },
    contact: { type: DataTypes.STRING(100), allowNull: true },
    idNumber: { type: DataTypes.STRING(100), allowNull: true, unique: false, field: 'id_number' },
    relation: { type: DataTypes.STRING(200), allowNull: true },
    qrCode: { type: DataTypes.STRING(200), allowNull: true, unique: true, field: 'qr_code' },
    photoUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'photo_url' },
    blacklistStatus: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false, field: 'blacklist_status' },
    riskLevel: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'none', field: 'risk_level' },
    flagReason: { type: DataTypes.TEXT, allowNull: true, field: 'flag_reason' },
    flagUpdatedBy: { type: DataTypes.INTEGER, allowNull: true, field: 'flag_updated_by' },
    flagUpdatedAt: { type: DataTypes.DATE, allowNull: true, field: 'flag_updated_at' },
  },
  { sequelize, tableName: 'visitors', underscored: true, indexes: [
    // Ensure no duplicates when contact is provided: names are normalized to uppercase in routes
    {
      unique: true,
      fields: ['first_name', 'middle_name', 'last_name', 'contact'],
      where: { contact: { [Op.ne]: null } },
      name: 'uniq_visitors_name_contact_when_contact_not_null'
    }
  ] }
);
