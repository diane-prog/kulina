import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { MealPlanStatus } from '../../../common/enum/meal-plan.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Users } from '../../users/entities/users.entity';
import { MealPlanItem } from './meal-plan-item.entity';

@Entity('meal_plans')
export class MealPlan extends AbstractEntity<MealPlan> {
    @ManyToOne(() => Users, { eager: true, nullable: false })
    @JoinColumn({ name: 'userId' })
    @Index()
    user: Users;

    @Column({ nullable: false })
    title: string;

    @Column({ type: 'date', nullable: false })
    weekStartDate: string;

    @Column({ type: 'date', nullable: false })
    weekEndDate: string;

    @Column({ type: 'int', default: 0 })
    budgetFcfa: number;

    @Column({
        type: 'enum',
        enum: MealPlanStatus,
        default: MealPlanStatus.DRAFT,
    })
    status: MealPlanStatus;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @OneToMany(() => MealPlanItem, (item) => item.mealPlan, {
        cascade: true,
    })
    items: MealPlanItem[];
}
