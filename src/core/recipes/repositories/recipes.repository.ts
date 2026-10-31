import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { Recipe } from '../entities/recipe.entity';

@Injectable()
export class RecipesRepository extends AbstractRepository<Recipe> {
    protected readonly logger = new Logger(RecipesRepository.name);

    constructor(
        @InjectRepository(Recipe)
        recipesRepository: Repository<Recipe>,
        entityManager: EntityManager,
    ) {
        super(recipesRepository, entityManager);
    }
}
