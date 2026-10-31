import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../libs/database/database.module';
import { CloudinaryController } from './cloudinary.controller';
import { CloudinaryService } from './cloudinary.service';
import { Files } from './entities/file.entity';
import { FilesRepository } from './repositories/files.repository';

@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([Files]), ConfigModule],
    controllers: [CloudinaryController],
    providers: [CloudinaryService, FilesRepository],
    exports: [CloudinaryService, FilesRepository],
})
export class CloudinaryModule {}
