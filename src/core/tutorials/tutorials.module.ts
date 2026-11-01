import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { UsersModule } from '../users/users.module';
import { Tutorial } from './entities/tutorial.entity';
import { TutorialsRepository } from './repositories/tutorials.repository';
import { TutorialsController } from './tutorials.controller';
import { TutorialsService } from './tutorials.service';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([Tutorial]),
        UsersModule,
    ],
    controllers: [TutorialsController],
    providers: [TutorialsService, TutorialsRepository],
    exports: [TutorialsService, TutorialsRepository],
})
export class TutorialsModule {}
