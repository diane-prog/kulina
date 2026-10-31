import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { Budget } from '../entities/budget.entity';

@Injectable()
export class BudgetsRepository extends AbstractRepository<Budget> {
    protected readonly logger = new Logger(BudgetsRepository.name);

    constructor(
        @InjectRepository(Budget)
        budgetsRepository: Repository<Budget>,
        entityManager: EntityManager,
    ) {
        super(budgetsRepository, entityManager);
    }
}
