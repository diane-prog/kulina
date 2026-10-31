import { Injectable } from '@nestjs/common';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { RecipesService } from '../recipes/recipes.service';
import { Favorite } from './entities/favorite.entity';
import { FavoritesRepository } from './repositories/favorites.repository';

@Injectable()
export class FavoritesService {
    constructor(
        private readonly favoritesRepository: FavoritesRepository,
        private readonly recipesService: RecipesService,
        private readonly errorHandlingService: ErrorHandlingService,
    ) {}

    /**
     * Adds a recipe to the user's favorites.
     *
     * @param userId - User identifier
     * @param recipeId - Recipe identifier
     * @returns The favorite record
     */
    async add(userId: string, recipeId: string): Promise<Favorite> {
        await this.recipesService.findOne(recipeId, true);

        const existing = await this.favoritesRepository.findOne({
            where: {
                user: { id: userId },
                recipe: { id: recipeId },
                deleted: false,
            },
        });

        if (existing) {
            return existing;
        }

        const favorite = await this.favoritesRepository.create(
            new Favorite({
                user: { id: userId } as any,
                recipe: { id: recipeId } as any,
            }),
        );

        await this.recipesService.incrementFavoriteCount(recipeId, 1);

        return favorite;
    }

    /**
     * Removes a recipe from the user's favorites.
     *
     * @param userId - User identifier
     * @param recipeId - Recipe identifier
     * @returns A confirmation message
     */
    async remove(
        userId: string,
        recipeId: string,
    ): Promise<{ message: string }> {
        const existing = await this.favoritesRepository.findOne({
            where: {
                user: { id: userId },
                recipe: { id: recipeId },
                deleted: false,
            },
        });

        if (!existing) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Favorite for recipe ${recipeId} not found`,
                'Favorite not found',
            );
        }

        await this.favoritesRepository.softDelete({ id: existing.id });
        await this.recipesService.incrementFavoriteCount(recipeId, -1);

        return { message: 'Recipe removed from favorites' };
    }

    /**
     * Lists the user's favorite recipes.
     *
     * @param userId - User identifier
     * @returns The favorite recipes
     */
    async findByUser(userId: string) {
        const favorites = await this.favoritesRepository.find({
            where: { user: { id: userId }, deleted: false },
            relations: [
                'recipe',
                'recipe.cuisine',
                'recipe.category',
                'recipe.author',
            ],
            order: { createdAt: 'DESC' },
        });

        return favorites.map((favorite) => ({
            id: favorite.id,
            addedAt: favorite.createdAt,
            recipe: favorite.recipe
                ? {
                      id: favorite.recipe.id,
                      title: favorite.recipe.title,
                      slug: favorite.recipe.slug,
                      description: favorite.recipe.description,
                      imageUrl: favorite.recipe.imageUrl,
                      prepTimeMinutes: favorite.recipe.prepTimeMinutes,
                      cookTimeMinutes: favorite.recipe.cookTimeMinutes,
                      servings: favorite.recipe.servings,
                      difficulty: favorite.recipe.difficulty,
                      budgetFcfa: favorite.recipe.budgetFcfa,
                      ratingAverage: favorite.recipe.ratingAverage,
                      cuisine: favorite.recipe.cuisine
                          ? {
                                id: favorite.recipe.cuisine.id,
                                name: favorite.recipe.cuisine.name,
                            }
                          : null,
                      category: favorite.recipe.category
                          ? {
                                id: favorite.recipe.category.id,
                                name: favorite.recipe.category.name,
                            }
                          : null,
                  }
                : null,
        }));
    }
}
