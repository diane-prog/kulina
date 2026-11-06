import { BadRequestException, Injectable } from '@nestjs/common';
import * as yaml from 'js-yaml';
import { Country } from '../../common/enum/country.enum';
import { IssueSeverity } from '../../common/enum/issue.enum';
import { Difficulty, RecipeStatus } from '../../common/enum/recipe.enum';
import { toSlug } from '../../utils/slug';
import { Ingredient } from '../ingredients/entities/ingredient.entity';
import { IngredientsRepository } from '../ingredients/repositories/ingredients.repository';
import { CreateRecipeDto } from '../recipes/dto/create-recipe.dto';
import { RecipesRepository } from '../recipes/repositories/recipes.repository';
import { RecipesService } from '../recipes/recipes.service';
import { bouillieDeRizSeed } from './seeds/bouillie-de-riz.seed';
import { recipeCatalogSeed } from './seeds/recipe-catalog.seed';

@Injectable()
export class AdminImportService {
    constructor(
        private readonly recipesService: RecipesService,
        private readonly recipesRepository: RecipesRepository,
        private readonly ingredientsRepository: IngredientsRepository,
    ) {}

    /**
     * Imports a recipe from a YAML string.
     *
     * @param content - YAML or JSON content
     * @returns The imported recipe
     */
    async importYaml(content: string) {
        const parsed = yaml.load(content) as any;

        if (!parsed || typeof parsed !== 'object') {
            throw new BadRequestException('Invalid YAML recipe');
        }

        return await this.importRecipe(parsed);
    }

    /**
     * Imports multiple recipes from YAML strings.
     *
     * @param contents - YAML recipe contents
     * @returns The imported recipes
     */
    async importMany(contents: string[]) {
        const imported = [];

        for (const content of contents) {
            imported.push(await this.importYaml(content));
        }

        return {
            importedCount: imported.length,
            recipes: imported,
        };
    }

    /**
     * Imports a structured recipe object.
     *
     * @param input - Recipe input
     * @returns The imported recipe
     */
    async importRecipe(input: any, status: RecipeStatus = RecipeStatus.REVIEW) {
        if (!input.title) {
            throw new BadRequestException('Recipe title is required');
        }

        const existing = await this.recipesRepository.findOne({
            where: { slug: toSlug(input.slug ?? input.title) },
        });

        if (existing) {
            return existing;
        }

        const ingredients = await this.resolveIngredients(
            input.ingredients ?? [],
        );
        const country = Object.values(Country).includes(input.country)
            ? input.country
            : Country.BOTH;
        const difficulty = Object.values(Difficulty).includes(input.difficulty)
            ? input.difficulty
            : Difficulty.EASY;

        const dto: CreateRecipeDto = {
            title: input.title,
            description: input.description,
            coverImageUrl: input.coverImageUrl,
            prepMinutes: input.prepMinutes ?? 0,
            cookMinutes: input.cookMinutes ?? 0,
            baseServings: input.baseServings ?? 1,
            difficulty,
            country,
            category: input.category,
            estimatedBudgetXof: input.estimatedBudgetXof ?? 0,
            tags: input.tags ?? [],
            status,
            ingredients,
            steps: (input.steps ?? []).map((step: any, index: number) => ({
                position: step.position ?? index + 1,
                title: step.title,
                instruction: step.instruction,
                imageUrl: step.imageUrl,
                idealSeconds: step.idealSeconds,
                minSeconds: step.minSeconds,
                maxSeconds: step.maxSeconds,
                isCritical: step.isCritical ?? false,
                tip: step.tip,
                narrationText: step.narrationText,
                audioUrl: step.audioUrl,
            })),
            tips: (input.tips ?? []).map((tip: any) => ({
                content: typeof tip === 'string' ? tip : tip.content,
            })),
            issues: (input.issues ?? []).map((issue: any) => ({
                stepPosition: issue.stepPosition ?? issue.step,
                symptom: issue.symptom,
                cause: issue.cause,
                fix: issue.fix,
                severity: Object.values(IssueSeverity).includes(issue.severity)
                    ? issue.severity
                    : IssueSeverity.MEDIUM,
            })),
        };

        return await this.recipesService.create(null, dto);
    }

    /**
     * Seeds the bouillie de riz pilot recipe.
     *
     * @returns The seeded recipe or null when it already exists
     */
    async seedBouillieDeRiz() {
        const existing = await this.recipesRepository.findOne({
            where: { slug: 'bouillie-de-riz' },
        });

        if (existing) {
            return existing;
        }

        return await this.importRecipe(bouillieDeRizSeed);
    }

    /**
     * Seeds the 50-recipe demo catalog as published recipes.
     *
     * @returns The number of imported recipes
     */
    async seedCatalog(): Promise<number> {
        let imported = 0;

        for (const recipe of recipeCatalogSeed) {
            const existing = await this.recipesRepository.findOne({
                where: { slug: recipe.slug },
            });

            if (existing) {
                continue;
            }

            await this.importRecipe(recipe, RecipeStatus.PUBLISHED);
            imported += 1;
        }

        return imported;
    }

    /**
     * Resolves ingredient names to existing or created ingredients.
     *
     * @param items - Recipe ingredient inputs
     * @returns Recipe ingredient DTOs
     */
    private async resolveIngredients(items: any[]) {
        const resolved = [];

        for (const item of items) {
            const slug = toSlug(item.name);
            let ingredient = await this.ingredientsRepository.findOne({
                where: { slug, deleted: false },
            });

            if (!ingredient) {
                ingredient = await this.ingredientsRepository.create(
                    new Ingredient({
                        name: item.name,
                        slug,
                        defaultUnit: item.unit ?? 'unit',
                        estimatedPriceXof: 0,
                        localNames: {},
                        isCommon: false,
                    }),
                );
            }

            resolved.push({
                ingredientId: ingredient.id,
                quantity: item.quantity ?? 1,
                unit: item.unit,
                note: item.note,
                optional: item.optional ?? false,
                substitutes: item.substitutes,
            });
        }

        return resolved;
    }
}
