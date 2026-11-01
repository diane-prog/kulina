import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Recipe } from './recipe.entity';

@Entity('recipe_steps')
@Index(['recipe', 'position'])
export class RecipeStep extends AbstractEntity<RecipeStep> {
    @ManyToOne(() => Recipe, (recipe) => recipe.steps, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'recipeId' })
    recipe: Recipe;

    @Column({ type: 'int', nullable: false })
    position: number;

    @Column({ nullable: true })
    title: string;

    @Column({ type: 'text', nullable: false })
    instruction: string;

    @Column({ nullable: true })
    imageUrl: string;

    @Column({ type: 'int', nullable: true })
    idealSeconds: number;

    @Column({ type: 'int', nullable: true })
    minSeconds: number;

    @Column({ type: 'int', nullable: true })
    maxSeconds: number;

    @Column({ default: false })
    isCritical: boolean;

    @Column({ type: 'text', nullable: true })
    tip: string;

    @Column({ type: 'text', nullable: true })
    narrationText: string;

    @Column({ nullable: true })
    audioUrl: string;
}
