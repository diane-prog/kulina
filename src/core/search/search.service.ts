import { Injectable } from '@nestjs/common';
import { CommunityService } from '../community/community.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { RecipesService } from '../recipes/recipes.service';
import { TutorialsService } from '../tutorials/tutorials.service';
import { SearchQueryDto } from './dto/search-query.dto';

@Injectable()
export class SearchService {
    constructor(
        private readonly recipesService: RecipesService,
        private readonly tutorialsService: TutorialsService,
        private readonly ingredientsService: IngredientsService,
        private readonly communityService: CommunityService,
    ) {}

    /**
     * Searches recipes, tutorials, ingredients, and community posts.
     *
     * @param dto - Search query and type
     * @returns Search results grouped by content type
     */
    async search(dto: SearchQueryDto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 5;
        const type = dto.type ?? 'all';
        const results: Record<string, unknown> = {};

        if (type === 'all' || type === 'recipes') {
            results.recipes = await this.recipesService.findAll({
                query: dto.q,
                page,
                limit,
                sort: 'rating',
            });
        }

        if (type === 'all' || type === 'tutorials') {
            results.tutorials = await this.tutorialsService.findAll({
                query: dto.q,
                page,
                limit,
            });
        }

        if (type === 'all' || type === 'ingredients') {
            results.ingredients = await this.ingredientsService.findAll({
                query: dto.q,
                page,
                limit,
            });
        }

        if (type === 'all' || type === 'posts') {
            results.posts = await this.communityService.findAll({
                query: dto.q,
                page,
                limit,
            });
        }

        return {
            query: dto.q,
            type,
            results,
        };
    }
}
