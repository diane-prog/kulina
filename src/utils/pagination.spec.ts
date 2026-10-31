import { paginate } from './pagination';

describe('paginate', () => {
    it('should wrap items with pagination metadata', () => {
        const actual = paginate(['a', 'b'], 10, 1, 2);

        expect(actual).toEqual({
            data: ['a', 'b'],
            total: 10,
            page: 1,
            limit: 2,
            totalPages: 5,
        });
    });

    it('should return zero pages for an empty result', () => {
        const actual = paginate([], 0, 1, 10);

        expect(actual.totalPages).toBe(0);
    });
});
