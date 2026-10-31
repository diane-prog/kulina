import { ForbiddenException, Injectable } from '@nestjs/common';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { paginate } from '../../utils/pagination';
import { toSlug } from '../../utils/slug';
import { CuisinesRepository } from '../cuisines/repositories/cuisines.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { CreateTutorialDto } from './dto/create-tutorial.dto';
import { QueryTutorialsDto } from './dto/query-tutorials.dto';
import { UpdateTutorialDto } from './dto/update-tutorial.dto';
import { Tutorial } from './entities/tutorial.entity';
import { TutorialsRepository } from './repositories/tutorials.repository';

@Injectable()
export class TutorialsService {
    constructor(
        private readonly tutorialsRepository: TutorialsRepository,
        private readonly usersRepository: UsersRepository,
        private readonly cuisinesRepository: CuisinesRepository,
        private readonly errorHandlingService: ErrorHandlingService,
    ) {}

    /**
     * Creates a video tutorial.
     *
     * @param authorId - Author identifier
     * @param dto - Tutorial payload
     * @returns The created tutorial
     */
    async create(authorId: string, dto: CreateTutorialDto): Promise<Tutorial> {
        const author = await this.usersRepository.findOne({
            where: { id: authorId, deleted: false },
        });

        if (!author) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Author ${authorId} not found`,
                'Author not found',
            );
        }

        let cuisine = null;

        if (dto.cuisineId) {
            cuisine = await this.cuisinesRepository.findOne({
                where: { id: dto.cuisineId, deleted: false },
            });

            if (!cuisine) {
                this.errorHandlingService.returnErrorOnNotFound(
                    `Cuisine ${dto.cuisineId} not found`,
                    'Cuisine not found',
                );
            }
        }

        return await this.tutorialsRepository.create(
            new Tutorial({
                title: dto.title,
                slug: await this.generateUniqueSlug(dto.title),
                description: dto.description,
                thumbnailUrl: dto.thumbnailUrl,
                videoUrl: dto.videoUrl,
                durationMinutes: dto.durationMinutes ?? 0,
                level: dto.level,
                cuisine,
                author,
                tags: dto.tags ?? [],
                isPublished: dto.isPublished ?? false,
            }),
        );
    }

    /**
     * Lists published tutorials.
     *
     * @param query - Filters and pagination
     * @returns A paginated tutorial list
     */
    async findAll(query: QueryTutorialsDto) {
        const tutorials = await this.tutorialsRepository.find({
            where: { deleted: false, isPublished: true },
            relations: ['cuisine', 'author'],
            order: { createdAt: 'DESC' },
        });

        const search = query.query?.toLowerCase();
        const filtered = tutorials.filter((tutorial) => {
            const matchesQuery = search
                ? tutorial.title.toLowerCase().includes(search) ||
                  tutorial.description?.toLowerCase().includes(search) ||
                  tutorial.tags?.some((tag) =>
                      tag.toLowerCase().includes(search),
                  )
                : true;
            const matchesCuisine = query.cuisineId
                ? tutorial.cuisine?.id === query.cuisineId
                : true;
            const matchesLevel = query.level
                ? tutorial.level === query.level
                : true;

            return matchesQuery && matchesCuisine && matchesLevel;
        });

        const page = query.page ?? 1;
        const limit = query.limit ?? 12;
        const data = filtered
            .slice((page - 1) * limit, page * limit)
            .map((tutorial) => this.mapTutorial(tutorial));

        return paginate(data, filtered.length, page, limit);
    }

    /**
     * Retrieves one tutorial.
     *
     * @param id - Tutorial identifier
     * @returns The tutorial
     */
    async findOne(id: string): Promise<Tutorial> {
        const tutorial = await this.tutorialsRepository.findOne({
            where: { id, deleted: false },
            relations: ['cuisine', 'author'],
        });

        if (!tutorial) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Tutorial ${id} not found`,
                'Tutorial not found',
            );
        }

        return tutorial;
    }

    /**
     * Increments the view counter of a tutorial.
     *
     * @param id - Tutorial identifier
     */
    async incrementViewCount(id: string): Promise<void> {
        const tutorial = await this.findOne(id);
        await this.tutorialsRepository.update(
            { id },
            { viewCount: tutorial.viewCount + 1 },
        );
    }

    /**
     * Updates a tutorial owned by the user or by an administrator.
     *
     * @param id - Tutorial identifier
     * @param userId - Requesting user identifier
     * @param isAdmin - Whether the user is an administrator
     * @param dto - Updated payload
     * @returns The updated tutorial
     */
    async update(
        id: string,
        userId: string,
        isAdmin: boolean,
        dto: UpdateTutorialDto,
    ): Promise<Tutorial> {
        const tutorial = await this.findOne(id);

        if (!isAdmin && tutorial.author?.id !== userId) {
            throw new ForbiddenException(
                'You can only manage tutorials you created',
            );
        }

        let cuisine = tutorial.cuisine;

        if (dto.cuisineId) {
            cuisine = await this.cuisinesRepository.findOne({
                where: { id: dto.cuisineId, deleted: false },
            });

            if (!cuisine) {
                this.errorHandlingService.returnErrorOnNotFound(
                    `Cuisine ${dto.cuisineId} not found`,
                    'Cuisine not found',
                );
            }
        }

        await this.tutorialsRepository.update(
            { id },
            {
                title: dto.title ?? tutorial.title,
                slug: dto.title
                    ? await this.generateUniqueSlug(dto.title, id)
                    : tutorial.slug,
                description: dto.description ?? tutorial.description,
                thumbnailUrl: dto.thumbnailUrl ?? tutorial.thumbnailUrl,
                videoUrl: dto.videoUrl ?? tutorial.videoUrl,
                durationMinutes:
                    dto.durationMinutes ?? tutorial.durationMinutes,
                level: dto.level ?? tutorial.level,
                cuisine,
                tags: dto.tags ?? tutorial.tags,
                isPublished: dto.isPublished ?? tutorial.isPublished,
            },
        );

        return await this.findOne(id);
    }

    /**
     * Deletes a tutorial owned by the user or by an administrator.
     *
     * @param id - Tutorial identifier
     * @param userId - Requesting user identifier
     * @param isAdmin - Whether the user is an administrator
     * @returns A confirmation message
     */
    async remove(
        id: string,
        userId: string,
        isAdmin: boolean,
    ): Promise<{ message: string }> {
        const tutorial = await this.findOne(id);

        if (!isAdmin && tutorial.author?.id !== userId) {
            throw new ForbiddenException(
                'You can only delete tutorials you created',
            );
        }

        await this.tutorialsRepository.softDelete({ id });

        return { message: 'Tutorial deleted successfully' };
    }

    /**
     * Generates a unique tutorial slug.
     *
     * @param title - Tutorial title
     * @param currentTutorialId - Tutorial being updated, if any
     * @returns A unique slug
     */
    private async generateUniqueSlug(
        title: string,
        currentTutorialId?: string,
    ): Promise<string> {
        const base = toSlug(title);
        let slug = base;
        let index = 1;

        while (true) {
            const existing = await this.tutorialsRepository.findOne({
                where: { slug },
            });

            if (!existing || existing.id === currentTutorialId) {
                return slug;
            }

            slug = `${base}-${index}`;
            index += 1;
        }
    }

    /**
     * Maps a tutorial to a public representation.
     *
     * @param tutorial - Tutorial entity
     * @returns The tutorial payload
     */
    private mapTutorial(tutorial: Tutorial) {
        return {
            id: tutorial.id,
            title: tutorial.title,
            slug: tutorial.slug,
            description: tutorial.description,
            thumbnailUrl: tutorial.thumbnailUrl,
            videoUrl: tutorial.videoUrl,
            durationMinutes: tutorial.durationMinutes,
            level: tutorial.level,
            isPublished: tutorial.isPublished,
            viewCount: tutorial.viewCount,
            tags: tutorial.tags ?? [],
            cuisine: tutorial.cuisine
                ? {
                      id: tutorial.cuisine.id,
                      name: tutorial.cuisine.name,
                  }
                : null,
            author: tutorial.author
                ? {
                      id: tutorial.author.id,
                      fullname: tutorial.author.fullname,
                  }
                : null,
            createdAt: tutorial.createdAt,
        };
    }
}
