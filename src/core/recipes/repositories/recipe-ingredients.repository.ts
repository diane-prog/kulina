import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';

@Injectable()
export class RecipeIngredientsRepository extends AbstractRepository<RecipeIngredient> {
    protected readonly logger = new Logger(RecipeIngredientsRepository.name);

    constructor(
        @InjectRepository(RecipeIngredient)
        recipeIngredientsRepository: Repository<RecipeIngredient>,
        entityManager: EntityManager,
    ) {
        super(recipeIngredientsRepository, entityManager);
    }
}
