import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PaymentStatus } from '../../../common/enum/payment.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Users } from '../../users/entities/users.entity';

@Entity('payments')
export class Payment extends AbstractEntity<Payment> {
    @ManyToOne(() => Users, { eager: true, nullable: false })
    @JoinColumn({ name: 'userId' })
    @Index()
    user: Users;

    @Column({ nullable: false })
    provider: string;

    @Index()
    @Column({ unique: true, nullable: false })
    reference: string;

    @Column({ type: 'int', nullable: false })
    amountXof: number;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    status: PaymentStatus;

    @Column({ type: 'timestamp', nullable: true })
    startedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    endsAt: Date;

    @Column({ nullable: true })
    providerReference: string;

    @Column({ type: 'text', nullable: true })
    checkoutUrl: string;

    @Column({ type: 'text', nullable: true })
    instructions: string;
}
