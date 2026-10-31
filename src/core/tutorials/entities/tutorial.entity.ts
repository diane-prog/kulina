import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SkillLevel } from '../../../common/enum/user.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Cuisine } from '../../cuisines/entities/cuisine.entity';
import { Users } from '../../users/entities/users.entity';

@Entity('tutorials')
export class Tutorial extends AbstractEntity<Tutorial> {
    @Column({ nullable: false })
    title: string;

    @Index()
    @Column({ unique: true, nullable: false })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    thumbnailUrl: string;

    @Column({ nullable: false })
    videoUrl: string;

    @Column({ type: 'int', default: 0 })
    durationMinutes: number;

    @Column({
        type: 'enum',
        enum: SkillLevel,
        default: SkillLevel.BEGINNER,
    })
    level: SkillLevel;

    @ManyToOne(() => Cuisine, { eager: false, nullable: true })
    @JoinColumn({ name: 'cuisineId' })
    cuisine: Cuisine;

    @ManyToOne(() => Users, { eager: false, nullable: false })
    @JoinColumn({ name: 'authorId' })
    author: Users;

    @Column({ default: false })
    isPublished: boolean;

    @Column({ type: 'int', default: 0 })
    viewCount: number;

    @Column({ type: 'simple-array', nullable: true })
    tags: string[];
}
