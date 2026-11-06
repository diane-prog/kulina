import { toSlug } from '../../../utils/slug';
import { recipeCatalogSeed } from './recipe-catalog.seed';

describe('recipeCatalogSeed', () => {
    it('should expose 50 unique recipes', () => {
        const slugs = recipeCatalogSeed.map((recipe) => recipe.slug);

        expect(recipeCatalogSeed).toHaveLength(50);
        expect(new Set(slugs).size).toBe(50);
    });

    it('should use the slug generated from each title', () => {
        const mismatches = recipeCatalogSeed.filter(
            (recipe) => toSlug(recipe.title) !== recipe.slug,
        );

        expect(mismatches).toEqual([]);
    });

    it('should provide ingredients, steps, and issues for each recipe', () => {
        const incomplete = recipeCatalogSeed.filter(
            (recipe) =>
                recipe.ingredients.length === 0 ||
                recipe.steps.length === 0 ||
                recipe.issues.length === 0 ||
                recipe.estimatedBudgetXof <= 0,
        );

        expect(incomplete).toEqual([]);
    });
});
