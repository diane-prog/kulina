import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { MealPlan } from '../entities/meal-plan.entity';

@Injectable()
export class MealPlansRepository extends AbstractRepository<MealPlan> {
    protected readonly logger = new Logger(MealPlansRepository.name);

    constructor(
        @InjectRepository(MealPlan)
        mealPlansRepository: Repository<MealPlan>,
        entityManager: EntityManager,
    ) {
        super(mealPlansRepository, entityManager);
    }
}
