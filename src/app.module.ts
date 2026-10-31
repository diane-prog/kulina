import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './common/logger/logger.module';
import { ResponseModule } from './common/response/response.module';
import { appConfig, authConfig, databaseConfig, mailConfig } from './config';
import { CacheModule } from './libs/cache/cache.module';
import { DatabaseModule } from './libs/database/database.module';
import { WebsocketModule } from './helpers/websocket/websocket.module';
import { AssistantModule } from './core/assistant/assistant.module';
import { BudgetsModule } from './core/budgets/budgets.module';
import { CommunityModule } from './core/community/community.module';
import { CookingModule } from './core/cooking/cooking.module';
import { CuisinesModule } from './core/cuisines/cuisines.module';
import { DashboardModule } from './core/dashboard/dashboard.module';
import { FavoritesModule } from './core/favorites/favorites.module';
import { CloudinaryModule } from './core/cloudinary/cloudinary.module';
import { IngredientsModule } from './core/ingredients/ingredients.module';
import { MealPlansModule } from './core/meal-plans/meal-plans.module';
import { RecipeCategoriesModule } from './core/recipe-categories/recipe-categories.module';
import { RecipesModule } from './core/recipes/recipes.module';
import { ReviewsModule } from './core/reviews/reviews.module';
import { RolesModule } from './core/roles/roles.module';
import { SearchModule } from './core/search/search.module';
import { ShoppingListsModule } from './core/shopping-lists/shopping-lists.module';
import { TutorialsModule } from './core/tutorials/tutorials.module';
import { UsersModule } from './core/users/users.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env'],
            load: [appConfig, authConfig, databaseConfig, mailConfig],
        }),
        LoggerModule,
        ResponseModule,
        CacheModule,
        DatabaseModule,
        WebsocketModule,
        ScheduleModule.forRoot(),
        UsersModule,
        RolesModule,
        CloudinaryModule,
        CuisinesModule,
        RecipeCategoriesModule,
        IngredientsModule,
        RecipesModule,
        ReviewsModule,
        FavoritesModule,
        TutorialsModule,
        CookingModule,
        MealPlansModule,
        ShoppingListsModule,
        CommunityModule,
        BudgetsModule,
        AssistantModule,
        SearchModule,
        DashboardModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
