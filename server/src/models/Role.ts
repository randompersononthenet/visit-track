import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../lib/db';

export interface RoleAttributes {
  id: number;
  name: 'admin' | 'officer' | 'staff';
}

type RoleCreation = Optional<RoleAttributes, 'id'>;

export class Role extends Model<RoleAttributes, RoleCreation> implements RoleAttributes {
  declare id: number;
  declare name: 'admin' | 'officer' | 'staff';
}

Role.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.ENUM('admin', 'officer', 'staff'), allowNull: false, unique: true },
  },
  { sequelize, tableName: 'roles', timestamps: false }
);
