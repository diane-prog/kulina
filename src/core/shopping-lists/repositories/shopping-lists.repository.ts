import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { ShoppingList } from '../entities/shopping-list.entity';

@Injectable()
export class ShoppingListsRepository extends AbstractRepository<ShoppingList> {
    protected readonly logger = new Logger(ShoppingListsRepository.name);

    constructor(
        @InjectRepository(ShoppingList)
        shoppingListsRepository: Repository<ShoppingList>,
        entityManager: EntityManager,
    ) {
        super(shoppingListsRepository, entityManager);
    }
}
