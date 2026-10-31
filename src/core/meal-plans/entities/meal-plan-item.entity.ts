import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { MealType } from '../../../common/enum/recipe.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Recipe } from '../../recipes/entities/recipe.entity';
import { MealPlan } from './meal-plan.entity';

@Entity('meal_plan_items')
export class MealPlanItem extends AbstractEntity<MealPlanItem> {
    @ManyToOne(() => MealPlan, (mealPlan) => mealPlan.items, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'mealPlanId' })
    mealPlan: MealPlan;

    @ManyToOne(() => Recipe, { eager: true, nullable: false })
    @JoinColumn({ name: 'recipeId' })
    @Index()
    recipe: Recipe;

    @Column({ type: 'date', nullable: false })
    plannedDate: string;

    @Column({ type: 'enum', enum: MealType, nullable: false })
    mealType: MealType;

    @Column({ type: 'int', default: 1 })
    servings: number;

    @Column({ type: 'int', default: 0 })
    estimatedCostFcfa: number;
}
