import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private readonly reflector: Reflector) {
        super();
    }

    /**
     * Skips authentication for routes marked with `@Public()`.
     *
     * @param context - Nest execution context
     * @returns Whether the request can proceed
     */
    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (isPublic) {
            return true;
        }

        return super.canActivate(context);
    }

    /**
     * Rejects unauthenticated requests with a clear message.
     *
     * @param err - Passport error
     * @param user - Authenticated user
     * @param info - Passport extra info (e.g. jwt expired)
     * @returns The authenticated user
     */
    handleRequest(err: any, user: any, info?: any) {
        if (err || !user) {
            const message = info?.message
                ? `Unauthorized: ${info.message}`
                : 'Unauthorized: User not found or invalid token';
            throw err || new UnauthorizedException(message);
        }

        return user;
    }
}
