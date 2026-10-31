import { Injectable } from '@nestjs/common';
import { toSlug } from '../../utils/slug';
import { Ingredient } from './entities/ingredient.entity';
import { IngredientsRepository } from './repositories/ingredients.repository';

const ingredients = [
    {
        name: 'Rice',
        category: 'Grains',
        unit: 'kg',
        averagePriceFcfa: 700,
        aliases: ['riz'],
    },
    {
        name: 'Chicken',
        category: 'Meat',
        unit: 'kg',
        averagePriceFcfa: 3000,
        aliases: ['poulet'],
    },
    {
        name: 'Fish',
        category: 'Seafood',
        unit: 'kg',
        averagePriceFcfa: 2500,
        aliases: ['poisson'],
    },
    {
        name: 'Beef',
        category: 'Meat',
        unit: 'kg',
        averagePriceFcfa: 3500,
        aliases: ['boeuf', 'bœuf'],
    },
    {
        name: 'Goat meat',
        category: 'Meat',
        unit: 'kg',
        averagePriceFcfa: 4000,
        aliases: ['chevre', 'chèvre'],
    },
    {
        name: 'Tomato',
        category: 'Vegetables',
        unit: 'kg',
        averagePriceFcfa: 750,
        aliases: ['tomates'],
    },
    {
        name: 'Onion',
        category: 'Vegetables',
        unit: 'kg',
        averagePriceFcfa: 600,
        aliases: ['oignon', 'oignons'],
    },
    {
        name: 'Chilli pepper',
        category: 'Spices',
        unit: 'kg',
        averagePriceFcfa: 1500,
        aliases: ['piment'],
    },
    {
        name: 'Garlic',
        category: 'Spices',
        unit: 'kg',
        averagePriceFcfa: 2000,
        aliases: ['ail'],
    },
    {
        name: 'Ginger',
        category: 'Spices',
        unit: 'kg',
        averagePriceFcfa: 2000,
        aliases: ['gingembre'],
    },
    {
        name: 'Palm oil',
        category: 'Oils',
        unit: 'litre',
        averagePriceFcfa: 1500,
        aliases: ['huile de palme'],
    },
    {
        name: 'Vegetable oil',
        category: 'Oils',
        unit: 'litre',
        averagePriceFcfa: 1800,
        aliases: ['huile vegetale', 'huile végétale'],
    },
    {
        name: 'Peanut paste',
        category: 'Sauces',
        unit: 'kg',
        averagePriceFcfa: 2500,
        aliases: ['pate d arachide', 'pâte d’arachide'],
    },
    {
        name: 'Peanut',
        category: 'Legumes',
        unit: 'kg',
        averagePriceFcfa: 2000,
        aliases: ['arachide', 'cacahuete', 'cacahuète'],
    },
    {
        name: 'Black-eyed peas',
        category: 'Legumes',
        unit: 'kg',
        averagePriceFcfa: 1200,
        aliases: ['niebe', 'niébé'],
    },
    {
        name: 'Cowpea',
        category: 'Legumes',
        unit: 'kg',
        averagePriceFcfa: 1200,
        aliases: ['haricot'],
    },
    {
        name: 'Plantain',
        category: 'Fruits',
        unit: 'piece',
        averagePriceFcfa: 250,
        aliases: ['banane plantain'],
    },
    {
        name: 'Yam',
        category: 'Tubers',
        unit: 'kg',
        averagePriceFcfa: 1000,
        aliases: ['igname'],
    },
    {
        name: 'Cassava',
        category: 'Tubers',
        unit: 'kg',
        averagePriceFcfa: 500,
        aliases: ['manioc'],
    },
    {
        name: 'Sweet potato',
        category: 'Tubers',
        unit: 'kg',
        averagePriceFcfa: 800,
        aliases: ['patate douce'],
    },
    {
        name: 'Okra',
        category: 'Vegetables',
        unit: 'kg',
        averagePriceFcfa: 1200,
        aliases: ['gombo'],
    },
    {
        name: 'Aubergine',
        category: 'Vegetables',
        unit: 'kg',
        averagePriceFcfa: 900,
        aliases: ['eggplant', 'aubergine africaine'],
    },
    {
        name: 'Cabbage',
        category: 'Vegetables',
        unit: 'piece',
        averagePriceFcfa: 500,
        aliases: ['chou'],
    },
    {
        name: 'Carrot',
        category: 'Vegetables',
        unit: 'kg',
        averagePriceFcfa: 800,
        aliases: ['carotte'],
    },
    {
        name: 'Green beans',
        category: 'Vegetables',
        unit: 'kg',
        averagePriceFcfa: 1500,
        aliases: ['haricot vert'],
    },
    {
        name: 'Spinach',
        category: 'Vegetables',
        unit: 'bunch',
        averagePriceFcfa: 300,
        aliases: ['epinard', 'épinard'],
    },
    {
        name: 'Maize',
        category: 'Grains',
        unit: 'kg',
        averagePriceFcfa: 500,
        aliases: ['mais', 'maïs'],
    },
    {
        name: 'Millet',
        category: 'Grains',
        unit: 'kg',
        averagePriceFcfa: 700,
        aliases: ['mil'],
    },
    {
        name: 'Sorghum',
        category: 'Grains',
        unit: 'kg',
        averagePriceFcfa: 600,
        aliases: ['sorgho'],
    },
    {
        name: 'Coconut milk',
        category: 'Sauces',
        unit: 'litre',
        averagePriceFcfa: 1800,
        aliases: ['lait de coco'],
    },
    {
        name: 'Stock cube',
        category: 'Spices',
        unit: 'piece',
        averagePriceFcfa: 50,
        aliases: ['cube maggi', 'bouillon'],
    },
    {
        name: 'Salt',
        category: 'Spices',
        unit: 'kg',
        averagePriceFcfa: 300,
        aliases: ['sel'],
    },
    {
        name: 'Black pepper',
        category: 'Spices',
        unit: 'kg',
        averagePriceFcfa: 5000,
        aliases: ['poivre noir'],
    },
    {
        name: 'Bay leaf',
        category: 'Spices',
        unit: 'bunch',
        averagePriceFcfa: 200,
        aliases: ['feuille de laurier'],
    },
    {
        name: 'Parsley',
        category: 'Herbs',
        unit: 'bunch',
        averagePriceFcfa: 200,
        aliases: ['persil'],
    },
    {
        name: 'Coriander',
        category: 'Herbs',
        unit: 'bunch',
        averagePriceFcfa: 200,
        aliases: ['coriandre'],
    },
    {
        name: 'Lemon',
        category: 'Fruits',
        unit: 'piece',
        averagePriceFcfa: 100,
        aliases: ['citron'],
    },
    {
        name: 'Banana',
        category: 'Fruits',
        unit: 'kg',
        averagePriceFcfa: 700,
        aliases: ['banane'],
    },
    {
        name: 'Mango',
        category: 'Fruits',
        unit: 'kg',
        averagePriceFcfa: 1000,
        aliases: ['mangue'],
    },
    {
        name: 'Pineapple',
        category: 'Fruits',
        unit: 'piece',
        averagePriceFcfa: 700,
        aliases: ['ananas'],
    },
    {
        name: 'Egg',
        category: 'Protein',
        unit: 'piece',
        averagePriceFcfa: 100,
        aliases: ['oeuf', 'œuf'],
    },
    {
        name: 'Milk',
        category: 'Dairy',
        unit: 'litre',
        averagePriceFcfa: 800,
        aliases: ['lait'],
    },
    {
        name: 'Wheat flour',
        category: 'Flour',
        unit: 'kg',
        averagePriceFcfa: 700,
        aliases: ['farine de ble', 'farine de blé'],
    },
    {
        name: 'Corn flour',
        category: 'Flour',
        unit: 'kg',
        averagePriceFcfa: 600,
        aliases: ['farine de mais', 'farine de maïs'],
    },
    {
        name: 'Sugar',
        category: 'Baking',
        unit: 'kg',
        averagePriceFcfa: 800,
        aliases: ['sucre'],
    },
    {
        name: 'Baking powder',
        category: 'Baking',
        unit: 'piece',
        averagePriceFcfa: 200,
        aliases: ['levure'],
    },
    {
        name: 'Water',
        category: 'Other',
        unit: 'litre',
        averagePriceFcfa: 0,
        aliases: ['eau'],
    },
];

@Injectable()
export class IngredientsSeeder {
    constructor(private readonly repository: IngredientsRepository) {}

    /**
     * Seeds common African ingredients with FCFA reference prices.
     *
     * @returns A promise resolved when all ingredients exist
     */
    async seed(): Promise<void> {
        for (const ingredient of ingredients) {
            const slug = toSlug(ingredient.name);
            const existing = await this.repository.findOne({
                where: { slug },
            });

            if (!existing) {
                await this.repository.create(
                    new Ingredient({
                        name: ingredient.name,
                        slug,
                        category: ingredient.category,
                        unit: ingredient.unit,
                        averagePriceFcfa: ingredient.averagePriceFcfa,
                        aliases: ingredient.aliases,
                        isCommon: true,
                    }),
                );
            }
        }
    }
}
