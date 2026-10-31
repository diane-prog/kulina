import { Injectable } from '@nestjs/common';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { Roles } from './entities/roles.entity';
import { RolesRepository } from './repositories/roles.repository';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
    constructor(
        private readonly rolesRepository: RolesRepository,
        private readonly errorHandlingService: ErrorHandlingService,
    ) {}

    /**
     * Lists all active roles.
     *
     * @returns All roles
     */
    async findAll(): Promise<Roles[]> {
        return await this.rolesRepository.find({
            where: { deleted: false },
            order: { label: 'ASC' },
        });
    }

    /**
     * Retrieves one role by identifier.
     *
     * @param id - Role identifier
     * @returns The matching role
     * @throws NotFoundException when the role does not exist
     */
    async findOne(id: string): Promise<Roles> {
        const role = await this.rolesRepository.findOne({
            where: { id, deleted: false },
        });

        if (!role) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Role with id ${id} not found`,
                'Role not found',
            );
        }

        return role;
    }

    /**
     * Creates a role.
     *
     * @param dto - Role payload
     * @returns The created role
     * @throws ConflictException when the label already exists
     */
    async create(dto: CreateRoleDto): Promise<Roles> {
        const existingRole = await this.rolesRepository.findOne({
            where: { label: dto.label.toLowerCase() },
        });

        if (existingRole) {
            this.errorHandlingService.returnErrorOnConflict(
                `Role ${dto.label} already exists`,
                'Role already exists',
            );
        }

        return await this.rolesRepository.create(
            new Roles({
                label: dto.label.toLowerCase(),
                description: dto.description,
            }),
        );
    }

    /**
     * Updates a role.
     *
     * @param id - Role identifier
     * @param dto - Updated role payload
     * @returns The updated role
     */
    async update(id: string, dto: UpdateRoleDto): Promise<Roles> {
        await this.findOne(id);

        return await this.rolesRepository.update(
            { id },
            {
                description: dto.description,
            },
        );
    }

    /**
     * Soft-deletes a role.
     *
     * @param id - Role identifier
     * @returns A confirmation message
     */
    async remove(id: string): Promise<{ message: string }> {
        await this.findOne(id);
        await this.rolesRepository.softDelete({ id });

        return { message: 'Role deleted successfully' };
    }
}
