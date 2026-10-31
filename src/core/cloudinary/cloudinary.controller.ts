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
import { CloudinaryService } from './cloudinary.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { Files } from './entities/file.entity';

@ApiTags('files')
@Controller('files')
export class CloudinaryController {
    constructor(private readonly cloudinaryService: CloudinaryService) {}

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get()
    @ApiOperation({ summary: 'List files stored in Cloudinary (admin)' })
    findAll(): Promise<Files[]> {
        return this.cloudinaryService.findAllFiles();
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Get('admin/test')
    @ApiOperation({ summary: 'Smoke test for the Cloudinary module' })
    adminTest() {
        return {
            status: 'ok',
            module: 'cloudinary',
            configured: this.cloudinaryService.isConfigured(),
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get one file by id' })
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Files> {
        return this.cloudinaryService.findFileById(id);
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
                file: {
                    type: 'string',
                    format: 'binary',
                },
                scope: {
                    type: 'string',
                    enum: [
                        'recipes',
                        'tutorials',
                        'avatars',
                        'community',
                        'ingredients',
                        'general',
                    ],
                },
                label: { type: 'string' },
                isTemporary: { type: 'boolean' },
            },
            required: ['file'],
        },
    })
    @ApiOperation({ summary: 'Upload one file to Cloudinary' })
    upload(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadFileDto,
    ): Promise<Files> {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        return this.cloudinaryService.uploadFile(
            file,
            dto?.scope ?? 'general',
            {
                label: dto?.label,
                isTemporary: dto?.isTemporary,
            },
        );
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
                scope: {
                    type: 'string',
                    enum: [
                        'recipes',
                        'tutorials',
                        'avatars',
                        'community',
                        'ingredients',
                        'general',
                    ],
                },
                label: { type: 'string' },
                isTemporary: { type: 'boolean' },
            },
            required: ['files'],
        },
    })
    @ApiOperation({ summary: 'Upload multiple files to Cloudinary' })
    uploadMany(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: UploadFileDto,
    ): Promise<Files[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('At least one file is required');
        }

        return this.cloudinaryService.uploadFiles(
            files,
            dto?.scope ?? 'general',
            {
                label: dto?.label,
                isTemporary: dto?.isTemporary,
            },
        );
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRoles('super_admin', 'admin')
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a file from Cloudinary (admin)' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.cloudinaryService.deleteFile(id);
    }
}
