import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { Ingredient } from '../entities/ingredient.entity';

@Injectable()
export class IngredientsRepository extends AbstractRepository<Ingredient> {
    protected readonly logger = new Logger(IngredientsRepository.name);

    constructor(
        @InjectRepository(Ingredient)
        ingredientsRepository: Repository<Ingredient>,
        entityManager: EntityManager,
    ) {
        super(ingredientsRepository, entityManager);
    }
}
