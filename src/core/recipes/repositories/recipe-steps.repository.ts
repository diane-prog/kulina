import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { RecipeStep } from '../entities/recipe-step.entity';

@Injectable()
export class RecipeStepsRepository extends AbstractRepository<RecipeStep> {
    protected readonly logger = new Logger(RecipeStepsRepository.name);

    constructor(
        @InjectRepository(RecipeStep)
        recipeStepsRepository: Repository<RecipeStep>,
        entityManager: EntityManager,
    ) {
        super(recipeStepsRepository, entityManager);
    }
}
