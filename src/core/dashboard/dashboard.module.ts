import { Module } from '@nestjs/common';
import { CommunityModule } from '../community/community.module';
import { RecipesModule } from '../recipes/recipes.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { TutorialsModule } from '../tutorials/tutorials.module';
import { UsersModule } from '../users/users.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
    imports: [
        UsersModule,
        RecipesModule,
        CommunityModule,
        ReviewsModule,
        TutorialsModule,
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [DashboardService],
})
export class DashboardModule {}
