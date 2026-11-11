import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { ServerOptions } from 'socket.io';
import { RedisService } from '../../libs/redis/redis.service';

export class RedisIoAdapter extends IoAdapter {
    private readonly adapterLogger = new Logger(RedisIoAdapter.name);
    private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

    constructor(
        app: INestApplicationContext,
        private readonly redisService: RedisService,
    ) {
        super(app);
    }

    /**
     * Attempts to connect to Redis for pub/sub adapter with a timeout fallback.
     */
    async connectToRedis(): Promise<void> {
        let publisher: ReturnType<RedisService['duplicate']> = null;
        let subscriber: ReturnType<RedisService['duplicate']> = null;

        try {
            publisher = this.redisService.duplicate();
            subscriber = this.redisService.duplicate();

            if (!publisher || !subscriber) {
                return;
            }

            await Promise.race([
                Promise.all([
                    new Promise<void>((resolve, reject) => {
                        if (publisher?.status === 'ready') resolve();
                        else {
                            publisher?.once('ready', () => resolve());
                            publisher?.once('error', (err) => reject(err));
                        }
                    }),
                    new Promise<void>((resolve, reject) => {
                        if (subscriber?.status === 'ready') resolve();
                        else {
                            subscriber?.once('ready', () => resolve());
                            subscriber?.once('error', (err) => reject(err));
                        }
                    }),
                ]),
                new Promise<void>((_, reject) =>
                    setTimeout(
                        () => reject(new Error('Connection timed out')),
                        2000,
                    ),
                ),
            ]);

            this.adapterConstructor = createAdapter(publisher, subscriber);
            this.adapterLogger.log('Redis WebSocket adapter enabled');
        } catch (error) {
            publisher?.disconnect();
            subscriber?.disconnect();
            this.adapterConstructor = null;
            this.adapterLogger.warn(
                `Redis WebSocket adapter disabled (${(error as Error).message}). Using in-memory adapter.`,
            );
        }
    }

    /**
     * Creates a Socket.IO server with the Redis adapter when Redis is available.
     *
     * @param port - Server port
     * @param options - Socket.IO options
     * @returns The Socket.IO server
     */
    createIOServer(port: number, options?: ServerOptions): any {
        const server = super.createIOServer(port, options);

        if (this.adapterConstructor) {
            server.adapter(this.adapterConstructor);
        }

        return server;
    }
}
