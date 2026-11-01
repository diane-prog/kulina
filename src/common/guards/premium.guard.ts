import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Plan } from '../enum/plan.enum';
import { PREMIUM_KEY } from '../decorators/require-premium.decorator';

@Injectable()
export class PremiumGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    /**
     * Checks that the authenticated user has an active premium plan.
     *
     * @param context - Nest execution context
     * @returns Whether the request can proceed
     * @throws ForbiddenException when the user is not premium
     */
    canActivate(context: ExecutionContext): boolean {
        const requiresPremium = this.reflector.getAllAndOverride<boolean>(
            PREMIUM_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiresPremium) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        const isPremium =
            user?.plan === Plan.PREMIUM &&
            (!user.premiumUntil ||
                new Date(user.premiumUntil).getTime() > Date.now());

        if (!isPremium) {
            throw new ForbiddenException(
                'This feature requires an active Kulina premium plan',
            );
        }

        return true;
    }
}
