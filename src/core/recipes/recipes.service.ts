import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Country } from '../../common/enum/country.enum';
import { IssueSeverity } from '../../common/enum/issue.enum';
import { Difficulty, RecipeStatus } from '../../common/enum/recipe.enum';
import { SkillLevel } from '../../common/enum/user.enum';
import { createHash } from 'node:crypto';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { RedisService } from '../../libs/redis/redis.service';
import { paginate } from '../../utils/pagination';
import { toSlug } from '../../utils/slug';
import { IngredientsRepository } from '../ingredients/repositories/ingredients.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { QueryRecipesDto } from './dto/query-recipes.dto';
import { RecipeIngredientDto } from './dto/recipe-ingredient.dto';
import { RecipeIssueDto } from './dto/recipe-issue.dto';
import { RecipeStepDto } from './dto/recipe-step.dto';
import { RecipeTipDto } from './dto/recipe-tip.dto';
import { SearchByIngredientsDto } from './dto/search-by-ingredients.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeIssue } from './entities/recipe-issue.entity';
import { RecipeStep } from './entities/recipe-step.entity';
import { RecipeTip } from './entities/recipe-tip.entity';
import { RecipeIngredientsRepository } from './repositories/recipe-ingredients.repository';
import { RecipeIssuesRepository } from './repositories/recipe-issues.repository';
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
        private readonly recipeIssuesRepository: RecipeIssuesRepository,
        private readonly ingredientsRepository: IngredientsRepository,
        private readonly usersRepository: UsersRepository,
        private readonly errorHandlingService: ErrorHandlingService,
        private readonly redisService: RedisService,
    ) {}

    /**
     * Creates a recipe with ingredients, steps, tips, and issues.
     *
     * @param authorId - Optional recipe author identifier
     * @param dto - Recipe payload
     * @returns The created recipe detail
     */
    async create(authorId: string | null, dto: CreateRecipeDto) {
        const author = authorId
            ? await this.usersRepository.findOne({
                  where: { id: authorId, deleted: false },
              })
            : null;

        if (authorId && !author) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Author ${authorId} not found`,
                'Author not found',
            );
        }

        const slug = await this.generateUniqueSlug(dto.title);
        const baseServings = dto.baseServings ?? 1;
        const estimatedBudgetXof = dto.estimatedBudgetXof ?? 0;

        const recipe = await this.recipesRepository.create(
            new Recipe({
                title: dto.title.trim(),
                slug,
                description: dto.description,
                coverImageUrl: dto.coverImageUrl,
                prepMinutes: dto.prepMinutes ?? 0,
                cookMinutes: dto.cookMinutes ?? 0,
                baseServings,
                difficulty: dto.difficulty,
                country: dto.country ?? Country.BOTH,
                category: dto.category,
                author,
                estimatedBudgetXof,
                costPerServingXof: this.computeCostPerServing(
                    estimatedBudgetXof,
                    baseServings,
                ),
                status: dto.status ?? RecipeStatus.DRAFT,
                isFeatured: dto.isFeatured ?? false,
                isPremium: dto.isPremium ?? false,
                tags: dto.tags ?? [],
                publishedAt:
                    dto.status === RecipeStatus.PUBLISHED ? new Date() : null,
            }),
        );

        await this.replaceIngredients(recipe, dto.ingredients);
        await this.replaceSteps(recipe, dto.steps);
        await this.replaceTips(recipe, dto.tips ?? []);
        await this.replaceIssues(recipe, dto.issues ?? []);

        this.logger.info(`Recipe ${recipe.slug} created`);
        await this.invalidateRecipeCache(recipe.slug);

        return await this.findOne(recipe.id, true);
    }

    /**
     * Lists published recipes with filters and pagination.
     *
     * @param query - Filters and pagination
     * @param includeDrafts - Whether drafts and review recipes are included
     * @returns A paginated recipe list
     */
    async findAll(query: QueryRecipesDto, includeDrafts = false) {
        const cacheKey = await this.buildListCacheKey(query, includeDrafts);
        const cached = await this.redisService.get(cacheKey);

        if (cached) {
            return JSON.parse(cached);
        }

        const recipes = await this.recipesRepository.find({
            where: { deleted: false },
            relations: ['author'],
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
            const matchesCountry = query.country
                ? recipe.country === query.country ||
                  recipe.country === Country.BOTH
                : true;
            const matchesCategory = query.category
                ? recipe.category?.toLowerCase() ===
                  query.category.toLowerCase()
                : true;
            const matchesDifficulty = query.difficulty
                ? recipe.difficulty === query.difficulty
                : true;
            const matchesBudget =
                query.maxBudgetXof !== undefined
                    ? recipe.estimatedBudgetXof <= query.maxBudgetXof
                    : true;
            const totalTime = recipe.prepMinutes + recipe.cookMinutes;
            const matchesTime =
                query.maxTimeMinutes !== undefined
                    ? totalTime <= query.maxTimeMinutes
                    : true;

            return (
                matchesQuery &&
                matchesCountry &&
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
        const result = paginate(data, sorted.length, page, limit);

        await this.redisService.set(cacheKey, JSON.stringify(result), 300);

        return result;
    }

    /**
     * Retrieves a recipe by its slug.
     *
     * @param slug - Recipe slug
     * @param includeDrafts - Whether non-published recipes are allowed
     * @returns The recipe detail
     */
    async findBySlug(slug: string, includeDrafts = false) {
        const cacheKey = `recipe:${slug}`;

        if (!includeDrafts) {
            const cached = await this.redisService.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        }

        const recipe = await this.recipesRepository.findOne({
            where: { slug, deleted: false },
            relations: [
                'author',
                'ingredients',
                'ingredients.ingredient',
                'steps',
                'tips',
                'issues',
                'issues.step',
            ],
        });

        if (!recipe) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Recipe ${slug} not found`,
                'Recipe not found',
            );
        }

        if (!includeDrafts && recipe.status !== RecipeStatus.PUBLISHED) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Published recipe ${slug} not found`,
                'Recipe not found',
            );
        }

        const detail = this.mapRecipeDetail(recipe);

        if (!includeDrafts) {
            await this.redisService.set(cacheKey, JSON.stringify(detail), 3600);
        }

        return detail;
    }

    /**
     * Retrieves a recipe by identifier.
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
     * Updates a recipe and optionally replaces nested content.
     *
     * @param id - Recipe identifier
     * @param userId - Requesting user identifier
     * @param isAdmin - Whether the user is an administrator
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

        const baseServings = dto.baseServings ?? recipe.baseServings;
        const estimatedBudgetXof =
            dto.estimatedBudgetXof ?? recipe.estimatedBudgetXof;

        await this.recipesRepository.update(
            { id },
            {
                title: dto.title ?? recipe.title,
                slug: dto.title
                    ? await this.generateUniqueSlug(dto.title, id)
                    : recipe.slug,
                description: dto.description ?? recipe.description,
                coverImageUrl: dto.coverImageUrl ?? recipe.coverImageUrl,
                prepMinutes: dto.prepMinutes ?? recipe.prepMinutes,
                cookMinutes: dto.cookMinutes ?? recipe.cookMinutes,
                baseServings,
                difficulty: dto.difficulty ?? recipe.difficulty,
                country: dto.country ?? recipe.country,
                category: dto.category ?? recipe.category,
                estimatedBudgetXof,
                costPerServingXof: this.computeCostPerServing(
                    estimatedBudgetXof,
                    baseServings,
                ),
                isFeatured: dto.isFeatured ?? recipe.isFeatured,
                isPremium: dto.isPremium ?? recipe.isPremium,
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

        if (dto.issues) {
            await this.replaceIssues(recipe, dto.issues);
        }

        await this.invalidateRecipeCache(recipe.slug);

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
        await this.invalidateRecipeCache(recipe.slug);

        return await this.findOne(id, true);
    }

    /**
     * Soft-deletes a recipe.
     *
     * @param id - Recipe identifier
     * @param userId - Requesting user identifier
     * @param isAdmin - Whether the user is an administrator
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
        await this.invalidateRecipeCache(recipe.slug);

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
        const recipes = await this.recipesRepository.searchByIngredients(
            wanted,
            (dto.limit ?? 10) * 5,
        );

        const results = recipes
            .filter(
                (recipe) =>
                    dto.budgetXof === undefined ||
                    recipe.estimatedBudgetXof <= dto.budgetXof,
            )
            .map((recipe) => {
                const required = recipe.ingredients.filter(
                    (ingredient) => !ingredient.optional,
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
                    estimatedBudgetXof: recipe.estimatedBudgetXof,
                };
            })
            .filter((recipe) => recipe.matchScore > 0)
            .sort((a, b) => {
                if (b.matchScore !== a.matchScore) {
                    return b.matchScore - a.matchScore;
                }

                return a.estimatedBudgetXof - b.estimatedBudgetXof;
            })
            .slice(0, dto.limit ?? 10);

        return { count: results.length, results };
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
            relations: ['author'],
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
            relations: ['author'],
        });

        const weeklyBudget =
            user.monthlyBudgetXof > 0
                ? Math.round(user.monthlyBudgetXof / 4)
                : undefined;

        return recipes
            .filter(
                (recipe) =>
                    weeklyBudget === undefined ||
                    recipe.estimatedBudgetXof <= weeklyBudget,
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
                    user.preferredCategories?.some(
                        (category) =>
                            category.toLowerCase() ===
                            recipe.category?.toLowerCase(),
                    )
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
        const existing = await this.recipeIngredientsRepository.find({
            where: { recipe: { id: recipe.id } },
        });

        if (existing.length > 0) {
            await this.recipeIngredientsRepository.deleteMany(
                existing.map((item) => item.id),
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
                    unit: item.unit ?? ingredient.defaultUnit,
                    note: item.note,
                    optional: item.optional ?? false,
                    substitutes: item.substitutes,
                    estimatedPriceXof: Math.round(
                        item.quantity * ingredient.estimatedPriceXof,
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
        const existing = await this.recipeStepsRepository.find({
            where: { recipe: { id: recipe.id } },
        });

        if (existing.length > 0) {
            await this.recipeStepsRepository.deleteMany(
                existing.map((step) => step.id),
            );
        }

        const rows = steps.map(
            (step, index) =>
                new RecipeStep({
                    recipe,
                    position: step.position ?? index + 1,
                    title: step.title,
                    instruction: step.instruction,
                    imageUrl: step.imageUrl,
                    idealSeconds: step.idealSeconds,
                    minSeconds: step.minSeconds,
                    maxSeconds: step.maxSeconds,
                    isCritical: step.isCritical ?? false,
                    tip: step.tip,
                    narrationText: step.narrationText,
                    audioUrl: step.audioUrl,
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
        const existing = await this.recipeTipsRepository.find({
            where: { recipe: { id: recipe.id } },
        });

        if (existing.length > 0) {
            await this.recipeTipsRepository.deleteMany(
                existing.map((tip) => tip.id),
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
     * Replaces recipe issues.
     *
     * @param recipe - Parent recipe
     * @param issues - New issue rows
     */
    private async replaceIssues(
        recipe: Recipe,
        issues: RecipeIssueDto[],
    ): Promise<void> {
        const existing = await this.recipeIssuesRepository.find({
            where: { recipe: { id: recipe.id } },
        });

        if (existing.length > 0) {
            await this.recipeIssuesRepository.deleteMany(
                existing.map((issue) => issue.id),
            );
        }

        const steps = await this.recipeStepsRepository.find({
            where: { recipe: { id: recipe.id } },
        });
        const rows = issues.map((issue) => {
            const step = issue.stepPosition
                ? steps.find(
                      (candidate) => candidate.position === issue.stepPosition,
                  )
                : null;

            return new RecipeIssue({
                recipe,
                step,
                symptom: issue.symptom,
                cause: issue.cause,
                fix: issue.fix,
                severity: issue.severity ?? IssueSeverity.MEDIUM,
            });
        });

        await this.recipeIssuesRepository.createMany(rows);
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
                'author',
                'ingredients',
                'ingredients.ingredient',
                'steps',
                'tips',
                'issues',
                'issues.step',
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
     * Builds a stable cache key for a recipe list query.
     *
     * @param query - Recipe filters
     * @param includeDrafts - Whether drafts are included
     * @returns The cache key
     */
    private async buildListCacheKey(
        query: QueryRecipesDto,
        includeDrafts: boolean,
    ): Promise<string> {
        const version = (await this.redisService.get('recipes:version')) ?? '1';
        const hash = createHash('sha256')
            .update(JSON.stringify({ query, includeDrafts }))
            .digest('hex');

        return `recipes:list:${version}:${hash}`;
    }

    /**
     * Invalidates recipe detail and list caches.
     *
     * @param slug - Optional recipe slug
     */
    private async invalidateRecipeCache(slug?: string): Promise<void> {
        if (slug) {
            await this.redisService.del(`recipe:${slug}`);
        }

        await this.redisService.set('recipes:version', Date.now().toString());
    }

    /**
     * Ensures a user can manage a recipe.
     *
     * @param recipe - Recipe entity
     * @param userId - Requesting user identifier
     * @param isAdmin - Whether the user is an administrator
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
     * Computes the cost per serving in XOF.
     *
     * @param budgetXof - Total recipe budget
     * @param servings - Number of servings
     * @returns The cost per serving
     */
    private computeCostPerServing(budgetXof: number, servings: number): number {
        if (servings <= 0) {
            return 0;
        }

        return Math.round(budgetXof / servings);
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
            ...Object.values(ingredient.localNames ?? {}).map((name) =>
                name.toLowerCase(),
            ),
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
            return sorted.sort(
                (a, b) => a.estimatedBudgetXof - b.estimatedBudgetXof,
            );
        }

        if (sort === 'time') {
            return sorted.sort(
                (a, b) =>
                    a.prepMinutes +
                    a.cookMinutes -
                    (b.prepMinutes + b.cookMinutes),
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
            coverImageUrl: recipe.coverImageUrl,
            prepMinutes: recipe.prepMinutes,
            cookMinutes: recipe.cookMinutes,
            totalTimeMinutes: recipe.prepMinutes + recipe.cookMinutes,
            baseServings: recipe.baseServings,
            difficulty: recipe.difficulty,
            country: recipe.country,
            category: recipe.category,
            estimatedBudgetXof: recipe.estimatedBudgetXof,
            costPerServingXof: recipe.costPerServingXof,
            status: recipe.status,
            isFeatured: recipe.isFeatured,
            isPremium: recipe.isPremium,
            ratingAverage: recipe.ratingAverage,
            ratingCount: recipe.ratingCount,
            favoriteCount: recipe.favoriteCount,
            viewCount: recipe.viewCount,
            tags: recipe.tags ?? [],
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
                optional: item.optional,
                substitutes: item.substitutes ?? {},
                estimatedPriceXof: item.estimatedPriceXof,
                ingredient: item.ingredient
                    ? {
                          id: item.ingredient.id,
                          name: item.ingredient.name,
                          slug: item.ingredient.slug,
                          category: item.ingredient.category,
                          defaultUnit: item.ingredient.defaultUnit,
                          estimatedPriceXof: item.ingredient.estimatedPriceXof,
                          localNames: item.ingredient.localNames ?? {},
                          imageUrl: item.ingredient.imageUrl,
                      }
                    : null,
            }))
            .sort((a, b) =>
                (a.ingredient?.name ?? '').localeCompare(
                    b.ingredient?.name ?? '',
                ),
            );

        const steps = (recipe.steps ?? [])
            .map((step) => ({
                id: step.id,
                position: step.position,
                title: step.title,
                instruction: step.instruction,
                imageUrl: step.imageUrl,
                idealSeconds: step.idealSeconds,
                minSeconds: step.minSeconds,
                maxSeconds: step.maxSeconds,
                isCritical: step.isCritical,
                tip: step.tip,
                narrationText: step.narrationText,
                audioUrl: step.audioUrl,
            }))
            .sort((a, b) => a.position - b.position);

        const tips = (recipe.tips ?? [])
            .map((tip) => ({
                id: tip.id,
                tipNumber: tip.tipNumber,
                content: tip.content,
            }))
            .sort((a, b) => a.tipNumber - b.tipNumber);

        const issues = (recipe.issues ?? [])
            .map((issue) => ({
                id: issue.id,
                stepPosition: issue.step?.position ?? null,
                symptom: issue.symptom,
                cause: issue.cause,
                fix: issue.fix,
                severity: issue.severity,
            }))
            .sort((a, b) => (a.stepPosition ?? 0) - (b.stepPosition ?? 0));

        const totalEstimatedCostXof = ingredients.reduce(
            (total, item) => total + item.estimatedPriceXof,
            0,
        );

        return {
            ...this.mapRecipeSummary(recipe),
            ingredients,
            steps,
            tips,
            issues,
            totalEstimatedCostXof,
            stepCount: steps.length,
        };
    }
}
