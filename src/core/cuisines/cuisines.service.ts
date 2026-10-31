import { Injectable } from '@nestjs/common';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { toSlug } from '../../utils/slug';
import { CreateCuisineDto } from './dto/create-cuisine.dto';
import { UpdateCuisineDto } from './dto/update-cuisine.dto';
import { Cuisine } from './entities/cuisine.entity';
import { CuisinesRepository } from './repositories/cuisines.repository';

@Injectable()
export class CuisinesService {
    constructor(
        private readonly cuisinesRepository: CuisinesRepository,
        private readonly errorHandlingService: ErrorHandlingService,
    ) {}

    /**
     * Lists active cuisines.
     *
     * @param query - Optional search term
     * @returns Matching cuisines
     */
    async findAll(query?: string): Promise<Cuisine[]> {
        const cuisines = await this.cuisinesRepository.find({
            where: { deleted: false, isActive: true },
            order: { name: 'ASC' },
        });

        if (!query) {
            return cuisines;
        }

        const normalizedQuery = query.toLowerCase();

        return cuisines.filter(
            (cuisine) =>
                cuisine.name.toLowerCase().includes(normalizedQuery) ||
                cuisine.region?.toLowerCase().includes(normalizedQuery),
        );
    }

    /**
     * Retrieves one cuisine by identifier.
     *
     * @param id - Cuisine identifier
     * @returns The matching cuisine
     */
    async findOne(id: string): Promise<Cuisine> {
        const cuisine = await this.cuisinesRepository.findOne({
            where: { id, deleted: false },
        });

        if (!cuisine) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Cuisine ${id} not found`,
                'Cuisine not found',
            );
        }

        return cuisine;
    }

    /**
     * Creates a cuisine.
     *
     * @param dto - Cuisine payload
     * @returns The created cuisine
     */
    async create(dto: CreateCuisineDto): Promise<Cuisine> {
        const slug = toSlug(dto.name);
        const existing = await this.cuisinesRepository.findOne({
            where: { slug },
        });

        if (existing) {
            this.errorHandlingService.returnErrorOnConflict(
                `Cuisine ${dto.name} already exists`,
                'Cuisine already exists',
            );
        }

        return await this.cuisinesRepository.create(
            new Cuisine({
                name: dto.name,
                slug,
                region: dto.region,
                description: dto.description,
                imageUrl: dto.imageUrl,
                isActive: dto.isActive ?? true,
            }),
        );
    }

    /**
     * Updates a cuisine.
     *
     * @param id - Cuisine identifier
     * @param dto - Updated payload
     * @returns The updated cuisine
     */
    async update(id: string, dto: UpdateCuisineDto): Promise<Cuisine> {
        const cuisine = await this.findOne(id);

        return await this.cuisinesRepository.update(
            { id },
            {
                name: dto.name ?? cuisine.name,
                slug: dto.name ? toSlug(dto.name) : cuisine.slug,
                region: dto.region ?? cuisine.region,
                description: dto.description ?? cuisine.description,
                imageUrl: dto.imageUrl ?? cuisine.imageUrl,
                isActive: dto.isActive ?? cuisine.isActive,
            },
        );
    }

    /**
     * Soft-deletes a cuisine.
     *
     * @param id - Cuisine identifier
     * @returns A confirmation message
     */
    async remove(id: string): Promise<{ message: string }> {
        await this.findOne(id);
        await this.cuisinesRepository.softDelete({ id });

        return { message: 'Cuisine deleted successfully' };
    }
}
