import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CookingSessionStatus } from '../../../common/enum/cooking.enum';
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
        enum: CookingSessionStatus,
        default: CookingSessionStatus.IN_PROGRESS,
    })
    status: CookingSessionStatus;

    @Column({ type: 'int', default: 1 })
    currentStepNumber: number;

    @Column({ type: 'int', default: 0 })
    totalSteps: number;

    @Column({ type: 'timestamp', nullable: true })
    startedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    lastActivityAt: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;
}
