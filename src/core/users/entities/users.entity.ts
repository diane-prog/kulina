import { Exclude } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SkillLevel, UserStatus } from '../../../common/enum/user.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Files } from '../../cloudinary/entities/file.entity';
import { Roles } from '../../roles/entities/roles.entity';

@Entity('users')
export class Users extends AbstractEntity<Users> {
    @Column({ nullable: false })
    fullname: string;

    @Index()
    @Column({ unique: true, nullable: false })
    email: string;

    @ManyToOne(() => Files, { eager: false, nullable: true })
    @JoinColumn({ name: 'avatarId' })
    avatar: Files;

    @Column({ nullable: true })
    bio: string;

    @Column({ nullable: true })
    country: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    preferredCuisine: string;

    @Column({
        type: 'enum',
        enum: SkillLevel,
        default: SkillLevel.BEGINNER,
        nullable: false,
    })
    skillLevel: SkillLevel;

    @Column({ type: 'int', default: 0 })
    monthlyBudgetFcfa: number;

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
    password: string;

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
