import { ForbiddenException, Injectable } from '@nestjs/common';
import { MessageRole } from '../../common/enum/message.enum';
import { SessionStatus } from '../../common/enum/session.enum';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { RedisService } from '../../libs/redis/redis.service';
import { paginate } from '../../utils/pagination';
import { RecipesService } from '../recipes/recipes.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateSessionMessageDto } from './dto/create-session-message.dto';
import { UpdateSessionStepDto } from './dto/update-session-step.dto';
import { CookingSession } from './entities/cooking-session.entity';
import { SessionMessage } from './entities/session-message.entity';
import { SessionMessagesRepository } from './repositories/session-messages.repository';
import { SessionsRepository } from './repositories/sessions.repository';

@Injectable()
export class SessionsService {
    constructor(
        private readonly sessionsRepository: SessionsRepository,
        private readonly sessionMessagesRepository: SessionMessagesRepository,
        private readonly recipesService: RecipesService,
        private readonly errorHandlingService: ErrorHandlingService,
        private readonly redisService: RedisService,
    ) {}

    /**
     * Creates or resumes a cooking session.
     *
     * @param userId - User identifier
     * @param dto - Session payload
     * @returns The active session
     */
    async create(
        userId: string,
        dto: CreateSessionDto,
    ): Promise<CookingSession> {
        const recipe = await this.recipesService.findOne(dto.recipeId, true);
        const existing = await this.sessionsRepository.findOne({
            where: {
                user: { id: userId },
                recipe: { id: dto.recipeId },
                status: SessionStatus.ACTIVE,
                deleted: false,
            },
        });

        if (existing) {
            await this.syncSessionState(existing);
            return existing;
        }

        const session = await this.sessionsRepository.create(
            new CookingSession({
                user: { id: userId } as any,
                recipe: { id: dto.recipeId } as any,
                status: SessionStatus.ACTIVE,
                servings: dto.servings ?? recipe.baseServings,
                currentStepPosition: 1,
                totalSteps: recipe.stepCount ?? 0,
                startedAt: new Date(),
                stepStartedAt: new Date(),
                lastActivityAt: new Date(),
            }),
        );
        await this.syncSessionState(session);

        return session;
    }

