import { ForbiddenException, Injectable } from '@nestjs/common';
import { ContentStatus } from '../../common/enum/community.enum';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { WebsocketService } from '../../helpers/websocket/websocket.service';
import { paginate } from '../../utils/pagination';
import { RecipesRepository } from '../recipes/repositories/recipes.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Comment } from './entities/comment.entity';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { CommentsRepository } from './repositories/comments.repository';
import { PostLikesRepository } from './repositories/post-likes.repository';
import { PostsRepository } from './repositories/posts.repository';

@Injectable()
export class CommunityService {
    constructor(
        private readonly postsRepository: PostsRepository,
        private readonly commentsRepository: CommentsRepository,
        private readonly postLikesRepository: PostLikesRepository,
        private readonly recipesRepository: RecipesRepository,
        private readonly websocketService: WebsocketService,
        private readonly errorHandlingService: ErrorHandlingService,
    ) {}

    /**
     * Creates a community post.
     *
     * @param userId - Author identifier
     * @param dto - Post payload
     * @returns The created post
     */
    async createPost(userId: string, dto: CreatePostDto) {
        let recipe = null;

        if (dto.recipeId) {
            recipe = await this.recipesRepository.findOne({
                where: { id: dto.recipeId, deleted: false },
            });

            if (!recipe) {
                this.errorHandlingService.returnErrorOnNotFound(
                    `Recipe ${dto.recipeId} not found`,
                    'Recipe not found',
                );
            }
        }

        const post = await this.postsRepository.create(
            new Post({
                author: { id: userId } as any,
                title: dto.title,
                content: dto.content,
                type: dto.type,
                imageUrl: dto.imageUrl,
                recipe,
                status: ContentStatus.ACTIVE,
                likesCount: 0,
                commentsCount: 0,
            }),
        );

        const created = await this.retrievePost(post.id);
        this.websocketService.sendData(
            { action: 'post-created', post: this.mapPostSummary(created) },
            'community:post-created',
        );

        return this.mapPostDetail(created);
    }

    /**
     * Lists active community posts.
     *
     * @param query - Filters and pagination
     * @returns A paginated post list
     */
    async findAll(query: QueryPostsDto) {
        const posts = await this.postsRepository.find({
            where: { deleted: false, status: ContentStatus.ACTIVE },
            relations: ['author', 'recipe'],
            order: { createdAt: 'DESC' },
        });

        const search = query.query?.toLowerCase();
        const filtered = posts.filter((post) => {
            const matchesQuery = search
                ? post.title.toLowerCase().includes(search) ||
                  post.content.toLowerCase().includes(search)
                : true;
            const matchesType = query.type ? post.type === query.type : true;
            const matchesRecipe = query.recipeId
                ? post.recipe?.id === query.recipeId
                : true;

            return matchesQuery && matchesType && matchesRecipe;
        });

        const page = query.page ?? 1;
        const limit = query.limit ?? 12;
        const data = filtered
            .slice((page - 1) * limit, page * limit)
            .map((post) => this.mapPostSummary(post));

        return paginate(data, filtered.length, page, limit);
    }

