import { toSlug } from './slug';

describe('toSlug', () => {
    it('should normalize accents and spaces', () => {
        const actual = toSlug('Poulet braisé');

        expect(actual).toBe('poulet-braise');
    });

    it('should remove leading and trailing separators', () => {
        const actual = toSlug('  --Attiéké  poisson--  ');

        expect(actual).toBe('attieke-poisson');
    });

    it('should return an empty string for an empty label', () => {
        const actual = toSlug('');

        expect(actual).toBe('');
    });
});
