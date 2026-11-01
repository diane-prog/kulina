import { Injectable } from '@nestjs/common';
import { toSlug } from '../../utils/slug';
import { Ingredient } from './entities/ingredient.entity';
import { IngredientsRepository } from './repositories/ingredients.repository';

const ingredients = [
    {
        name: 'Riz',
        category: 'Céréales',
        defaultUnit: 'kg',
        estimatedPriceXof: 700,
        localNames: { fr: 'riz', fon: 'lan', mina: 'molu', ewe: 'molu' },
    },
    {
        name: 'Eau',
        category: 'Autre',
        defaultUnit: 'litre',
        estimatedPriceXof: 0,
        localNames: { fr: 'eau', fon: 'sin', mina: 'si', ewe: 'tsi' },
    },
    {
        name: 'Sel',
        category: 'Épices',
        defaultUnit: 'kg',
        estimatedPriceXof: 300,
        localNames: { fr: 'sel', fon: 'jɛ', mina: 'jɛ', ewe: 'dze' },
    },
    {
        name: 'Sucre',
        category: 'Épicerie',
        defaultUnit: 'kg',
        estimatedPriceXof: 800,
        localNames: { fr: 'sucre', fon: 'sukli', mina: 'sukli', ewe: 'sukli' },
    },
    {
        name: 'Lait',
        category: 'Produits laitiers',
        defaultUnit: 'litre',
        estimatedPriceXof: 800,
        localNames: { fr: 'lait', fon: 'kan', mina: 'kan', ewe: 'notsi' },
    },
    {
        name: 'Tomate',
        category: 'Légumes',
        defaultUnit: 'kg',
        estimatedPriceXof: 750,
        localNames: {
            fr: 'tomate',
            fon: 'timati',
            mina: 'timati',
            ewe: 'timati',
        },
    },
    {
        name: 'Oignon',
        category: 'Légumes',
        defaultUnit: 'kg',
        estimatedPriceXof: 600,
        localNames: {
            fr: 'oignon',
            fon: 'sabla',
            mina: 'sabla',
            ewe: 'sabala',
        },
    },
    {
        name: 'Piment',
        category: 'Épices',
        defaultUnit: 'kg',
        estimatedPriceXof: 1500,
        localNames: {
            fr: 'piment',
            fon: 'takinsin',
            mina: 'takinsin',
            ewe: 'take',
        },
    },
    {
        name: 'Huile de palme',
        category: 'Huiles',
        defaultUnit: 'litre',
        estimatedPriceXof: 1500,
        localNames: {
            fr: 'huile de palme',
            fon: 'kwlikwin',
            mina: 'kwlikwin',
            ewe: 'dzikpɔ',
        },
    },
    {
        name: 'Huile végétale',
        category: 'Huiles',
        defaultUnit: 'litre',
        estimatedPriceXof: 1800,
        localNames: {
            fr: 'huile végétale',
            fon: 'amio',
            mina: 'amio',
            ewe: 'ami',
        },
    },
    {
        name: 'Poulet',
        category: 'Viandes',
        defaultUnit: 'kg',
        estimatedPriceXof: 3000,
        localNames: { fr: 'poulet', fon: 'koklo', mina: 'koklo', ewe: 'koklo' },
    },
    {
        name: 'Poisson',
        category: 'Produits de la mer',
        defaultUnit: 'kg',
        estimatedPriceXof: 2500,
        localNames: { fr: 'poisson', fon: 'hwe', mina: 'hwe', ewe: 'ƒe' },
    },
    {
        name: 'Arachide',
        category: 'Légumineuses',
        defaultUnit: 'kg',
        estimatedPriceXof: 2000,
        localNames: { fr: 'arachide', fon: 'azin', mina: 'azin', ewe: 'azi' },
    },
    {
        name: 'Niébé',
        category: 'Légumineuses',
        defaultUnit: 'kg',
        estimatedPriceXof: 1200,
        localNames: { fr: 'niébé', fon: 'ayi', mina: 'ayi', ewe: 'ayi' },
    },
    {
        name: 'Igname',
        category: 'Tubercules',
        defaultUnit: 'kg',
        estimatedPriceXof: 1000,
        localNames: { fr: 'igname', fon: 'te', mina: 'te', ewe: 'te' },
    },
    {
        name: 'Manioc',
        category: 'Tubercules',
        defaultUnit: 'kg',
        estimatedPriceXof: 500,
        localNames: {
            fr: 'manioc',
            fon: 'agbade',
            mina: 'agbade',
            ewe: 'agbeli',
        },
    },
    {
        name: 'Plantain',
        category: 'Fruits',
        defaultUnit: 'pièce',
        estimatedPriceXof: 250,
        localNames: {
            fr: 'plantain',
            fon: 'abladzo',
            mina: 'abladzo',
            ewe: 'abladzo',
        },
    },
    {
        name: 'Gombo',
        category: 'Légumes',
        defaultUnit: 'kg',
        estimatedPriceXof: 1200,
        localNames: { fr: 'gombo', fon: 'fevi', mina: 'fevi', ewe: 'fetri' },
    },
    {
        name: 'Aubergine',
        category: 'Légumes',
        defaultUnit: 'kg',
        estimatedPriceXof: 900,
        localNames: { fr: 'aubergine', fon: 'glo', mina: 'glo', ewe: 'glo' },
    },
    {
        name: 'Chou',
        category: 'Légumes',
        defaultUnit: 'pièce',
        estimatedPriceXof: 500,
        localNames: { fr: 'chou', fon: 'chou', mina: 'chou', ewe: 'chou' },
    },
    {
        name: 'Carotte',
        category: 'Légumes',
        defaultUnit: 'kg',
        estimatedPriceXof: 800,
        localNames: {
            fr: 'carotte',
            fon: 'carotte',
            mina: 'carotte',
            ewe: 'carotte',
        },
    },
    {
        name: 'Maïs',
        category: 'Céréales',
        defaultUnit: 'kg',
        estimatedPriceXof: 500,
        localNames: { fr: 'maïs', fon: 'gblé', mina: 'gblé', ewe: 'bli' },
    },
    {
        name: 'Mil',
        category: 'Céréales',
        defaultUnit: 'kg',
        estimatedPriceXof: 700,
        localNames: { fr: 'mil', fon: 'kpo', mina: 'kpo', ewe: 'kpo' },
    },
    {
        name: 'Lait de coco',
        category: 'Sauces',
        defaultUnit: 'litre',
        estimatedPriceXof: 1800,
        localNames: {
            fr: 'lait de coco',
            fon: 'agunkwin',
            mina: 'agunkwin',
            ewe: 'ne',
        },
    },
    {
        name: 'Cube bouillon',
        category: 'Épices',
        defaultUnit: 'pièce',
        estimatedPriceXof: 50,
        localNames: {
            fr: 'cube bouillon',
            fon: 'bouillon',
            mina: 'bouillon',
            ewe: 'bouillon',
        },
    },
    {
        name: 'Poivre noir',
        category: 'Épices',
        defaultUnit: 'kg',
        estimatedPriceXof: 5000,
        localNames: {
            fr: 'poivre noir',
            fon: 'poivre',
            mina: 'poivre',
            ewe: 'poivre',
        },
    },
    {
        name: 'Persil',
        category: 'Herbes',
        defaultUnit: 'botte',
        estimatedPriceXof: 200,
        localNames: {
            fr: 'persil',
            fon: 'persil',
            mina: 'persil',
            ewe: 'persil',
        },
    },
    {
        name: 'Citron',
        category: 'Fruits',
        defaultUnit: 'pièce',
        estimatedPriceXof: 100,
        localNames: {
            fr: 'citron',
            fon: 'citron',
            mina: 'citron',
            ewe: 'citron',
        },
    },
    {
        name: 'Banane',
        category: 'Fruits',
        defaultUnit: 'kg',
        estimatedPriceXof: 700,
        localNames: {
            fr: 'banane',
            fon: 'yovozin',
            mina: 'yovozin',
            ewe: 'akɔ',
        },
    },
    {
        name: 'Mangue',
        category: 'Fruits',
        defaultUnit: 'kg',
        estimatedPriceXof: 1000,
        localNames: { fr: 'mangue', fon: 'mango', mina: 'mango', ewe: 'mango' },
    },
    {
        name: 'Ananas',
        category: 'Fruits',
        defaultUnit: 'pièce',
        estimatedPriceXof: 700,
        localNames: {
            fr: 'ananas',
            fon: 'ananas',
            mina: 'ananas',
            ewe: 'ananas',
        },
    },
    {
        name: 'Œuf',
        category: 'Protéines',
        defaultUnit: 'pièce',
        estimatedPriceXof: 100,
        localNames: {
            fr: 'œuf',
            fon: 'koklozi',
            mina: 'koklozi',
            ewe: 'koklozi',
        },
    },
    {
        name: 'Farine de blé',
        category: 'Farines',
        defaultUnit: 'kg',
        estimatedPriceXof: 700,
        localNames: {
            fr: 'farine de blé',
            fon: 'farine',
            mina: 'farine',
            ewe: 'farine',
        },
    },
    {
        name: 'Farine de maïs',
        category: 'Farines',
        defaultUnit: 'kg',
        estimatedPriceXof: 600,
        localNames: {
            fr: 'farine de maïs',
            fon: 'gbléfarine',
            mina: 'gbléfarine',
            ewe: 'blifarine',
        },
    },
    {
        name: 'Levure',
        category: 'Épicerie',
        defaultUnit: 'pièce',
        estimatedPriceXof: 200,
        localNames: {
            fr: 'levure',
            fon: 'levure',
            mina: 'levure',
            ewe: 'levure',
        },
    },
];

@Injectable()
export class IngredientsSeeder {
    constructor(private readonly repository: IngredientsRepository) {}

    /**
     * Seeds common Beninese and Togolese ingredients with XOF reference prices.
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
                        defaultUnit: ingredient.defaultUnit,
                        estimatedPriceXof: ingredient.estimatedPriceXof,
                        localNames: ingredient.localNames,
                        isCommon: true,
                    }),
                );
            }
        }
    }
}
