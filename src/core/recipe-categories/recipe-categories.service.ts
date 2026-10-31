import { Injectable } from '@nestjs/common';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { toSlug } from '../../utils/slug';
import { CreateRecipeCategoryDto } from './dto/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from './dto/update-recipe-category.dto';
import { RecipeCategory } from './entities/recipe-category.entity';
import { RecipeCategoriesRepository } from './repositories/recipe-categories.repository';

@Injectable()
export class RecipeCategoriesService {
    constructor(
        private readonly repository: RecipeCategoriesRepository,
        private readonly errorHandlingService: ErrorHandlingService,
    ) {}

    /**
     * Lists active recipe categories.
     *
     * @returns Matching categories
     */
    async findAll(): Promise<RecipeCategory[]> {
        return await this.repository.find({
            where: { deleted: false, isActive: true },
            order: { name: 'ASC' },
        });
    }

    /**
     * Retrieves one recipe category by identifier.
     *
     * @param id - Category identifier
     * @returns The matching category
     */
    async findOne(id: string): Promise<RecipeCategory> {
        const category = await this.repository.findOne({
            where: { id, deleted: false },
        });

        if (!category) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Recipe category ${id} not found`,
                'Recipe category not found',
            );
        }

        return category;
    }

    /**
     * Creates a recipe category.
     *
     * @param dto - Category payload
     * @returns The created category
     */
    async create(dto: CreateRecipeCategoryDto): Promise<RecipeCategory> {
        const slug = toSlug(dto.name);
        const existing = await this.repository.findOne({ where: { slug } });

        if (existing) {
            this.errorHandlingService.returnErrorOnConflict(
                `Recipe category ${dto.name} already exists`,
                'Recipe category already exists',
            );
        }

        return await this.repository.create(
            new RecipeCategory({
                name: dto.name,
                slug,
                description: dto.description,
                icon: dto.icon,
                isActive: dto.isActive ?? true,
            }),
        );
    }

    /**
     * Updates a recipe category.
     *
     * @param id - Category identifier
     * @param dto - Updated payload
     * @returns The updated category
     */
    async update(
        id: string,
        dto: UpdateRecipeCategoryDto,
    ): Promise<RecipeCategory> {
        const category = await this.findOne(id);

        return await this.repository.update(
            { id },
            {
                name: dto.name ?? category.name,
                slug: dto.name ? toSlug(dto.name) : category.slug,
                description: dto.description ?? category.description,
                icon: dto.icon ?? category.icon,
                isActive: dto.isActive ?? category.isActive,
            },
        );
    }

    /**
     * Soft-deletes a recipe category.
     *
     * @param id - Category identifier
     * @returns A confirmation message
     */
    async remove(id: string): Promise<{ message: string }> {
        await this.findOne(id);
        await this.repository.softDelete({ id });

        return { message: 'Recipe category deleted successfully' };
    }
}
