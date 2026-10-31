import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { Ingredient } from './entities/ingredient.entity';
import { IngredientsController } from './ingredients.controller';
import { IngredientsSeeder } from './ingredients.seeder';
import { IngredientsService } from './ingredients.service';
import { IngredientsRepository } from './repositories/ingredients.repository';

@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([Ingredient])],
    controllers: [IngredientsController],
    providers: [IngredientsService, IngredientsRepository, IngredientsSeeder],
    exports: [IngredientsService, IngredientsRepository],
})
export class IngredientsModule {}
