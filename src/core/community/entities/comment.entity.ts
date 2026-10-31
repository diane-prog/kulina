import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ContentStatus } from '../../../common/enum/community.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Users } from '../../users/entities/users.entity';
import { Post } from './post.entity';

@Entity('comments')
export class Comment extends AbstractEntity<Comment> {
    @ManyToOne(() => Post, {
        eager: false,
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'postId' })
    @Index()
    post: Post;

    @ManyToOne(() => Users, { eager: true, nullable: false })
    @JoinColumn({ name: 'authorId' })
    @Index()
    author: Users;

    @Column({ type: 'text', nullable: false })
    content: string;

    @ManyToOne(() => Comment, { eager: false, nullable: true })
    @JoinColumn({ name: 'parentId' })
    parent: Comment;

    @Column({
        type: 'enum',
        enum: ContentStatus,
        default: ContentStatus.ACTIVE,
    })
    status: ContentStatus;
}
