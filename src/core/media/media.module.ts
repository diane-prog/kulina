import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../libs/database/database.module';
import { Media } from './entities/media.entity';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaRepository } from './repositories/media.repository';

@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([Media]), ConfigModule],
    controllers: [MediaController],
    providers: [MediaService, MediaRepository],
    exports: [MediaService, MediaRepository],
})
export class MediaModule {}
