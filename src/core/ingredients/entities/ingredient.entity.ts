import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';

@Entity('ingredients')
export class Ingredient extends AbstractEntity<Ingredient> {
    @Column({ nullable: false })
    name: string;

    @Index()
    @Column({ unique: true, nullable: false })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Index()
    @Column({ nullable: true })
    category: string;

    @Column({ nullable: false, default: 'unit' })
    unit: string;

    @Column({ type: 'int', default: 0 })
    averagePriceFcfa: number;

    @Column({ nullable: true })
    imageUrl: string;

    @Column({ type: 'simple-array', nullable: true })
    aliases: string[];

    @Column({ default: false })
    isCommon: boolean;
}
