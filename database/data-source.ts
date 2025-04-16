import { DataSource } from 'typeorm';
import configuration from 'config';
import * as dotenv from 'dotenv';
import { join } from 'path';
dotenv.config();

const config = configuration();
const database = config?.database;

export const dataSource = new DataSource({
  type: 'mssql',
  host: database.host,
  port: database.port,
  synchronize: config.env !== 'production',
  logging: config.env === 'development' ? 'all' : ['query', 'error'],
  username: database.username,
  password: database.password,
  database: database.database,
  entities: [join(__dirname, '../src/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 60000,
  },
});
