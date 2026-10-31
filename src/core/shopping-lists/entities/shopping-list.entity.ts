import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { ShoppingListStatus } from '../../../common/enum/shopping-list.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { MealPlan } from '../../meal-plans/entities/meal-plan.entity';
import { Users } from '../../users/entities/users.entity';
import { ShoppingListItem } from './shopping-list-item.entity';

@Entity('shopping_lists')
export class ShoppingList extends AbstractEntity<ShoppingList> {
    @ManyToOne(() => Users, { eager: true, nullable: false })
    @JoinColumn({ name: 'userId' })
    @Index()
    user: Users;

    @ManyToOne(() => MealPlan, { eager: false, nullable: true })
    @JoinColumn({ name: 'mealPlanId' })
    mealPlan: MealPlan;

    @Column({ nullable: false })
    title: string;

    @Column({ type: 'int', default: 0 })
    estimatedTotalFcfa: number;

    @Column({
        type: 'enum',
        enum: ShoppingListStatus,
        default: ShoppingListStatus.OPEN,
    })
    status: ShoppingListStatus;

    @OneToMany(() => ShoppingListItem, (item) => item.shoppingList, {
        cascade: true,
    })
    items: ShoppingListItem[];
}
