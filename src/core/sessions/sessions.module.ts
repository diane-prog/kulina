import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { RecipesModule } from '../recipes/recipes.module';
import { CookingSession } from './entities/cooking-session.entity';
import { SessionMessage } from './entities/session-message.entity';
import { SessionMessagesRepository } from './repositories/session-messages.repository';
import { SessionsRepository } from './repositories/sessions.repository';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([CookingSession, SessionMessage]),
        RecipesModule,
    ],
    controllers: [SessionsController],
    providers: [SessionsService, SessionsRepository, SessionMessagesRepository],
    exports: [SessionsService, SessionsRepository, SessionMessagesRepository],
})
export class SessionsModule {}
