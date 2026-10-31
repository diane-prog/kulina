import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { Roles } from '../entities/roles.entity';

@Injectable()
export class RolesRepository extends AbstractRepository<Roles> {
    protected readonly logger = new Logger(RolesRepository.name);

    constructor(
        @InjectRepository(Roles)
        rolesRepository: Repository<Roles>,
        entityManager: EntityManager,
    ) {
        super(rolesRepository, entityManager);
    }
}
