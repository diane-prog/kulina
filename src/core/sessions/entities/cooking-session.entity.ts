import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SessionStatus } from '../../../common/enum/session.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Recipe } from '../../recipes/entities/recipe.entity';
import { Users } from '../../users/entities/users.entity';

@Entity('cooking_sessions')
export class CookingSession extends AbstractEntity<CookingSession> {
    @ManyToOne(() => Users, { eager: true, nullable: false })
    @JoinColumn({ name: 'userId' })
    @Index()
    user: Users;

    @ManyToOne(() => Recipe, {
        eager: true,
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'recipeId' })
    @Index()
    recipe: Recipe;

    @Column({
        type: 'enum',
        enum: SessionStatus,
        default: SessionStatus.ACTIVE,
    })
    status: SessionStatus;

    @Column({ type: 'int', default: 1 })
    servings: number;

    @Column({ type: 'int', default: 1 })
    currentStepPosition: number;

    @Column({ type: 'int', default: 0 })
    totalSteps: number;

    @Column({ type: 'timestamp', nullable: true })
    startedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    stepStartedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    finishedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    lastActivityAt: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;
}
