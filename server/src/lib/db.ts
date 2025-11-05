import { Sequelize } from 'sequelize';

const DEFAULTS = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  name: process.env.DB_NAME || 'visittrack',
  user: process.env.DB_USER || 'visit_user',
  pass: process.env.DB_PASSWORD || 'visit_pass',
};

const url = process.env.DATABASE_URL || `postgres://${DEFAULTS.user}:${DEFAULTS.pass}@${DEFAULTS.host}:${DEFAULTS.port}/${DEFAULTS.name}`;

export const sequelize = new Sequelize(url, {
  dialect: 'postgres',
  logging: false,
});
