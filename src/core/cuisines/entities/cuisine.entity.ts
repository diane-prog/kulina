import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';

@Entity('cuisines')
export class Cuisine extends AbstractEntity<Cuisine> {
    @Column({ nullable: false })
    name: string;

    @Index()
    @Column({ unique: true, nullable: false })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    region: string;

    @Column({ nullable: true })
    imageUrl: string;

    @Column({ default: true })
    isActive: boolean;
}
