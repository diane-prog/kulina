import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    nodeEnv: process.env.NODE_ENV ?? 'dev',
    port: Number.parseInt(process.env.PORT ?? '3000', 10),
    logLevel: process.env.LOG_LEVEL ?? 'info',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    enableSwagger:
        (process.env.ENABLE_SWAGGER ?? 'false').toLowerCase() === 'true',
    swaggerUsername: process.env.SWAGGER_USERNAME ?? 'kulina',
    swaggerPassword: process.env.SWAGGER_PASSWORD ?? 'kulina',
    allFeaturesFree:
        (process.env.ALL_FEATURES_FREE ?? 'true').toLowerCase() === 'true',
}));
