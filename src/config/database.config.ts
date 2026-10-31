import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
    type: process.env.DB_TYPE ?? 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
    name: process.env.DB_NAME ?? 'kulina',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    synchronize: (process.env.DB_SYNC ?? 'false').toLowerCase() === 'true',
    ssl: (process.env.DB_SSL ?? 'false').toLowerCase() === 'true',
    logging: (process.env.DB_LOGGING ?? 'false').toLowerCase() === 'true',
}));
