export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * Wraps a list in the standard pagination result shape.
 *
 * @param data - Page items
 * @param total - Total number of items
 * @param page - Current page
 * @param limit - Page size
 * @returns The paginated result
 */
export function paginate<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
): PaginatedResult<T> {
    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
