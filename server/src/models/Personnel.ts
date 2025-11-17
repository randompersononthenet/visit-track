import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../lib/db';

export interface PersonnelAttributes {
  id: number;
  fullName: string;
  roleTitle?: string | null;
  qrCode?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type PersonnelCreation = Optional<PersonnelAttributes, 'id'>;

export class Personnel extends Model<PersonnelAttributes, PersonnelCreation> implements PersonnelAttributes {
  declare id: number;
  declare fullName: string;
  declare roleTitle: string | null | undefined;
  declare qrCode: string | null | undefined;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Personnel.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    fullName: { type: DataTypes.STRING(150), allowNull: false, field: 'full_name' },
    roleTitle: { type: DataTypes.STRING(100), allowNull: true, field: 'role_title' },
    qrCode: { type: DataTypes.STRING(200), allowNull: true, unique: true, field: 'qr_code' },
  },
  { sequelize, tableName: 'personnel', underscored: true }
);
