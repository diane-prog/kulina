import {
    ForbiddenException,
    HttpException,
    HttpStatus,
    Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { Plan } from '../../common/enum/plan.enum';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { RedisService } from '../../libs/redis/redis.service';
import { UsersRepository } from '../users/repositories/users.repository';
import { SessionsService } from '../sessions/sessions.service';
import { RecipeIssuesRepository } from '../recipes/repositories/recipe-issues.repository';
import { RecipesService } from '../recipes/recipes.service';
import { AiResponseSchema } from './schemas/ai-response.schema';
import { GeminiService } from './services/gemini.service';
import { IssueMatcherService } from './services/issue-matcher.service';
import { QuotaService } from './services/quota.service';

@Injectable()
export class AiService {
    constructor(
        private readonly configService: ConfigService,
        private readonly geminiService: GeminiService,
        private readonly quotaService: QuotaService,
        private readonly issueMatcherService: IssueMatcherService,
        private readonly sessionsService: SessionsService,
        private readonly recipesService: RecipesService,
        private readonly recipeIssuesRepository: RecipeIssuesRepository,
        private readonly usersRepository: UsersRepository,
        private readonly errorHandlingService: ErrorHandlingService,
        private readonly redisService: RedisService,
    ) {}

    /**
     * Answers a cooking question during a session.
     *
     * @param sessionId - Session identifier
     * @param userId - User identifier
     * @param text - User message
     * @returns The assistant answer and suggested action
     */
    async chat(sessionId: string, userId: string, text: string) {
        const user = await this.requirePremiumUser(userId);
        const remainingQuota = await this.quotaService.consume(
            user.id,
            'chat',
            this.quotaService.chatLimit(),
        );

        const session = await this.sessionsService.findOne(sessionId, userId);
        const recipe = await this.recipesService.findOne(
            session.recipe.id,
            true,
        );

        await this.sessionsService.addMessage(sessionId, userId, {
            content: text,
        });

        const issueCandidates =
            await this.recipeIssuesRepository.findCandidates(recipe.id, text);
        const issue = this.issueMatcherService.findMatch(issueCandidates, text);

        if (issue) {
            const answer = issue.fix;
            await this.sessionsService.saveAssistantMessage(sessionId, answer);

            return {
                answer,
                action: 'none',
                newTimerSeconds: null,
                source: 'rules',
                remainingQuota,
            };
        }

        const cacheKey = this.buildCacheKey(session, text);
        const cached = await this.redisService.get(cacheKey);

        if (cached) {
            await this.sessionsService.saveAssistantMessage(sessionId, cached);

            return {
                answer: cached,
                action: 'none',
                newTimerSeconds: null,
                source: 'cache',
                remainingQuota,
            };
        }

        const lockKey = `ai:lock:${sessionId}`;
        const hasLock = await this.redisService.lock(lockKey, 30);

        if (!hasLock) {
            throw new HttpException(
                'The AI assistant is already answering for this session',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        try {
            const recentMessages = await this.sessionsService.getRecentMessages(
                sessionId,
                6,
            );
            const prompt = await this.buildChatPrompt(
                recipe,
                session,
                text,
                recentMessages,
            );
            const rawResult = await this.geminiService.generateJson(
                prompt,
                this.configService.get<string>('ai.chatModel'),
            );
            const parsed = AiResponseSchema.safeParse(rawResult);

            if (parsed.success) {
                const answer = parsed.data.answer;
                const usage = this.geminiService.getLastUsage();
                const costUsd = this.computeCost(usage);
                await this.sessionsService.saveAssistantMessage(
                    sessionId,
                    answer,
                    usage.tokensIn,
                    usage.tokensOut,
                    costUsd,
                    this.configService.get<string>('ai.chatModel'),
                );
                await this.redisService.set(cacheKey, answer, 3600);

                return {
                    answer,
                    action: parsed.data.action,
                    newTimerSeconds: parsed.data.newTimerSeconds ?? null,
                    source: 'gemini',
                    remainingQuota,
                    tokensIn: usage.tokensIn,
                    tokensOut: usage.tokensOut,
                    costUsd,
                };
            }
        } finally {
            await this.redisService.unlock(lockKey);
        }

        const fallback =
            "Je n'ai pas accès à l'assistant pour le moment. Goûte d'abord, ajoute un peu d'eau chaude si c'est trop épais, et continue doucement.";
        await this.sessionsService.saveAssistantMessage(sessionId, fallback);

        return {
            answer: fallback,
            action: 'none',
            newTimerSeconds: null,
            source: 'fallback',
            remainingQuota,
        };
    }

    /**
     * Streams an assistant answer during a cooking session.
     *
     * @param sessionId - Session identifier
     * @param userId - User identifier
     * @param text - User message
     * @param onChunk - Callback receiving text chunks
     * @returns The final assistant result
     */
    async chatStream(
        sessionId: string,
        userId: string,
        text: string,
        onChunk: (chunk: string) => void,
    ) {
        const user = await this.requirePremiumUser(userId);
        const remainingQuota = await this.quotaService.consume(
            user.id,
            'chat',
            this.quotaService.chatLimit(),
        );
        const session = await this.sessionsService.findOne(sessionId, userId);
        const recipe = await this.recipesService.findOne(
            session.recipe.id,
            true,
        );

        await this.sessionsService.addMessage(sessionId, userId, {
            content: text,
        });

        const issueCandidates =
            await this.recipeIssuesRepository.findCandidates(recipe.id, text);
        const issue = this.issueMatcherService.findMatch(issueCandidates, text);

        if (issue) {
            onChunk(issue.fix);
            await this.sessionsService.saveAssistantMessage(
                sessionId,
                issue.fix,
            );

            return {
                answer: issue.fix,
                action: 'none',
                newTimerSeconds: null,
                source: 'rules',
                remainingQuota,
            };
        }

        const cacheKey = this.buildCacheKey(session, text);
        const cached = await this.redisService.get(cacheKey);

        if (cached) {
            onChunk(cached);
            await this.sessionsService.saveAssistantMessage(sessionId, cached);

            return {
                answer: cached,
                action: 'none',
                newTimerSeconds: null,
                source: 'cache',
                remainingQuota,
            };
        }

        const lockKey = `ai:lock:${sessionId}`;
        const hasLock = await this.redisService.lock(lockKey, 30);

        if (!hasLock) {
            throw new HttpException(
                'The AI assistant is already answering for this session',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        try {
            const recentMessages = await this.sessionsService.getRecentMessages(
                sessionId,
                6,
            );
            const prompt = await this.buildChatStreamPrompt(
                recipe,
                session,
                text,
                recentMessages,
            );
            let answer = '';

            for await (const chunk of this.geminiService.generateTextStream(
                prompt,
                this.configService.get<string>('ai.chatModel'),
            )) {
                answer += chunk;
                onChunk(chunk);
            }

            if (answer.trim()) {
                const usage = this.geminiService.getLastUsage();
                const costUsd = this.computeCost(usage);
                await this.sessionsService.saveAssistantMessage(
                    sessionId,
                    answer,
                    usage.tokensIn,
                    usage.tokensOut,
                    costUsd,
                    this.configService.get<string>('ai.chatModel'),
                );
                await this.redisService.set(cacheKey, answer, 3600);

                return {
                    answer,
                    action: 'none',
                    newTimerSeconds: null,
                    source: 'gemini-stream',
                    remainingQuota,
                    tokensIn: usage.tokensIn,
                    tokensOut: usage.tokensOut,
                    costUsd,
                };
            }
        } finally {
            await this.redisService.unlock(lockKey);
        }

        const fallback =
            "Je n'ai pas accès à l'assistant pour le moment. Goûte d'abord, ajoute un peu d'eau chaude si c'est trop épais, et continue doucement.";
        onChunk(fallback);
        await this.sessionsService.saveAssistantMessage(sessionId, fallback);

        return {
            answer: fallback,
            action: 'none',
            newTimerSeconds: null,
            source: 'fallback',
            remainingQuota,
        };
    }

    /**
     * Checks a user's cooking photo with Gemini vision.
     *
     * @param sessionId - Session identifier
     * @param userId - User identifier
     * @param publicId - Cloudinary public identifier
     * @returns The assistant answer
     */
    async photoCheck(sessionId: string, userId: string, publicId: string) {
        const user = await this.requirePremiumUser(userId);
        const remainingQuota = await this.quotaService.consume(
            user.id,
            'photo',
            this.quotaService.photoLimit(),
        );

        const session = await this.sessionsService.findOne(sessionId, userId);
        const recipe = await this.recipesService.findOne(
            session.recipe.id,
            true,
        );
        const cloudName = this.configService.get<string>(
            'CLOUDINARY_CLOUD_NAME',
        );
        const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
        const answer = await this.geminiService.analyzePhoto(
            imageUrl,
            this.buildPhotoPrompt(recipe, session),
        );
        const finalAnswer =
            answer ??
            "Je n'arrive pas à analyser la photo pour le moment. Vérifie la couleur, la texture et goûte prudemment.";

        await this.sessionsService.saveAssistantMessage(sessionId, finalAnswer);

        return {
            answer: finalAnswer,
            action: 'none',
            newTimerSeconds: null,
            source: 'vision',
            remainingQuota,
        };
    }

    /**
     * Structures a raw recipe transcript into JSON.
     *
     * @param transcript - Raw transcript
     * @returns Structured recipe JSON
     */
    async structureRecipe(transcript: string) {
        const result = await this.geminiService.generateJson(
            this.buildStructurePrompt(transcript),
            this.configService.get<string>('ai.chatModel'),
        );

        return (
            result ?? {
                message:
                    'Gemini is not configured. Add GEMINI_API_KEY to structure recipes.',
            }
        );
    }

    /**
     * Ensures the user has an active premium plan.
     *
     * @param userId - User identifier
     * @returns The premium user
     */
    private async requirePremiumUser(userId: string) {
        const user = await this.usersRepository.findOne({
            where: { id: userId, deleted: false },
        });

        if (!user) {
            this.errorHandlingService.returnErrorOnNotFound(
                `User ${userId} not found`,
                'User not found',
            );
        }

        const allFeaturesFree =
            this.configService.get<boolean>('app.allFeaturesFree') ??
            (process.env.ALL_FEATURES_FREE ?? 'true').toLowerCase() === 'true';

        if (allFeaturesFree) {
            return user;
        }

        const isPremium =
            user.plan === Plan.PREMIUM &&
            (!user.premiumUntil ||
                new Date(user.premiumUntil).getTime() > Date.now());

        if (!isPremium) {
            throw new ForbiddenException(
                'This feature requires an active Kulina premium plan',
            );
        }

        return user;
    }

    /**
     * Computes an estimated USD cost from Gemini token usage.
     *
     * @param usage - Token usage
     * @returns Estimated cost in USD
     */
    private computeCost(usage: {
        tokensIn: number;
        tokensOut: number;
    }): number {
        const inputCost =
            (usage.tokensIn / 1000) *
            (this.configService.get<number>('ai.inputCostPer1kUsd') ?? 0.0001);
        const outputCost =
            (usage.tokensOut / 1000) *
            (this.configService.get<number>('ai.outputCostPer1kUsd') ?? 0.0004);

        return Number((inputCost + outputCost).toFixed(6));
    }

    /**
     * Builds a cache key for a repeated cooking question.
     *
     * @param session - Cooking session
     * @param text - User message
     * @returns A stable cache key
     */
    private buildCacheKey(session: any, text: string): string {
        const hash = createHash('sha256')
            .update(
                `${session.recipe.id}:${session.currentStepPosition}:${text
                    .trim()
                    .toLowerCase()}`,
            )
            .digest('hex');

        return `ai:answer:${hash}`;
    }

    /**
     * Builds the compact chat prompt from the recipe and session state.
     *
     * @param recipe - Recipe detail
     * @param session - Cooking session
     * @param text - User message
     * @param recentMessages - Recent conversation messages
     * @returns The Gemini prompt
     */
    private async buildChatPrompt(
        recipe: any,
        session: any,
        text: string,
        recentMessages: any[],
    ): Promise<string> {
        const currentPosition = session.currentStepPosition;
        const contextKey = `ai:context:${recipe.id}:${currentPosition}`;
        let recipeContext = await this.redisService.get(contextKey);

        if (!recipeContext) {
            const currentStep = recipe.steps.find(
                (step) => step.position === currentPosition,
            );
            const previousStep = recipe.steps.find(
                (step) => step.position === currentPosition - 1,
            );
            const nextStep = recipe.steps.find(
                (step) => step.position === currentPosition + 1,
            );
            const issues = (recipe.issues ?? []).filter(
                (issue) =>
                    issue.stepPosition === null ||
                    issue.stepPosition === currentPosition,
            );

            recipeContext = JSON.stringify({
                title: recipe.title,
                baseServings: recipe.baseServings,
                currentStep,
                previousStep,
                nextStep,
                issues,
            });
            await this.redisService.set(contextKey, recipeContext, 3600);
        }

        const elapsedSeconds = session.stepStartedAt
            ? Math.max(
                  0,
                  Math.round(
                      (Date.now() - new Date(session.stepStartedAt).getTime()) /
                          1000,
                  ),
              )
            : 0;

        return [
            'Tu es Chef en poche, un assistant de cuisine béninois et togolais.',
            'Réponds en français simple, en 3 phrases maximum, avec une action claire.',
            "Appuie-toi uniquement sur la FICHE fournie. Si l'information manque, donne le conseil le plus prudent.",
            'Sécurité d’abord : feu, huile chaude, aliments crus ou mal cuits.',
            'Réponds en JSON : {answer, action: none|adjust_timer|go_next_step|repeat_step, newTimerSeconds}.',
            '',
            `FICHE: ${recipeContext}`,
            `TEMPS ÉCOULÉ SUR L'ÉTAPE: ${elapsedSeconds} secondes`,
            `DERNIERS MESSAGES: ${JSON.stringify(
                recentMessages.map((message) => ({
                    role: message.role,
                    content: message.content,
                })),
            )}`,
            `QUESTION: ${text}`,
        ].join('\n');
    }

    /**
     * Builds a streaming chat prompt that asks for plain text.
     *
     * @param recipe - Recipe detail
     * @param session - Cooking session
     * @param text - User message
     * @param recentMessages - Recent conversation messages
     * @returns The Gemini prompt
     */
    private async buildChatStreamPrompt(
        recipe: any,
        session: any,
        text: string,
        recentMessages: any[],
    ): Promise<string> {
        const prompt = await this.buildChatPrompt(
            recipe,
            session,
            text,
            recentMessages,
        );

        return prompt.replace(
            /Réponds en JSON[^\n]*/g,
            'Réponds en texte simple, sans JSON.',
        );
    }

    /**
     * Builds the photo check prompt.
     *
     * @param recipe - Recipe detail
     * @param session - Cooking session
     * @returns The vision prompt
     */
    private buildPhotoPrompt(recipe: any, session: any): string {
        return [
            'Tu es Chef en poche. Analyse la photo de cuisine envoyée par l’utilisateur.',
            `Recette : ${recipe.title}. Étape actuelle : ${session.currentStepPosition}.`,
            'Dis en 3 phrases maximum si le plat semble correct, ce qui doit être ajusté, et la prochaine action.',
            'Sois prudent sur la cuisson, le feu et les aliments crus.',
        ].join('\n');
    }

    /**
     * Builds the recipe structuring prompt.
     *
     * @param transcript - Raw transcript
     * @returns The structuring prompt
     */
    private buildStructurePrompt(transcript: string): string {
        return [
            'Tu reçois la transcription brute d’une cuisinière béninoise ou togolaise.',
            'Produis un JSON de recette avec : slug, title, country (BJ, TG, BOTH), category, baseServings, ingredients [{name, quantity, unit, optional}], steps [{position, title, instruction, idealSeconds, minSeconds, maxSeconds, isCritical, tip}], issues [{stepPosition, symptom, cause, fix, severity}].',
            'Ne rien inventer : si une durée ou une quantité manque, mets null et ajoute une question à poser.',
            'Ajoute 3 à 5 issues (problèmes courants et solutions).',
            `TRANSCRIPTION: ${transcript}`,
        ].join('\n');
    }
}
