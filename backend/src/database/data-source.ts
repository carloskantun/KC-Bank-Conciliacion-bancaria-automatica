import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { DataSource } from 'typeorm';

const localEnv = resolve(__dirname, '../../.env');
const rootEnv = resolve(__dirname, '../../../.env');
loadEnv({ path: existsSync(localEnv) ? localEnv : rootEnv });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER ?? 'kcbank',
  password: process.env.POSTGRES_PASSWORD ?? 'kcbank',
  database: process.env.POSTGRES_DB ?? 'kcbank',
  synchronize: false,
  entities: [resolve(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [resolve(__dirname, 'migrations/*{.ts,.js}')],
});
