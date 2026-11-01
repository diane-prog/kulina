import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { Country } from '../../../common/enum/country.enum';
import { Difficulty, RecipeStatus } from '../../../common/enum/recipe.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Users } from '../../users/entities/users.entity';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { RecipeIssue } from './recipe-issue.entity';
import { RecipeStep } from './recipe-step.entity';
import { RecipeTip } from './recipe-tip.entity';

@Entity('recipes')
@Index(['country', 'category', 'status'])
export class Recipe extends AbstractEntity<Recipe> {
    @Column({ nullable: false })
    title: string;

    @Index()
    @Column({ unique: true, nullable: false })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    coverImageUrl: string;

    @Column({ type: 'int', default: 0 })
    prepMinutes: number;

    @Column({ type: 'int', default: 0 })
    cookMinutes: number;

    @Column({ type: 'int', default: 1 })
    baseServings: number;

    @Column({
        type: 'enum',
        enum: Difficulty,
        default: Difficulty.EASY,
    })
    difficulty: Difficulty;

    @Column({
        type: 'enum',
        enum: Country,
        default: Country.BOTH,
    })
    @Index()
    country: Country;

    @Column({ nullable: true })
    @Index()
    category: string;

    @ManyToOne(() => Users, { eager: false, nullable: true })
    @JoinColumn({ name: 'authorId' })
    author: Users;

    @Column({ type: 'int', default: 0 })
    estimatedBudgetXof: number;

    @Column({ type: 'int', default: 0 })
    costPerServingXof: number;

    @Column({
        type: 'enum',
        enum: RecipeStatus,
        default: RecipeStatus.DRAFT,
    })
    status: RecipeStatus;

    @Column({ default: false })
    isPremium: boolean;

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

    @OneToMany(() => RecipeIssue, (issue) => issue.recipe, { cascade: true })
    issues: RecipeIssue[];
}
