import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { RecipesModule } from '../recipes/recipes.module';
import { AdminImportService } from './admin-import.service';
import { AdminRecipesController } from './admin-recipes.controller';
import { RecipesSeeder } from './admin.seeder';

@Module({
    imports: [DatabaseModule, RecipesModule, IngredientsModule],
    controllers: [AdminRecipesController],
    providers: [AdminImportService, RecipesSeeder],
    exports: [AdminImportService],
})
export class AdminModule {}
