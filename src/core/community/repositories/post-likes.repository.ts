import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { PostLike } from '../entities/post-like.entity';

@Injectable()
export class PostLikesRepository extends AbstractRepository<PostLike> {
    protected readonly logger = new Logger(PostLikesRepository.name);

    constructor(
        @InjectRepository(PostLike)
        postLikesRepository: Repository<PostLike>,
        entityManager: EntityManager,
    ) {
        super(postLikesRepository, entityManager);
    }
}
