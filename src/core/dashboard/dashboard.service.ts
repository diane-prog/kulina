import { Injectable } from '@nestjs/common';
import { RecipeStatus } from '../../common/enum/recipe.enum';
import { UserStatus } from '../../common/enum/user.enum';
import { PostsRepository } from '../community/repositories/posts.repository';
import { RecipesRepository } from '../recipes/repositories/recipes.repository';
import { ReviewsRepository } from '../reviews/repositories/reviews.repository';
import { TutorialsRepository } from '../tutorials/repositories/tutorials.repository';
import { UsersRepository } from '../users/repositories/users.repository';

@Injectable()
export class DashboardService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly recipesRepository: RecipesRepository,
        private readonly postsRepository: PostsRepository,
        private readonly reviewsRepository: ReviewsRepository,
        private readonly tutorialsRepository: TutorialsRepository,
    ) {}

    /**
     * Builds the administrator dashboard statistics.
     *
     * @returns Platform statistics and highlights
     */
    async getStats() {
        const [users, recipes, posts, reviews, tutorials] = await Promise.all([
            this.usersRepository.find({ where: { deleted: false } }),
            this.recipesRepository.find({ where: { deleted: false } }),
            this.postsRepository.find({ where: { deleted: false } }),
            this.reviewsRepository.find({ where: { deleted: false } }),
            this.tutorialsRepository.find({ where: { deleted: false } }),
        ]);

        const publishedRecipes = recipes.filter(
            (recipe) => recipe.status === RecipeStatus.PUBLISHED,
        );
        const activeUsers = users.filter(
            (user) => user.status === UserStatus.ACTIVE,
        );
        const averageRating =
            reviews.length === 0
                ? 0
                : reviews.reduce((total, review) => total + review.rating, 0) /
                  reviews.length;

        const topRecipes = [...publishedRecipes]
            .sort(
                (a, b) =>
                    b.favoriteCount * 3 +
                    b.ratingAverage * 10 +
                    b.viewCount -
                    (a.favoriteCount * 3 + a.ratingAverage * 10 + a.viewCount),
            )
            .slice(0, 5)
            .map((recipe) => ({
                id: recipe.id,
                title: recipe.title,
                slug: recipe.slug,
                ratingAverage: recipe.ratingAverage,
                favoriteCount: recipe.favoriteCount,
                viewCount: recipe.viewCount,
                estimatedBudgetXof: recipe.estimatedBudgetXof,
            }));

        const latestUsers = [...users]
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
            )
            .slice(0, 5)
            .map((user) => ({
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                status: user.status,
                createdAt: user.createdAt,
            }));

        return {
            users: {
                total: users.length,
                active: activeUsers.length,
                suspended: users.filter(
                    (user) => user.status === UserStatus.SUSPENDED,
                ).length,
            },
            recipes: {
                total: recipes.length,
                published: publishedRecipes.length,
                draft: recipes.filter(
                    (recipe) => recipe.status === RecipeStatus.DRAFT,
                ).length,
                totalFavorites: recipes.reduce(
                    (total, recipe) => total + recipe.favoriteCount,
                    0,
                ),
            },
            tutorials: {
                total: tutorials.length,
                published: tutorials.filter((tutorial) => tutorial.isPublished)
                    .length,
            },
            community: {
                posts: posts.length,
                comments: posts.reduce(
                    (total, post) => total + post.commentsCount,
                    0,
                ),
                likes: posts.reduce(
                    (total, post) => total + post.likesCount,
                    0,
                ),
            },
            reviews: {
                total: reviews.length,
                averageRating: Number(averageRating.toFixed(2)),
            },
            topRecipes,
            latestUsers,
        };
    }
}
