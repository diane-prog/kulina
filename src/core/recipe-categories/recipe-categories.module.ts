import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { RecipeCategory } from './entities/recipe-category.entity';
import { RecipeCategoriesController } from './recipe-categories.controller';
import { RecipeCategoriesSeeder } from './recipe-categories.seeder';
import { RecipeCategoriesService } from './recipe-categories.service';
import { RecipeCategoriesRepository } from './repositories/recipe-categories.repository';

@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([RecipeCategory])],
    controllers: [RecipeCategoriesController],
    providers: [
        RecipeCategoriesService,
        RecipeCategoriesRepository,
        RecipeCategoriesSeeder,
    ],
    exports: [RecipeCategoriesService, RecipeCategoriesRepository],
})
export class RecipeCategoriesModule {}
