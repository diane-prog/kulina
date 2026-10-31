import { Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Recipe } from '../../recipes/entities/recipe.entity';
import { Users } from '../../users/entities/users.entity';

@Entity('favorites')
@Unique(['user', 'recipe'])
export class Favorite extends AbstractEntity<Favorite> {
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
}
