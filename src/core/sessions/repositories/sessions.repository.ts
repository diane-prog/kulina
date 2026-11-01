import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { CookingSession } from '../entities/cooking-session.entity';

@Injectable()
export class SessionsRepository extends AbstractRepository<CookingSession> {
    protected readonly logger = new Logger(SessionsRepository.name);

    constructor(
        @InjectRepository(CookingSession)
        cookingSessionsRepository: Repository<CookingSession>,
        entityManager: EntityManager,
    ) {
        super(cookingSessionsRepository, entityManager);
    }
}
