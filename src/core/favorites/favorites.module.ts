import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { RecipesModule } from '../recipes/recipes.module';
import { Favorite } from './entities/favorite.entity';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { FavoritesRepository } from './repositories/favorites.repository';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([Favorite]),
        RecipesModule,
    ],
    controllers: [FavoritesController],
    providers: [FavoritesService, FavoritesRepository],
    exports: [FavoritesService, FavoritesRepository],
})
export class FavoritesModule {}
