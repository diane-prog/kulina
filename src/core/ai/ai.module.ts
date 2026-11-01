import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../../libs/redis/redis.module';
import { RecipesModule } from '../recipes/recipes.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UsersModule } from '../users/users.module';
import { AiController } from './ai.controller';
import { AiQueueService } from './ai-queue.service';
import { AiService } from './ai.service';
import { PhotoCheckController } from './photo-check.controller';
import { GeminiService } from './services/gemini.service';
import { IssueMatcherService } from './services/issue-matcher.service';
import { QuotaService } from './services/quota.service';

@Module({
    imports: [
        ConfigModule,
        RedisModule,
        UsersModule,
        RecipesModule,
        SessionsModule,
    ],
    controllers: [AiController, PhotoCheckController],
    providers: [
        AiService,
        AiQueueService,
        GeminiService,
        QuotaService,
        IssueMatcherService,
    ],
    exports: [AiService, AiQueueService],
})
export class AiModule {}
