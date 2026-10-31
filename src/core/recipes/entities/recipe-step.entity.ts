import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Recipe } from './recipe.entity';

@Entity('recipe_steps')
export class RecipeStep extends AbstractEntity<RecipeStep> {
    @ManyToOne(() => Recipe, (recipe) => recipe.steps, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'recipeId' })
    recipe: Recipe;

    @Column({ type: 'int', nullable: false })
    stepNumber: number;

    @Column({ nullable: true })
    title: string;

    @Column({ type: 'text', nullable: false })
    instruction: string;

    @Column({ nullable: true })
    imageUrl: string;

    @Column({ type: 'int', nullable: true })
    videoTimestampSeconds: number;

    @Column({ type: 'int', default: 0 })
    durationMinutes: number;
}
