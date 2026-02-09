import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../lib/db';
import { Permission } from './Permission';
import { RolePermission } from './RolePermission';

export interface RoleAttributes {
  id: number;
  name: string;
}

type RoleCreation = Optional<RoleAttributes, 'id'>;

export class Role extends Model<RoleAttributes, RoleCreation> implements RoleAttributes {
  declare id: number;
  declare name: string;
  declare permissions?: Permission[];
}

Role.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  {
    sequelize,
    tableName: 'roles',
    timestamps: false,
  }
);

Role.belongsToMany(Permission, { through: RolePermission, as: 'permissions', foreignKey: 'roleId', otherKey: 'permissionId' });
Permission.belongsToMany(Role, { through: RolePermission, as: 'roles', foreignKey: 'permissionId', otherKey: 'roleId' });
