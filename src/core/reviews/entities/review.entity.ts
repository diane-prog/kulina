import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Recipe } from '../../recipes/entities/recipe.entity';
import { Users } from '../../users/entities/users.entity';

@Entity('reviews')
@Unique(['user', 'recipe'])
export class Review extends AbstractEntity<Review> {
    @ManyToOne(() => Users, { eager: true, nullable: false })
    @JoinColumn({ name: 'userId' })
    @Index()
    user: Users;

    @ManyToOne(() => Recipe, {
        eager: true,
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'recipeId' })
    @Index()
    recipe: Recipe;

    @Column({ type: 'int', nullable: false })
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment: string;

    @Column({ type: 'simple-array', nullable: true })
    images: string[];
}
