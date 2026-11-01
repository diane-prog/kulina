import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RecipeStatus } from '../../../common/enum/recipe.enum';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { Recipe } from '../entities/recipe.entity';

@Injectable()
export class RecipesRepository extends AbstractRepository<Recipe> {
    protected readonly logger = new Logger(RecipesRepository.name);

    constructor(
        @InjectRepository(Recipe)
        recipesRepository: Repository<Recipe>,
        entityManager: EntityManager,
    ) {
        super(recipesRepository, entityManager);
    }

    /**
     * Finds published recipes containing at least one requested ingredient.
     *
     * @param names - Ingredient names
     * @param limit - Maximum number of recipes
     * @returns Matching recipes with ingredients loaded
     */
    async searchByIngredients(names: string[], limit = 50): Promise<Recipe[]> {
        if (names.length === 0) {
            return [];
        }

        const query = this.entityRepository
            .createQueryBuilder('recipe')
            .leftJoinAndSelect('recipe.ingredients', 'recipeIngredient')
            .leftJoinAndSelect('recipeIngredient.ingredient', 'ingredient')
            .leftJoinAndSelect('recipe.author', 'author')
            .where('recipe.deleted = false')
            .andWhere('recipe.status = :status', {
                status: RecipeStatus.PUBLISHED,
            });

        const conditions = names
            .map(
                (_name, index) =>
                    `ingredient.name ILIKE :name${index} OR CAST(ingredient.localNames AS text) ILIKE :name${index}`,
            )
            .join(' OR ');

        query.andWhere(`(${conditions})`);

        names.forEach((name, index) => {
            query.setParameter(`name${index}`, `%${name}%`);
        });

        return await query.take(limit).getMany();
    }
}