    /**
     * Retrieves a post detail.
     *
     * @param id - Post identifier
     * @returns The post detail
     */
    async findOne(id: string) {
        const post = await this.retrievePost(id);

        if (post.status === ContentStatus.REMOVED) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Post ${id} not found`,
                'Post not found',
            );
        }

        return this.mapPostDetail(post);
    }

    /**
     * Updates a post owned by the user or by an administrator.
     *
     * @param id - Post identifier
     * @param userId - Requesting user identifier
     * @param isAdmin - Whether the user is an administrator
     * @param dto - Updated payload
     * @returns The updated post
     */
    async updatePost(
        id: string,
        userId: string,
        isAdmin: boolean,
        dto: UpdatePostDto,
    ) {
        const post = await this.retrievePost(id);

        if (!isAdmin && post.author?.id !== userId) {
            throw new ForbiddenException('You can only update your own posts');
        }

        await this.postsRepository.update(
            { id },
            {
                title: dto.title ?? post.title,
                content: dto.content ?? post.content,
                type: dto.type ?? post.type,
                imageUrl: dto.imageUrl ?? post.imageUrl,
                status: dto.status ?? post.status,
            },
        );

        return this.mapPostDetail(await this.retrievePost(id));
    }

    /**
     * Deletes a post owned by the user or by an administrator.
     *
     * @param id - Post identifier
     * @param userId - Requesting user identifier
     * @param isAdmin - Whether the user is an administrator
     * @returns A confirmation message
     */
    async removePost(
        id: string,
        userId: string,
        isAdmin: boolean,
    ): Promise<{ message: string }> {
        const post = await this.retrievePost(id);

        if (!isAdmin && post.author?.id !== userId) {
            throw new ForbiddenException('You can only delete your own posts');
        }

        await this.postsRepository.softDelete({ id });

        return { message: 'Post deleted successfully' };
    }

    /**
     * Likes a post.
     *
     * @param id - Post identifier
     * @param userId - User identifier
     * @returns The like state and count
     */
    async likePost(id: string, userId: string) {
        const post = await this.retrievePost(id);
        const existing = await this.postLikesRepository.findOne({
            where: {
                user: { id: userId },
                post: { id },
                deleted: false,
            },
        });

        if (existing) {
            return { liked: true, likesCount: post.likesCount };
        }

        await this.postLikesRepository.create(
            new PostLike({
                user: { id: userId } as any,
                post: { id } as any,
            }),
        );
        await this.postsRepository.update(
            { id },
            { likesCount: post.likesCount + 1 },
        );
        this.websocketService.sendData(
            { action: 'post-liked', postId: id },
            'community:post-liked',
        );

        return { liked: true, likesCount: post.likesCount + 1 };
    }

    /**
     * Unlikes a post.
     *
     * @param id - Post identifier
     * @param userId - User identifier
     * @returns The like state and count
     */
    async unlikePost(id: string, userId: string) {
        const post = await this.retrievePost(id);
        const existing = await this.postLikesRepository.findOne({
            where: {
                user: { id: userId },
                post: { id },
                deleted: false,
            },
        });

        if (!existing) {
            return { liked: false, likesCount: post.likesCount };
        }

        await this.postLikesRepository.softDelete({ id: existing.id });
        const likesCount = Math.max(0, post.likesCount - 1);
        await this.postsRepository.update({ id }, { likesCount });

        return { liked: false, likesCount };
    }

    /**
     * Adds a comment to a post.
     *
     * @param postId - Post identifier
     * @param userId - Author identifier
     * @param dto - Comment payload
     * @returns The created comment
     */
    async addComment(postId: string, userId: string, dto: CreateCommentDto) {
        const post = await this.retrievePost(postId);
        let parent = null;

        if (dto.parentId) {
            parent = await this.commentsRepository.findOne({
                where: { id: dto.parentId, deleted: false },
                relations: ['post'],
            });

            if (!parent || parent.post?.id !== postId) {
                this.errorHandlingService.returnErrorOnNotFound(
                    `Parent comment ${dto.parentId} not found`,
                    'Parent comment not found',
                );
            }
        }

        const comment = await this.commentsRepository.create(
            new Comment({
                post: { id: postId } as any,
                author: { id: userId } as any,
                content: dto.content,
                parent,
                status: ContentStatus.ACTIVE,
            }),
        );
        await this.postsRepository.update(
            { id: postId },
            { commentsCount: post.commentsCount + 1 },
        );

        const created = await this.retrieveComment(comment.id);
        this.websocketService.sendData(
            {
                action: 'comment-created',
                postId,
                comment: this.mapComment(created),
            },
            'community:comment-created',
        );

        return this.mapComment(created);
    }

    /**
     * Lists comments for a post.
     *
     * @param postId - Post identifier
     * @param page - Page number
     * @param limit - Page size
     * @returns A paginated comment list
     */
    async listComments(postId: string, page = 1, limit = 20) {
        await this.retrievePost(postId);
        const comments = await this.commentsRepository.find({
            where: {
                post: { id: postId },
                deleted: false,
                status: ContentStatus.ACTIVE,
            },
            relations: ['author', 'parent'],
            order: { createdAt: 'ASC' },
        });

        const data = comments
            .slice((page - 1) * limit, page * limit)
            .map((comment) => this.mapComment(comment));

        return paginate(data, comments.length, page, limit);
    }

    /**
     * Updates a comment owned by the user.
     *
     * @param id - Comment identifier
     * @param userId - Requesting user identifier
     * @param dto - Updated payload
     * @returns The updated comment
     */
    async updateComment(id: string, userId: string, dto: UpdateCommentDto) {
        const comment = await this.retrieveComment(id);

        if (comment.author?.id !== userId) {
            throw new ForbiddenException(
                'You can only update your own comments',
            );
        }

        await this.commentsRepository.update({ id }, { content: dto.content });

        return this.mapComment(await this.retrieveComment(id));
    }

    /**
     * Deletes a comment owned by the user or by an administrator.
     *
     * @param id - Comment identifier
     * @param userId - Requesting user identifier
     * @param isAdmin - Whether the user is an administrator
     * @returns A confirmation message
     */
    async removeComment(
        id: string,
        userId: string,
        isAdmin: boolean,
    ): Promise<{ message: string }> {
        const comment = await this.retrieveComment(id);

        if (!isAdmin && comment.author?.id !== userId) {
            throw new ForbiddenException(
                'You can only delete your own comments',
            );
        }

        await this.commentsRepository.softDelete({ id });
        const post = await this.retrievePost(comment.post.id);
        await this.postsRepository.update(
            { id: post.id },
            { commentsCount: Math.max(0, post.commentsCount - 1) },
        );

        return { message: 'Comment deleted successfully' };
    }

    /**
     * Loads a post with relations.
     *
     * @param id - Post identifier
     * @returns The post entity
     */
    private async retrievePost(id: string): Promise<Post> {
        const post = await this.postsRepository.findOne({
            where: { id, deleted: false },
            relations: ['author', 'recipe'],
        });

        if (!post) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Post ${id} not found`,
                'Post not found',
            );
        }

        return post;
    }

    /**
     * Loads a comment with relations.
     *
     * @param id - Comment identifier
     * @returns The comment entity
     */
    private async retrieveComment(id: string): Promise<Comment> {
        const comment = await this.commentsRepository.findOne({
            where: { id, deleted: false },
            relations: ['author', 'parent', 'post'],
        });

        if (!comment) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Comment ${id} not found`,
                'Comment not found',
            );
        }

        return comment;
    }

    /**
     * Maps a post to a summary.
     *
     * @param post - Post entity
     * @returns The post summary
     */
    private mapPostSummary(post: Post) {
        return {
            id: post.id,
            title: post.title,
            content: post.content,
            type: post.type,
            imageUrl: post.imageUrl,
            status: post.status,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            author: post.author
                ? {
                      id: post.author.id,
                      fullname: post.author.fullname,
                      avatar: post.author.avatar?.url ?? null,
                  }
                : null,
            recipe: post.recipe
                ? {
                      id: post.recipe.id,
                      title: post.recipe.title,
                      slug: post.recipe.slug,
                  }
                : null,
            createdAt: post.createdAt,
        };
    }

    /**
     * Maps a post to a detailed representation.
     *
     * @param post - Post entity
     * @returns The post detail
     */
    private mapPostDetail(post: Post) {
        return this.mapPostSummary(post);
    }

    /**
     * Maps a comment to a public representation.
     *
     * @param comment - Comment entity
     * @returns The comment payload
     */
    private mapComment(comment: Comment) {
        return {
            id: comment.id,
            content: comment.content,
            status: comment.status,
            parentId: comment.parent?.id ?? null,
            author: comment.author
                ? {
                      id: comment.author.id,
                      fullname: comment.author.fullname,
                      avatar: comment.author.avatar?.url ?? null,
                  }
                : null,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
        };
    }
}
