import { Injectable } from '@nestjs/common';
import { toSlug } from '../../utils/slug';
import { RecipeCategory } from './entities/recipe-category.entity';
import { RecipeCategoriesRepository } from './repositories/recipe-categories.repository';

const categories = [
    { name: 'Main dishes', icon: '🍲' },
    { name: 'Soups and sauces', icon: '🥘' },
    { name: 'Side dishes', icon: '🍚' },
    { name: 'Breakfast', icon: '🍳' },
    { name: 'Snacks', icon: '🥟' },
    { name: 'Street food', icon: '🌯' },
    { name: 'Desserts', icon: '🍮' },
    { name: 'Drinks', icon: '🥤' },
    { name: 'Salads', icon: '🥗' },
    { name: 'Grills', icon: '🔥' },
];

@Injectable()
export class RecipeCategoriesSeeder {
    constructor(private readonly repository: RecipeCategoriesRepository) {}

    /**
     * Seeds the default recipe categories.
     *
     * @returns A promise resolved when all categories exist
     */
    async seed(): Promise<void> {
        for (const category of categories) {
            const slug = toSlug(category.name);
            const existing = await this.repository.findOne({
                where: { slug },
            });

            if (!existing) {
                await this.repository.create(
                    new RecipeCategory({
                        name: category.name,
                        slug,
                        icon: category.icon,
                        description: `${category.name} recipes for every day.`,
                        isActive: true,
                    }),
                );
            }
        }
    }
}
