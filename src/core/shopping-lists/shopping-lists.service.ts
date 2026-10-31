import { ForbiddenException, Injectable } from '@nestjs/common';
import { ShoppingListStatus } from '../../common/enum/shopping-list.enum';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { paginate } from '../../utils/pagination';
import { IngredientsRepository } from '../ingredients/repositories/ingredients.repository';
import { MealPlansService } from '../meal-plans/meal-plans.service';
import { RecipesService } from '../recipes/recipes.service';
import { AddShoppingListItemDto } from './dto/add-shopping-list-item.dto';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { GenerateShoppingListDto } from './dto/generate-shopping-list.dto';
import { QueryShoppingListsDto } from './dto/query-shopping-lists.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { ShoppingList } from './entities/shopping-list.entity';
import { ShoppingListItem } from './entities/shopping-list-item.entity';
import { ShoppingListItemsRepository } from './repositories/shopping-list-items.repository';
import { ShoppingListsRepository } from './repositories/shopping-lists.repository';

@Injectable()
export class ShoppingListsService {
    constructor(
        private readonly shoppingListsRepository: ShoppingListsRepository,
        private readonly shoppingListItemsRepository: ShoppingListItemsRepository,
        private readonly ingredientsRepository: IngredientsRepository,
        private readonly mealPlansService: MealPlansService,
        private readonly recipesService: RecipesService,
        private readonly errorHandlingService: ErrorHandlingService,
    ) {}

    /**
     * Creates an empty shopping list.
     *
     * @param userId - Owner identifier
     * @param dto - Shopping list payload
     * @returns The created shopping list detail
     */
    async create(userId: string, dto: CreateShoppingListDto) {
        let mealPlan = null;

        if (dto.mealPlanId) {
            await this.mealPlansService.findOne(dto.mealPlanId, userId);
            mealPlan = { id: dto.mealPlanId };
        }

        const list = await this.shoppingListsRepository.create(
            new ShoppingList({
                user: { id: userId } as any,
                mealPlan: mealPlan as any,
                title: dto.title,
                estimatedTotalFcfa: 0,
                status: ShoppingListStatus.OPEN,
            }),
        );

        return await this.findOne(list.id, userId);
    }

    /**
     * Lists the user's shopping lists.
     *
     * @param userId - Owner identifier
     * @param query - Filters and pagination
     * @returns A paginated shopping list
     */
    async findAll(userId: string, query: QueryShoppingListsDto) {
        const lists = await this.shoppingListsRepository.find({
            where: { user: { id: userId }, deleted: false },
            relations: ['items'],
            order: { createdAt: 'DESC' },
        });

        const filtered = lists.filter((list) =>
            query.status ? list.status === query.status : true,
        );
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const data = filtered
            .slice((page - 1) * limit, page * limit)
            .map((list) => this.mapListSummary(list));

        return paginate(data, filtered.length, page, limit);
    }

    /**
     * Retrieves a shopping list detail.
     *
     * @param id - Shopping list identifier
     * @param userId - Owner identifier
     * @returns The shopping list detail
     */
    async findOne(id: string, userId: string) {
        const list = await this.retrieveList(id, userId);

        return this.mapListDetail(list);
    }

    /**
     * Updates a shopping list.
     *
     * @param id - Shopping list identifier
     * @param userId - Owner identifier
     * @param dto - Updated payload
     * @returns The updated shopping list detail
     */
    async update(id: string, userId: string, dto: UpdateShoppingListDto) {
        const list = await this.retrieveList(id, userId);

        await this.shoppingListsRepository.update(
            { id },
            {
                title: dto.title ?? list.title,
                status: dto.status ?? list.status,
            },
        );

        return await this.findOne(id, userId);
    }

