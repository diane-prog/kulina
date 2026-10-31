import { Injectable } from '@nestjs/common';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { paginate } from '../../utils/pagination';
import { toSlug } from '../../utils/slug';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { QueryIngredientsDto } from './dto/query-ingredients.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { Ingredient } from './entities/ingredient.entity';
import { IngredientsRepository } from './repositories/ingredients.repository';

@Injectable()
export class IngredientsService {
    constructor(
        private readonly ingredientsRepository: IngredientsRepository,
        private readonly errorHandlingService: ErrorHandlingService,
    ) {}

    /**
     * Lists ingredients with optional search and category filters.
     *
     * @param query - Filters and pagination
     * @returns A paginated ingredient list
     */
    async findAll(query: QueryIngredientsDto) {
        const ingredients = await this.ingredientsRepository.find({
            where: { deleted: false },
            order: { name: 'ASC' },
        });

        const search = query.query?.toLowerCase();
        const filtered = ingredients.filter((ingredient) => {
            const matchesQuery = search
                ? ingredient.name.toLowerCase().includes(search) ||
                  ingredient.aliases?.some((alias) =>
                      alias.toLowerCase().includes(search),
                  )
                : true;
            const matchesCategory = query.category
                ? ingredient.category?.toLowerCase() ===
                  query.category.toLowerCase()
                : true;

            return matchesQuery && matchesCategory;
        });

        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const data = filtered.slice((page - 1) * limit, page * limit);

        return paginate(data, filtered.length, page, limit);
    }

    /**
     * Retrieves one ingredient by identifier.
     *
     * @param id - Ingredient identifier
     * @returns The matching ingredient
     */
    async findOne(id: string): Promise<Ingredient> {
        const ingredient = await this.ingredientsRepository.findOne({
            where: { id, deleted: false },
        });

        if (!ingredient) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Ingredient ${id} not found`,
                'Ingredient not found',
            );
        }

        return ingredient;
    }

    /**
     * Finds ingredients by name or alias.
     *
     * @param names - Names to look up
     * @returns Matching ingredients
     */
    async findByNames(names: string[]): Promise<Ingredient[]> {
        const normalized = names.map((name) => name.trim().toLowerCase());
        const ingredients = await this.ingredientsRepository.find({
            where: { deleted: false },
        });

        return ingredients.filter((ingredient) => {
            const candidates = [
                ingredient.name.toLowerCase(),
                ...(ingredient.aliases ?? []).map((alias) =>
                    alias.toLowerCase(),
                ),
            ];

            return candidates.some((candidate) =>
                normalized.some(
                    (name) =>
                        candidate.includes(name) || name.includes(candidate),
                ),
            );
        });
    }

    /**
     * Creates an ingredient.
     *
     * @param dto - Ingredient payload
     * @returns The created ingredient
     */
    async create(dto: CreateIngredientDto): Promise<Ingredient> {
        const slug = toSlug(dto.name);
        const existing = await this.ingredientsRepository.findOne({
            where: { slug },
        });

        if (existing) {
            this.errorHandlingService.returnErrorOnConflict(
                `Ingredient ${dto.name} already exists`,
                'Ingredient already exists',
            );
        }

        return await this.ingredientsRepository.create(
            new Ingredient({
                name: dto.name,
                slug,
                category: dto.category,
                unit: dto.unit ?? 'unit',
                averagePriceFcfa: dto.averagePriceFcfa ?? 0,
                description: dto.description,
                imageUrl: dto.imageUrl,
                aliases: dto.aliases ?? [],
                isCommon: dto.isCommon ?? false,
            }),
        );
    }

    /**
     * Updates an ingredient.
     *
     * @param id - Ingredient identifier
     * @param dto - Updated payload
     * @returns The updated ingredient
     */
    async update(id: string, dto: UpdateIngredientDto): Promise<Ingredient> {
        const ingredient = await this.findOne(id);

        return await this.ingredientsRepository.update(
            { id },
            {
                name: dto.name ?? ingredient.name,
                slug: dto.name ? toSlug(dto.name) : ingredient.slug,
                category: dto.category ?? ingredient.category,
                unit: dto.unit ?? ingredient.unit,
                averagePriceFcfa:
                    dto.averagePriceFcfa ?? ingredient.averagePriceFcfa,
                description: dto.description ?? ingredient.description,
                imageUrl: dto.imageUrl ?? ingredient.imageUrl,
                aliases: dto.aliases ?? ingredient.aliases,
                isCommon: dto.isCommon ?? ingredient.isCommon,
            },
        );
    }

    /**
     * Soft-deletes an ingredient.
     *
     * @param id - Ingredient identifier
     * @returns A confirmation message
     */
    async remove(id: string): Promise<{ message: string }> {
        await this.findOne(id);
        await this.ingredientsRepository.softDelete({ id });

        return { message: 'Ingredient deleted successfully' };
    }
}
