import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { Tutorial } from '../entities/tutorial.entity';

@Injectable()
export class TutorialsRepository extends AbstractRepository<Tutorial> {
    protected readonly logger = new Logger(TutorialsRepository.name);

    constructor(
        @InjectRepository(Tutorial)
        tutorialsRepository: Repository<Tutorial>,
        entityManager: EntityManager,
    ) {
        super(tutorialsRepository, entityManager);
    }
}
