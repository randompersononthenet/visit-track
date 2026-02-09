import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../lib/db';

export interface PermissionAttributes {
    id: number;
    slug: string; // e.g., 'visitors:view'
    description: string;
}

type PermissionCreation = Optional<PermissionAttributes, 'id'>;

export class Permission extends Model<PermissionAttributes, PermissionCreation> implements PermissionAttributes {
    declare id: number;
    declare slug: string;
    declare description: string;
}

Permission.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        slug: { type: DataTypes.STRING, allowNull: false, unique: true },
        description: { type: DataTypes.STRING, allowNull: false },
    },
    {
        sequelize,
        tableName: 'permissions',
        timestamps: false,
    }
);
