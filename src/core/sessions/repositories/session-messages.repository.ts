import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { SessionMessage } from '../entities/session-message.entity';

@Injectable()
export class SessionMessagesRepository extends AbstractRepository<SessionMessage> {
    protected readonly logger = new Logger(SessionMessagesRepository.name);

    constructor(
        @InjectRepository(SessionMessage)
        sessionMessagesRepository: Repository<SessionMessage>,
        entityManager: EntityManager,
    ) {
        super(sessionMessagesRepository, entityManager);
    }
}
