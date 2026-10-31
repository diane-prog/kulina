import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { Roles } from './entities/roles.entity';
import { RolesRepository } from './repositories/roles.repository';
import { RolesController } from './roles.controller';
import { RolesSeeder } from './roles.seeder';
import { RolesService } from './roles.service';

@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([Roles])],
    controllers: [RolesController],
    providers: [RolesService, RolesRepository, RolesSeeder],
    exports: [RolesService, RolesRepository],
})
export class RolesModule {}
