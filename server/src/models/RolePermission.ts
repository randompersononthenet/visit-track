import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class RolePermission extends Model { }

RolePermission.init(
    {
        roleId: {
            type: DataTypes.INTEGER,
            references: { model: 'roles', key: 'id' },
            primaryKey: true,
            field: 'role_id',
        },
        permissionId: {
            type: DataTypes.INTEGER,
            references: { model: 'permissions', key: 'id' },
            primaryKey: true,
            field: 'permission_id',
        },
    },
    {
        sequelize,
        tableName: 'role_permissions',
        timestamps: false,
        underscored: true,
    }
);
