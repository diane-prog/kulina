import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { RecipesModule } from '../recipes/recipes.module';
import { CookingController } from './cooking.controller';
import { CookingService } from './cooking.service';
import { CookingSession } from './entities/cooking-session.entity';
import { CookingSessionsRepository } from './repositories/cooking-sessions.repository';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([CookingSession]),
        RecipesModule,
    ],
    controllers: [CookingController],
    providers: [CookingService, CookingSessionsRepository],
    exports: [CookingService, CookingSessionsRepository],
})
export class CookingModule {}
