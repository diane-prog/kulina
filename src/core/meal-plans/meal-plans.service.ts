import { ForbiddenException, Injectable } from '@nestjs/common';
import { MealPlanStatus } from '../../common/enum/meal-plan.enum';
import { MealType, RecipeStatus } from '../../common/enum/recipe.enum';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { paginate } from '../../utils/pagination';
import { RecipesRepository } from '../recipes/repositories/recipes.repository';
import { AddMealPlanItemDto } from './dto/add-meal-plan-item.dto';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';
import { GenerateMealPlanDto } from './dto/generate-meal-plan.dto';
import { QueryMealPlansDto } from './dto/query-meal-plans.dto';
import { UpdateMealPlanDto } from './dto/update-meal-plan.dto';
import { MealPlan } from './entities/meal-plan.entity';
import { MealPlanItem } from './entities/meal-plan-item.entity';
import { MealPlanItemsRepository } from './repositories/meal-plan-items.repository';
import { MealPlansRepository } from './repositories/meal-plans.repository';

@Injectable()
export class MealPlansService {
    constructor(
        private readonly mealPlansRepository: MealPlansRepository,
        private readonly mealPlanItemsRepository: MealPlanItemsRepository,
        private readonly recipesRepository: RecipesRepository,
        private readonly errorHandlingService: ErrorHandlingService,
    ) {}

    /**
     * Creates a weekly meal plan.
     *
     * @param userId - Owner identifier
     * @param dto - Meal plan payload
     * @returns The created meal plan detail
     */
    async create(userId: string, dto: CreateMealPlanDto) {
        const weekStartDate = this.normalizeDate(dto.weekStartDate);
        const plan = await this.mealPlansRepository.create(
            new MealPlan({
                user: { id: userId } as any,
                title: dto.title,
                weekStartDate,
                weekEndDate: this.addDays(weekStartDate, 6),
                budgetFcfa: dto.budgetFcfa ?? 0,
                status: MealPlanStatus.DRAFT,
                notes: dto.notes,
            }),
        );

        return await this.findOne(plan.id, userId);
    }

    /**
     * Lists the user's meal plans.
     *
     * @param userId - Owner identifier
     * @param query - Filters and pagination
     * @returns A paginated meal plan list
     */
    async findAll(userId: string, query: QueryMealPlansDto) {
        const plans = await this.mealPlansRepository.find({
            where: { user: { id: userId }, deleted: false },
            relations: ['items', 'items.recipe'],
            order: { createdAt: 'DESC' },
        });

        const filtered = plans.filter((plan) =>
            query.status ? plan.status === query.status : true,
        );
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const data = filtered
            .slice((page - 1) * limit, page * limit)
            .map((plan) => this.mapPlanSummary(plan));

        return paginate(data, filtered.length, page, limit);
    }

    /**
     * Retrieves a meal plan detail.
     *
     * @param id - Meal plan identifier
     * @param userId - Owner identifier
     * @returns The meal plan detail
     */
    async findOne(id: string, userId: string) {
        const plan = await this.retrievePlan(id, userId);

        return this.mapPlanDetail(plan);
    }

    /**
     * Updates a meal plan.
     *
     * @param id - Meal plan identifier
     * @param userId - Owner identifier
     * @param dto - Updated payload
     * @returns The updated meal plan detail
     */
    async update(id: string, userId: string, dto: UpdateMealPlanDto) {
        const plan = await this.retrievePlan(id, userId);
        const weekStartDate = dto.weekStartDate
            ? this.normalizeDate(dto.weekStartDate)
            : plan.weekStartDate;

        await this.mealPlansRepository.update(
            { id },
            {
                title: dto.title ?? plan.title,
                weekStartDate,
                weekEndDate: dto.weekStartDate
                    ? this.addDays(weekStartDate, 6)
                    : plan.weekEndDate,
                budgetFcfa: dto.budgetFcfa ?? plan.budgetFcfa,
                status: dto.status ?? plan.status,
                notes: dto.notes ?? plan.notes,
            },
        );

        return await this.findOne(id, userId);
    }

    /**
     * Soft-deletes a meal plan.
     *
     * @param id - Meal plan identifier
     * @param userId - Owner identifier
     * @returns A confirmation message
     */
    async remove(id: string, userId: string): Promise<{ message: string }> {
        await this.retrievePlan(id, userId);
        await this.mealPlansRepository.softDelete({ id });

        return { message: 'Meal plan deleted successfully' };
    }

