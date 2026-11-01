import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './common/logger/logger.module';
import { ResponseModule } from './common/response/response.module';
import {
    aiConfig,
    appConfig,
    authConfig,
    databaseConfig,
    mailConfig,
    redisConfig,
} from './config';
import { CacheModule } from './libs/cache/cache.module';
import { DatabaseModule } from './libs/database/database.module';
import { RedisModule } from './libs/redis/redis.module';
import { WebsocketModule } from './helpers/websocket/websocket.module';
import { AdminModule } from './core/admin/admin.module';
import { AiModule } from './core/ai/ai.module';
import { AuthModule } from './core/auth/auth.module';
import { BudgetsModule } from './core/budgets/budgets.module';
import { ChatModule } from './core/chat/chat.module';
import { CommunityModule } from './core/community/community.module';
import { DashboardModule } from './core/dashboard/dashboard.module';
import { FavoritesModule } from './core/favorites/favorites.module';
import { IngredientsModule } from './core/ingredients/ingredients.module';
import { MealPlansModule } from './core/meal-plans/meal-plans.module';
import { MediaModule } from './core/media/media.module';
import { RecipesModule } from './core/recipes/recipes.module';
import { ReviewsModule } from './core/reviews/reviews.module';
import { RolesModule } from './core/roles/roles.module';
import { SearchModule } from './core/search/search.module';
import { SessionsModule } from './core/sessions/sessions.module';
import { ShoppingListsModule } from './core/shopping-lists/shopping-lists.module';
import { SubscriptionsModule } from './core/subscriptions/subscriptions.module';
import { TutorialsModule } from './core/tutorials/tutorials.module';
import { UsersModule } from './core/users/users.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env'],
            load: [
                appConfig,
                authConfig,
                databaseConfig,
                mailConfig,
                redisConfig,
                aiConfig,
            ],
        }),
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 100,
            },
        ]),
        LoggerModule,
        ResponseModule,
        CacheModule,
        RedisModule,
        DatabaseModule,
        WebsocketModule,
        ScheduleModule.forRoot(),
        UsersModule,
        AuthModule,
        RolesModule,
        MediaModule,
        IngredientsModule,
        RecipesModule,
        SessionsModule,
        AiModule,
        ChatModule,
        ReviewsModule,
        FavoritesModule,
        TutorialsModule,
        MealPlansModule,
        ShoppingListsModule,
        CommunityModule,
        BudgetsModule,
        SubscriptionsModule,
        AdminModule,
        SearchModule,
        DashboardModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}
