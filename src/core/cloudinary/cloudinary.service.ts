import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { FileType } from '../../common/enum/file_type.enum';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import type { CloudinaryScope } from './cloudinary.constants';
import { Files } from './entities/file.entity';
import { FilesRepository } from './repositories/files.repository';

interface CloudinaryUploadResult {
    publicId: string;
    url: string;
    secureUrl: string;
    format: string;
    width?: number;
    height?: number;
    bytes: number;
    folder: string;
    resourceType: string;
}

interface UploadFileOptions {
    label?: string;
    tags?: string[];
    isTemporary?: boolean;
}

@Injectable()
export class CloudinaryService {
    private readonly logger: Logger;
    private configured = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly filesRepository: FilesRepository,
        private readonly errorHandlingService: ErrorHandlingService,
        @Inject(WINSTON_MODULE_PROVIDER) logger: Logger,
    ) {
        this.logger = logger;
        this.configure();
    }

    /**
     * Configures the Cloudinary SDK from environment variables.
     */
    private configure(): void {
        const cloudName = this.configService.get<string>(
            'CLOUDINARY_CLOUD_NAME',
        );
        const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
        const apiSecret = this.configService.get<string>(
            'CLOUDINARY_API_SECRET',
        );

        if (cloudName && apiKey && apiSecret) {
            cloudinary.config({
                cloud_name: cloudName,
                api_key: apiKey,
                api_secret: apiSecret,
                secure: true,
            });
            this.configured = true;
            this.logger.info('Cloudinary configured');
            return;
        }

        this.logger.warn(
            'Cloudinary is not configured. Uploads will return mock URLs until CLOUDINARY_* variables are set.',
        );
    }

    /**
     * Returns whether Cloudinary credentials are available.
     *
     * @returns True when Cloudinary is configured
     */
    isConfigured(): boolean {
        return this.configured;
    }

    /**
     * Builds the Cloudinary folder for a Kulina scope.
     *
     * @param scope - Upload scope
     * @returns The Cloudinary folder path
     */
    buildFolder(scope: CloudinaryScope = 'general'): string {
        return `kulina/${scope}`;
    }

    /**
     * Uploads one file to Cloudinary and stores its metadata.
     *
     * @param file - Uploaded multer file
     * @param scope - Upload scope
     * @param options - Optional label, tags, and temporary flag
     * @returns The stored file record
     * @throws BadRequestException when no file is provided
     */
    async uploadFile(
        file: Express.Multer.File,
        scope: CloudinaryScope = 'general',
        options: UploadFileOptions = {},
    ): Promise<Files> {
        if (!file?.buffer || !file.originalname) {
            throw new BadRequestException('File is required');
        }

        const folder = this.buildFolder(scope);
        const upload = await this.uploadToCloudinary(
            file,
            folder,
            options.tags,
        );

        const created = await this.filesRepository.create(
            new Files({
                publicId: upload.publicId,
                label: options.label ?? file.originalname,
                path: upload.secureUrl,
                folder: upload.folder,
                format: upload.format,
                mimetype: file.mimetype,
                width: upload.width,
                height: upload.height,
                size: upload.bytes,
                type: this.determineFileType(file.mimetype),
                resourceType: upload.resourceType,
                isTemporary: options.isTemporary ?? false,
            }),
        );

        this.logger.info(`File ${created.publicId} uploaded`);

        return created;
    }

    /**
     * Uploads an image to Cloudinary and stores its metadata.
     *
     * @param file - Uploaded multer file
     * @param scope - Upload scope
     * @param options - Optional label, tags, and temporary flag
     * @returns The stored file record
     * @throws BadRequestException when the file is not an image
     */
    async uploadImage(
        file: Express.Multer.File,
        scope: CloudinaryScope = 'general',
        options: UploadFileOptions = {},
    ): Promise<Files> {
        if (!file?.mimetype?.startsWith('image/')) {
            throw new BadRequestException(
                'Only image uploads are allowed for this endpoint',
            );
        }

        return await this.uploadFile(file, scope, options);
    }

    /**
     * Uploads multiple files to Cloudinary.
     *
     * @param files - Uploaded multer files
     * @param scope - Upload scope
     * @param options - Optional label, tags, and temporary flag
     * @returns The stored file records
     */
    async uploadFiles(
        files: Express.Multer.File[],
        scope: CloudinaryScope = 'general',
        options: UploadFileOptions = {},
    ): Promise<Files[]> {
        const created: Files[] = [];

        for (const file of files) {
            created.push(await this.uploadFile(file, scope, options));
        }

        return created;
    }

    /**
     * Lists all non-deleted files.
     *
     * @returns All stored files
     */
    async findAllFiles(): Promise<Files[]> {
        return await this.filesRepository.find({
            where: { deleted: false },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Retrieves one file by identifier.
     *
     * @param id - File identifier
     * @returns The matching file
     * @throws NotFoundException when the file does not exist
     */
    async findFileById(id: string): Promise<Files> {
        const file = await this.filesRepository.findOne({
            where: { id, deleted: false },
        });

        if (!file) {
            this.errorHandlingService.returnErrorOnNotFound(
                `File with id ${id} not found`,
                'File not found',
            );
        }

        return file;
    }

    /**
     * Deletes a file from Cloudinary and soft-deletes its metadata.
     *
     * @param id - File identifier
     * @returns A confirmation message
     */
    async deleteFile(id: string): Promise<{ message: string }> {
        const file = await this.findFileById(id);
        const resourceType =
            file.resourceType ?? this.resolveResourceType(file.type);

        await this.deleteCloudinaryAsset(file.publicId, resourceType).catch(
            (error: unknown) => {
                this.logger.warn(
                    `Cloudinary deletion failed for ${file.publicId}: ${error}`,
                );
            },
        );
        await this.filesRepository.softDelete({ id });

        return { message: 'File deleted successfully' };
    }

    /**
     * Uploads a buffer to Cloudinary through an upload stream.
     *
     * @param file - Uploaded multer file
     * @param folder - Destination folder
     * @param tags - Optional Cloudinary tags
     * @returns The Cloudinary upload result
     */
    private uploadToCloudinary(
        file: Express.Multer.File,
        folder: string,
        tags?: string[],
    ): Promise<CloudinaryUploadResult> {
        if (!this.configured) {
            const safeName = file.originalname.replace(/[^\w.-]/g, '_');
            const mockId = `${folder}/${Date.now()}_${safeName}`;
            const mockUrl = `https://res.cloudinary.com/mock/image/upload/${mockId}`;

            return Promise.resolve({
                publicId: mockId,
                url: mockUrl,
                secureUrl: mockUrl,
                format: file.mimetype.split('/')[1] ?? 'bin',
                bytes: file.size,
                folder,
                resourceType: this.resolveResourceType(
                    this.determineFileType(file.mimetype),
                ),
            });
        }

        return new Promise<CloudinaryUploadResult>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    tags,
                    resource_type: 'auto',
                    overwrite: false,
                    unique_filename: true,
                },
                (error, result: UploadApiResponse | undefined) => {
                    if (error || !result) {
                        this.logger.error(
                            `Cloudinary upload failed: ${error?.message ?? 'unknown error'}`,
                        );
                        reject(
                            new BadRequestException(
                                `Upload failed: ${error?.message ?? 'unknown error'}`,
                            ),
                        );
                        return;
                    }

                    resolve({
                        publicId: result.public_id,
                        url: result.url,
                        secureUrl: result.secure_url,
                        format: result.format,
                        width: result.width,
                        height: result.height,
                        bytes: result.bytes,
                        folder: result.folder || folder,
                        resourceType: result.resource_type,
                    });
                },
            );

            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }

    /**
     * Deletes a Cloudinary asset.
     *
     * @param publicId - Cloudinary public identifier
     * @param resourceType - Cloudinary resource type
     * @returns The Cloudinary deletion result
     */
    private async deleteCloudinaryAsset(
        publicId: string,
        resourceType: string,
    ): Promise<unknown> {
        if (!this.configured) {
            return { result: 'ok (mock)' };
        }

        return await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
    }

    /**
     * Maps a MIME type to the shared file type enum.
     *
     * @param mimetype - Uploaded file MIME type
     * @returns The matching file type
     */
    private determineFileType(mimetype: string): FileType {
        if (mimetype.startsWith('image/')) {
            return FileType.IMAGE;
        }

        if (mimetype.startsWith('video/')) {
            return FileType.VIDEO;
        }

        if (mimetype.startsWith('audio/')) {
            return FileType.AUDIO;
        }

        if (mimetype === 'application/pdf') {
            return FileType.PDF;
        }

        if (
            mimetype.startsWith('text/') ||
            mimetype.includes('document') ||
            mimetype.includes('sheet') ||
            mimetype.includes('presentation')
        ) {
            return FileType.DOCUMENT;
        }

        return FileType.OTHER;
    }

    /**
     * Resolves the Cloudinary resource type from a file type.
     *
     * @param type - File type
     * @returns The Cloudinary resource type
     */
    private resolveResourceType(type: FileType): string {
        if (type === FileType.IMAGE) {
            return 'image';
        }

        if (type === FileType.VIDEO || type === FileType.AUDIO) {
            return 'video';
        }

        return 'raw';
    }
}
