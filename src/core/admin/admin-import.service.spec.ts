import { AdminImportService } from './admin-import.service';

describe('AdminImportService', () => {
    let service: AdminImportService;
    let mockRecipesService: any;
    let mockRecipesRepository: any;
    let mockIngredientsRepository: any;

    beforeEach(() => {
        mockRecipesService = {
            create: jest.fn().mockResolvedValue({
                id: 'recipe-1',
                title: 'Bouillie de riz',
            }),
        };
        mockRecipesRepository = {
            findOne: jest.fn().mockResolvedValue(null),
        };
        mockIngredientsRepository = {
            findOne: jest.fn().mockResolvedValue({
                id: 'ingredient-1',
                name: 'Riz',
            }),
            create: jest.fn(),
        };

        service = new AdminImportService(
            mockRecipesService,
            mockRecipesRepository,
            mockIngredientsRepository,
        );
    });

    describe('importRecipe', () => {
        it('should import a structured recipe as review', async () => {
            const input = {
                slug: 'bouillie-de-riz',
                title: 'Bouillie de riz',
                country: 'BOTH',
                baseServings: 2,
                ingredients: [{ name: 'Riz', quantity: 1, unit: 'tasse' }],
                steps: [
                    {
                        position: 1,
                        title: 'Laver le riz',
                        instruction: 'Lave le riz.',
                    },
                ],
                issues: [
                    {
                        step: 1,
                        symptom: 'Trop épais',
                        fix: "Ajoute de l'eau.",
                    },
                ],
            };

            const actual = await service.importRecipe(input);

            expect(actual.id).toBe('recipe-1');
            expect(mockRecipesService.create).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    title: 'Bouillie de riz',
                    status: 'review',
                }),
            );
        });

        it('should return the existing recipe when the slug exists', async () => {
            mockRecipesRepository.findOne.mockResolvedValue({
                id: 'existing',
                slug: 'bouillie-de-riz',
            });

            const actual = await service.importRecipe({
                slug: 'bouillie-de-riz',
                title: 'Bouillie de riz',
            });

            expect(actual.id).toBe('existing');
            expect(mockRecipesService.create).not.toHaveBeenCalled();
        });
    });
});