    /**
     * Lists the user's cooking sessions.
     *
     * @param userId - User identifier
     * @returns The cooking sessions
     */
    async findByUser(userId: string): Promise<CookingSession[]> {
        return await this.sessionsRepository.find({
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
        const session = await this.retrieveSession(id, userId);
        const state = await this.redisService.hgetall(`session:${id}`);

        if (state.currentStepPosition) {
            session.currentStepPosition = Number.parseInt(
                state.currentStepPosition,
                10,
            );
        }
        if (state.stepStartedAt) {
            session.stepStartedAt = new Date(state.stepStartedAt);
        }
        if (state.status) {
            session.status = state.status as SessionStatus;
        }

        return session;
    }

    /**
     * Updates the current step of a session.
     *
     * @param id - Session identifier
     * @param userId - User identifier
     * @param dto - Step payload
     * @returns The updated session
     */
    async updateStep(
        id: string,
        userId: string,
        dto: UpdateSessionStepDto,
    ): Promise<CookingSession> {
        const session = await this.retrieveSession(id, userId);
        const position = Math.min(
            Math.max(dto.position, 1),
            session.totalSteps || 1,
        );

        const updated = await this.sessionsRepository.update(
            { id },
            {
                currentStepPosition: position,
                status: SessionStatus.ACTIVE,
                stepStartedAt: new Date(),
                lastActivityAt: new Date(),
            },
        );
        await this.syncSessionState(updated);

        return updated;
    }

    /**
     * Moves to the next step of a session.
     *
     * @param id - Session identifier
     * @param userId - User identifier
     * @returns The updated session
     */
    async nextStep(id: string, userId: string): Promise<CookingSession> {
        const session = await this.retrieveSession(id, userId);
        const isLastStep =
            session.currentStepPosition >= (session.totalSteps || 1);

        const updated = await this.sessionsRepository.update(
            { id },
            {
                currentStepPosition: isLastStep
                    ? session.currentStepPosition
                    : session.currentStepPosition + 1,
                status: isLastStep
                    ? SessionStatus.FINISHED
                    : SessionStatus.ACTIVE,
                stepStartedAt: new Date(),
                lastActivityAt: new Date(),
                finishedAt: isLastStep ? new Date() : session.finishedAt,
            },
        );
        await this.syncSessionState(updated);

        return updated;
    }

    /**
     * Moves to the previous step of a session.
     *
     * @param id - Session identifier
     * @param userId - User identifier
     * @returns The updated session
     */
    async previousStep(id: string, userId: string): Promise<CookingSession> {
        const session = await this.retrieveSession(id, userId);

        const updated = await this.sessionsRepository.update(
            { id },
            {
                currentStepPosition: Math.max(
                    1,
                    session.currentStepPosition - 1,
                ),
                status: SessionStatus.ACTIVE,
                stepStartedAt: new Date(),
                lastActivityAt: new Date(),
            },
        );
        await this.syncSessionState(updated);

        return updated;
    }

    /**
     * Marks a session as finished.
     *
     * @param id - Session identifier
     * @param userId - User identifier
     * @returns The updated session
     */
    async finish(id: string, userId: string): Promise<CookingSession> {
        const session = await this.retrieveSession(id, userId);

        const updated = await this.sessionsRepository.update(
            { id },
            {
                status: SessionStatus.FINISHED,
                currentStepPosition: session.totalSteps || 1,
                finishedAt: new Date(),
                lastActivityAt: new Date(),
            },
        );
        await this.syncSessionState(updated);

        return updated;
    }

    /**
     * Marks a session as abandoned.
     *
     * @param id - Session identifier
     * @param userId - User identifier
     * @returns The updated session
     */
    async abandon(id: string, userId: string): Promise<CookingSession> {
        await this.retrieveSession(id, userId);

        const updated = await this.sessionsRepository.update(
            { id },
            {
                status: SessionStatus.ABANDONED,
                lastActivityAt: new Date(),
            },
        );
        await this.syncSessionState(updated);

        return updated;
    }

    /**
     * Lists messages for a session.
     *
     * @param id - Session identifier
     * @param userId - User identifier
     * @param page - Page number
     * @param limit - Page size
     * @returns A paginated message list
     */
    async listMessages(id: string, userId: string, page = 1, limit = 20) {
        await this.retrieveSession(id, userId);
        const messages = await this.sessionMessagesRepository.find({
            where: { session: { id }, deleted: false },
            order: { createdAt: 'ASC' },
        });

        return paginate(
            messages.slice((page - 1) * limit, page * limit),
            messages.length,
            page,
            limit,
        );
    }

    /**
     * Adds a user message to a session.
     *
     * @param id - Session identifier
     * @param userId - User identifier
     * @param dto - Message payload
     * @returns The created message
     */
    async addMessage(
        id: string,
        userId: string,
        dto: CreateSessionMessageDto,
    ): Promise<SessionMessage> {
        await this.retrieveSession(id, userId);

        return await this.saveMessage(id, MessageRole.USER, dto.content);
    }

    /**
     * Saves an assistant message.
     *
     * @param sessionId - Session identifier
     * @param content - Assistant answer
     * @param tokensIn - Input token count
     * @param tokensOut - Output token count
     * @returns The created message
     */
    async saveAssistantMessage(
        sessionId: string,
        content: string,
        tokensIn = 0,
        tokensOut = 0,
        costUsd = 0,
        model?: string,
    ): Promise<SessionMessage> {
        return await this.saveMessage(
            sessionId,
            MessageRole.ASSISTANT,
            content,
            tokensIn,
            tokensOut,
            costUsd,
            model,
        );
    }

    /**
     * Returns recent messages for AI context.
     *
     * @param sessionId - Session identifier
     * @param limit - Maximum number of messages
     * @returns Recent messages
     */
    async getRecentMessages(
        sessionId: string,
        limit = 6,
    ): Promise<SessionMessage[]> {
        const messages = await this.sessionMessagesRepository.find({
            where: { session: { id: sessionId }, deleted: false },
            order: { createdAt: 'DESC' },
        });

        return messages.slice(0, limit).reverse();
    }

    /**
     * Stores the lightweight session state in Redis.
     *
     * @param session - Cooking session
     */
    private async syncSessionState(session: CookingSession): Promise<void> {
        await this.redisService.hset(
            `session:${session.id}`,
            {
                currentStepPosition: String(session.currentStepPosition),
                stepStartedAt: session.stepStartedAt
                    ? new Date(session.stepStartedAt).toISOString()
                    : '',
                status: String(session.status),
            },
            6 * 60 * 60,
        );
    }

    /**
     * Loads a session owned by the user.
     *
     * @param id - Session identifier
     * @param userId - User identifier
     * @returns The session entity
     */
    private async retrieveSession(
        id: string,
        userId: string,
    ): Promise<CookingSession> {
        const session = await this.sessionsRepository.findOne({
            where: { id, deleted: false },
            relations: ['recipe'],
        });

        if (!session) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Session ${id} not found`,
                'Session not found',
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
     * Persists a session message.
     *
     * @param sessionId - Session identifier
     * @param role - Message role
     * @param content - Message content
     * @param tokensIn - Input token count
     * @param tokensOut - Output token count
     * @returns The created message
     */
    private async saveMessage(
        sessionId: string,
        role: MessageRole,
        content: string,
        tokensIn = 0,
        tokensOut = 0,
        costUsd = 0,
        model?: string,
    ): Promise<SessionMessage> {
        return await this.sessionMessagesRepository.create(
            new SessionMessage({
                session: { id: sessionId } as any,
                role,
                content,
                tokensIn,
                tokensOut,
                costUsd,
                model,
            }),
        );
    }
}
