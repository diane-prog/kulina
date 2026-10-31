import { Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Users } from '../../users/entities/users.entity';
import { Post } from './post.entity';

@Entity('post_likes')
@Unique(['user', 'post'])
export class PostLike extends AbstractEntity<PostLike> {
    @ManyToOne(() => Users, { eager: true, nullable: false })
    @JoinColumn({ name: 'userId' })
    @Index()
    user: Users;

    @ManyToOne(() => Post, {
        eager: true,
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'postId' })
    @Index()
    post: Post;
}
