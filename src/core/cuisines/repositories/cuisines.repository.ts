import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { Cuisine } from '../entities/cuisine.entity';

@Injectable()
export class CuisinesRepository extends AbstractRepository<Cuisine> {
    protected readonly logger = new Logger(CuisinesRepository.name);

    constructor(
        @InjectRepository(Cuisine)
        cuisinesRepository: Repository<Cuisine>,
        entityManager: EntityManager,
    ) {
        super(cuisinesRepository, entityManager);
    }
}
