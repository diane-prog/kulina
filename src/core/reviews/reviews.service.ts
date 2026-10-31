import { ForbiddenException, Injectable } from '@nestjs/common';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { paginate } from '../../utils/pagination';
import { RecipesService } from '../recipes/recipes.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { ReviewsRepository } from './repositories/reviews.repository';

@Injectable()
export class ReviewsService {
    constructor(
        private readonly reviewsRepository: ReviewsRepository,
        private readonly recipesService: RecipesService,
        private readonly errorHandlingService: ErrorHandlingService,
    ) {}

    /**
     * Creates a review for a recipe.
     *
     * @param userId - Review author identifier
     * @param dto - Review payload
     * @returns The created review
     * @throws ConflictException when the user already reviewed the recipe
     */
    async create(userId: string, dto: CreateReviewDto): Promise<Review> {
        await this.recipesService.findOne(dto.recipeId, true);

        const existing = await this.reviewsRepository.findOne({
            where: {
                user: { id: userId },
                recipe: { id: dto.recipeId },
                deleted: false,
            },
        });

        if (existing) {
            this.errorHandlingService.returnErrorOnConflict(
                `User ${userId} already reviewed recipe ${dto.recipeId}`,
                'You already reviewed this recipe',
            );
        }

        const review = await this.reviewsRepository.create(
            new Review({
                user: { id: userId } as any,
                recipe: { id: dto.recipeId } as any,
                rating: dto.rating,
                comment: dto.comment,
                images: dto.images ?? [],
            }),
        );

        await this.recomputeRecipeRating(dto.recipeId);

        return await this.findOne(review.id);
    }

    /**
     * Lists reviews for a recipe.
     *
     * @param recipeId - Recipe identifier
     * @param page - Page number
     * @param limit - Page size
     * @returns A paginated review list
     */
    async findByRecipe(recipeId: string, page = 1, limit = 10) {
        const reviews = await this.reviewsRepository.find({
            where: { recipe: { id: recipeId }, deleted: false },
            relations: ['user', 'recipe'],
            order: { createdAt: 'DESC' },
        });

        const data = reviews
            .slice((page - 1) * limit, page * limit)
            .map((review) => this.mapReview(review));

        return paginate(data, reviews.length, page, limit);
    }

    /**
     * Lists reviews written by a user.
     *
     * @param userId - User identifier
     * @returns The user's reviews
     */
    async findByUser(userId: string): Promise<Review[]> {
        return await this.reviewsRepository.find({
            where: { user: { id: userId }, deleted: false },
            relations: ['user', 'recipe'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Updates a review owned by the user.
     *
     * @param id - Review identifier
     * @param userId - Requesting user identifier
     * @param dto - Updated payload
     * @returns The updated review
     */
    async update(
        id: string,
        userId: string,
        dto: UpdateReviewDto,
    ): Promise<Review> {
        const review = await this.retrieveReview(id);

        if (review.user?.id !== userId) {
            throw new ForbiddenException('You can only update your review');
        }

        await this.reviewsRepository.update(
            { id },
            {
                rating: dto.rating ?? review.rating,
                comment: dto.comment ?? review.comment,
                images: dto.images ?? review.images,
            },
        );

        await this.recomputeRecipeRating(review.recipe.id);

        return await this.findOne(id);
    }

    /**
     * Deletes a review owned by the user or an administrator.
     *
     * @param id - Review identifier
     * @param userId - Requesting user identifier
     * @param isAdmin - Whether the requesting user is an administrator
     * @returns A confirmation message
     */
    async remove(
        id: string,
        userId: string,
        isAdmin: boolean,
    ): Promise<{ message: string }> {
        const review = await this.retrieveReview(id);

        if (!isAdmin && review.user?.id !== userId) {
            throw new ForbiddenException('You can only delete your review');
        }

        await this.reviewsRepository.softDelete({ id });
        await this.recomputeRecipeRating(review.recipe.id);

        return { message: 'Review deleted successfully' };
    }

    /**
     * Retrieves one review by identifier.
     *
     * @param id - Review identifier
     * @returns The matching review
     */
    async findOne(id: string): Promise<Review> {
        return await this.retrieveReview(id);
    }

    /**
     * Recomputes the aggregate rating of a recipe.
     *
     * @param recipeId - Recipe identifier
     */
    private async recomputeRecipeRating(recipeId: string): Promise<void> {
        const reviews = await this.reviewsRepository.find({
            where: { recipe: { id: recipeId }, deleted: false },
        });
        const count = reviews.length;
        const average =
            count === 0
                ? 0
                : reviews.reduce((total, review) => total + review.rating, 0) /
                  count;

        await this.recipesService.updateRating(
            recipeId,
            Number(average.toFixed(2)),
            count,
        );
    }

    /**
     * Loads a review with its relations.
     *
     * @param id - Review identifier
     * @returns The matching review
     */
    private async retrieveReview(id: string): Promise<Review> {
        const review = await this.reviewsRepository.findOne({
            where: { id, deleted: false },
            relations: ['user', 'recipe'],
        });

        if (!review) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Review ${id} not found`,
                'Review not found',
            );
        }

        return review;
    }

    /**
     * Maps a review to a public representation.
     *
     * @param review - Review entity
     * @returns The review payload
     */
    private mapReview(review: Review) {
        return {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            images: review.images ?? [],
            user: review.user
                ? {
                      id: review.user.id,
                      fullname: review.user.fullname,
                      avatar: review.user.avatar?.path ?? null,
                  }
                : null,
            recipe: review.recipe
                ? {
                      id: review.recipe.id,
                      title: review.recipe.title,
                      slug: review.recipe.slug,
                  }
                : null,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
        };
    }
}
