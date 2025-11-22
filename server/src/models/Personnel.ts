import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../lib/db';

export interface PersonnelAttributes {
  id: number;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  fullName: string;
  roleTitle?: string | null;
  qrCode?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type PersonnelCreation = Optional<PersonnelAttributes, 'id'>;

export class Personnel extends Model<PersonnelAttributes, PersonnelCreation> implements PersonnelAttributes {
  declare id: number;
  declare firstName: string | null | undefined;
  declare middleName: string | null | undefined;
  declare lastName: string | null | undefined;
  declare fullName: string;
  declare roleTitle: string | null | undefined;
  declare qrCode: string | null | undefined;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Personnel.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    firstName: { type: DataTypes.STRING(80), allowNull: true, field: 'first_name' },
    middleName: { type: DataTypes.STRING(80), allowNull: true, field: 'middle_name' },
    lastName: { type: DataTypes.STRING(80), allowNull: true, field: 'last_name' },
    fullName: { type: DataTypes.STRING(150), allowNull: false, field: 'full_name' },
    roleTitle: { type: DataTypes.STRING(100), allowNull: true, field: 'role_title' },
    qrCode: { type: DataTypes.STRING(200), allowNull: true, unique: true, field: 'qr_code' },
  },
  { sequelize, tableName: 'personnel', underscored: true }
);
