import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { RecipesModule } from '../recipes/recipes.module';
import { Review } from './entities/review.entity';
import { ReviewsRepository } from './repositories/reviews.repository';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([Review]),
        RecipesModule,
    ],
    controllers: [ReviewsController],
    providers: [ReviewsService, ReviewsRepository],
    exports: [ReviewsService, ReviewsRepository],
})
export class ReviewsModule {}
