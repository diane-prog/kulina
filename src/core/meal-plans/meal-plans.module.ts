import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { RecipesModule } from '../recipes/recipes.module';
import { MealPlan } from './entities/meal-plan.entity';
import { MealPlanItem } from './entities/meal-plan-item.entity';
import { MealPlansController } from './meal-plans.controller';
import { MealPlansService } from './meal-plans.service';
import { MealPlanItemsRepository } from './repositories/meal-plan-items.repository';
import { MealPlansRepository } from './repositories/meal-plans.repository';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([MealPlan, MealPlanItem]),
        RecipesModule,
    ],
    controllers: [MealPlansController],
    providers: [MealPlansService, MealPlansRepository, MealPlanItemsRepository],
    exports: [MealPlansService, MealPlansRepository, MealPlanItemsRepository],
})
export class MealPlansModule {}