    /**
     * Adds a recipe to a meal plan.
     *
     * @param id - Meal plan identifier
     * @param userId - Owner identifier
     * @param dto - Item payload
     * @returns The updated meal plan detail
     */
    async addItem(id: string, userId: string, dto: AddMealPlanItemDto) {
        const plan = await this.retrievePlan(id, userId);
        const recipe = await this.recipesRepository.findOne({
            where: { id: dto.recipeId, deleted: false },
        });

        if (!recipe) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Recipe ${dto.recipeId} not found`,
                'Recipe not found',
            );
        }

        await this.mealPlanItemsRepository.create(
            new MealPlanItem({
                mealPlan: plan,
                recipe,
                plannedDate: this.normalizeDate(dto.plannedDate),
                mealType: dto.mealType,
                servings: dto.servings ?? recipe.servings,
                estimatedCostFcfa: recipe.budgetFcfa,
            }),
        );

        return await this.findOne(id, userId);
    }

    /**
     * Removes a recipe from a meal plan.
     *
     * @param id - Meal plan identifier
     * @param itemId - Item identifier
     * @param userId - Owner identifier
     * @returns The updated meal plan detail
     */
    async removeItem(id: string, itemId: string, userId: string) {
        await this.retrievePlan(id, userId);
        const item = await this.mealPlanItemsRepository.findOne({
            where: { id: itemId, deleted: false },
            relations: ['mealPlan'],
        });

        if (!item || item.mealPlan?.id !== id) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Meal plan item ${itemId} not found`,
                'Meal plan item not found',
            );
        }

        await this.mealPlanItemsRepository.softDelete({ id: itemId });

        return await this.findOne(id, userId);
    }

    /**
     * Generates a balanced weekly meal plan from published recipes.
     *
     * @param userId - Owner identifier
     * @param dto - Generation constraints
     * @returns The generated meal plan detail
     * @throws BadRequestException when no recipe fits the budget
     */
    async generate(userId: string, dto: GenerateMealPlanDto) {
        const weekStartDate = this.normalizeDate(dto.weekStartDate);
        const includeLunch = dto.includeLunch ?? true;
        const includeDinner = dto.includeDinner ?? true;
        const meals = [
            includeLunch ? MealType.LUNCH : null,
            includeDinner ? MealType.DINNER : null,
        ].filter(Boolean) as MealType[];

        if (meals.length === 0) {
            this.errorHandlingService.returnErrorOnBadRequest(
                'At least one meal type must be included',
                'At least one meal type must be included',
            );
        }

        const recipes = await this.recipesRepository.find({
            where: { deleted: false, status: RecipeStatus.PUBLISHED },
            relations: ['cuisine'],
        });

        const budgetPerMeal = Math.floor(dto.budgetFcfa / (7 * meals.length));
        const candidates = recipes
            .filter(
                (recipe) =>
                    (!dto.cuisineId || recipe.cuisine?.id === dto.cuisineId) &&
                    recipe.budgetFcfa <= budgetPerMeal,
            )
            .sort((a, b) => {
                if (b.ratingAverage !== a.ratingAverage) {
                    return b.ratingAverage - a.ratingAverage;
                }

                return a.budgetFcfa - b.budgetFcfa;
            });

        const fallback = recipes
            .filter(
                (recipe) =>
                    !dto.cuisineId || recipe.cuisine?.id === dto.cuisineId,
            )
            .sort((a, b) => a.budgetFcfa - b.budgetFcfa);
        const pool = candidates.length > 0 ? candidates : fallback;

        if (pool.length === 0) {
            this.errorHandlingService.returnErrorOnBadRequest(
                'No published recipe matches the requested constraints',
                'No published recipe matches the requested constraints',
            );
        }

        const plan = await this.mealPlansRepository.create(
            new MealPlan({
                user: { id: userId } as any,
                title: `Meal plan for week of ${weekStartDate}`,
                weekStartDate,
                weekEndDate: this.addDays(weekStartDate, 6),
                budgetFcfa: dto.budgetFcfa,
                status: MealPlanStatus.ACTIVE,
                notes: 'Automatically generated by Kulina',
            }),
        );

        const items: MealPlanItem[] = [];
        let recipeIndex = 0;

        for (let day = 0; day < 7; day += 1) {
            const plannedDate = this.addDays(weekStartDate, day);

            for (const mealType of meals) {
                const recipe = pool[recipeIndex % pool.length];
                recipeIndex += 1;

                items.push(
                    new MealPlanItem({
                        mealPlan: plan,
                        recipe,
                        plannedDate,
                        mealType,
                        servings: dto.servings ?? recipe.servings,
                        estimatedCostFcfa: recipe.budgetFcfa,
                    }),
                );
            }
        }

        await this.mealPlanItemsRepository.createMany(items);

        return await this.findOne(plan.id, userId);
    }

    /**
     * Builds a budget summary for a meal plan.
     *
     * @param id - Meal plan identifier
     * @param userId - Owner identifier
     * @returns Budget totals and coverage
     */
    async getBudgetSummary(id: string, userId: string) {
        const plan = await this.retrievePlan(id, userId);
        const items = plan.items ?? [];
        const totalEstimatedCostFcfa = items.reduce(
            (total, item) => total + item.estimatedCostFcfa,
            0,
        );
        const remainingBudgetFcfa = plan.budgetFcfa - totalEstimatedCostFcfa;
        const days = new Set(items.map((item) => item.plannedDate));

        return {
            mealPlanId: plan.id,
            budgetFcfa: plan.budgetFcfa,
            totalEstimatedCostFcfa,
            remainingBudgetFcfa,
            isWithinBudget: remainingBudgetFcfa >= 0,
            itemCount: items.length,
            dayCount: days.size,
            averageCostPerMealFcfa:
                items.length === 0
                    ? 0
                    : Math.round(totalEstimatedCostFcfa / items.length),
        };
    }

    /**
     * Loads a meal plan with nested items.
     *
     * @param id - Meal plan identifier
     * @param userId - Owner identifier
     * @returns The meal plan entity
     */
    private async retrievePlan(id: string, userId: string): Promise<MealPlan> {
        const plan = await this.mealPlansRepository.findOne({
            where: { id, deleted: false },
            relations: [
                'items',
                'items.recipe',
                'items.recipe.cuisine',
                'items.recipe.category',
            ],
        });

        if (!plan) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Meal plan ${id} not found`,
                'Meal plan not found',
            );
        }

        if (plan.user?.id !== userId) {
            throw new ForbiddenException(
                'You can only access your own meal plans',
            );
        }

        return plan;
    }

    /**
     * Formats a date as YYYY-MM-DD.
     *
     * @param value - Date input
     * @returns The normalized date string
     */
    private normalizeDate(value: string): string {
        return new Date(value).toISOString().slice(0, 10);
    }

    /**
     * Adds days to a YYYY-MM-DD date.
     *
     * @param value - Base date
     * @param days - Number of days to add
     * @returns The resulting date string
     */
    private addDays(value: string, days: number): string {
        const date = new Date(value);
        date.setDate(date.getDate() + days);

        return date.toISOString().slice(0, 10);
    }

    /**
     * Maps a meal plan to a summary.
     *
     * @param plan - Meal plan entity
     * @returns The meal plan summary
     */
    private mapPlanSummary(plan: MealPlan) {
        const items = plan.items ?? [];
        const totalEstimatedCostFcfa = items.reduce(
            (total, item) => total + item.estimatedCostFcfa,
            0,
        );

        return {
            id: plan.id,
            title: plan.title,
            weekStartDate: plan.weekStartDate,
            weekEndDate: plan.weekEndDate,
            budgetFcfa: plan.budgetFcfa,
            totalEstimatedCostFcfa,
            remainingBudgetFcfa: plan.budgetFcfa - totalEstimatedCostFcfa,
            status: plan.status,
            notes: plan.notes,
            itemCount: items.length,
            createdAt: plan.createdAt,
        };
    }

    /**
     * Maps a meal plan to a detailed representation.
     *
     * @param plan - Meal plan entity with items
     * @returns The meal plan detail
     */
    private mapPlanDetail(plan: MealPlan) {
        const summary = this.mapPlanSummary(plan);
        const items = (plan.items ?? [])
            .map((item) => ({
                id: item.id,
                plannedDate: item.plannedDate,
                mealType: item.mealType,
                servings: item.servings,
                estimatedCostFcfa: item.estimatedCostFcfa,
                recipe: item.recipe
                    ? {
                          id: item.recipe.id,
                          title: item.recipe.title,
                          slug: item.recipe.slug,
                          imageUrl: item.recipe.imageUrl,
                          difficulty: item.recipe.difficulty,
                          budgetFcfa: item.recipe.budgetFcfa,
                          prepTimeMinutes: item.recipe.prepTimeMinutes,
                          cookTimeMinutes: item.recipe.cookTimeMinutes,
                          cuisine: item.recipe.cuisine
                              ? {
                                    id: item.recipe.cuisine.id,
                                    name: item.recipe.cuisine.name,
                                }
                              : null,
                      }
                    : null,
            }))
            .sort((a, b) => {
                if (a.plannedDate !== b.plannedDate) {
                    return a.plannedDate.localeCompare(b.plannedDate);
                }

                return a.mealType.localeCompare(b.mealType);
            });

        return { ...summary, items };
    }
}
