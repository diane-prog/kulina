import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ContentStatus, PostType } from '../../../common/enum/community.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Recipe } from '../../recipes/entities/recipe.entity';
import { Users } from '../../users/entities/users.entity';

@Entity('posts')
export class Post extends AbstractEntity<Post> {
    @ManyToOne(() => Users, { eager: true, nullable: false })
    @JoinColumn({ name: 'authorId' })
    @Index()
    author: Users;

    @Column({ nullable: false })
    title: string;

    @Column({ type: 'text', nullable: false })
    content: string;

    @Column({ type: 'enum', enum: PostType, default: PostType.TIP })
    type: PostType;

    @Column({ nullable: true })
    imageUrl: string;

    @ManyToOne(() => Recipe, { eager: false, nullable: true })
    @JoinColumn({ name: 'recipeId' })
    recipe: Recipe;

    @Column({
        type: 'enum',
        enum: ContentStatus,
        default: ContentStatus.ACTIVE,
    })
    status: ContentStatus;

    @Column({ type: 'int', default: 0 })
    likesCount: number;

    @Column({ type: 'int', default: 0 })
    commentsCount: number;
}
