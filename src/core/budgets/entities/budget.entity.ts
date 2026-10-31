import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BudgetPeriod, BudgetStatus } from '../../../common/enum/budget.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Users } from '../../users/entities/users.entity';

@Entity('budgets')
export class Budget extends AbstractEntity<Budget> {
    @ManyToOne(() => Users, { eager: true, nullable: false })
    @JoinColumn({ name: 'userId' })
    @Index()
    user: Users;

    @Column({ nullable: false })
    title: string;

    @Column({
        type: 'enum',
        enum: BudgetPeriod,
        default: BudgetPeriod.WEEKLY,
    })
    period: BudgetPeriod;

    @Column({ type: 'int', default: 0 })
    amountFcfa: number;

    @Column({ type: 'int', default: 0 })
    spentFcfa: number;

    @Column({ type: 'date', nullable: false })
    startDate: string;

    @Column({ type: 'date', nullable: false })
    endDate: string;

    @Column({
        type: 'enum',
        enum: BudgetStatus,
        default: BudgetStatus.ACTIVE,
    })
    status: BudgetStatus;

    @Column({ type: 'text', nullable: true })
    notes: string;
}
