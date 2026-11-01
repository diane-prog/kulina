import { Injectable } from '@nestjs/common';
import { AdminImportService } from './admin-import.service';

@Injectable()
export class RecipesSeeder {
    constructor(private readonly adminImportService: AdminImportService) {}

    /**
     * Seeds the pilot bouillie de riz recipe.
     *
     * @returns A promise resolved when the recipe exists
     */
    async seed(): Promise<void> {
        await this.adminImportService.seedBouillieDeRiz();
    }
}
