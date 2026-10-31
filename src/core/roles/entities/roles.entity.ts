import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Users } from '../../users/entities/users.entity';

@Entity('roles')
export class Roles extends AbstractEntity<Roles> {
    @Column({ unique: true, nullable: false })
    label: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @OneToMany(() => Users, (user) => user.role)
    users: Users[];
}
