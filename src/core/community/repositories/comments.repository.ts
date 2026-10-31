import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { Comment } from '../entities/comment.entity';

@Injectable()
export class CommentsRepository extends AbstractRepository<Comment> {
    protected readonly logger = new Logger(CommentsRepository.name);

    constructor(
        @InjectRepository(Comment)
        commentsRepository: Repository<Comment>,
        entityManager: EntityManager,
    ) {
        super(commentsRepository, entityManager);
    }
}
