import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { FileType } from '../../common/enum/file_type.enum';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { SignUploadDto } from './dto/sign-upload.dto';
import { Media } from './entities/media.entity';
import { MediaRepository } from './repositories/media.repository';

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
    ownerId?: string;
}

@Injectable()
export class MediaService {
    private readonly logger: Logger;
    private configured = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly mediaRepository: MediaRepository,
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
     * Builds a Cloudinary folder from an upload request.
     *
     * @param dto - Upload scope details
     * @returns The Cloudinary folder
     */
    buildFolder(dto: SignUploadDto): string {
        if (dto.scope === 'recipes' && dto.slug) {
            return dto.step
                ? `kulina/recipes/${dto.slug}/step-${dto.step}`
                : `kulina/recipes/${dto.slug}/cover`;
        }

        if (dto.scope === 'user-checks') {
            return `kulina/user-checks/${dto.ownerId ?? 'anonymous'}`;
        }

        if (dto.scope === 'avatars' && dto.ownerId) {
            return `kulina/avatars/${dto.ownerId}`;
        }

        return `kulina/${dto.scope}`;
    }

    /**
     * Builds an optimized Cloudinary delivery URL.
     *
     * @param publicId - Cloudinary public identifier
     * @param width - Target width
     * @returns The optimized URL
     */
    optimizedUrl(publicId: string, width = 600): string {
        const cloudName = this.configService.get<string>(
            'CLOUDINARY_CLOUD_NAME',
        );

        return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_${width}/${publicId}`;
    }

    /**
     * Signs a direct Cloudinary upload.
     *
     * @param dto - Upload scope details
     * @returns Signature payload for the client
     * @throws BadRequestException when Cloudinary is not configured
     */
    signUpload(dto: SignUploadDto) {
        if (!this.configured) {
            throw new BadRequestException('Cloudinary is not configured');
        }

        const timestamp = Math.round(Date.now() / 1000);
        const folder = this.buildFolder(dto);
        const signature = cloudinary.utils.api_sign_request(
            { timestamp, folder },
            this.configService.get<string>('CLOUDINARY_API_SECRET'),
        );

        return {
            cloudName: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            apiKey: this.configService.get<string>('CLOUDINARY_API_KEY'),
            timestamp,
            folder,
            signature,
            transformation: 'f_auto,q_auto,w_600',
            uploadUrl: `https://api.cloudinary.com/v1_1/${this.configService.get<string>('CLOUDINARY_CLOUD_NAME')}/auto/upload`,
        };
    }

    /**
     * Persists metadata after a direct Cloudinary upload.
     *
     * @param dto - Uploaded asset metadata
     * @returns The stored media record
     */
    async confirmUpload(dto: ConfirmUploadDto): Promise<Media> {
        const mimetype = dto.mimetype ?? '';
        const format = dto.format ?? mimetype.split('/')[1] ?? 'bin';

        return await this.mediaRepository.create(
            new Media({
                publicId: dto.publicId,
                label: dto.label,
                url: dto.url,
                optimizedUrl: this.optimizedUrl(dto.publicId),
                folder: dto.folder,
                format,
                mimetype,
                width: dto.width,
                height: dto.height,
                bytes: dto.bytes ?? 0,
                type: this.determineFileType(mimetype, format),
                resourceType: dto.resourceType ?? 'auto',
                ownerId: dto.ownerId,
                isTemporary: dto.isTemporary ?? false,
            }),
        );
    }

    /**
     * Uploads one file to Cloudinary and stores its metadata.
     *
     * @param file - Uploaded multer file
     * @param scope - Upload scope
     * @param options - Optional label, tags, temporary flag, owner
     * @returns The stored media record
     */
    async uploadFile(
        file: Express.Multer.File,
        scope: SignUploadDto['scope'] = 'general',
        options: UploadFileOptions = {},
    ): Promise<Media> {
        if (!file?.buffer || !file.originalname) {
            throw new BadRequestException('File is required');
        }

        const folder = this.buildFolder({ scope, ownerId: options.ownerId });
        const upload = await this.uploadToCloudinary(
            file,
            folder,
            options.tags,
        );

        const created = await this.mediaRepository.create(
            new Media({
                publicId: upload.publicId,
                label: options.label ?? file.originalname,
                url: upload.secureUrl,
                optimizedUrl: this.optimizedUrl(upload.publicId),
                folder: upload.folder,
                format: upload.format,
                mimetype: file.mimetype,
                width: upload.width,
                height: upload.height,
                bytes: upload.bytes,
                type: this.determineFileType(file.mimetype, upload.format),
                resourceType: upload.resourceType,
                ownerId: options.ownerId,
                isTemporary: options.isTemporary ?? false,
            }),
        );

        this.logger.info(`Media ${created.publicId} uploaded`);

        return created;
    }

    /**
     * Uploads an image to Cloudinary and stores its metadata.
     *
     * @param file - Uploaded multer file
     * @param scope - Upload scope
     * @param options - Optional label, tags, temporary flag, owner
     * @returns The stored media record
     */
    async uploadImage(
        file: Express.Multer.File,
        scope: SignUploadDto['scope'] = 'general',
        options: UploadFileOptions = {},
    ): Promise<Media> {
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
     * @param options - Optional label, tags, temporary flag, owner
     * @returns The stored media records
     */
    async uploadFiles(
        files: Express.Multer.File[],
        scope: SignUploadDto['scope'] = 'general',
        options: UploadFileOptions = {},
    ): Promise<Media[]> {
        const created: Media[] = [];

        for (const file of files) {
            created.push(await this.uploadFile(file, scope, options));
        }

        return created;
    }

    /**
     * Lists all non-deleted media.
     *
     * @returns All stored media
     */
    async findAllFiles(): Promise<Media[]> {
        return await this.mediaRepository.find({
            where: { deleted: false },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Retrieves one media record by identifier.
     *
     * @param id - Media identifier
     * @returns The matching media
     */
    async findFileById(id: string): Promise<Media> {
        const media = await this.mediaRepository.findOne({
            where: { id, deleted: false },
        });

        if (!media) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Media with id ${id} not found`,
                'Media not found',
            );
        }

        return media;
    }

    /**
     * Deletes a media asset from Cloudinary and soft-deletes its metadata.
     *
     * @param id - Media identifier
     * @returns A confirmation message
     */
    async deleteFile(id: string): Promise<{ message: string }> {
        const media = await this.findFileById(id);
        const resourceType =
            media.resourceType ?? this.resolveResourceType(media.type);

        await this.deleteCloudinaryAsset(media.publicId, resourceType).catch(
            (error: unknown) => {
                this.logger.warn(
                    `Cloudinary deletion failed for ${media.publicId}: ${error}`,
                );
            },
        );
        await this.mediaRepository.softDelete({ id });

        return { message: 'Media deleted successfully' };
    }

    /**
     * Deletes temporary media older than seven days.
     */
    @Cron('0 3 * * *')
    async cleanupTemporaryMedia(): Promise<void> {
        const media = await this.mediaRepository.find({
            where: { deleted: false, isTemporary: true },
        });
        const threshold = Date.now() - 7 * 24 * 60 * 60 * 1000;

        for (const item of media) {
            if (new Date(item.createdAt).getTime() > threshold) {
                continue;
            }

            await this.deleteCloudinaryAsset(
                item.publicId,
                item.resourceType ?? this.resolveResourceType(item.type),
            ).catch(() => undefined);
            await this.mediaRepository.softDelete({ id: item.id });
        }
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
     * Maps a MIME type or format to the shared file type enum.
     *
     * @param mimetype - Uploaded file MIME type
     * @param format - Optional Cloudinary format
     * @returns The matching file type
     */
    private determineFileType(mimetype: string, format?: string): FileType {
        const normalizedFormat = format?.toLowerCase();

        if (
            mimetype.startsWith('image/') ||
            ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(
                normalizedFormat ?? '',
            )
        ) {
            return FileType.IMAGE;
        }

        if (
            mimetype.startsWith('video/') ||
            ['mp4', 'mov', 'webm'].includes(normalizedFormat ?? '')
        ) {
            return FileType.VIDEO;
        }

        if (
            mimetype.startsWith('audio/') ||
            ['mp3', 'wav', 'ogg'].includes(normalizedFormat ?? '')
        ) {
            return FileType.AUDIO;
        }

        if (mimetype === 'application/pdf' || normalizedFormat === 'pdf') {
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
