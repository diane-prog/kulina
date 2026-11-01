import { MediaService } from './media.service';

describe('MediaService', () => {
    const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
    const mockErrorHandlingService = {
        returnErrorOnNotFound: jest.fn(),
    };

    const configuredService = () =>
        new MediaService(
            {
                get: jest.fn((key: string) => {
                    if (key === 'CLOUDINARY_CLOUD_NAME') {
                        return 'test-cloud';
                    }
                    if (key === 'CLOUDINARY_API_KEY') {
                        return 'test-key';
                    }
                    if (key === 'CLOUDINARY_API_SECRET') {
                        return 'test-secret';
                    }
                    return undefined;
                }),
            } as any,
            { create: jest.fn() } as any,
            mockErrorHandlingService as any,
            mockLogger as any,
        );

    const unconfiguredService = () =>
        new MediaService(
            { get: jest.fn(() => undefined) } as any,
            { create: jest.fn() } as any,
            mockErrorHandlingService as any,
            mockLogger as any,
        );

    describe('isConfigured', () => {
        it('should return true when Cloudinary variables are set', () => {
            expect(configuredService().isConfigured()).toBe(true);
        });

        it('should return false when Cloudinary variables are missing', () => {
            expect(unconfiguredService().isConfigured()).toBe(false);
        });
    });

    describe('buildFolder', () => {
        it('should build a Kulina folder for each scope', () => {
            const service = configuredService();

            expect(service.buildFolder({ scope: 'recipes' })).toBe(
                'kulina/recipes',
            );
            expect(
                service.buildFolder({
                    scope: 'recipes',
                    slug: 'bouillie-de-riz',
                    step: 2,
                }),
            ).toBe('kulina/recipes/bouillie-de-riz/step-2');
            expect(service.buildFolder({ scope: 'avatars' })).toBe(
                'kulina/avatars',
            );
        });
    });

    describe('optimizedUrl', () => {
        it('should build an f_auto,q_auto,w_600 delivery URL', () => {
            const service = configuredService();

            expect(service.optimizedUrl('kulina/recipes/test')).toContain(
                'f_auto,q_auto,w_600',
            );
        });
    });

    describe('uploadFile', () => {
        it('should store a mock file when Cloudinary is not configured', async () => {
            const mockMediaRepository = {
                create: jest.fn(async (entity) => entity),
            };
            const service = new MediaService(
                { get: jest.fn(() => undefined) } as any,
                mockMediaRepository as any,
                mockErrorHandlingService as any,
                mockLogger as any,
            );
            const inputFile = {
                buffer: Buffer.from('test'),
                originalname: 'recipe.png',
                mimetype: 'image/png',
                size: 4,
            } as Express.Multer.File;

            const actual = await service.uploadFile(inputFile, 'recipes');

            expect(mockMediaRepository.create).toHaveBeenCalled();
            expect(actual.url).toContain('res.cloudinary.com/mock');
            expect(actual.folder).toBe('kulina/recipes');
        });
    });

    describe('deleteFile', () => {
        it('should soft-delete media metadata when Cloudinary is not configured', async () => {
            const mockMediaRepository = {
                findOne: jest.fn().mockResolvedValue({
                    id: 'media-1',
                    publicId: 'kulina/recipes/test',
                    resourceType: 'image',
                    type: 'image',
                }),
                softDelete: jest.fn(),
            };
            const service = new MediaService(
                { get: jest.fn(() => undefined) } as any,
                mockMediaRepository as any,
                mockErrorHandlingService as any,
                mockLogger as any,
            );

            const actual = await service.deleteFile('media-1');

            expect(mockMediaRepository.softDelete).toHaveBeenCalledWith({
                id: 'media-1',
            });
            expect(actual.message).toBe('Media deleted successfully');
        });
    });
});