    /**
     * Soft-deletes a shopping list.
     *
     * @param id - Shopping list identifier
     * @param userId - Owner identifier
     * @returns A confirmation message
     */
    async remove(id: string, userId: string): Promise<{ message: string }> {
        await this.retrieveList(id, userId);
        await this.shoppingListsRepository.softDelete({ id });

        return { message: 'Shopping list deleted successfully' };
    }

    /**
     * Adds an ingredient to a shopping list.
     *
     * @param id - Shopping list identifier
     * @param userId - Owner identifier
     * @param dto - Item payload
     * @returns The updated shopping list detail
     */
    async addItem(id: string, userId: string, dto: AddShoppingListItemDto) {
        const list = await this.retrieveList(id, userId);
        const ingredient = await this.ingredientsRepository.findOne({
            where: { id: dto.ingredientId, deleted: false },
        });

        if (!ingredient) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Ingredient ${dto.ingredientId} not found`,
                'Ingredient not found',
            );
        }

        await this.shoppingListItemsRepository.create(
            new ShoppingListItem({
                shoppingList: list,
                ingredient,
                quantity: dto.quantity,
                unit: dto.unit ?? ingredient.unit,
                estimatedPriceFcfa: Math.round(
                    dto.quantity * ingredient.averagePriceFcfa,
                ),
                isChecked: dto.isChecked ?? false,
                note: dto.note,
            }),
        );

        await this.recomputeTotal(id);

        return await this.findOne(id, userId);
    }

    /**
     * Removes an ingredient from a shopping list.
     *
     * @param id - Shopping list identifier
     * @param itemId - Item identifier
     * @param userId - Owner identifier
     * @returns The updated shopping list detail
     */
    async removeItem(id: string, itemId: string, userId: string) {
        await this.retrieveList(id, userId);
        const item = await this.shoppingListItemsRepository.findOne({
            where: { id: itemId, deleted: false },
            relations: ['shoppingList'],
        });

        if (!item || item.shoppingList?.id !== id) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Shopping list item ${itemId} not found`,
                'Shopping list item not found',
            );
        }

        await this.shoppingListItemsRepository.softDelete({ id: itemId });
        await this.recomputeTotal(id);

        return await this.findOne(id, userId);
    }

    /**
     * Toggles the checked state of a shopping list item.
     *
     * @param id - Shopping list identifier
     * @param itemId - Item identifier
     * @param userId - Owner identifier
     * @returns The updated shopping list detail
     */
    async toggleItem(id: string, itemId: string, userId: string) {
        await this.retrieveList(id, userId);
        const item = await this.shoppingListItemsRepository.findOne({
            where: { id: itemId, deleted: false },
            relations: ['shoppingList'],
        });

        if (!item || item.shoppingList?.id !== id) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Shopping list item ${itemId} not found`,
                'Shopping list item not found',
            );
        }

        await this.shoppingListItemsRepository.update(
            { id: itemId },
            { isChecked: !item.isChecked },
        );

        return await this.findOne(id, userId);
    }

    /**
     * Generates a shopping list from a meal plan.
     *
     * @param userId - Owner identifier
     * @param dto - Generation payload
     * @returns The generated shopping list detail
     */
    async generate(userId: string, dto: GenerateShoppingListDto) {
        const mealPlan = await this.mealPlansService.findOne(
            dto.mealPlanId,
            userId,
        );
        const aggregated = new Map<
            string,
            {
                ingredient: any;
                quantity: number;
                unit: string;
                estimatedPriceFcfa: number;
            }
        >();

        for (const planItem of mealPlan.items ?? []) {
            if (!planItem.recipe) {
                continue;
            }

            const recipe = await this.recipesService.findOne(
                planItem.recipe.id,
                true,
            );
            const scale = recipe.servings
                ? planItem.servings / recipe.servings
                : 1;

            for (const recipeIngredient of recipe.ingredients ?? []) {
                if (!recipeIngredient.ingredient) {
                    continue;
                }

                const key = recipeIngredient.ingredient.id;
                const existing = aggregated.get(key);

                if (existing) {
                    existing.quantity += recipeIngredient.quantity * scale;
                    existing.estimatedPriceFcfa += Math.round(
                        recipeIngredient.estimatedPriceFcfa * scale,
                    );
                } else {
                    aggregated.set(key, {
                        ingredient: recipeIngredient.ingredient,
                        quantity: recipeIngredient.quantity * scale,
                        unit: recipeIngredient.unit,
                        estimatedPriceFcfa: Math.round(
                            recipeIngredient.estimatedPriceFcfa * scale,
                        ),
                    });
                }
            }
        }

        const list = await this.shoppingListsRepository.create(
            new ShoppingList({
                user: { id: userId } as any,
                mealPlan: { id: dto.mealPlanId } as any,
                title: dto.title ?? `Shopping list for ${mealPlan.title}`,
                estimatedTotalFcfa: 0,
                status: ShoppingListStatus.OPEN,
            }),
        );

        const items = [...aggregated.values()].map(
            (entry) =>
                new ShoppingListItem({
                    shoppingList: list,
                    ingredient: entry.ingredient,
                    quantity: Number(entry.quantity.toFixed(2)),
                    unit: entry.unit,
                    estimatedPriceFcfa: entry.estimatedPriceFcfa,
                    isChecked: false,
                }),
        );

        if (items.length > 0) {
            await this.shoppingListItemsRepository.createMany(items);
        }

        await this.recomputeTotal(list.id);

        return await this.findOne(list.id, userId);
    }

    /**
     * Recomputes the estimated total of a shopping list.
     *
     * @param id - Shopping list identifier
     */
    private async recomputeTotal(id: string): Promise<void> {
        const items = await this.shoppingListItemsRepository.find({
            where: { shoppingList: { id }, deleted: false },
        });
        const total = items.reduce(
            (sum, item) => sum + item.estimatedPriceFcfa,
            0,
        );

        await this.shoppingListsRepository.update(
            { id },
            { estimatedTotalFcfa: total },
        );
    }

    /**
     * Loads a shopping list with nested items.
     *
     * @param id - Shopping list identifier
     * @param userId - Owner identifier
     * @returns The shopping list entity
     */
    private async retrieveList(
        id: string,
        userId: string,
    ): Promise<ShoppingList> {
        const list = await this.shoppingListsRepository.findOne({
            where: { id, deleted: false },
            relations: ['items', 'items.ingredient', 'mealPlan'],
        });

        if (!list) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Shopping list ${id} not found`,
                'Shopping list not found',
            );
        }

        if (list.user?.id !== userId) {
            throw new ForbiddenException(
                'You can only access your own shopping lists',
            );
        }

        return list;
    }

    /**
     * Maps a shopping list to a summary.
     *
     * @param list - Shopping list entity
     * @returns The shopping list summary
     */
    private mapListSummary(list: ShoppingList) {
        const items = list.items ?? [];
        const checkedCount = items.filter((item) => item.isChecked).length;

        return {
            id: list.id,
            title: list.title,
            mealPlanId: list.mealPlan?.id ?? null,
            estimatedTotalFcfa: list.estimatedTotalFcfa,
            status: list.status,
            itemCount: items.length,
            checkedCount,
            createdAt: list.createdAt,
        };
    }

    /**
     * Maps a shopping list to a detailed representation.
     *
     * @param list - Shopping list entity with items
     * @returns The shopping list detail
     */
    private mapListDetail(list: ShoppingList) {
        const summary = this.mapListSummary(list);
        const items = (list.items ?? [])
            .map((item) => ({
                id: item.id,
                quantity: item.quantity,
                unit: item.unit,
                estimatedPriceFcfa: item.estimatedPriceFcfa,
                isChecked: item.isChecked,
                note: item.note,
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
            .sort((a, b) =>
                (a.ingredient?.name ?? '').localeCompare(
                    b.ingredient?.name ?? '',
                ),
            );

        return { ...summary, items };
    }
}
