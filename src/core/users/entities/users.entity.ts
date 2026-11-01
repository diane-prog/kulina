import { Exclude } from 'class-transformer';
import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Plan } from '../../../common/enum/plan.enum';
import { SkillLevel, UserStatus } from '../../../common/enum/user.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Media } from '../../media/entities/media.entity';
import { Roles } from '../../roles/entities/roles.entity';

@Entity('users')
@Check('"email" IS NOT NULL OR "phone" IS NOT NULL')
export class Users extends AbstractEntity<Users> {
    @Column({ nullable: false })
    fullname: string;

    @Index()
    @Column({ unique: true, nullable: true })
    email: string;

    @Index()
    @Column({ unique: true, nullable: true })
    phone: string;

    @ManyToOne(() => Media, { eager: false, nullable: true })
    @JoinColumn({ name: 'avatarId' })
    avatar: Media;

    @Column({ nullable: true })
    bio: string;

    @Column({ nullable: true })
    country: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: false, default: 'fr' })
    locale: string;

    @Column({ type: 'simple-array', nullable: true })
    preferredCategories: string[];

    @Column({
        type: 'enum',
        enum: SkillLevel,
        default: SkillLevel.BEGINNER,
        nullable: false,
    })
    skillLevel: SkillLevel;

    @Column({ type: 'int', default: 0 })
    monthlyBudgetXof: number;

    @Column({ type: 'simple-array', nullable: true })
    dietaryPreferences: string[];

    @Column({ type: 'simple-array', nullable: true })
    allergies: string[];

    @ManyToOne(() => Roles, (role) => role.users, {
        eager: true,
        nullable: false,
    })
    @Index()
    role: Roles;

    @Exclude()
    @Column({ nullable: true })
    passwordHash: string;

    @Column({
        type: 'enum',
        enum: Plan,
        default: Plan.FREE,
        nullable: false,
    })
    plan: Plan;

    @Column({ type: 'timestamp', nullable: true })
    premiumUntil: Date;

    @Column({ nullable: false, default: 0 })
    points: number;

    @Column({ type: 'boolean', default: false })
    emailVerified: boolean;

    @Column({ type: 'boolean', default: false })
    isAuthorized: boolean;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.ACTIVE,
        nullable: false,
    })
    status: UserStatus;

    @Column({ type: 'timestamp', nullable: true })
    lastConnexionAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    authorizedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    blockedAt: Date;
}
