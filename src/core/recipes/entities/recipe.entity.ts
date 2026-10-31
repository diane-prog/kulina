import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { Difficulty, RecipeStatus } from '../../../common/enum/recipe.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Cuisine } from '../../cuisines/entities/cuisine.entity';
import { RecipeCategory } from '../../recipe-categories/entities/recipe-category.entity';
import { Users } from '../../users/entities/users.entity';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { RecipeStep } from './recipe-step.entity';
import { RecipeTip } from './recipe-tip.entity';

@Entity('recipes')
export class Recipe extends AbstractEntity<Recipe> {
    @Column({ nullable: false })
    title: string;

    @Index()
    @Column({ unique: true, nullable: false })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    imageUrl: string;

    @Column({ nullable: true })
    videoUrl: string;

    @Column({ type: 'int', default: 0 })
    prepTimeMinutes: number;

    @Column({ type: 'int', default: 0 })
    cookTimeMinutes: number;

    @Column({ type: 'int', default: 1 })
    servings: number;

    @Column({
        type: 'enum',
        enum: Difficulty,
        default: Difficulty.EASY,
    })
    difficulty: Difficulty;

    @ManyToOne(() => Cuisine, { eager: false, nullable: true })
    @JoinColumn({ name: 'cuisineId' })
    cuisine: Cuisine;

    @ManyToOne(() => RecipeCategory, { eager: false, nullable: true })
    @JoinColumn({ name: 'categoryId' })
    category: RecipeCategory;

    @ManyToOne(() => Users, { eager: false, nullable: false })
    @JoinColumn({ name: 'authorId' })
    author: Users;

    @Column({ type: 'int', default: 0 })
    budgetFcfa: number;

    @Column({ type: 'int', default: 0 })
    costPerServingFcfa: number;

    @Column({
        type: 'enum',
        enum: RecipeStatus,
        default: RecipeStatus.DRAFT,
    })
    status: RecipeStatus;

    @Column({ default: false })
    isFeatured: boolean;

    @Column({ type: 'float', default: 0 })
    ratingAverage: number;

    @Column({ type: 'int', default: 0 })
    ratingCount: number;

    @Column({ type: 'int', default: 0 })
    favoriteCount: number;

    @Column({ type: 'int', default: 0 })
    viewCount: number;

    @Column({ type: 'simple-array', nullable: true })
    tags: string[];

    @Column({ type: 'timestamp', nullable: true })
    publishedAt: Date;

    @OneToMany(() => RecipeIngredient, (ingredient) => ingredient.recipe, {
        cascade: true,
    })
    ingredients: RecipeIngredient[];

    @OneToMany(() => RecipeStep, (step) => step.recipe, { cascade: true })
    steps: RecipeStep[];

    @OneToMany(() => RecipeTip, (tip) => tip.recipe, { cascade: true })
    tips: RecipeTip[];
}
