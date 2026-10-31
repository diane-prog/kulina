import { Module } from '@nestjs/common';
import { CommunityModule } from '../community/community.module';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { RecipesModule } from '../recipes/recipes.module';
import { TutorialsModule } from '../tutorials/tutorials.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
    imports: [
        RecipesModule,
        TutorialsModule,
        IngredientsModule,
        CommunityModule,
    ],
    controllers: [SearchController],
    providers: [SearchService],
    exports: [SearchService],
})
export class SearchModule {}
