import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { Favorite } from '../entities/favorite.entity';

@Injectable()
export class FavoritesRepository extends AbstractRepository<Favorite> {
    protected readonly logger = new Logger(FavoritesRepository.name);

    constructor(
        @InjectRepository(Favorite)
        favoritesRepository: Repository<Favorite>,
        entityManager: EntityManager,
    ) {
        super(favoritesRepository, entityManager);
    }
}
