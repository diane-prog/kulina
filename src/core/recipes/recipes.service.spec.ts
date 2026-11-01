import { Country } from '../../common/enum/country.enum';
import { Difficulty, RecipeStatus } from '../../common/enum/recipe.enum';
import { Recipe } from './entities/recipe.entity';
import { RecipesService } from './recipes.service';

const createRecipe = (overrides: Partial<Recipe>): Recipe =>
    ({
        id: 'recipe-1',
        title: 'Bouillie de riz',
        slug: 'bouillie-de-riz',
        description: 'Une bouillie de riz pour le petit-déjeuner.',
        coverImageUrl: null,
        prepMinutes: 10,
        cookMinutes: 35,
        baseServings: 2,
        difficulty: Difficulty.EASY,
        country: Country.BOTH,
        category: 'Bouillies',
        estimatedBudgetXof: 1000,
        costPerServingXof: 500,
        status: RecipeStatus.PUBLISHED,
        isFeatured: false,
        isPremium: false,
        ratingAverage: 4.5,
        ratingCount: 2,
        favoriteCount: 3,
        viewCount: 10,
        tags: ['riz', 'petit-déjeuner'],
        author: { id: 'user-1', fullname: 'Awa Koné' } as any,
        ingredients: [],
        steps: [],
        tips: [],
        issues: [],
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        publishedAt: new Date('2026-10-01T10:00:00.000Z'),
        ...overrides,
    }) as unknown as Recipe;

describe('RecipesService', () => {
    let service: RecipesService;
    let mockRecipesRepository: any;
    let mockRecipeIngredientsRepository: any;
    let mockRecipeStepsRepository: any;
    let mockRecipeTipsRepository: any;
    let mockRecipeIssuesRepository: any;
    let mockIngredientsRepository: any;
    let mockUsersRepository: any;
    let mockErrorHandlingService: any;
    let mockRedisService: any;

    beforeEach(() => {
        mockRecipesRepository = {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            searchByIngredients: jest.fn(),
        };
        mockRecipeIngredientsRepository = {
            find: jest.fn(),
            deleteMany: jest.fn(),
            createMany: jest.fn(),
        };
        mockRecipeStepsRepository = {
            find: jest.fn(),
            deleteMany: jest.fn(),
            createMany: jest.fn(),
        };
        mockRecipeTipsRepository = {
            find: jest.fn(),
            deleteMany: jest.fn(),
            createMany: jest.fn(),
        };
        mockRecipeIssuesRepository = {
            find: jest.fn(),
            deleteMany: jest.fn(),
            createMany: jest.fn(),
        };
        mockIngredientsRepository = { findOne: jest.fn() };
        mockUsersRepository = { findOne: jest.fn() };
        mockRedisService = {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn(),
            del: jest.fn(),
        };
        mockErrorHandlingService = {
            returnErrorOnNotFound: jest.fn(),
            returnErrorOnBadRequest: jest.fn(),
            returnErrorOnConflict: jest.fn(),
        };

        service = new RecipesService(
            { info: jest.fn(), error: jest.fn() } as any,
            mockRecipesRepository,
            mockRecipeIngredientsRepository,
            mockRecipeStepsRepository,
            mockRecipeTipsRepository,
            mockRecipeIssuesRepository,
            mockIngredientsRepository,
            mockUsersRepository,
            mockErrorHandlingService,
            mockRedisService,
        );
    });

    describe('findAll', () => {
        it('should only return published recipes for public callers', async () => {
            const published = createRecipe({});
            const draft = createRecipe({
                id: 'recipe-2',
                title: 'Brouillon',
                slug: 'brouillon',
                status: RecipeStatus.DRAFT,
            });
            mockRecipesRepository.find.mockResolvedValue([published, draft]);

            const actual = await service.findAll({
                page: 1,
                limit: 12,
                sort: 'recent',
            });

            expect(actual.total).toBe(1);
            expect(actual.data).toHaveLength(1);
            expect(actual.data[0].title).toBe('Bouillie de riz');
        });

        it('should filter recipes by maximum budget', async () => {
            const cheap = createRecipe({ estimatedBudgetXof: 1000 });
            const expensive = createRecipe({
                id: 'recipe-2',
                title: 'Recette chère',
                slug: 'recette-chere',
                estimatedBudgetXof: 9000,
            });
            mockRecipesRepository.find.mockResolvedValue([cheap, expensive]);

            const actual = await service.findAll({
                maxBudgetXof: 2000,
                page: 1,
                limit: 12,
                sort: 'recent',
            });

            expect(actual.total).toBe(1);
            expect(actual.data[0].estimatedBudgetXof).toBe(1000);
        });
    });

    describe('searchByIngredients', () => {
        it('should rank recipes by ingredient coverage', async () => {
            const recipe = createRecipe({
                ingredients: [
                    {
                        optional: false,
                        ingredient: {
                            id: 'ingredient-1',
                            name: 'Riz',
                            localNames: { fr: 'riz' },
                        },
                    },
                    {
                        optional: false,
                        ingredient: {
                            id: 'ingredient-2',
                            name: 'Eau',
                            localNames: { fr: 'eau' },
                        },
                    },
                    {
                        optional: false,
                        ingredient: {
                            id: 'ingredient-3',
                            name: 'Sucre',
                            localNames: { fr: 'sucre' },
                        },
                    },
                ] as any,
            });
            mockRecipesRepository.searchByIngredients.mockResolvedValue([
                recipe,
            ]);

            const actual = await service.searchByIngredients({
                ingredients: ['riz', 'eau'],
                limit: 5,
            });

            expect(actual.count).toBe(1);
            expect(actual.results[0].matchScore).toBe(67);
            expect(actual.results[0].missingIngredients).toEqual(['Sucre']);
        });

        it('should return no result when no ingredient matches', async () => {
            const recipe = createRecipe({
                ingredients: [
                    {
                        optional: false,
                        ingredient: {
                            id: 'ingredient-1',
                            name: 'Riz',
                            localNames: {},
                        },
                    },
                ] as any,
            });
            mockRecipesRepository.searchByIngredients.mockResolvedValue([
                recipe,
            ]);

            const actual = await service.searchByIngredients({
                ingredients: ['chocolat'],
                limit: 5,
            });

            expect(actual.count).toBe(0);
            expect(actual.results).toEqual([]);
        });
    });
});
