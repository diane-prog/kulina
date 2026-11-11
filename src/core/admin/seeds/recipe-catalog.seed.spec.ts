import { recipeCatalogSeed } from './recipe-catalog.seed';

describe('recipeCatalogSeed', () => {
    it('should contain 50 valid demo recipes', () => {
        expect(recipeCatalogSeed).toHaveLength(50);

        for (const recipe of recipeCatalogSeed) {
            expect(recipe.slug).toBeTruthy();
            expect(recipe.title).toBeTruthy();
            expect(recipe.category).toBeTruthy();
            expect(recipe.ingredients.length).toBeGreaterThan(0);
            expect(recipe.steps.length).toBeGreaterThan(0);
            expect(recipe.issues.length).toBeGreaterThan(0);
        }
    });

    it('should use unique recipe slugs', () => {
        const slugs = recipeCatalogSeed.map((recipe) => recipe.slug);

        expect(new Set(slugs).size).toBe(slugs.length);
    });
});
