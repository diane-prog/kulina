import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { ServerOptions } from 'socket.io';
import { RedisService } from '../../libs/redis/redis.service';

export class RedisIoAdapter extends IoAdapter {
    constructor(
        app: INestApplicationContext,
        private readonly redisService: RedisService,
    ) {
        super(app);
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
        const publisher = this.redisService.duplicate();
        const subscriber = this.redisService.duplicate();

        if (publisher && subscriber) {
            server.adapter(createAdapter(publisher, subscriber));
        }

        return server;
    }
}
