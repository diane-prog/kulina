import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from '../ai/ai.module';
import { RecipesModule } from '../recipes/recipes.module';
import { SessionsModule } from '../sessions/sessions.module';
import { CookingGateway } from './cooking.gateway';

@Module({
    imports: [ConfigModule, SessionsModule, AiModule, RecipesModule],
    providers: [CookingGateway],
})
export class ChatModule {}
