import { Difficulty, RecipeStatus } from '../../common/enum/recipe.enum';
import { Recipe } from './entities/recipe.entity';
import { RecipesService } from './recipes.service';

const createRecipe = (overrides: Partial<Recipe>): Recipe =>
    ({
        id: 'recipe-1',
        title: 'Jollof rice',
        slug: 'jollof-rice',
        description: 'A beginner-friendly African rice dish.',
        imageUrl: null,
        videoUrl: null,
        prepTimeMinutes: 10,
        cookTimeMinutes: 25,
        servings: 4,
        difficulty: Difficulty.EASY,
        budgetFcfa: 3000,
        costPerServingFcfa: 750,
        status: RecipeStatus.PUBLISHED,
        isFeatured: false,
        ratingAverage: 4.5,
        ratingCount: 2,
        favoriteCount: 3,
        viewCount: 10,
        tags: ['rice', 'african'],
        cuisine: null,
        category: null,
        author: { id: 'user-1', fullname: 'Awa Koné' } as any,
        ingredients: [],
        steps: [],
        tips: [],
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
    let mockIngredientsRepository: any;
    let mockCuisinesRepository: any;
    let mockRecipeCategoriesRepository: any;
    let mockUsersRepository: any;
    let mockErrorHandlingService: any;

    beforeEach(() => {
        mockRecipesRepository = {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
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
        mockIngredientsRepository = { findOne: jest.fn() };
        mockCuisinesRepository = { findOne: jest.fn() };
        mockRecipeCategoriesRepository = { findOne: jest.fn() };
        mockUsersRepository = { findOne: jest.fn() };
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
            mockIngredientsRepository,
            mockCuisinesRepository,
            mockRecipeCategoriesRepository,
            mockUsersRepository,
            mockErrorHandlingService,
        );
    });

    describe('findAll', () => {
        it('should only return published recipes for public callers', async () => {
            const published = createRecipe({});
            const draft = createRecipe({
                id: 'recipe-2',
                title: 'Draft recipe',
                slug: 'draft-recipe',
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
            expect(actual.data[0].title).toBe('Jollof rice');
        });

        it('should filter recipes by maximum budget', async () => {
            const cheap = createRecipe({ budgetFcfa: 2000 });
            const expensive = createRecipe({
                id: 'recipe-2',
                title: 'Expensive recipe',
                slug: 'expensive-recipe',
                budgetFcfa: 9000,
            });
            mockRecipesRepository.find.mockResolvedValue([cheap, expensive]);

            const actual = await service.findAll({
                maxBudgetFcfa: 3000,
                page: 1,
                limit: 12,
                sort: 'recent',
            });

            expect(actual.total).toBe(1);
            expect(actual.data[0].budgetFcfa).toBe(2000);
        });
    });

    describe('searchByIngredients', () => {
        it('should rank recipes by ingredient coverage', async () => {
            const recipe = createRecipe({
                ingredients: [
                    {
                        isOptional: false,
                        ingredient: {
                            id: 'ingredient-1',
                            name: 'Tomato',
                            aliases: ['tomates'],
                        },
                    },
                    {
                        isOptional: false,
                        ingredient: {
                            id: 'ingredient-2',
                            name: 'Onion',
                            aliases: [],
                        },
                    },
                    {
                        isOptional: false,
                        ingredient: {
                            id: 'ingredient-3',
                            name: 'Rice',
                            aliases: [],
                        },
                    },
                ] as any,
            });
            mockRecipesRepository.find.mockResolvedValue([recipe]);

            const actual = await service.searchByIngredients({
                ingredients: ['tomato', 'onion'],
                limit: 5,
            });

            expect(actual.count).toBe(1);
            expect(actual.results[0].matchScore).toBe(67);
            expect(actual.results[0].missingIngredients).toEqual(['Rice']);
        });

        it('should return no result when no ingredient matches', async () => {
            const recipe = createRecipe({
                ingredients: [
                    {
                        isOptional: false,
                        ingredient: {
                            id: 'ingredient-1',
                            name: 'Rice',
                            aliases: [],
                        },
                    },
                ] as any,
            });
            mockRecipesRepository.find.mockResolvedValue([recipe]);

            const actual = await service.searchByIngredients({
                ingredients: ['chocolate'],
                limit: 5,
            });

            expect(actual.count).toBe(0);
            expect(actual.results).toEqual([]);
        });
    });
});
