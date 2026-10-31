import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { MealPlanItem } from '../entities/meal-plan-item.entity';

@Injectable()
export class MealPlanItemsRepository extends AbstractRepository<MealPlanItem> {
    protected readonly logger = new Logger(MealPlanItemsRepository.name);

    constructor(
        @InjectRepository(MealPlanItem)
        mealPlanItemsRepository: Repository<MealPlanItem>,
        entityManager: EntityManager,
    ) {
        super(mealPlanItemsRepository, entityManager);
    }
}
