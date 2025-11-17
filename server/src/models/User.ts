import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../lib/db';
import { Role } from './Role';

export interface UserAttributes {
  id: number;
  username: string;
  passwordHash: string;
  roleId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserCreation = Optional<UserAttributes, 'id'>;

export class User extends Model<UserAttributes, UserCreation> implements UserAttributes {
  declare id: number;
  declare username: string;
  declare passwordHash: string;
  declare roleId: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    roleId: { type: DataTypes.INTEGER, allowNull: false, field: 'role_id', references: { model: 'roles', key: 'id' } },
  },
  { sequelize, tableName: 'users', underscored: true }
);

User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
