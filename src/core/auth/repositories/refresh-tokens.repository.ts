import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokensRepository extends AbstractRepository<RefreshToken> {
    protected readonly logger = new Logger(RefreshTokensRepository.name);

    constructor(
        @InjectRepository(RefreshToken)
        refreshTokensRepository: Repository<RefreshToken>,
        entityManager: EntityManager,
    ) {
        super(refreshTokensRepository, entityManager);
    }
}
