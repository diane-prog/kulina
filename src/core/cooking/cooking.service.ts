import { ForbiddenException, Injectable } from '@nestjs/common';
import { CookingSessionStatus } from '../../common/enum/cooking.enum';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { RecipesService } from '../recipes/recipes.service';
import { StartCookingSessionDto } from './dto/start-cooking-session.dto';
import { UpdateCookingProgressDto } from './dto/update-cooking-progress.dto';
import { CookingSession } from './entities/cooking-session.entity';
import { CookingSessionsRepository } from './repositories/cooking-sessions.repository';

@Injectable()
export class CookingService {
    constructor(
        private readonly cookingSessionsRepository: CookingSessionsRepository,
        private readonly recipesService: RecipesService,
        private readonly errorHandlingService: ErrorHandlingService,
    ) {}

    /**
     * Starts or resumes a guided cooking session.
     *
     * @param userId - User identifier
     * @param dto - Recipe payload
     * @returns The active cooking session
     */
    async start(
        userId: string,
        dto: StartCookingSessionDto,
    ): Promise<CookingSession> {
        const recipe = await this.recipesService.findOne(dto.recipeId, true);
        const existing = await this.cookingSessionsRepository.findOne({
            where: {
                user: { id: userId },
                recipe: { id: dto.recipeId },
                status: CookingSessionStatus.IN_PROGRESS,
                deleted: false,
            },
        });

        if (existing) {
            return existing;
        }

        return await this.cookingSessionsRepository.create(
            new CookingSession({
                user: { id: userId } as any,
                recipe: { id: dto.recipeId } as any,
                status: CookingSessionStatus.IN_PROGRESS,
                currentStepNumber: 1,
                totalSteps: recipe.stepCount ?? 0,
                startedAt: new Date(),
                lastActivityAt: new Date(),
            }),
        );
    }

    /**
     * Lists the user's cooking sessions.
     *
     * @param userId - User identifier
     * @returns The cooking sessions
     */
    async findByUser(userId: string): Promise<CookingSession[]> {
        return await this.cookingSessionsRepository.find({
            where: { user: { id: userId }, deleted: false },
            relations: ['recipe'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Retrieves one cooking session owned by the user.
     *
     * @param id - Session identifier
     * @param userId - User identifier
     * @returns The cooking session
     */
    async findOne(id: string, userId: string): Promise<CookingSession> {
        const session = await this.cookingSessionsRepository.findOne({
            where: { id, deleted: false },
            relations: ['recipe'],
        });

        if (!session) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Cooking session ${id} not found`,
                'Cooking session not found',
            );
        }

        if (session.user?.id !== userId) {
            throw new ForbiddenException(
                'You can only access your own cooking sessions',
            );
        }

        return session;
    }

    /**
     * Updates the progress of a cooking session.
     *
     * @param id - Session identifier
     * @param userId - User identifier
     * @param dto - Progress payload
     * @returns The updated session
     */
    async updateProgress(
        id: string,
        userId: string,
        dto: UpdateCookingProgressDto,
    ): Promise<CookingSession> {
        const session = await this.findOne(id, userId);
        const currentStepNumber = Math.min(
            Math.max(dto.currentStepNumber ?? session.currentStepNumber, 1),
            session.totalSteps || 1,
        );
        const status = dto.status ?? session.status;

        return await this.cookingSessionsRepository.update(
            { id },
            {
                currentStepNumber,
                status,
                notes: dto.notes ?? session.notes,
                lastActivityAt: new Date(),
                completedAt:
                    status === CookingSessionStatus.COMPLETED
                        ? (session.completedAt ?? new Date())
                        : session.completedAt,
            },
        );
    }

    /**
     * Moves to the next step of a cooking session.
     *
     * @param id - Session identifier
     * @param userId - User identifier
     * @returns The updated session
     */
    async nextStep(id: string, userId: string): Promise<CookingSession> {
        const session = await this.findOne(id, userId);
        const isLastStep =
            session.currentStepNumber >= (session.totalSteps || 1);

        return await this.cookingSessionsRepository.update(
            { id },
            {
                currentStepNumber: isLastStep
                    ? session.currentStepNumber
                    : session.currentStepNumber + 1,
                status: isLastStep
                    ? CookingSessionStatus.COMPLETED
                    : CookingSessionStatus.IN_PROGRESS,
                lastActivityAt: new Date(),
                completedAt: isLastStep ? new Date() : session.completedAt,
            },
        );
    }

    /**
     * Moves to the previous step of a cooking session.
     *
     * @param id - Session identifier
     * @param userId - User identifier
     * @returns The updated session
     */
    async previousStep(id: string, userId: string): Promise<CookingSession> {
        const session = await this.findOne(id, userId);

        return await this.cookingSessionsRepository.update(
            { id },
            {
                currentStepNumber: Math.max(1, session.currentStepNumber - 1),
                status: CookingSessionStatus.IN_PROGRESS,
                lastActivityAt: new Date(),
            },
        );
    }

    /**
     * Marks a cooking session as completed.
     *
     * @param id - Session identifier
     * @param userId - User identifier
     * @returns The updated session
     */
    async complete(id: string, userId: string): Promise<CookingSession> {
        const session = await this.findOne(id, userId);

        return await this.cookingSessionsRepository.update(
            { id },
            {
                status: CookingSessionStatus.COMPLETED,
                currentStepNumber: session.totalSteps || 1,
                completedAt: new Date(),
                lastActivityAt: new Date(),
            },
        );
    }

    /**
     * Marks a cooking session as abandoned.
     *
     * @param id - Session identifier
     * @param userId - User identifier
     * @returns The updated session
     */
    async abandon(id: string, userId: string): Promise<CookingSession> {
        await this.findOne(id, userId);

        return await this.cookingSessionsRepository.update(
            { id },
            {
                status: CookingSessionStatus.ABANDONED,
                lastActivityAt: new Date(),
            },
        );
    }
}
