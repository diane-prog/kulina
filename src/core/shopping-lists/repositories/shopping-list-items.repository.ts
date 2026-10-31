import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { ShoppingListItem } from '../entities/shopping-list-item.entity';

@Injectable()
export class ShoppingListItemsRepository extends AbstractRepository<ShoppingListItem> {
    protected readonly logger = new Logger(ShoppingListItemsRepository.name);

    constructor(
        @InjectRepository(ShoppingListItem)
        shoppingListItemsRepository: Repository<ShoppingListItem>,
        entityManager: EntityManager,
    ) {
        super(shoppingListItemsRepository, entityManager);
    }
}
