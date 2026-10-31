import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { Files } from '../entities/file.entity';

@Injectable()
export class FilesRepository extends AbstractRepository<Files> {
    protected readonly logger = new Logger(FilesRepository.name);

    constructor(
        @InjectRepository(Files)
        filesRepository: Repository<Files>,
        entityManager: EntityManager,
    ) {
        super(filesRepository, entityManager);
    }
}
