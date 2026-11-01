import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Users } from '../../users/entities/users.entity';

@Entity('refresh_tokens')
export class RefreshToken extends AbstractEntity<RefreshToken> {
    @ManyToOne(() => Users, {
        eager: false,
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'userId' })
    @Index()
    user: Users;

    @Index()
    @Column({ type: 'text', nullable: false })
    tokenHash: string;

    @Column({ type: 'timestamp', nullable: false })
    expiresAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    revokedAt: Date;

    @Column({ nullable: true })
    userAgent: string;

    @Column({ nullable: true })
    ipAddress: string;
}
