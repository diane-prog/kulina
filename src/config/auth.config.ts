import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
    jwtSecret: process.env.JWT_SECRET ?? 'kulina-development-secret',
    jwtExpirationTime: process.env.JWT_EXPIRATION_TIME ?? '7d',
    resetPasswordExpirationTime:
        process.env.RESET_PASSWORD_EXPIRATION_TIME ?? '30m',
    resetPasswordLink:
        process.env.RESET_PASSWORD_LINK ??
        'http://localhost:3001/reset-password?token=',
    roles: {
        superAdmin: (process.env.SUPER_ADMIN ?? 'super_admin').toLowerCase(),
        admin: (process.env.ADMIN_ROLE ?? 'admin').toLowerCase(),
        moderator: (process.env.MODERATOR_ROLE ?? 'moderator').toLowerCase(),
        contributor: (
            process.env.CONTRIBUTOR_ROLE ?? 'contributor'
        ).toLowerCase(),
        user: (process.env.USER_ROLE ?? 'user').toLowerCase(),
    },
}));
