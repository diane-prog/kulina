import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../libs/redis/redis.service';

@Injectable()
export class QuotaService {
    constructor(
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Consumes one AI quota unit and throws when the limit is reached.
     *
     * @param userId - User identifier
     * @param type - Quota type
     * @param limit - Daily limit
     * @returns The remaining quota
     * @throws HttpException when the daily limit is exceeded
     */
    async consume(
        userId: string,
        type: 'chat' | 'photo',
        limit: number,
    ): Promise<number> {
        const day = new Date().toISOString().slice(0, 10);
        const key = `ai:quota:${userId}:${day}:${type}`;
        const count = await this.redisService.incr(key, 24 * 60 * 60);

        if (count > limit) {
            throw new HttpException(
                {
                    message: 'Daily AI quota reached',
                    type,
                    limit,
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        return Math.max(0, limit - count);
    }

    /**
     * Returns the configured chat quota.
     *
     * @returns Daily chat quota
     */
    chatLimit(): number {
        return this.configService.get<number>('ai.chatDailyQuota') ?? 40;
    }

    /**
     * Returns the configured photo quota.
     *
     * @returns Daily photo quota
     */
    photoLimit(): number {
        return this.configService.get<number>('ai.photoDailyQuota') ?? 3;
    }
}
