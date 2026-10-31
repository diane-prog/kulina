import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Global()
@Module({
    imports: [
        WinstonModule.forRoot({
            level: process.env.LOG_LEVEL ?? 'info',
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.errors({ stack: true }),
                        winston.format.printf(
                            ({
                                level,
                                message,
                                context,
                                timestamp,
                            }: {
                                level: string;
                                message: unknown;
                                context?: string;
                                timestamp?: string;
                            }) =>
                                `${timestamp ?? ''} [${context ?? 'App'}] ${level}: ${message}`,
                        ),
                    ),
                }),
            ],
        }),
    ],
    exports: [WinstonModule],
})
export class LoggerModule {}
