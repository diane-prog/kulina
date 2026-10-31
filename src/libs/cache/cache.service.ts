import { Injectable } from '@nestjs/common';

interface CacheEntry {
    value: unknown;
    expiresAt: number;
}

@Injectable()
export class CacheService {
    private readonly store = new Map<string, CacheEntry>();

    /**
     * Stores a value with a time-to-live.
     *
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttlSeconds - Time-to-live in seconds
     */
    set(key: string, value: unknown, ttlSeconds = 60): void {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }

    /**
     * Reads a cached value when it has not expired.
     *
     * @param key - Cache key
     * @returns The cached value or null
     */
    get<T>(key: string): T | null {
        const entry = this.store.get(key);

        if (!entry) {
            return null;
        }

        if (entry.expiresAt < Date.now()) {
            this.store.delete(key);
            return null;
        }

        return entry.value as T;
    }

    /**
     * Removes a cached value.
     *
     * @param key - Cache key
     */
    delete(key: string): void {
        this.store.delete(key);
    }

    /**
     * Clears the entire cache.
     */
    clear(): void {
        this.store.clear();
    }
}
