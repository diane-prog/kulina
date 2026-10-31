import { Module } from '@nestjs/common';
import { RecipesModule } from '../recipes/recipes.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';

@Module({
    imports: [RecipesModule],
    controllers: [AssistantController],
    providers: [AssistantService],
    exports: [AssistantService],
})
export class AssistantModule {}
