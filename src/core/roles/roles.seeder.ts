import { Injectable } from '@nestjs/common';
import { RolesRepository } from './repositories/roles.repository';
import { Roles } from './entities/roles.entity';

const roles = [
    {
        label: 'super_admin',
        description:
            'Full access to Kulina, including users, roles, and content administration.',
    },
    {
        label: 'admin',
        description:
            'Manages users, recipes, tutorials, and community content.',
    },
    {
        label: 'moderator',
        description:
            'Moderates community posts, comments, and reported content.',
    },
    {
        label: 'contributor',
        description:
            'Creates and manages recipes, tutorials, and cooking guides.',
    },
    {
        label: 'user',
        description:
            'Default role for everyone who cooks, plans meals, and shares tips.',
    },
];

@Injectable()
export class RolesSeeder {
    constructor(private readonly repository: RolesRepository) {}

    /**
     * Seeds the default Kulina roles.
     *
     * @returns A promise resolved when all roles exist
     */
    async seed(): Promise<void> {
        for (const role of roles) {
            const existingRole = await this.repository.findOne({
                where: { label: role.label },
            });

            if (!existingRole) {
                await this.repository.create(new Roles(role));
            }
        }
    }
}
