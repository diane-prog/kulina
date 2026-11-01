import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Ingredient } from '../../ingredients/entities/ingredient.entity';
import { Recipe } from './recipe.entity';

@Entity('recipe_ingredients')
export class RecipeIngredient extends AbstractEntity<RecipeIngredient> {
    @ManyToOne(() => Recipe, (recipe) => recipe.ingredients, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'recipeId' })
    recipe: Recipe;

    @ManyToOne(() => Ingredient, { eager: true, nullable: false })
    @JoinColumn({ name: 'ingredientId' })
    ingredient: Ingredient;

    @Column({ type: 'float', default: 1 })
    quantity: number;

    @Column({ nullable: true })
    unit: string;

    @Column({ nullable: true })
    note: string;

    @Column({ default: false })
    optional: boolean;

    @Column({ type: 'jsonb', nullable: true })
    substitutes: Record<string, string>;

    @Column({ type: 'int', default: 0 })
    estimatedPriceXof: number;
}
