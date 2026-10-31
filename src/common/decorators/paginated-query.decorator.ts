import {
    SetMetadata,
    createParamDecorator,
    ExecutionContext,
    applyDecorators,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export const PAGINATION_QUERY_PARAMS = 'PAGINATION_QUERY_PARAMS';

/**
 * Marks a route as using the shared pagination contract.
 *
 * @returns A method decorator
 */
export const UsePagination = () => SetMetadata(PAGINATION_QUERY_PARAMS, true);

export interface PaginationOptions {
    defaultPage?: number;
    defaultLimit?: number;
    maxLimit?: number;
}

export interface PaginatedParams {
    query?: string;
    category?: string;
    page: number;
    limit: number;
}

/**
 * Extracts and validates pagination query parameters.
 *
 * @param options - Pagination defaults and maximum limit
 * @param context - Nest execution context
 * @returns Validated pagination parameters
 */
export const PaginationParams = createParamDecorator(
    (
        options: PaginationOptions | undefined,
        context: ExecutionContext,
    ): PaginatedParams => {
        const request = context.switchToHttp().getRequest();
        const query = request.query;

        const defaultPage = options?.defaultPage ?? 1;
        const defaultLimit = options?.defaultLimit ?? 10;
        const maxLimit = options?.maxLimit ?? 100;

        const pageParam = query.page;
        const page = pageParam
            ? Math.max(
                  1,
                  Number.parseInt(pageParam as string, 10) || defaultPage,
              )
            : defaultPage;

        const limitParam = query.limit;
        const limit = limitParam
            ? Math.min(
                  maxLimit,
                  Math.max(
                      1,
                      Number.parseInt(limitParam as string, 10) || defaultLimit,
                  ),
              )
            : defaultLimit;

        return {
            query: query.query,
            category: query.category,
            page,
            limit,
        };
    },
);

/**
 * Adds standard Swagger query documentation for pagination.
 *
 * @param options - Pagination defaults
 * @returns A set of Swagger query decorators
 */
export const StandardPaginationQueries = (options?: PaginationOptions) => {
    return applyDecorators(
        ApiQuery({ name: 'query', required: false, type: String }),
        ApiQuery({ name: 'category', required: false, type: String }),
        ApiQuery({
            name: 'page',
            required: false,
            type: Number,
            example: options?.defaultPage ?? 1,
        }),
        ApiQuery({
            name: 'limit',
            required: false,
            type: Number,
            example: options?.defaultLimit ?? 10,
        }),
    );
};
