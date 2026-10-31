/**
 * Converts a label into a URL-friendly slug.
 *
 * @param value - Raw label
 * @returns The normalized slug
 */
export function toSlug(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
