import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { RecipeCategory } from '../entities/recipe-category.entity';

@Injectable()
export class RecipeCategoriesRepository extends AbstractRepository<RecipeCategory> {
    protected readonly logger = new Logger(RecipeCategoriesRepository.name);

    constructor(
        @InjectRepository(RecipeCategory)
        recipeCategoriesRepository: Repository<RecipeCategory>,
        entityManager: EntityManager,
    ) {
        super(recipeCategoriesRepository, entityManager);
    }
}
