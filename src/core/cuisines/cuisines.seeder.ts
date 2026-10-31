import { Injectable } from '@nestjs/common';
import { toSlug } from '../../utils/slug';
import { Cuisine } from './entities/cuisine.entity';
import { CuisinesRepository } from './repositories/cuisines.repository';

const cuisines = [
    { name: 'Ivorian', region: 'West Africa' },
    { name: 'Senegalese', region: 'West Africa' },
    { name: 'Nigerian', region: 'West Africa' },
    { name: 'Ghanaian', region: 'West Africa' },
    { name: 'Togolese', region: 'West Africa' },
    { name: 'Beninese', region: 'West Africa' },
    { name: 'Burkinabe', region: 'West Africa' },
    { name: 'Malian', region: 'West Africa' },
    { name: 'Cameroonian', region: 'Central Africa' },
    { name: 'Congolese', region: 'Central Africa' },
    { name: 'Gabonese', region: 'Central Africa' },
    { name: 'Moroccan', region: 'North Africa' },
    { name: 'Algerian', region: 'North Africa' },
    { name: 'Tunisian', region: 'North Africa' },
    { name: 'Ethiopian', region: 'East Africa' },
    { name: 'Kenyan', region: 'East Africa' },
    { name: 'Tanzanian', region: 'East Africa' },
    { name: 'South African', region: 'Southern Africa' },
    { name: 'African Fusion', region: 'Pan-African' },
];

@Injectable()
export class CuisinesSeeder {
    constructor(private readonly repository: CuisinesRepository) {}

    /**
     * Seeds the African cuisine catalog.
     *
     * @returns A promise resolved when all cuisines exist
     */
    async seed(): Promise<void> {
        for (const cuisine of cuisines) {
            const slug = toSlug(cuisine.name);
            const existing = await this.repository.findOne({
                where: { slug },
            });

            if (!existing) {
                await this.repository.create(
                    new Cuisine({
                        name: cuisine.name,
                        slug,
                        region: cuisine.region,
                        description: `${cuisine.name} recipes and cooking traditions.`,
                        isActive: true,
                    }),
                );
            }
        }
    }
}
