import { CloudinaryService } from './cloudinary.service';

describe('CloudinaryService', () => {
    const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
    const mockErrorHandlingService = {
        returnErrorOnNotFound: jest.fn(),
    };

    const configuredService = () =>
        new CloudinaryService(
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
        new CloudinaryService(
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

            expect(service.buildFolder('recipes')).toBe('kulina/recipes');
            expect(service.buildFolder('avatars')).toBe('kulina/avatars');
            expect(service.buildFolder()).toBe('kulina/general');
        });
    });

    describe('uploadFile', () => {
        it('should store a mock file when Cloudinary is not configured', async () => {
            const mockFilesRepository = {
                create: jest.fn(async (entity) => entity),
            };
            const service = new CloudinaryService(
                { get: jest.fn(() => undefined) } as any,
                mockFilesRepository as any,
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

            expect(mockFilesRepository.create).toHaveBeenCalled();
            expect(actual.path).toContain('res.cloudinary.com/mock');
            expect(actual.folder).toBe('kulina/recipes');
        });
    });

    describe('deleteFile', () => {
        it('should soft-delete file metadata when Cloudinary is not configured', async () => {
            const mockFilesRepository = {
                findOne: jest.fn().mockResolvedValue({
                    id: 'file-1',
                    publicId: 'kulina/recipes/test',
                    resourceType: 'image',
                    type: 'image',
                }),
                softDelete: jest.fn(),
            };
            const service = new CloudinaryService(
                { get: jest.fn(() => undefined) } as any,
                mockFilesRepository as any,
                mockErrorHandlingService as any,
                mockLogger as any,
            );

            const actual = await service.deleteFile('file-1');

            expect(mockFilesRepository.softDelete).toHaveBeenCalledWith({
                id: 'file-1',
            });
            expect(actual.message).toBe('File deleted successfully');
        });
    });
});
