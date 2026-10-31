import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Recipe } from './recipe.entity';

@Entity('recipe_tips')
export class RecipeTip extends AbstractEntity<RecipeTip> {
    @ManyToOne(() => Recipe, (recipe) => recipe.tips, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'recipeId' })
    recipe: Recipe;

    @Column({ type: 'int', default: 1 })
    tipNumber: number;

    @Column({ type: 'text', nullable: false })
    content: string;
}
