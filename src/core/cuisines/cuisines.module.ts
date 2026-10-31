import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { CuisinesController } from './cuisines.controller';
import { CuisinesSeeder } from './cuisines.seeder';
import { CuisinesService } from './cuisines.service';
import { Cuisine } from './entities/cuisine.entity';
import { CuisinesRepository } from './repositories/cuisines.repository';

@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([Cuisine])],
    controllers: [CuisinesController],
    providers: [CuisinesService, CuisinesRepository, CuisinesSeeder],
    exports: [CuisinesService, CuisinesRepository],
})
export class CuisinesModule {}
