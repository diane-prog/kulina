import { Injectable } from '@nestjs/common';
import { AdminImportService } from './admin-import.service';

@Injectable()
export class RecipesSeeder {
    constructor(private readonly adminImportService: AdminImportService) {}

    /**
     * Seeds the pilot bouillie de riz recipe and the 50-recipe catalog.
     *
     * @returns A promise resolved when the recipes exist
     */
    async seed(): Promise<void> {
        await this.adminImportService.seedBouillieDeRiz();
        await this.adminImportService.seedCatalog();
    }
}
