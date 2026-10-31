import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Ingredient } from '../../ingredients/entities/ingredient.entity';
import { ShoppingList } from './shopping-list.entity';

@Entity('shopping_list_items')
export class ShoppingListItem extends AbstractEntity<ShoppingListItem> {
    @ManyToOne(() => ShoppingList, (list) => list.items, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'shoppingListId' })
    shoppingList: ShoppingList;

    @ManyToOne(() => Ingredient, { eager: true, nullable: false })
    @JoinColumn({ name: 'ingredientId' })
    ingredient: Ingredient;

    @Column({ type: 'float', default: 1 })
    quantity: number;

    @Column({ nullable: true })
    unit: string;

    @Column({ type: 'int', default: 0 })
    estimatedPriceFcfa: number;

    @Column({ default: false })
    isChecked: boolean;

    @Column({ nullable: true })
    note: string;
}
