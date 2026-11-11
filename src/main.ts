import { ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { SwaggerModule } from '@nestjs/swagger';
import { RedocModule } from 'nestjs-redoc';
import * as basicAuth from 'express-basic-auth';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { CircularInterceptor } from './common/interceptors/circular.interceptor';
import { CustomValidationPipe } from './common/response/customValidationPipe';
import { ResponseInterceptor } from './common/response/response.interceptor';
import { allSeeder } from './common/seeder/seeders';
import { buildCorsOptions } from './helpers/cors.config';
import { createSwaggerConfig } from './helpers/api_documentation/documentation.config';
import { createRedocConfig } from './helpers/api_documentation/redoc.config';
import { RedisIoAdapter } from './helpers/websocket/redis-io.adapter';
import { RedisService } from './libs/redis/redis.service';

/**
 * Boots the Kulina API.
 */
async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const env = configService.get<string>('app.nodeEnv');
    const port = configService.get<number>('app.port');

    app.use(helmet());
    app.enableCors(buildCorsOptions(env));
    app.setGlobalPrefix('api/v1', { exclude: ['/ping'] });
    const redisService = app.get(RedisService);
    if (redisService.isEnabled()) {
        const redisIoAdapter = new RedisIoAdapter(app, redisService);
        await redisIoAdapter.connectToRedis();
        app.useWebSocketAdapter(redisIoAdapter);
    } else {
        app.useWebSocketAdapter(new IoAdapter(app));
    }
    app.useGlobalPipes(new CustomValidationPipe());

    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(
        new ResponseInterceptor(),
        new CircularInterceptor(),
        new ClassSerializerInterceptor(reflector),
    );

    for (const Seeder of allSeeder) {
        const seeder = app.get(Seeder);
        await seeder.seed();
    }

    const enableSwagger =
        configService.get<boolean>('app.enableSwagger') || env === 'dev';

    if (enableSwagger) {
        const swaggerUsername = configService.get<string>(
            'app.swaggerUsername',
        );
        const swaggerPassword = configService.get<string>(
            'app.swaggerPassword',
        );

        if (swaggerUsername && swaggerPassword) {
            app.use(
                ['/docs', '/docs-json'],
                basicAuth({
                    challenge: true,
                    users: {
                        [swaggerUsername]: swaggerPassword,
                    },
                }),
            );
        }

        const { config, customOptions } = createSwaggerConfig();
        const document = SwaggerModule.createDocument(app, config, {
            deepScanRoutes: true,
        });
        SwaggerModule.setup('docs', app, document, customOptions);

        await RedocModule.setup(
            '/docs/redoc',
            app,
            document,
            createRedocConfig(),
        );
    }

    await app.listen(port);

    console.log(`Kulina API is running on http://localhost:${port}`);
}

bootstrap().catch((error: unknown) => {
    const message = error instanceof Error ? error.stack : String(error);

    console.error(`Failed to start Kulina API: ${message}`);
    process.exit(1);
});
