import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { MealPlansModule } from '../meal-plans/meal-plans.module';
import { RecipesModule } from '../recipes/recipes.module';
import { ShoppingList } from './entities/shopping-list.entity';
import { ShoppingListItem } from './entities/shopping-list-item.entity';
import { ShoppingListItemsRepository } from './repositories/shopping-list-items.repository';
import { ShoppingListsRepository } from './repositories/shopping-lists.repository';
import { ShoppingListsController } from './shopping-lists.controller';
import { ShoppingListsService } from './shopping-lists.service';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([ShoppingList, ShoppingListItem]),
        MealPlansModule,
        RecipesModule,
        IngredientsModule,
    ],
    controllers: [ShoppingListsController],
    providers: [
        ShoppingListsService,
        ShoppingListsRepository,
        ShoppingListItemsRepository,
    ],
    exports: [
        ShoppingListsService,
        ShoppingListsRepository,
        ShoppingListItemsRepository,
    ],
})
export class ShoppingListsModule {}
