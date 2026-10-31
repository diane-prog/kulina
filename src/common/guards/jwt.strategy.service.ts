import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UsersRepository } from '../../core/users/repositories/users.repository';
import { Users } from '../../core/users/entities/users.entity';
import { ErrorHandlingService } from '../response/errorHandler.service';

@Injectable()
export class AuthService {
    private readonly adminRole: string;
    private readonly superAdminRole: string;

    constructor(
        private readonly repository: UsersRepository,
        private readonly configService: ConfigService,
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        private readonly errorHandlingService: ErrorHandlingService,
    ) {
        this.adminRole = this.configService
            .get<string>('auth.roles.admin')
            .toLowerCase();
        this.superAdminRole = this.configService
            .get<string>('auth.roles.superAdmin')
            .toLowerCase();
    }

    /**
     * Finds an active user by identifier.
     *
     * @param id - User identifier
     * @returns The matching user or null
     */
    async findUserById(id: string): Promise<Users> {
        if (!id) {
            return null;
        }

        return await this.repository.findOne({
            where: { id, deleted: false },
            relations: ['role'],
        });
    }

    /**
     * Validates a JWT payload against the database.
     *
     * @param payload - Decoded JWT payload
     * @param errorMessage - Message used when no user matches
     * @returns The matching user
     * @throws UnauthorizedException when no user matches
     */
    async validateUser(
        payload: any,
        errorMessage = 'No matching credentials found',
    ): Promise<Users> {
        const user = await this.findUserById(payload?.id);

        if (!user) {
            throw new UnauthorizedException(errorMessage);
        }

        return user;
    }

    /**
     * Ensures the user has an administrative role.
     *
     * @param userId - User identifier
     * @returns The administrative user
     * @throws NotFoundException when the user does not exist
     * @throws ForbiddenException when the user is not an administrator
     */
    async isAdmin(userId: string): Promise<Users> {
        const user = await this.repository.findOne({
            where: { id: userId },
            relations: ['role'],
        });

        if (!user) {
            this.errorHandlingService.returnErrorOnNotFound(
                'User not found',
                'User not found',
            );
        }

        const roleLabel = user.role?.label?.toLowerCase();

        if (roleLabel !== this.superAdminRole && roleLabel !== this.adminRole) {
            this.errorHandlingService.returnErrorOnForbidden(
                'Access denied',
                `Access denied for role ${user.role?.label}`,
            );
        }

        return user;
    }
}
