import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Request } from 'express';

const RESPONSE_ENVELOPE_BYPASS_PATHS = [
    '/ping',
    '/docs',
    '/docs-json',
    '/docs/redoc',
    '/mcp',
    '/sse',
    '/messages',
] as const;

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    /**
     * Wraps successful HTTP responses in the standard API envelope unless the route must stay raw.
     *
     * @param context - Nest execution context for the current request
     * @param next - Next handler in the interceptor chain
     * @returns Observable of the raw or enveloped response body
     */
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        const request = context.switchToHttp().getRequest<Request>();

        if (this.shouldBypassResponseEnvelope(request)) {
            return next.handle();
        }

        return next
            .handle()
            .pipe(map((res: unknown) => this.responseHandler(res, context)));
    }

    /**
     * Determines whether a route must bypass the `{ statusCode, data }` response wrapper.
     *
     * @param request - Incoming HTTP request
     * @returns True when the route should return its body unchanged
     */
    private shouldBypassResponseEnvelope(request: Request): boolean {
        const requestPath =
            request.route?.path ?? request.path ?? request.url.split('?')[0];

        return RESPONSE_ENVELOPE_BYPASS_PATHS.some(
            (bypassPath) =>
                requestPath === bypassPath ||
                requestPath.startsWith(`${bypassPath}/`),
        );
    }

    /**
     * Builds the standard API success envelope for REST routes.
     *
     * @param res - Handler return value
     * @param context - Nest execution context for the current request
     * @returns Enveloped response payload
     */
    responseHandler(res: unknown, context: ExecutionContext): unknown {
        const response = context.switchToHttp().getResponse();

        return {
            statusCode: response.statusCode,
            data: res,
        };
    }
}
