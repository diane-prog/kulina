import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { Post } from '../entities/post.entity';

@Injectable()
export class PostsRepository extends AbstractRepository<Post> {
    protected readonly logger = new Logger(PostsRepository.name);

    constructor(
        @InjectRepository(Post)
        postsRepository: Repository<Post>,
        entityManager: EntityManager,
    ) {
        super(postsRepository, entityManager);
    }
}
