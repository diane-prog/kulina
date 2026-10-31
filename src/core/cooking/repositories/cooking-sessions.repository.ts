import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { CookingSession } from '../entities/cooking-session.entity';

@Injectable()
export class CookingSessionsRepository extends AbstractRepository<CookingSession> {
    protected readonly logger = new Logger(CookingSessionsRepository.name);

    constructor(
        @InjectRepository(CookingSession)
        cookingSessionsRepository: Repository<CookingSession>,
        entityManager: EntityManager,
    ) {
        super(cookingSessionsRepository, entityManager);
    }
}
