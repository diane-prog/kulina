import { Module } from '@nestjs/common';
import { WebsocketModule } from '../../helpers/websocket/websocket.module';
import { DatabaseModule } from '../../libs/database/database.module';
import { RecipesModule } from '../recipes/recipes.module';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { Comment } from './entities/comment.entity';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { CommentsRepository } from './repositories/comments.repository';
import { PostLikesRepository } from './repositories/post-likes.repository';
import { PostsRepository } from './repositories/posts.repository';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([Post, Comment, PostLike]),
        RecipesModule,
        WebsocketModule,
    ],
    controllers: [CommunityController],
    providers: [
        CommunityService,
        PostsRepository,
        CommentsRepository,
        PostLikesRepository,
    ],
    exports: [CommunityService, PostsRepository],
})
export class CommunityModule {}
