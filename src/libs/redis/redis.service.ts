import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface MemoryEntry {
    value: string;
    expiresAt?: number;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly client: Redis | null;
    private readonly memory = new Map<string, MemoryEntry>();

    constructor(private readonly configService: ConfigService) {
        const url = this.configService.get<string>('redis.url');
        this.client = url
            ? new Redis(url, {
                  lazyConnect: true,
                  maxRetriesPerRequest: 1,
              })
            : null;

        if (this.client) {
            this.client.connect().catch(() => undefined);
        }
    }

    /**
     * Returns whether a real Redis connection is configured.
     *
     * @returns True when REDIS_URL is set
     */
    isEnabled(): boolean {
        return Boolean(this.client);
    }

    /**
     * Reads a value.
     *
     * @param key - Cache key
     * @returns The stored value or null
     */
    async get(key: string): Promise<string | null> {
        if (this.client) {
            return await this.client.get(key);
        }

        const entry = this.memory.get(key);

        if (!entry || (entry.expiresAt && entry.expiresAt < Date.now())) {
            this.memory.delete(key);
            return null;
        }

        return entry.value;
    }

    /**
     * Stores a value with an optional TTL.
     *
     * @param key - Cache key
     * @param value - Value to store
     * @param ttlSeconds - Optional TTL in seconds
     */
    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (this.client) {
            if (ttlSeconds) {
                await this.client.set(key, value, 'EX', ttlSeconds);
                return;
            }

            await this.client.set(key, value);
            return;
        }

        this.memory.set(key, {
            value,
            expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
        });
    }

    /**
     * Deletes a value.
     *
     * @param key - Cache key
     */
    async del(key: string): Promise<void> {
        if (this.client) {
            await this.client.del(key);
            return;
        }

        this.memory.delete(key);
    }

    /**
     * Sets multiple hash fields and an optional TTL.
     *
     * @param key - Hash key
     * @param values - Hash values
     * @param ttlSeconds - Optional TTL in seconds
     */
    async hset(
        key: string,
        values: Record<string, string>,
        ttlSeconds?: number,
    ): Promise<void> {
        if (this.client) {
            await this.client.hset(key, values);
            if (ttlSeconds) {
                await this.client.expire(key, ttlSeconds);
            }
            return;
        }

        await this.set(key, JSON.stringify(values), ttlSeconds);
    }

    /**
     * Reads all hash fields.
     *
     * @param key - Hash key
     * @returns The hash values
     */
    async hgetall(key: string): Promise<Record<string, string>> {
        if (this.client) {
            return await this.client.hgetall(key);
        }

        const raw = await this.get(key);
        return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    }

    /**
     * Sets or refreshes a key TTL.
     *
     * @param key - Cache key
     * @param ttlSeconds - TTL in seconds
     */
    async expire(key: string, ttlSeconds: number): Promise<void> {
        if (this.client) {
            await this.client.expire(key, ttlSeconds);
            return;
        }

        const entry = this.memory.get(key);
        if (entry) {
            entry.expiresAt = Date.now() + ttlSeconds * 1000;
        }
    }

    /**
     * Publishes a message on a Redis channel.
     *
     * @param channel - Channel name
     * @param message - Message payload
     */
    async publish(channel: string, message: string): Promise<void> {
        if (this.client) {
            await this.client.publish(channel, message);
        }
    }

    /**
     * Returns the raw Redis client when available.
     *
     * @returns The Redis client or null
     */
    getClient(): Redis | null {
        return this.client;
    }

    /**
     * Creates a duplicate Redis connection for pub/sub.
     *
     * @returns A duplicated Redis client or null
     */
    duplicate(): Redis | null {
        return this.client ? this.client.duplicate() : null;
    }

    /**
     * Increments a counter and sets a TTL on first increment.
     *
     * @param key - Counter key
     * @param ttlSeconds - TTL in seconds
     * @returns The new counter value
     */
    async incr(key: string, ttlSeconds: number): Promise<number> {
        if (this.client) {
            const value = await this.client.incr(key);

            if (value === 1) {
                await this.client.expire(key, ttlSeconds);
            }

            return value;
        }

        const current = Number.parseInt((await this.get(key)) ?? '0', 10);
        const next = current + 1;
        const entry = this.memory.get(key);
        await this.set(
            key,
            String(next),
            entry?.expiresAt
                ? Math.max(1, Math.ceil((entry.expiresAt - Date.now()) / 1000))
                : ttlSeconds,
        );

        return next;
    }

    /**
     * Acquires a simple lock.
     *
     * @param key - Lock key
     * @param ttlSeconds - Lock TTL
     * @returns True when the lock was acquired
     */
    async lock(key: string, ttlSeconds: number): Promise<boolean> {
        if (this.client) {
            const result = await this.client.set(
                key,
                '1',
                'EX',
                ttlSeconds,
                'NX',
            );
            return result === 'OK';
        }

        if (await this.get(key)) {
            return false;
        }

        await this.set(key, '1', ttlSeconds);
        return true;
    }

    /**
     * Releases a lock.
     *
     * @param key - Lock key
     */
    async unlock(key: string): Promise<void> {
        await this.del(key);
    }

    /**
     * Closes the Redis connection.
     */
    async onModuleDestroy(): Promise<void> {
        if (this.client) {
            await this.client.quit().catch(() => undefined);
        }
    }
}
