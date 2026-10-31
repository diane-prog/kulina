import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';

@Entity('recipe_categories')
export class RecipeCategory extends AbstractEntity<RecipeCategory> {
    @Column({ nullable: false })
    name: string;

    @Index()
    @Column({ unique: true, nullable: false })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    icon: string;

    @Column({ default: true })
    isActive: boolean;
}
