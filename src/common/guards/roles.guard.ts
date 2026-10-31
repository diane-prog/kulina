import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    /**
     * Checks that the authenticated user has one of the required roles.
     *
     * @param context - Nest execution context
     * @returns Whether the request can proceed
     * @throws ForbiddenException when the role is missing
     */
    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        const userRoleLabel: string = user?.role?.label?.toLowerCase();

        if (
            !userRoleLabel ||
            !requiredRoles
                .map((role) => role.toLowerCase())
                .includes(userRoleLabel)
        ) {
            throw new ForbiddenException(
                "You're not authorized to perform this action",
            );
        }

        return true;
    }
}
