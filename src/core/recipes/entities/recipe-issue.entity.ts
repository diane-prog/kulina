import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { IssueSeverity } from '../../../common/enum/issue.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Recipe } from './recipe.entity';
import { RecipeStep } from './recipe-step.entity';

@Entity('recipe_issues')
export class RecipeIssue extends AbstractEntity<RecipeIssue> {
    @ManyToOne(() => Recipe, (recipe) => recipe.issues, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'recipeId' })
    @Index()
    recipe: Recipe;

    @ManyToOne(() => RecipeStep, { eager: false, nullable: true })
    @JoinColumn({ name: 'stepId' })
    step: RecipeStep;

    @Column({ type: 'text', nullable: false })
    @Index()
    symptom: string;

    @Column({ type: 'text', nullable: true })
    cause: string;

    @Column({ type: 'text', nullable: false })
    fix: string;

    @Column({
        type: 'enum',
        enum: IssueSeverity,
        default: IssueSeverity.MEDIUM,
    })
    severity: IssueSeverity;
}
