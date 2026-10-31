const DEV_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
] as const;

const PROD_ORIGINS = ['https://kulina.app', 'https://www.kulina.app'] as const;

/**
 * Checks whether the environment should use development origins.
 *
 * @param env - Current environment
 * @returns True for local, dev, development, and staging environments
 */
function usesDevOrigins(env: string | undefined): boolean {
    return ['dev', 'development', 'staging', 'local'].includes(env);
}

/**
 * Builds environment-aware CORS options.
 *
 * @param env - Current environment
 * @returns NestJS CORS configuration
 */
export function buildCorsOptions(env: string | undefined) {
    const configuredFrontend = process.env.FRONTEND_URL;
    const allowedOrigins = usesDevOrigins(env)
        ? [...DEV_ORIGINS, configuredFrontend].filter(Boolean)
        : [...PROD_ORIGINS, configuredFrontend].filter(Boolean);

    return {
        origin: (
            origin: string | undefined,
            callback: (error: Error | null, allow?: boolean) => void,
        ) => {
            if (!origin) {
                callback(null, usesDevOrigins(env));
                return;
            }

            callback(null, allowedOrigins.includes(origin));
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    };
}
