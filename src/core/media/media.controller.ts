import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    UploadedFile,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { SignUploadDto } from './dto/sign-upload.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { Media } from './entities/media.entity';
import { MediaService } from './media.service';

@ApiTags('media')
@Controller('media')
export class MediaController {
    constructor(private readonly mediaService: MediaService) {}

    @Post('sign')
    @ApiOperation({ summary: 'Sign a direct Cloudinary upload' })
    sign(@Body() dto: SignUploadDto) {
        return this.mediaService.signUpload(dto);
    }

    @Post('confirm')
    @ApiOperation({ summary: 'Persist metadata after a direct upload' })
    confirm(@Body() dto: ConfirmUploadDto): Promise<Media> {
        return this.mediaService.confirmUpload(dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get()
    @ApiOperation({ summary: 'List media stored in Cloudinary (admin)' })
    findAll(): Promise<Media[]> {
        return this.mediaService.findAllFiles();
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the media module' })
    adminTest() {
        return {
            status: 'ok',
            module: 'media',
            configured: this.mediaService.isConfigured(),
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get one media record by id' })
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Media> {
        return this.mediaService.findFileById(id);
    }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 20 * 1024 * 1024 },
        }),
    )
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                scope: { type: 'string' },
                label: { type: 'string' },
                isTemporary: { type: 'boolean' },
            },
            required: ['file'],
        },
    })
    @ApiOperation({ summary: 'Upload one file through the API' })
    upload(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadFileDto,
    ): Promise<Media> {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        return this.mediaService.uploadFile(file, dto?.scope ?? 'general', {
            label: dto?.label,
            isTemporary: dto?.isTemporary,
        });
    }

    @Post('upload-multiple')
    @UseInterceptors(
        FilesInterceptor('files', 10, {
            limits: { fileSize: 20 * 1024 * 1024 },
        }),
    )
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
                scope: { type: 'string' },
                label: { type: 'string' },
                isTemporary: { type: 'boolean' },
            },
            required: ['files'],
        },
    })
    @ApiOperation({ summary: 'Upload multiple files through the API' })
    uploadMany(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: UploadFileDto,
    ): Promise<Media[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('At least one file is required');
        }

        return this.mediaService.uploadFiles(files, dto?.scope ?? 'general', {
            label: dto?.label,
            isTemporary: dto?.isTemporary,
        });
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a media asset (admin)' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.mediaService.deleteFile(id);
    }
}
