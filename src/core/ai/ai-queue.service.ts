import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, QueueEvents, Worker } from 'bullmq';
import { AiService } from './ai.service';

@Injectable()
export class AiQueueService implements OnModuleDestroy {
    private queue: Queue | null = null;
    private events: QueueEvents | null = null;
    private worker: Worker | null = null;

    constructor(
        private readonly configService: ConfigService,
        private readonly aiService: AiService,
    ) {
        const redisUrl = this.configService.get<string>('redis.url');

        if (!redisUrl) {
            return;
        }

        try {
            const parsed = new URL(redisUrl);
            const connection = {
                host: parsed.hostname,
                port: Number.parseInt(parsed.port || '6379', 10),
                username: parsed.username || undefined,
                password: parsed.password || undefined,
            };

            this.queue = new Queue('ai-jobs', {
                connection,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 1000 },
                    removeOnComplete: true,
                    removeOnFail: true,
                },
            });
            this.events = new QueueEvents('ai-jobs', { connection });
            this.worker = new Worker(
                'ai-jobs',
                async (job) => this.handleJob(job.name, job.data),
                {
                    connection,
                    concurrency: 2,
                    limiter: { max: 10, duration: 1000 },
                },
            );
            this.queue.on('error', () => undefined);
            this.events.on('error', () => undefined);
            this.worker.on('error', () => undefined);
        } catch {
            this.queue = null;
            this.events = null;
            this.worker = null;
        }
    }

    /**
     * Enqueues an AI job and waits for its result, or runs it directly without Redis.
     *
     * @param name - Job name
     * @param data - Job payload
     * @param timeoutMs - Maximum wait time
     * @returns The job result
     */
    async enqueueAndWait<T>(
        name: string,
        data: Record<string, unknown>,
        timeoutMs = 60000,
    ): Promise<T> {
        if (!this.queue || !this.events) {
            return (await this.handleJob(name, data)) as T;
        }

        const job = await this.queue.add(name, data);

        return (await job.waitUntilFinished(this.events, timeoutMs)) as T;
    }

    /**
     * Dispatches a BullMQ job to the AI service.
     *
     * @param name - Job name
     * @param data - Job payload
     * @returns The job result
     */
    private async handleJob(
        name: string,
        data: Record<string, unknown>,
    ): Promise<unknown> {
        if (name === 'photo-check') {
            return await this.aiService.photoCheck(
                String(data.sessionId),
                String(data.userId),
                String(data.publicId),
            );
        }

        if (name === 'structure-recipe') {
            return await this.aiService.structureRecipe(
                String(data.transcript),
            );
        }

        throw new Error(`Unknown AI job: ${name}`);
    }

    /**
     * Closes BullMQ resources.
     */
    async onModuleDestroy(): Promise<void> {
        await this.worker?.close().catch(() => undefined);
        await this.queue?.close().catch(() => undefined);
        await this.events?.close().catch(() => undefined);
    }
}
