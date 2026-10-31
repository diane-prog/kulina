import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { RecipeTip } from '../entities/recipe-tip.entity';

@Injectable()
export class RecipeTipsRepository extends AbstractRepository<RecipeTip> {
    protected readonly logger = new Logger(RecipeTipsRepository.name);

    constructor(
        @InjectRepository(RecipeTip)
        recipeTipsRepository: Repository<RecipeTip>,
        entityManager: EntityManager,
    ) {
        super(recipeTipsRepository, entityManager);
    }
}
