import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { Media } from '../entities/media.entity';

@Injectable()
export class MediaRepository extends AbstractRepository<Media> {
    protected readonly logger = new Logger(MediaRepository.name);

    constructor(
        @InjectRepository(Media)
        mediaRepository: Repository<Media>,
        entityManager: EntityManager,
    ) {
        super(mediaRepository, entityManager);
    }
}
