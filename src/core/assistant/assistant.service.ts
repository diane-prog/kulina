import { Injectable } from '@nestjs/common';
import { SkillLevel } from '../../common/enum/user.enum';
import { QueryRecipesDto } from '../recipes/dto/query-recipes.dto';
import { RecipesService } from '../recipes/recipes.service';
import { SuggestRecipesDto } from './dto/suggest-recipes.dto';

@Injectable()
export class AssistantService {
    constructor(private readonly recipesService: RecipesService) {}

    /**
     * Suggests recipes and beginner guidance from available ingredients and budget.
     *
     * @param dto - Suggestion constraints
     * @returns Recipes, tips, and budget advice
     */
    async suggest(dto: SuggestRecipesDto) {
        const limit = dto.limit ?? 5;
        let recipes = [];

        if (dto.ingredients && dto.ingredients.length > 0) {
            const matches = await this.recipesService.searchByIngredients({
                ingredients: dto.ingredients,
                maxBudgetFcfa: dto.budgetFcfa,
                limit,
            });
            recipes = matches.results;
        }

        if (recipes.length === 0) {
            const query: QueryRecipesDto = {
                maxBudgetFcfa: dto.budgetFcfa,
                maxTimeMinutes: dto.maxTimeMinutes,
                cuisineId: dto.cuisineId,
                sort: 'rating',
                page: 1,
                limit,
            };
            const fallback = await this.recipesService.findAll(query);
            recipes = fallback.data;
        }

        return {
            recipes,
            tips: this.buildBeginnerTips(dto.skillLevel ?? SkillLevel.BEGINNER),
            budgetAdvice: this.buildBudgetAdvice(
                dto.budgetFcfa,
                dto.servings ?? 4,
            ),
            nextSteps: [
                'Choose one recipe and open its step-by-step guide.',
                'Start a guided cooking session so Kulina follows your progress.',
                'Add the ingredients to a shopping list before going to the market.',
            ],
        };
    }

    /**
     * Builds a beginner-friendly cooking guide for a recipe.
     *
     * @param recipeId - Recipe identifier
     * @returns The recipe guide with beginner tips
     */
    async guide(recipeId: string) {
        const recipe = await this.recipesService.findOne(recipeId);
        const steps = recipe.steps.map((step) => ({
            ...step,
            beginnerHint: this.buildStepHint(step.instruction),
        }));

        return {
            recipe,
            steps,
            preparationChecklist: [
                'Wash your hands and clean the workspace.',
                'Read the full recipe before starting.',
                'Prepare and measure every ingredient first.',
                'Keep a bowl for waste and a cloth for spills.',
            ],
            safetyTips: [
                'Ask an adult for help when using a hot stove or sharp knife.',
                'Turn pot handles inward so they do not catch on clothes.',
                'Taste carefully and let hot food cool before eating.',
            ],
        };
    }

    /**
     * Builds practical tips based on the user's skill level.
     *
     * @param skillLevel - Current skill level
     * @returns A list of tips
     */
    private buildBeginnerTips(skillLevel: SkillLevel): string[] {
        const commonTips = [
            'Cook with ingredients you can find in your local market.',
            'Keep a small notebook for prices in FCFA and adjust each week.',
            'Prepare the ingredients before turning on the stove.',
        ];

        if (skillLevel === SkillLevel.ADVANCED) {
            return [
                ...commonTips,
                'Try a new African cuisine this week to expand your skills.',
                'Adjust spices progressively and write down what worked.',
            ];
        }

        if (skillLevel === SkillLevel.INTERMEDIATE) {
            return [
                ...commonTips,
                'Practice one new technique per week, such as braising or grilling.',
                'Cook a larger batch and plan leftovers for the next day.',
            ];
        }

        return [
            ...commonTips,
            'Start with easy recipes that have fewer than six steps.',
            'Use a timer so you do not burn food while learning.',
            'Ask a family member to taste with you and give feedback.',
        ];
    }

    /**
     * Builds budget advice in FCFA.
     *
     * @param budgetFcfa - Available budget
     * @param servings - Number of servings
     * @returns Budget guidance
     */
    private buildBudgetAdvice(
        budgetFcfa: number | undefined,
        servings: number,
    ): Record<string, unknown> {
        if (!budgetFcfa) {
            return {
                message:
                    'Set a budget in FCFA to receive precise meal cost guidance.',
            };
        }

        return {
            budgetFcfa,
            servings,
            budgetPerServingFcfa: Math.round(
                budgetFcfa / Math.max(1, servings),
            ),
            message:
                'Compare ingredient prices at your local market and prefer seasonal products.',
        };
    }

    /**
     * Adds a short beginner hint to a cooking instruction.
     *
     * @param instruction - Recipe step instruction
     * @returns A beginner-friendly hint
     */
    private buildStepHint(instruction: string): string {
        const lower = instruction.toLowerCase();

        if (lower.includes('fry') || lower.includes('oil')) {
            return 'Heat the oil gently and test with a small piece before adding everything.';
        }

        if (lower.includes('cut') || lower.includes('chop')) {
            return 'Cut ingredients into similar sizes so they cook evenly.';
        }

        if (lower.includes('boil') || lower.includes('simmer')) {
            return 'Keep the heat medium and stir from time to time.';
        }

        return 'Read the step twice, then do it slowly and carefully.';
    }
}
