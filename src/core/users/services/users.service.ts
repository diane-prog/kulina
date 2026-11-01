import {
    ForbiddenException,
    Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as jwt from 'jsonwebtoken';
import { In } from 'typeorm';
import { SkillLevel, UserStatus } from '../../../common/enum/user.enum';
import { ErrorHandlingService } from '../../../common/response/errorHandler.service';
import { AuthService } from '../../../common/guards/jwt.strategy.service';
import { PasswordHashService } from '../../../helpers/password_hash/passwordHash.service';
import { MailerService } from '../../../libs/mailer/mailer.service';
import { paginate } from '../../../utils/pagination';
import { MediaRepository } from '../../media/repositories/media.repository';
import { RolesRepository } from '../../roles/repositories/roles.repository';
import { AdminUpdateUserDto } from '../dto/admin-update-user.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginUserDto } from '../dto/login.dto';
import { QueryUsersDto } from '../dto/query-users.dto';
import { RegisterUserDto } from '../dto/register.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { Users } from '../entities/users.entity';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class UsersService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
        private readonly configService: ConfigService,
        private readonly usersRepository: UsersRepository,
        private readonly rolesRepository: RolesRepository,
        private readonly mediaRepository: MediaRepository,
        private readonly passwordHashService: PasswordHashService,
        private readonly mailerService: MailerService,
        private readonly authService: AuthService,
        private readonly errorHandlingService: ErrorHandlingService,
    ) {}

    /**
     * Registers a new Kulina member.
     *
     * @param dto - Registration payload
     * @returns The created user and a JWT
     * @throws BadRequestException when passwords do not match
     * @throws ConflictException when the email is already used
     */
    async register(dto: RegisterUserDto): Promise<{
        user: Record<string, unknown>;
        token: string;
    }> {
        if (dto.password !== dto.confirmPassword) {
            this.errorHandlingService.returnErrorOnBadRequest(
                'Password and confirm password do not match',
                'Password and confirm password do not match',
            );
        }

        const email = dto.email?.trim().toLowerCase();
        const phone = dto.phone?.trim();

        if (!email && !phone) {
            this.errorHandlingService.returnErrorOnBadRequest(
                'Email or phone is required',
                'Email or phone is required',
            );
        }

        const existingUser = email
            ? await this.usersRepository.findOne({ where: { email } })
            : phone
              ? await this.usersRepository.findOne({ where: { phone } })
              : null;

        if (existingUser) {
            this.errorHandlingService.returnErrorOnConflict(
                'Email or phone already exists',
                'Email or phone already exists',
            );
        }

        const userCount = await this.usersRepository.count({
            where: { deleted: false },
        });
        const isFirstUser = userCount === 0;
        const roleLabel = isFirstUser
            ? this.configService.get<string>('auth.roles.superAdmin')
            : this.configService.get<string>('auth.roles.user');

        const role = await this.rolesRepository.findOne({
            where: { label: roleLabel },
        });

        if (!role) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Role ${roleLabel} not found`,
                'Default role is not configured',
            );
        }

        let avatar = null;

        if (dto.avatarId) {
            avatar = await this.mediaRepository.findOne({
                where: { id: dto.avatarId, deleted: false },
            });

            if (!avatar) {
                this.errorHandlingService.returnErrorOnNotFound(
                    `Avatar file ${dto.avatarId} not found`,
                    'Avatar file not found',
                );
            }
        }

        const hashedPassword = await this.passwordHashService.hashPassword(
            dto.password,
        );

        const user = await this.usersRepository.create(
            new Users({
                fullname: dto.fullname.trim(),
                email,
                phone,
                passwordHash: hashedPassword,
                avatar,
                role,
                skillLevel: dto.skillLevel ?? SkillLevel.BEGINNER,
                country: dto.country,
                city: dto.city,
                locale: dto.locale ?? 'fr',
                preferredCategories: dto.preferredCategories ?? [],
                monthlyBudgetXof: dto.monthlyBudgetXof ?? 0,
                dietaryPreferences: dto.dietaryPreferences ?? [],
                allergies: dto.allergies ?? [],
                status: UserStatus.ACTIVE,
                isAuthorized: true,
                emailVerified: false,
                authorizedAt: new Date(),
            }),
        );

        if (user.email) {
            void this.sendWelcomeEmail(user);
        }

        this.logger.info(`User ${user.email ?? user.phone} registered`);

        return {
            user: this.sanitizeUser(user),
            token: this.generateToken(user),
        };
    }

    /**
     * Authenticates a user with email and password.
     *
     * @param dto - Login payload
     * @returns The authenticated user and a JWT
     * @throws UnauthorizedException when credentials are invalid
     * @throws ForbiddenException when the account is blocked
     */
    async login(dto: LoginUserDto): Promise<{
        user: Record<string, unknown>;
        token: string;
    }> {
        const identity = dto.identity.trim();
        const where = identity.includes('@')
            ? { email: identity.toLowerCase(), deleted: false }
            : { phone: identity, deleted: false };
        const user = await this.usersRepository.findOne({
            where,
            relations: ['role', 'avatar'],
        });

        if (!user) {
            throw new UnauthorizedException(
                'Invalid email, phone, or password',
            );
        }

        if (
            !user.isAuthorized ||
            [
                UserStatus.SUSPENDED,
                UserStatus.ARCHIVED,
                UserStatus.INACTIVE,
            ].includes(user.status)
        ) {
            throw new ForbiddenException(
                'Your account is not active. Please contact Kulina support.',
            );
        }

        const isPasswordValid = await this.passwordHashService.comparePassword(
            dto.password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        await this.usersRepository.update(
            { id: user.id },
            { lastConnexionAt: new Date() },
        );

        this.logger.info(`User ${user.email} logged in`);

        return {
            user: this.sanitizeUser(user),
            token: this.generateToken(user),
        };
    }

    /**
     * Returns the current user profile.
     *
     * @param userId - Authenticated user identifier
     * @returns The sanitized profile
     */
    async getCurrentUser(userId: string): Promise<Record<string, unknown>> {
        const user = await this.retrieveUserById(userId);

        return this.sanitizeUser(user);
    }

    /**
     * Updates the current user profile.
     *
     * @param userId - Authenticated user identifier
     * @param dto - Profile payload
     * @returns The updated profile
     */
    async updateProfile(
        userId: string,
        dto: UpdateProfileDto,
    ): Promise<Record<string, unknown>> {
        const user = await this.retrieveUserById(userId);

        let avatar = user.avatar;

        if (dto.avatarId) {
            avatar = await this.mediaRepository.findOne({
                where: { id: dto.avatarId, deleted: false },
            });

            if (!avatar) {
                this.errorHandlingService.returnErrorOnNotFound(
                    `Avatar file ${dto.avatarId} not found`,
                    'Avatar file not found',
                );
            }
        }
        await this.usersRepository.update(
            { id: userId },
            {
                fullname: dto.fullname ?? user.fullname,
                phone: dto.phone ?? user.phone,
                bio: dto.bio ?? user.bio,
                country: dto.country ?? user.country,
                city: dto.city ?? user.city,
                locale: dto.locale ?? user.locale,
                preferredCategories:
                    dto.preferredCategories ?? user.preferredCategories,
                skillLevel: dto.skillLevel ?? user.skillLevel,
                monthlyBudgetXof: dto.monthlyBudgetXof ?? user.monthlyBudgetXof,
                dietaryPreferences:
                    dto.dietaryPreferences ?? user.dietaryPreferences,
                allergies: dto.allergies ?? user.allergies,
                avatar,
            },
        );

        return await this.getCurrentUser(userId);
    }

    /**
     * Changes the current user password.
     *
     * @param userId - Authenticated user identifier
     * @param dto - Password payload
     * @returns A confirmation message
     * @throws BadRequestException when passwords do not match
     */
    async updatePassword(
        userId: string,
        dto: UpdatePasswordDto,
    ): Promise<{ message: string }> {
        if (dto.newPassword !== dto.confirmPassword) {
            this.errorHandlingService.returnErrorOnBadRequest(
                'New password and confirm password do not match',
                'New password and confirm password do not match',
            );
        }

        const user = await this.retrieveUserById(userId);
        const isCurrentPasswordValid =
            await this.passwordHashService.comparePassword(
                dto.currentPassword,
                user.passwordHash,
            );

        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException('Current password is invalid');
        }

        const hashedPassword = await this.passwordHashService.hashPassword(
            dto.newPassword,
        );
        await this.usersRepository.update(
            { id: userId },
            { passwordHash: hashedPassword },
        );

        return { message: 'Password updated successfully' };
    }

    /**
     * Sends a password reset link when the account exists.
     *
     * @param dto - Forgot password payload
     * @returns A generic confirmation message
     */
    async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
        const email = dto.email.trim().toLowerCase();
        const user = await this.usersRepository.findOne({
            where: { email, deleted: false },
        });

        if (user) {
            const expiresIn =
                this.configService.get<string>(
                    'auth.resetPasswordExpirationTime',
                ) ?? '30m';
            const token = jwt.sign(
                { id: user.id, purpose: 'reset-password' },
                this.configService.getOrThrow<string>('auth.jwtSecret'),
                {
                    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
                },
            );

            const resetLink =
                this.configService.get<string>('auth.resetPasswordLink') +
                token;

            void this.mailerService
                .sendMail(
                    user.email,
                    'Reset your Kulina password',
                    `<p>Hello ${user.fullname},</p><p>Use this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, you can ignore this email.</p>`,
                )
                .catch((error: unknown) => {
                    this.logger.warn(
                        `Password reset email failed for ${user.email}: ${error}`,
                    );
                });

            this.logger.info(`Password reset requested for ${user.email}`);
        }

        return {
            message:
                'If an account exists with this email, a reset link has been sent.',
        };
    }

    /**
     * Resets a password using a signed reset token.
     *
     * @param dto - Reset payload
     * @returns A confirmation message
     * @throws BadRequestException when the token is invalid or passwords differ
     */
    async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
        if (dto.password !== dto.confirmPassword) {
            this.errorHandlingService.returnErrorOnBadRequest(
                'Password and confirm password do not match',
                'Password and confirm password do not match',
            );
        }

        let payload: any;

        try {
            payload = jwt.verify(
                dto.token,
                this.configService.getOrThrow<string>('auth.jwtSecret'),
            );
        } catch {
            this.errorHandlingService.returnErrorOnBadRequest(
                'Reset token expired or invalid',
                'Reset token expired or invalid',
            );
        }

        if (payload.purpose !== 'reset-password') {
            this.errorHandlingService.returnErrorOnBadRequest(
                'Invalid reset token',
                'Invalid reset token',
            );
        }

        const user = await this.retrieveUserById(payload.id);
        const hashedPassword = await this.passwordHashService.hashPassword(
            dto.password,
        );
        await this.usersRepository.update(
            { id: user.id },
            { passwordHash: hashedPassword },
        );

        return { message: 'Password reset successfully' };
    }

    /**
     * Lists users for administrators.
     *
     * @param adminId - Administrator identifier
     * @param query - Filters and pagination
     * @returns A paginated list of users
     */
    async getAllUsers(adminId: string, query: QueryUsersDto) {
        await this.authService.isAdmin(adminId);

        const users = await this.usersRepository.find({
            where: { deleted: false },
            relations: ['role', 'avatar'],
            order: { createdAt: 'DESC' },
        });

        const filtered = users.filter((user) => {
            const matchesQuery = query.query
                ? user.fullname
                      ?.toLowerCase()
                      .includes(query.query.toLowerCase()) ||
                  user.email?.toLowerCase().includes(query.query.toLowerCase())
                : true;
            const matchesRole = query.roleLabel
                ? user.role?.label?.toLowerCase() ===
                  query.roleLabel.toLowerCase()
                : true;
            const matchesStatus = query.status
                ? user.status === query.status
                : true;

            return matchesQuery && matchesRole && matchesStatus;
        });

        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const data = filtered
            .slice((page - 1) * limit, page * limit)
            .map((user) => this.sanitizeUser(user));

        return paginate(data, filtered.length, page, limit);
    }

    /**
     * Retrieves one user for administrators.
     *
     * @param adminId - Administrator identifier
     * @param userId - Target user identifier
     * @returns The sanitized user
     */
    async getUserById(
        adminId: string,
        userId: string,
    ): Promise<Record<string, unknown>> {
        await this.authService.isAdmin(adminId);
        const user = await this.retrieveUserById(userId);

        return this.sanitizeUser(user);
    }

    /**
     * Updates a user role, status, or authorization as an administrator.
     *
     * @param adminId - Administrator identifier
     * @param userId - Target user identifier
     * @param dto - Administrative payload
     * @returns The updated user
     */
    async adminUpdateUser(
        adminId: string,
        userId: string,
        dto: AdminUpdateUserDto,
    ): Promise<Record<string, unknown>> {
        await this.authService.isAdmin(adminId);
        const user = await this.retrieveUserById(userId);

        let role = user.role;

        if (dto.roleLabel) {
            role = await this.rolesRepository.findOne({
                where: { label: dto.roleLabel.toLowerCase() },
            });

            if (!role) {
                this.errorHandlingService.returnErrorOnNotFound(
                    `Role ${dto.roleLabel} not found`,
                    'Role not found',
                );
            }
        }

        const isAuthorized = dto.isAuthorized ?? user.isAuthorized;
        const status = dto.status ?? user.status;

        await this.usersRepository.update(
            { id: userId },
            {
                role,
                status,
                isAuthorized,
                authorizedAt: isAuthorized
                    ? (user.authorizedAt ?? new Date())
                    : user.authorizedAt,
                blockedAt: !isAuthorized ? new Date() : user.blockedAt,
            },
        );

        return await this.getCurrentUser(userId);
    }

    /**
     * Soft-deletes a user as an administrator.
     *
     * @param adminId - Administrator identifier
     * @param userId - Target user identifier
     * @returns A confirmation message
     */
    async removeUser(
        adminId: string,
        userId: string,
    ): Promise<{ message: string }> {
        await this.authService.isAdmin(adminId);
        await this.retrieveUserById(userId);
        await this.usersRepository.softDelete({ id: userId });

        return { message: 'User deleted successfully' };
    }

    /**
     * Bulk-updates user authorization as an administrator.
     *
     * @param adminId - Administrator identifier
     * @param userIds - Target user identifiers
     * @param isAuthorized - New authorization flag
     * @returns A summary of the operation
     */
    async bulkUpdateAuthorization(
        adminId: string,
        userIds: string[],
        isAuthorized: boolean,
    ): Promise<{
        message: string;
        updatedCount: number;
        notFoundIds: string[];
    }> {
        await this.authService.isAdmin(adminId);
        const users = await this.usersRepository.find({
            where: { id: In(userIds), deleted: false },
        });
        const foundIds = new Set(users.map((user) => user.id));
        const notFoundIds = userIds.filter((id) => !foundIds.has(id));

        for (const user of users) {
            await this.usersRepository.update(
                { id: user.id },
                {
                    isAuthorized,
                    status: isAuthorized
                        ? UserStatus.ACTIVE
                        : UserStatus.SUSPENDED,
                    authorizedAt: isAuthorized
                        ? (user.authorizedAt ?? new Date())
                        : user.authorizedAt,
                    blockedAt: isAuthorized ? user.blockedAt : new Date(),
                },
            );
        }

        return {
            message: `${users.length} user(s) updated successfully`,
            updatedCount: users.length,
            notFoundIds,
        };
    }

    /**
     * Retrieves an active user by identifier.
     *
     * @param id - User identifier
     * @returns The matching user
     * @throws NotFoundException when the user does not exist
     */
    private async retrieveUserById(id: string): Promise<Users> {
        const user = await this.usersRepository.findOne({
            where: { id, deleted: false },
            relations: ['role', 'avatar'],
        });

        if (!user) {
            this.errorHandlingService.returnErrorOnNotFound(
                `User with id ${id} not found`,
                'User not found',
            );
        }

        return user;
    }

    /**
     * Removes sensitive fields from a user before returning it.
     *
     * @param user - User entity
     * @returns A public user representation
     */
    private sanitizeUser(user: Users): Record<string, unknown> {
        return {
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            avatar: user.avatar?.url ?? null,
            bio: user.bio ?? null,
            country: user.country ?? null,
            city: user.city ?? null,
            phone: user.phone ?? null,
            locale: user.locale ?? 'fr',
            preferredCategories: user.preferredCategories ?? [],
            skillLevel: user.skillLevel,
            monthlyBudgetXof: user.monthlyBudgetXof,
            plan: user.plan,
            premiumUntil: user.premiumUntil ?? null,
            dietaryPreferences: user.dietaryPreferences ?? [],
            allergies: user.allergies ?? [],
            points: user.points,
            status: user.status,
            isAuthorized: user.isAuthorized,
            role: user.role
                ? {
                      id: user.role.id,
                      label: user.role.label,
                      description: user.role.description,
                  }
                : null,
            lastConnexionAt: user.lastConnexionAt ?? null,
            createdAt: user.createdAt,
        };
    }

    /**
     * Signs a JWT for a user.
     *
     * @param user - Authenticated user
     * @returns The signed token
     */
    private generateToken(user: Users): string {
        const expiresIn =
            this.configService.get<string>('auth.jwtAccessExpirationTime') ??
            '15m';

        return jwt.sign(
            { id: user.id },
            this.configService.getOrThrow<string>('auth.jwtSecret'),
            {
                expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
            },
        );
    }

    /**
     * Sends the Kulina welcome email without blocking registration.
     *
     * @param user - Newly created user
     */
    private async sendWelcomeEmail(user: Users): Promise<void> {
        try {
            await this.mailerService.sendMail(
                user.email,
                'Welcome to Kulina',
                `<p>Hello ${user.fullname},</p><p>Welcome to Kulina! You can now discover African recipes, plan meals, and cook with confidence.</p>`,
            );
        } catch (error) {
            this.logger.warn(
                `Welcome email failed for ${user.email}: ${error}`,
            );
        }
    }
}
