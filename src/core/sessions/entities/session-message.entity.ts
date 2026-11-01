import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { MessageRole } from '../../../common/enum/message.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { CookingSession } from './cooking-session.entity';

@Entity('session_messages')
export class SessionMessage extends AbstractEntity<SessionMessage> {
    @ManyToOne(() => CookingSession, {
        eager: false,
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'sessionId' })
    @Index()
    session: CookingSession;

    @Column({ type: 'enum', enum: MessageRole, nullable: false })
    role: MessageRole;

    @Column({ type: 'text', nullable: false })
    content: string;

    @Column({ type: 'int', default: 0 })
    tokensIn: number;

    @Column({ type: 'int', default: 0 })
    tokensOut: number;

    @Column({
        type: 'numeric',
        precision: 12,
        scale: 6,
        default: 0,
    })
    costUsd: number;

    @Column({ nullable: true })
    model: string;
}
