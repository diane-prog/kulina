import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Difficulty, RecipeStatus } from '../../common/enum/recipe.enum';
import { SkillLevel } from '../../common/enum/user.enum';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { paginate } from '../../utils/pagination';
import { toSlug } from '../../utils/slug';
import { CuisinesRepository } from '../cuisines/repositories/cuisines.repository';
import { IngredientsRepository } from '../ingredients/repositories/ingredients.repository';
import { RecipeCategoriesRepository } from '../recipe-categories/repositories/recipe-categories.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { QueryRecipesDto } from './dto/query-recipes.dto';
import { RecipeIngredientDto } from './dto/recipe-ingredient.dto';
import { RecipeStepDto } from './dto/recipe-step.dto';
import { RecipeTipDto } from './dto/recipe-tip.dto';
import { SearchByIngredientsDto } from './dto/search-by-ingredients.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeStep } from './entities/recipe-step.entity';
import { RecipeTip } from './entities/recipe-tip.entity';
import { RecipeIngredientsRepository } from './repositories/recipe-ingredients.repository';
import { RecipeStepsRepository } from './repositories/recipe-steps.repository';
import { RecipeTipsRepository } from './repositories/recipe-tips.repository';
import { RecipesRepository } from './repositories/recipes.repository';

@Injectable()
export class RecipesService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
        private readonly recipesRepository: RecipesRepository,
        private readonly recipeIngredientsRepository: RecipeIngredientsRepository,
        private readonly recipeStepsRepository: RecipeStepsRepository,
        private readonly recipeTipsRepository: RecipeTipsRepository,
        private readonly ingredientsRepository: IngredientsRepository,
        private readonly cuisinesRepository: CuisinesRepository,
        private readonly recipeCategoriesRepository: RecipeCategoriesRepository,
        private readonly usersRepository: UsersRepository,
        private readonly errorHandlingService: ErrorHandlingService,
    ) {}

    /**
     * Creates a recipe with ingredients, steps, and tips.
     *
     * @param authorId - Recipe author identifier
     * @param dto - Recipe payload
     * @returns The created recipe detail
     */
    async create(authorId: string, dto: CreateRecipeDto) {
        const author = await this.usersRepository.findOne({
            where: { id: authorId, deleted: false },
        });

        if (!author) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Author ${authorId} not found`,
                'Author not found',
            );
        }

        const cuisine = await this.resolveCuisine(dto.cuisineId);
        const category = await this.resolveCategory(dto.categoryId);
        const slug = await this.generateUniqueSlug(dto.title);
        const servings = dto.servings ?? 1;
        const budgetFcfa = dto.budgetFcfa ?? 0;

        const recipe = await this.recipesRepository.create(
            new Recipe({
                title: dto.title.trim(),
                slug,
                description: dto.description,
                imageUrl: dto.imageUrl,
                videoUrl: dto.videoUrl,
                prepTimeMinutes: dto.prepTimeMinutes ?? 0,
                cookTimeMinutes: dto.cookTimeMinutes ?? 0,
                servings,
                difficulty: dto.difficulty,
                cuisine,
                category,
                author,
                budgetFcfa,
                costPerServingFcfa: this.computeCostPerServing(
                    budgetFcfa,
                    servings,
                ),
                status: dto.status ?? RecipeStatus.DRAFT,
                isFeatured: dto.isFeatured ?? false,
                tags: dto.tags ?? [],
                publishedAt:
                    dto.status === RecipeStatus.PUBLISHED ? new Date() : null,
            }),
        );

        await this.replaceIngredients(recipe, dto.ingredients);
        await this.replaceSteps(recipe, dto.steps);
        await this.replaceTips(recipe, dto.tips ?? []);

        this.logger.info(`Recipe ${recipe.slug} created by ${author.email}`);

        return await this.findOne(recipe.id, true);
    }

    /**
     * Lists published recipes with filters and pagination.
     *
     * @param query - Filters and pagination
     * @param includeDrafts - Whether drafts and archived recipes are included
     * @returns A paginated recipe list
     */
    async findAll(query: QueryRecipesDto, includeDrafts = false) {
        const recipes = await this.recipesRepository.find({
            where: { deleted: false },
            relations: ['cuisine', 'category', 'author'],
            order: { createdAt: 'DESC' },
        });

        const filtered = recipes.filter((recipe) => {
            if (!includeDrafts && recipe.status !== RecipeStatus.PUBLISHED) {
                return false;
            }

            const search = query.query?.toLowerCase();
            const matchesQuery = search
                ? recipe.title.toLowerCase().includes(search) ||
                  recipe.description?.toLowerCase().includes(search) ||
                  recipe.tags?.some((tag) => tag.toLowerCase().includes(search))
                : true;
            const matchesCuisine = query.cuisineId
                ? recipe.cuisine?.id === query.cuisineId
                : true;
            const matchesCategory = query.categoryId
                ? recipe.category?.id === query.categoryId
                : true;
            const matchesDifficulty = query.difficulty
                ? recipe.difficulty === query.difficulty
                : true;
            const matchesBudget =
                query.maxBudgetFcfa !== undefined
                    ? recipe.budgetFcfa <= query.maxBudgetFcfa
                    : true;
            const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
            const matchesTime =
                query.maxTimeMinutes !== undefined
                    ? totalTime <= query.maxTimeMinutes
                    : true;

            return (
                matchesQuery &&
                matchesCuisine &&
                matchesCategory &&
                matchesDifficulty &&
                matchesBudget &&
                matchesTime
            );
        });

        const sorted = this.sortRecipes(filtered, query.sort);
        const page = query.page ?? 1;
        const limit = query.limit ?? 12;
        const data = sorted
            .slice((page - 1) * limit, page * limit)
            .map((recipe) => this.mapRecipeSummary(recipe));

        return paginate(data, sorted.length, page, limit);
    }

    /**
     * Retrieves a recipe detail.
     *
     * @param id - Recipe identifier
     * @param includeDrafts - Whether non-published recipes are allowed
     * @returns The recipe detail
     */
    async findOne(id: string, includeDrafts = false) {
        const recipe = await this.retrieveRecipe(id);

        if (!includeDrafts && recipe.status !== RecipeStatus.PUBLISHED) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Published recipe ${id} not found`,
                'Recipe not found',
            );
        }

        return this.mapRecipeDetail(recipe);
    }

    /**
     * Updates a recipe and optionally replaces its nested content.
     *
     * @param id - Recipe identifier
     * @param userId - Requesting user identifier
     * @param isAdmin - Whether the requesting user is an administrator
     * @param dto - Updated recipe payload
     * @returns The updated recipe detail
     */
    async update(
        id: string,
        userId: string,
        isAdmin: boolean,
        dto: UpdateRecipeDto,
    ) {
        const recipe = await this.retrieveRecipe(id);
        this.assertCanManage(recipe, userId, isAdmin);

        const cuisine = dto.cuisineId
            ? await this.resolveCuisine(dto.cuisineId)
            : recipe.cuisine;
        const category = dto.categoryId
            ? await this.resolveCategory(dto.categoryId)
            : recipe.category;
        const servings = dto.servings ?? recipe.servings;
        const budgetFcfa = dto.budgetFcfa ?? recipe.budgetFcfa;

        await this.recipesRepository.update(
            { id },
            {
                title: dto.title ?? recipe.title,
                slug: dto.title
                    ? await this.generateUniqueSlug(dto.title, id)
                    : recipe.slug,
                description: dto.description ?? recipe.description,
                imageUrl: dto.imageUrl ?? recipe.imageUrl,
                videoUrl: dto.videoUrl ?? recipe.videoUrl,
                prepTimeMinutes: dto.prepTimeMinutes ?? recipe.prepTimeMinutes,
                cookTimeMinutes: dto.cookTimeMinutes ?? recipe.cookTimeMinutes,
                servings,
                difficulty: dto.difficulty ?? recipe.difficulty,
                cuisine,
                category,
                budgetFcfa,
                costPerServingFcfa: this.computeCostPerServing(
                    budgetFcfa,
                    servings,
                ),
                isFeatured: dto.isFeatured ?? recipe.isFeatured,
                tags: dto.tags ?? recipe.tags,
                status: dto.status ?? recipe.status,
                publishedAt:
                    dto.status === RecipeStatus.PUBLISHED && !recipe.publishedAt
                        ? new Date()
                        : recipe.publishedAt,
            },
        );

        if (dto.ingredients) {
            await this.replaceIngredients(recipe, dto.ingredients);
        }

        if (dto.steps) {
            await this.replaceSteps(recipe, dto.steps);
        }

        if (dto.tips) {
            await this.replaceTips(recipe, dto.tips);
        }

        return await this.findOne(id, true);
    }

    /**
     * Updates the publication status of a recipe.
     *
     * @param id - Recipe identifier
     * @param status - New status
     * @returns The updated recipe detail
     */
    async updateStatus(id: string, status: RecipeStatus) {
        const recipe = await this.retrieveRecipe(id);

        await this.recipesRepository.update(
            { id },
            {
                status,
                publishedAt:
                    status === RecipeStatus.PUBLISHED
                        ? (recipe.publishedAt ?? new Date())
                        : recipe.publishedAt,
            },
        );

        return await this.findOne(id, true);
    }

    /**
     * Soft-deletes a recipe.
     *
     * @param id - Recipe identifier
     * @param userId - Requesting user identifier
     * @param isAdmin - Whether the requesting user is an administrator
     * @returns A confirmation message
     */
    async remove(
        id: string,
        userId: string,
        isAdmin: boolean,
    ): Promise<{ message: string }> {
        const recipe = await this.retrieveRecipe(id);
        this.assertCanManage(recipe, userId, isAdmin);
        await this.recipesRepository.softDelete({ id });

        return { message: 'Recipe deleted successfully' };
    }

    /**
     * Finds published recipes that best match a list of ingredients.
     *
     * @param dto - Ingredients and optional budget
     * @returns Matching recipes with coverage details
     */
    async searchByIngredients(dto: SearchByIngredientsDto) {
        const wanted = dto.ingredients.map((ingredient) =>
            ingredient.trim().toLowerCase(),
        );
        const recipes = await this.recipesRepository.find({
            where: { deleted: false, status: RecipeStatus.PUBLISHED },
            relations: [
                'cuisine',
                'category',
                'author',
                'ingredients',
                'ingredients.ingredient',
            ],
        });

        const results = recipes
            .filter(
                (recipe) =>
                    dto.maxBudgetFcfa === undefined ||
                    recipe.budgetFcfa <= dto.maxBudgetFcfa,
            )
            .map((recipe) => {
                const required = recipe.ingredients.filter(
                    (ingredient) => !ingredient.isOptional,
                );
                const matched = required.filter((recipeIngredient) =>
                    this.matchesIngredient(recipeIngredient, wanted),
                );
                const missing = required.filter(
                    (recipeIngredient) =>
                        !this.matchesIngredient(recipeIngredient, wanted),
                );
                const matchScore =
                    required.length === 0
                        ? 0
                        : Math.round((matched.length / required.length) * 100);

                return {
                    ...this.mapRecipeSummary(recipe),
                    matchScore,
                    matchedIngredients: matched.map(
                        (item) => item.ingredient?.name,
                    ),
                    missingIngredients: missing.map(
                        (item) => item.ingredient?.name,
                    ),
                    estimatedBudgetFcfa: recipe.budgetFcfa,
                };
            })
            .filter((recipe) => recipe.matchScore > 0)
            .sort((a, b) => {
                if (b.matchScore !== a.matchScore) {
                    return b.matchScore - a.matchScore;
                }

                return a.estimatedBudgetFcfa - b.estimatedBudgetFcfa;
            })
            .slice(0, dto.limit ?? 10);

        return {
            count: results.length,
            results,
        };
    }

    /**
     * Lists the most popular published recipes.
     *
     * @param limit - Maximum number of recipes
     * @returns Popular recipe summaries
     */
    async findPopular(limit = 10) {
        const recipes = await this.recipesRepository.find({
            where: { deleted: false, status: RecipeStatus.PUBLISHED },
            relations: ['cuisine', 'category', 'author'],
        });

        return recipes
            .sort((a, b) => {
                const scoreA =
                    a.favoriteCount * 3 + a.ratingAverage * 10 + a.viewCount;
                const scoreB =
                    b.favoriteCount * 3 + b.ratingAverage * 10 + b.viewCount;

                return scoreB - scoreA;
            })
            .slice(0, limit)
            .map((recipe) => this.mapRecipeSummary(recipe));
    }

    /**
     * Recommends recipes based on the user's skill level and budget.
     *
     * @param userId - User identifier
     * @returns Recommended recipe summaries
     */
    async findRecommendedForUser(userId: string) {
        const user = await this.usersRepository.findOne({
            where: { id: userId, deleted: false },
        });

        if (!user) {
            this.errorHandlingService.returnErrorOnNotFound(
                `User ${userId} not found`,
                'User not found',
            );
        }

        const recipes = await this.recipesRepository.find({
            where: { deleted: false, status: RecipeStatus.PUBLISHED },
            relations: ['cuisine', 'category', 'author'],
        });

        const weeklyBudget =
            user.monthlyBudgetFcfa > 0
                ? Math.round(user.monthlyBudgetFcfa / 4)
                : undefined;

        return recipes
            .filter(
                (recipe) =>
                    weeklyBudget === undefined ||
                    recipe.budgetFcfa <= weeklyBudget,
            )
            .map((recipe) => {
                let score = recipe.ratingAverage * 10 + recipe.favoriteCount;
                const isBeginnerFriendly =
                    user.skillLevel === SkillLevel.BEGINNER &&
                    recipe.difficulty === Difficulty.EASY;

                if (isBeginnerFriendly) {
                    score += 25;
                }

                if (
                    user.preferredCuisine &&
                    recipe.cuisine?.name
                        ?.toLowerCase()
                        .includes(user.preferredCuisine.toLowerCase())
                ) {
                    score += 20;
                }

                return { recipe, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(({ recipe }) => this.mapRecipeSummary(recipe));
    }

    /**
     * Increments a recipe view counter.
     *
     * @param id - Recipe identifier
     */
    async incrementViewCount(id: string): Promise<void> {
        const recipe = await this.recipesRepository.findOne({
            where: { id, deleted: false },
        });

        if (recipe) {
            await this.recipesRepository.update(
                { id },
                { viewCount: recipe.viewCount + 1 },
            );
        }
    }

    /**
     * Adjusts a recipe favorite counter.
     *
     * @param id - Recipe identifier
     * @param delta - Increment or decrement
     */
    async incrementFavoriteCount(id: string, delta: number): Promise<void> {
        const recipe = await this.recipesRepository.findOne({
            where: { id, deleted: false },
        });

        if (recipe) {
            await this.recipesRepository.update(
                { id },
                { favoriteCount: Math.max(0, recipe.favoriteCount + delta) },
            );
        }
    }

    /**
     * Updates the rating aggregate of a recipe.
     *
     * @param id - Recipe identifier
     * @param average - New average rating
     * @param count - Number of ratings
     */
    async updateRating(
        id: string,
        average: number,
        count: number,
    ): Promise<void> {
        await this.recipesRepository.update(
            { id },
            { ratingAverage: average, ratingCount: count },
        );
    }

    /**
     * Replaces recipe ingredients.
     *
     * @param recipe - Parent recipe
     * @param ingredients - New ingredient rows
     */
    private async replaceIngredients(
        recipe: Recipe,
        ingredients: RecipeIngredientDto[],
    ): Promise<void> {
        const existingIngredients = await this.recipeIngredientsRepository.find(
            {
                where: { recipe: { id: recipe.id } },
            },
        );

        if (existingIngredients.length > 0) {
            await this.recipeIngredientsRepository.deleteMany(
                existingIngredients.map((item) => item.id),
            );
        }

        const rows: RecipeIngredient[] = [];

        for (const item of ingredients) {
            const ingredient = await this.ingredientsRepository.findOne({
                where: { id: item.ingredientId, deleted: false },
            });

            if (!ingredient) {
                this.errorHandlingService.returnErrorOnNotFound(
                    `Ingredient ${item.ingredientId} not found`,
                    `Ingredient ${item.ingredientId} not found`,
                );
            }

            rows.push(
                new RecipeIngredient({
                    recipe,
                    ingredient,
                    quantity: item.quantity,
                    unit: item.unit ?? ingredient.unit,
                    note: item.note,
                    isOptional: item.isOptional ?? false,
                    estimatedPriceFcfa: Math.round(
                        item.quantity * ingredient.averagePriceFcfa,
                    ),
                }),
            );
        }

        await this.recipeIngredientsRepository.createMany(rows);
    }

    /**
     * Replaces recipe steps.
     *
     * @param recipe - Parent recipe
     * @param steps - New step rows
     */
    private async replaceSteps(
        recipe: Recipe,
        steps: RecipeStepDto[],
    ): Promise<void> {
        const existingSteps = await this.recipeStepsRepository.find({
            where: { recipe: { id: recipe.id } },
        });

        if (existingSteps.length > 0) {
            await this.recipeStepsRepository.deleteMany(
                existingSteps.map((step) => step.id),
            );
        }

        const rows = steps.map(
            (step, index) =>
                new RecipeStep({
                    recipe,
                    stepNumber: step.stepNumber ?? index + 1,
                    title: step.title,
                    instruction: step.instruction,
                    imageUrl: step.imageUrl,
                    videoTimestampSeconds: step.videoTimestampSeconds,
                    durationMinutes: step.durationMinutes ?? 0,
                }),
        );

        await this.recipeStepsRepository.createMany(rows);
    }

    /**
     * Replaces recipe tips.
     *
     * @param recipe - Parent recipe
     * @param tips - New tip rows
     */
    private async replaceTips(
        recipe: Recipe,
        tips: RecipeTipDto[],
    ): Promise<void> {
        const existingTips = await this.recipeTipsRepository.find({
            where: { recipe: { id: recipe.id } },
        });

        if (existingTips.length > 0) {
            await this.recipeTipsRepository.deleteMany(
                existingTips.map((tip) => tip.id),
            );
        }

        const rows = tips.map(
            (tip, index) =>
                new RecipeTip({
                    recipe,
                    tipNumber: index + 1,
                    content: tip.content,
                }),
        );

        await this.recipeTipsRepository.createMany(rows);
    }

    /**
     * Loads a recipe with all nested content.
     *
     * @param id - Recipe identifier
     * @returns The recipe entity
     */
    private async retrieveRecipe(id: string): Promise<Recipe> {
        const recipe = await this.recipesRepository.findOne({
            where: { id, deleted: false },
            relations: [
                'cuisine',
                'category',
                'author',
                'ingredients',
                'ingredients.ingredient',
                'steps',
                'tips',
            ],
        });

        if (!recipe) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Recipe ${id} not found`,
                'Recipe not found',
            );
        }

        return recipe;
    }

    /**
     * Ensures a user can manage a recipe.
     *
     * @param recipe - Recipe entity
     * @param userId - Requesting user identifier
     * @param isAdmin - Whether the user is an administrator
     * @throws ForbiddenException when the user is neither the author nor an admin
     */
    private assertCanManage(
        recipe: Recipe,
        userId: string,
        isAdmin: boolean,
    ): void {
        if (isAdmin || recipe.author?.id === userId) {
            return;
        }

        throw new ForbiddenException('You can only manage recipes you created');
    }

    /**
     * Resolves an optional cuisine identifier.
     *
     * @param cuisineId - Cuisine identifier
     * @returns The cuisine or null
     */
    private async resolveCuisine(cuisineId?: string) {
        if (!cuisineId) {
            return null;
        }

        const cuisine = await this.cuisinesRepository.findOne({
            where: { id: cuisineId, deleted: false },
        });

        if (!cuisine) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Cuisine ${cuisineId} not found`,
                'Cuisine not found',
            );
        }

        return cuisine;
    }

    /**
     * Resolves an optional recipe category identifier.
     *
     * @param categoryId - Category identifier
     * @returns The category or null
     */
    private async resolveCategory(categoryId?: string) {
        if (!categoryId) {
            return null;
        }

        const category = await this.recipeCategoriesRepository.findOne({
            where: { id: categoryId, deleted: false },
        });

        if (!category) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Recipe category ${categoryId} not found`,
                'Recipe category not found',
            );
        }

        return category;
    }

    /**
     * Generates a unique recipe slug.
     *
     * @param title - Recipe title
     * @param currentRecipeId - Recipe being updated, if any
     * @returns A unique slug
     */
    private async generateUniqueSlug(
        title: string,
        currentRecipeId?: string,
    ): Promise<string> {
        const base = toSlug(title);
        let slug = base;
        let index = 1;

        while (true) {
            const existing = await this.recipesRepository.findOne({
                where: { slug },
            });

            if (!existing || existing.id === currentRecipeId) {
                return slug;
            }

            slug = `${base}-${index}`;
            index += 1;
        }
    }

    /**
     * Computes the cost per serving in FCFA.
     *
     * @param budgetFcfa - Total recipe budget
     * @param servings - Number of servings
     * @returns The cost per serving
     */
    private computeCostPerServing(
        budgetFcfa: number,
        servings: number,
    ): number {
        if (servings <= 0) {
            return 0;
        }

        return Math.round(budgetFcfa / servings);
    }

    /**
     * Checks whether a recipe ingredient matches the requested names.
     *
     * @param recipeIngredient - Recipe ingredient row
     * @param wanted - Normalized ingredient names
     * @returns Whether the ingredient matches
     */
    private matchesIngredient(
        recipeIngredient: RecipeIngredient,
        wanted: string[],
    ): boolean {
        const ingredient = recipeIngredient.ingredient;

        if (!ingredient) {
            return false;
        }

        const candidates = [
            ingredient.name.toLowerCase(),
            ...(ingredient.aliases ?? []).map((alias) => alias.toLowerCase()),
        ];

        return candidates.some((candidate) =>
            wanted.some(
                (name) => candidate.includes(name) || name.includes(candidate),
            ),
        );
    }

    /**
     * Sorts recipes using the requested strategy.
     *
     * @param recipes - Recipes to sort
     * @param sort - Sort strategy
     * @returns Sorted recipes
     */
    private sortRecipes(
        recipes: Recipe[],
        sort: QueryRecipesDto['sort'],
    ): Recipe[] {
        const sorted = [...recipes];

        if (sort === 'popular') {
            return sorted.sort(
                (a, b) =>
                    b.favoriteCount * 3 +
                    b.ratingAverage * 10 +
                    b.viewCount -
                    (a.favoriteCount * 3 + a.ratingAverage * 10 + a.viewCount),
            );
        }

        if (sort === 'rating') {
            return sorted.sort((a, b) => b.ratingAverage - a.ratingAverage);
        }

        if (sort === 'budget') {
            return sorted.sort((a, b) => a.budgetFcfa - b.budgetFcfa);
        }

        if (sort === 'time') {
            return sorted.sort(
                (a, b) =>
                    a.prepTimeMinutes +
                    a.cookTimeMinutes -
                    (b.prepTimeMinutes + b.cookTimeMinutes),
            );
        }

        return sorted.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        );
    }

    /**
     * Builds a lightweight recipe representation.
     *
     * @param recipe - Recipe entity
     * @returns The recipe summary
     */
    private mapRecipeSummary(recipe: Recipe) {
        return {
            id: recipe.id,
            title: recipe.title,
            slug: recipe.slug,
            description: recipe.description,
            imageUrl: recipe.imageUrl,
            videoUrl: recipe.videoUrl,
            prepTimeMinutes: recipe.prepTimeMinutes,
            cookTimeMinutes: recipe.cookTimeMinutes,
            totalTimeMinutes: recipe.prepTimeMinutes + recipe.cookTimeMinutes,
            servings: recipe.servings,
            difficulty: recipe.difficulty,
            budgetFcfa: recipe.budgetFcfa,
            costPerServingFcfa: recipe.costPerServingFcfa,
            status: recipe.status,
            isFeatured: recipe.isFeatured,
            ratingAverage: recipe.ratingAverage,
            ratingCount: recipe.ratingCount,
            favoriteCount: recipe.favoriteCount,
            viewCount: recipe.viewCount,
            tags: recipe.tags ?? [],
            cuisine: recipe.cuisine
                ? {
                      id: recipe.cuisine.id,
                      name: recipe.cuisine.name,
                      slug: recipe.cuisine.slug,
                  }
                : null,
            category: recipe.category
                ? {
                      id: recipe.category.id,
                      name: recipe.category.name,
                      slug: recipe.category.slug,
                  }
                : null,
            author: recipe.author
                ? {
                      id: recipe.author.id,
                      fullname: recipe.author.fullname,
                  }
                : null,
            createdAt: recipe.createdAt,
            publishedAt: recipe.publishedAt,
        };
    }

    /**
     * Builds a detailed recipe representation.
     *
     * @param recipe - Recipe entity with nested relations
     * @returns The recipe detail
     */
    private mapRecipeDetail(recipe: Recipe) {
        const ingredients = (recipe.ingredients ?? [])
            .map((item) => ({
                id: item.id,
                quantity: item.quantity,
                unit: item.unit,
                note: item.note,
                isOptional: item.isOptional,
                estimatedPriceFcfa: item.estimatedPriceFcfa,
                ingredient: item.ingredient
                    ? {
                          id: item.ingredient.id,
                          name: item.ingredient.name,
                          slug: item.ingredient.slug,
                          category: item.ingredient.category,
                          unit: item.ingredient.unit,
                          averagePriceFcfa: item.ingredient.averagePriceFcfa,
                          imageUrl: item.ingredient.imageUrl,
                      }
                    : null,
            }))
            .sort(
                (a, b) =>
                    a.ingredient?.name?.localeCompare(
                        b.ingredient?.name ?? '',
                    ) ?? 0,
            );

        const steps = (recipe.steps ?? [])
            .map((step) => ({
                id: step.id,
                stepNumber: step.stepNumber,
                title: step.title,
                instruction: step.instruction,
                imageUrl: step.imageUrl,
                videoTimestampSeconds: step.videoTimestampSeconds,
                durationMinutes: step.durationMinutes,
            }))
            .sort((a, b) => a.stepNumber - b.stepNumber);

        const tips = (recipe.tips ?? [])
            .map((tip) => ({
                id: tip.id,
                tipNumber: tip.tipNumber,
                content: tip.content,
            }))
            .sort((a, b) => a.tipNumber - b.tipNumber);

        const totalEstimatedCostFcfa = ingredients.reduce(
            (total, item) => total + item.estimatedPriceFcfa,
            0,
        );

        return {
            ...this.mapRecipeSummary(recipe),
            ingredients,
            steps,
            tips,
            totalEstimatedCostFcfa,
            stepCount: steps.length,
        };
    }
}
