import { Plan } from '../../common/enum/plan.enum';
import { AiService } from './ai.service';

describe('AiService', () => {
    let service: AiService;
    let mockGeminiService: any;
    let mockQuotaService: any;
    let mockIssueMatcherService: any;
    let mockSessionsService: any;
    let mockRecipesService: any;
    let mockRecipeIssuesRepository: any;
    let mockUsersRepository: any;
    let mockRedisService: any;

    beforeEach(() => {
        mockGeminiService = {
            generateJson: jest.fn(),
            generateTextStream: jest.fn(),
            getLastUsage: jest.fn().mockReturnValue({
                tokensIn: 0,
                tokensOut: 0,
            }),
        };
        mockQuotaService = {
            consume: jest.fn().mockResolvedValue(39),
            chatLimit: jest.fn().mockReturnValue(40),
            photoLimit: jest.fn().mockReturnValue(3),
        };
        mockIssueMatcherService = {
            findMatch: jest.fn(),
        };
        mockSessionsService = {
            findOne: jest.fn().mockResolvedValue({
                id: 'session-1',
                recipe: { id: 'recipe-1' },
                currentStepPosition: 1,
                stepStartedAt: new Date(),
            }),
            addMessage: jest.fn(),
            saveAssistantMessage: jest.fn(),
            getRecentMessages: jest.fn().mockResolvedValue([]),
        };
        mockRecipesService = {
            findOne: jest.fn().mockResolvedValue({
                id: 'recipe-1',
                title: 'Bouillie de riz',
                baseServings: 2,
                steps: [],
                issues: [],
            }),
        };
        mockRecipeIssuesRepository = {
            findCandidates: jest.fn().mockResolvedValue([]),
        };
        mockUsersRepository = {
            findOne: jest.fn().mockResolvedValue({
                id: 'user-1',
                plan: Plan.PREMIUM,
                premiumUntil: null,
            }),
        };
        mockRedisService = {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn(),
            lock: jest.fn().mockResolvedValue(true),
            unlock: jest.fn(),
        };

        service = new AiService(
            {
                get: jest.fn(),
            } as any,
            mockGeminiService,
            mockQuotaService,
            mockIssueMatcherService,
            mockSessionsService,
            mockRecipesService,
            mockRecipeIssuesRepository,
            mockUsersRepository,
            { returnErrorOnNotFound: jest.fn() } as any,
            mockRedisService,
        );
    });

    describe('chat', () => {
        it('should answer from RecipeIssue rules before calling Gemini', async () => {
            const issue = {
                symptom: 'Trop épaisse',
                fix: "Ajoute de l'eau chaude.",
                severity: 'low',
            };
            mockRecipeIssuesRepository.findCandidates.mockResolvedValue([
                issue,
            ]);
            mockIssueMatcherService.findMatch.mockReturnValue(issue);

            const actual = await service.chat(
                'session-1',
                'user-1',
                'Mon riz est trop épais',
            );

            expect(actual.source).toBe('rules');
            expect(actual.answer).toBe(issue.fix);
            expect(mockGeminiService.generateJson).not.toHaveBeenCalled();
            expect(mockSessionsService.saveAssistantMessage).toHaveBeenCalled();
        });

        it('should reject free users', async () => {
            mockUsersRepository.findOne.mockResolvedValue({
                id: 'user-1',
                plan: Plan.FREE,
                premiumUntil: null,
            });

            await expect(
                service.chat('session-1', 'user-1', 'Hello'),
            ).rejects.toThrow('premium');
        });
    });
});
