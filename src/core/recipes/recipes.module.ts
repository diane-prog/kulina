import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { CuisinesModule } from '../cuisines/cuisines.module';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { RecipeCategoriesModule } from '../recipe-categories/recipe-categories.module';
import { UsersModule } from '../users/users.module';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeStep } from './entities/recipe-step.entity';
import { RecipeTip } from './entities/recipe-tip.entity';
import { RecipeIngredientsRepository } from './repositories/recipe-ingredients.repository';
import { RecipeStepsRepository } from './repositories/recipe-steps.repository';
import { RecipeTipsRepository } from './repositories/recipe-tips.repository';
import { RecipesRepository } from './repositories/recipes.repository';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([
            Recipe,
            RecipeIngredient,
            RecipeStep,
            RecipeTip,
        ]),
        UsersModule,
        IngredientsModule,
        CuisinesModule,
        RecipeCategoriesModule,
    ],
    controllers: [RecipesController],
    providers: [
        RecipesService,
        RecipesRepository,
        RecipeIngredientsRepository,
        RecipeStepsRepository,
        RecipeTipsRepository,
    ],
    exports: [RecipesService, RecipesRepository, RecipeIngredientsRepository],
})
export class RecipesModule {}
